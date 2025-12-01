import { Component, signal, computed, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar';
import { SideMenuComponent } from '../../components/side-menu/side-menu';
import { CondominiumService } from '../../services';
import { 
  Condominium,
  CreateCondominiumDto,
  UpdateCondominiumDto,
  CondominiumType,
  CondominiumStatus,
  ApiResponse
} from '../../models';

@Component({
  selector: 'app-condominiums',
  imports: [CommonModule, FormsModule, NavbarComponent, SideMenuComponent],
  templateUrl: './condominiums.html'
})
export class CondominiumsComponent implements OnInit {
  constructor(
    private readonly router: Router,
    private readonly condominiumService: CondominiumService
  ) {
    // Load condominiums on component init
  }
  ngOnInit(): void {
    this.loadCondominiums();
  }
  protected readonly sidebarOpen = signal(window.innerWidth >= 1024);
  protected readonly userName = signal('Administrador');
  protected readonly selectedCondo = signal<Condominium | null>(null);
  
  // Expose Math for template
  protected readonly Math = Math;
  
  // Data signals
  protected readonly condominiums = signal<Condominium[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  
  // Pagination
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly totalPages = signal(1);
  
  // Filters
  protected readonly searchTerm = signal('');
  
  // Modal state
  protected readonly showModal = signal(false);
  protected readonly modalMode = signal<'create' | 'edit' | 'view'>('create');
  protected readonly selectedCondominium = signal<Condominium | null>(null);
  
  // Toast notifications
  protected readonly showToast = signal(false);
  protected readonly toastMessage = signal('');
  protected readonly toastType = signal<'success' | 'error' | 'info'>('success');
  
  // Delete confirmation modal
  protected readonly showDeleteModal = signal(false);
  protected readonly condoToDelete = signal<Condominium | null>(null);
  protected readonly isDeleting = signal(false);
  
  // Form data (nombres coinciden con lambda)
  protected readonly formData = signal<Partial<CreateCondominiumDto>>({
    name: '',
    type: CondominiumType.TOWER,
    streetAddress: '',
    neighborhood: '',
    city: '',
    zipCode: '',
    state: '',
    country: 'México',
    conventionalPenalty: 0,
    initialFolioNumber: 1,
    isActive: true,
    hasAC: false,
    additionalInfo: '',
    buildingsId: [],
    buildings: [],
    privateStreets: [],
    amenities: [],
    // Legacy para compatibilidad
    number: '',
    paymentDay: 1,
    rfc: ''
  });
  
  // Computed filtered condominiums
  protected readonly filteredCondominiums = computed(() => {
    let filtered = this.condominiums();
    
    const search = this.searchTerm().toLowerCase();
    if (search) {
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(search) ||
        c.city?.toLowerCase().includes(search) ||
        c.neighborhood?.toLowerCase().includes(search) ||
        c.streetAddress?.toLowerCase().includes(search)
      );
    }
    
    return filtered;
  });

  // Computed statistics
  protected readonly totalActive = computed(() => 
    this.filteredCondominiums().filter(c => c.isActive).length
  );

  protected readonly totalInactive = computed(() => 
    this.filteredCondominiums().filter(c => !c.isActive).length
  );

  protected readonly totalWithAC = computed(() => 
    this.filteredCondominiums().filter(c => c.hasAC).length
  );

  protected readonly averagePenalty = computed(() => {
    const condos = this.filteredCondominiums();
    if (condos.length === 0) return 0;
    return condos.reduce((sum, c) => sum + (c.conventionalPenalty || 0), 0) / condos.length;
  });

  

  toggleSidebar(): void {
    this.sidebarOpen.set(!this.sidebarOpen());
  }

  onCondoSelected(condo: Condominium | null): void {
    this.selectedCondo.set(condo);
  }

  // CRUD Operations
  loadCondominiums(): void {
    this.loading.set(true);
    this.error.set(null);
    
    this.condominiumService.getAllCondominiums().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.condominiums.set(response.data);
          this.calculatePagination();
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading condominiums:', err);
        this.error.set('Error al cargar los condominios');
        this.loading.set(false);
      }
    });
  }

  calculatePagination(): void {
    const total = this.filteredCondominiums().length;
    this.totalPages.set(Math.ceil(total / this.pageSize()));
  }

  openCreateModal(): void {
    this.modalMode.set('create');
    this.selectedCondominium.set(null);
    this.formData.set({
      name: '',
      type: CondominiumType.TOWER,
      streetAddress: '',
      neighborhood: '',
      city: '',
      zipCode: '',
      state: '',
      country: 'México',
      conventionalPenalty: 0,
      initialFolioNumber: 1,
      isActive: true,
      hasAC: false,
      additionalInfo: '',
      buildingsId: [],
      buildings: [],
      privateStreets: [],
      amenities: [],
      // Legacy para compatibilidad
      number: '',
      paymentDay: 1,
      rfc: ''
    });
    this.showModal.set(true);
  }

  openEditModal(condo: Condominium): void {
    console.log('🔧 openEditModal called with condo:', condo);
    console.log('🆔 Condo ID:', condo?.id);
    this.modalMode.set('edit');
    this.selectedCondominium.set(condo);
    this.formData.set({
      name: condo.name,
      type: condo.type,
      streetAddress: condo.streetAddress || '',
      neighborhood: condo.neighborhood || '',
      city: condo.city || '',
      zipCode: condo.zipCode || '',
      state: condo.state || '',
      country: condo.country || 'México',
      conventionalPenalty: condo.conventionalPenalty || 0,
      initialFolioNumber: condo.initialFolioNumber || 1,
      isActive: condo.isActive !== undefined ? condo.isActive : true,
      hasAC: condo.hasAC !== undefined ? condo.hasAC : false,
      additionalInfo: condo.additionalInfo || '',
      buildingsId: condo.buildingsId || [],
      buildings: condo.buildings || [],
      privateStreets: condo.privateStreets || [],
      amenities: condo.amenities || [],
      // Legacy para compatibilidad
      number: condo.number || '',
      paymentDay: condo.paymentDay || 1,
      rfc: condo.rfc || ''
    });
    this.showModal.set(true);
  }

  openViewModal(condo: Condominium): void {
    this.modalMode.set('view');
    this.selectedCondominium.set(condo);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.selectedCondominium.set(null);
  }

  saveCondominium(): void {
    console.log('🔄 saveCondominium called, modalMode:', this.modalMode());
    const data = this.formData();
    console.log('📋 Form data:', data);
    
    if (!this.validateForm(data)) {
      console.log('❌ Validation failed');
      return;
    }

    // Si initialFolioNumber está vacío, usar 1
    if (!data.initialFolioNumber || data.initialFolioNumber < 1) {
      data.initialFolioNumber = 1;
    }

    this.loading.set(true);

    if (this.modalMode() === 'create') {
      // Agregar campos requeridos por la lambda SOLO en creación
      const now = new Date();
      data.createdAt = now;
      data.updatedAt = now;
      data.status = CondominiumStatus.ACTIVE;

      this.condominiumService.createCondominium(data as CreateCondominiumDto).subscribe({
        next: (response) => {
          if (response.success) {
            this.showToastMessage('Condominio creado exitosamente', 'success');
            this.closeModal();
            this.loadCondominiums();
          } else {
            this.showToastMessage(response.error?.message || 'Error al crear el condominio', 'error');
          }
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error creating condominium:', err);
          this.showToastMessage('Error al crear el condominio', 'error');
          this.loading.set(false);
        }
      });
    } else if (this.modalMode() === 'edit') {
      const condoId = this.getCondoId(this.selectedCondominium());
      console.log('✏️ Edit mode - condoId:', condoId);
      
      // Para edición, solo actualizar updatedAt y mantener los campos existentes
      const selectedCondo = this.selectedCondominium();
      data.updatedAt = new Date();
      data.createdAt = selectedCondo?.createdAt || new Date();
      data.status = selectedCondo?.status || CondominiumStatus.ACTIVE;
      
      console.log('📤 Sending data:', data);
      if (!condoId) {
        console.log('❌ No condoId found');
        return;
      }

      this.condominiumService.updateCondominium(condoId, data as UpdateCondominiumDto).subscribe({
        next: (response) => {
          if (response.success) {
            this.showToastMessage('Condominio actualizado exitosamente', 'success');
            this.closeModal();
            this.loadCondominiums();
          } else {
            this.showToastMessage(response.error?.message || 'Error al actualizar el condominio', 'error');
          }
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error updating condominium:', err);
          this.showToastMessage('Error al actualizar el condominio', 'error');
          this.loading.set(false);
        }
      });
    }
  }

  openDeleteModal(condo: Condominium): void {
    this.condoToDelete.set(condo);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.condoToDelete.set(null);
    this.isDeleting.set(false);
  }

  confirmDelete(): void {
    const condo = this.condoToDelete();
    if (!condo) return;

    const condoId = this.getCondoId(condo);
    if (!condoId) return;

    this.isDeleting.set(true);

    this.condominiumService.deleteCondominium(condoId).subscribe({
      next: (response) => {
        if (response.success) {
          this.showToastMessage('Condominio eliminado exitosamente', 'success');
          this.closeDeleteModal();
          this.loadCondominiums();
        } else {
          this.showToastMessage(response.error?.message || 'Error al eliminar el condominio', 'error');
          this.isDeleting.set(false);
        }
      },
      error: (err) => {
        console.error('Error deleting condominium:', err);
        this.showToastMessage('Error al eliminar el condominio', 'error');
        this.isDeleting.set(false);
      }
    });
  }

  // Form field update helpers
  updateFormField(field: string, value: any): void {
    const current = this.formData();
    this.formData.set({
      ...current,
      [field]: value
    });
  }

  // Helper para obtener el ID correcto (maneja tanto id como _id)
  private getCondoId(condo: Condominium | null): string | undefined {
    if (!condo) return undefined;
    return condo.id || (condo as any)._id;
  }

  // Helper para mostrar el tipo de condominio
  getCondominiumTypeLabel(type: any): string {
    switch (type) {
      case 'TOWER':
        return 'Edificio con Torres';
      case 'HOUSE':
        return 'Fraccionamiento/Casas';
      case 'COMPLEX':
        return 'Conjunto Habitacional';
      default:
        return 'No especificado';
    }
  }

  private showToastMessage(message: string, type: 'success' | 'error' | 'info'): void {
    this.toastMessage.set(message);
    this.toastType.set(type);
    this.showToast.set(true);
    
    // Auto hide after 3 seconds
    setTimeout(() => {
      this.showToast.set(false);
    }, 3000);
  }

  private validateForm(data: Partial<CreateCondominiumDto>): boolean {
    if (!data.name || !data.streetAddress || !data.neighborhood || 
        !data.zipCode || !data.city || !data.state || !data.country) {
      this.error.set('Por favor complete todos los campos obligatorios');
      return false;
    }

    if (data.conventionalPenalty! < 0) {
      this.error.set('La pena convencional no puede ser negativa');
      return false;
    }

    if (data.initialFolioNumber! < 1) {
      this.error.set('El folio inicial debe ser mayor a 0');
      return false;
    }
    
    return true;
  }

  // Pagination
  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.set(this.currentPage() + 1);
    }
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  getPaginatedItems() {
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return this.filteredCondominiums().slice(start, end);
  }

  // Filters
  onSearchChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
    this.currentPage.set(1);
    this.calculatePagination();
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.currentPage.set(1);
    this.calculatePagination();
  }

  onLogout(): void {
    this.router.navigate(['/login']);
  }

  // Utility methods
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'ACTIVE':
        return 'badge-success';
      case 'INACTIVE':
        return 'badge-error';
      case 'ARCHIVED':
        return 'badge-warning';
      default:
        return 'badge-neutral';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'ACTIVE':
        return 'Activo';
      case 'INACTIVE':
        return 'Inactivo';
      case 'ARCHIVED':
        return 'Archivado';
      default:
        return 'Desconocido';
    }
  }

  formatDate(date: Date | undefined): string {
    if (!date) return '-';
    return new Intl.DateTimeFormat('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  }

  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  getFullAddress(condo: Condominium): string {
    return `${condo.streetAddress}, Col. ${condo.neighborhood}, ${condo.city}`;
  }

  // Navigation
  navigateToBuildings(condo: Condominium): void {
    const condoId = this.getCondoId(condo);
    this.router.navigate(['/condominios', condoId, 'edificios']);
  }
}
