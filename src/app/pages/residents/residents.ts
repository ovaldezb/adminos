import { Component, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar';
import { SideMenuComponent } from '../../components/side-menu/side-menu';
import type { Condominium } from '../../components/condo-selector/condo-selector';
import { ResidentService } from '../../services';
import { 
  Resident, 
  ResidentDetails, 
  ResidentType, 
  DocumentType,
  CreateResidentDto,
  UpdateResidentDto,
  ApiResponse
} from '../../models';

@Component({
  selector: 'app-residents',
  imports: [CommonModule, FormsModule, NavbarComponent, SideMenuComponent],
  templateUrl: './residents.html',
  styleUrl: './residents.css'
})
export class ResidentsComponent {
  protected readonly sidebarOpen = signal(false);
  protected readonly userName = signal('Administrador');
  protected readonly selectedCondo = signal<Condominium | null>(null);
  protected readonly isOverviewMode = computed(() => !this.selectedCondo() || this.selectedCondo()?.id === 'all');
  
  // Expose Math for template
  protected readonly Math = Math;
  
  // Data signals
  protected readonly residents = signal<ResidentDetails[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  
  // Pagination
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly totalPages = signal(1);
  protected readonly totalItems = signal(0);
  
  // Filters
  protected readonly searchTerm = signal('');
  protected readonly typeFilter = signal<ResidentType | ''>('');
  protected readonly statusFilter = signal<'active' | 'inactive' | ''>('');
  
  // Modal state
  protected readonly showModal = signal(false);
  protected readonly modalMode = signal<'create' | 'edit' | 'view'>('create');
  protected readonly selectedResident = signal<ResidentDetails | null>(null);
  
  // Form data
  protected readonly formData = signal<Partial<CreateResidentDto>>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    documentType: DocumentType.DNI,
    documentNumber: '',
    type: ResidentType.OWNER,
    condominiumId: '',
    unitId: '',
    moveInDate: new Date(),
    emergencyContactName: '',
    emergencyContactPhone: ''
  });
  
  // Enums for template
  protected readonly ResidentType = ResidentType;
  protected readonly DocumentType = DocumentType;
  
  // Computed filtered residents
  protected readonly filteredResidents = computed(() => {
    let filtered = this.residents();
    
    const search = this.searchTerm().toLowerCase();
    if (search) {
      filtered = filtered.filter(r =>
        r.firstName.toLowerCase().includes(search) ||
        r.lastName.toLowerCase().includes(search) ||
        r.email.toLowerCase().includes(search) ||
        r.documentNumber.toLowerCase().includes(search)
      );
    }
    
    const type = this.typeFilter();
    if (type) {
      filtered = filtered.filter(r => r.type === type);
    }
    
    const status = this.statusFilter();
    if (status === 'active') {
      filtered = filtered.filter(r => r.isActive);
    } else if (status === 'inactive') {
      filtered = filtered.filter(r => !r.isActive);
    }
    
    return filtered;
  });

  // Computed statistics
  protected readonly totalOwners = computed(() => 
    this.filteredResidents().filter(r => r.type === ResidentType.OWNER || r.type === ResidentType.BOTH).length
  );

  protected readonly totalTenants = computed(() => 
    this.filteredResidents().filter(r => r.type === ResidentType.TENANT).length
  );

  protected readonly totalWithDebt = computed(() => 
    this.filteredResidents().filter(r => r.totalDebt > 0).length
  );

  protected readonly totalActive = computed(() => 
    this.filteredResidents().filter(r => r.isActive).length
  );

  constructor(
    private router: Router,
    private residentService: ResidentService
  ) {
    // Load initial data
    effect(() => {
      const condo = this.selectedCondo();
      this.loadResidents();
    });
  }

  toggleSidebar(): void {
    this.sidebarOpen.set(!this.sidebarOpen());
  }

  onCondoSelected(condo: Condominium | null): void {
    console.log('Residents recibió selección:', condo?.name);
    this.selectedCondo.set(condo);
    this.currentPage.set(1);
    this.loadResidents();
  }

  // CRUD Operations
  loadResidents(): void {
    this.loading.set(true);
    this.error.set(null);
    
    const condoId = this.selectedCondo()?.id;
    
    this.residentService.getResidents({
      page: this.currentPage(),
      pageSize: this.pageSize(),
      condominiumId: condoId,
      search: this.searchTerm() || undefined,
      type: this.typeFilter() || undefined
    }).subscribe({
      next: (response: ApiResponse<any>) => {
        if (response.success && response.data) {
          this.residents.set(response.data.items);
          this.totalPages.set(response.data.totalPages);
          this.totalItems.set(response.data.total);
        }
        this.loading.set(false);
      },
      error: (err: any) => {
        console.error('Error loading residents:', err);
        this.error.set('Error al cargar los residentes');
        this.loading.set(false);
      }
    });
  }

  openCreateModal(): void {
    this.modalMode.set('create');
    this.selectedResident.set(null);
    this.formData.set({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      documentType: DocumentType.DNI,
      documentNumber: '',
      type: ResidentType.OWNER,
      condominiumId: this.selectedCondo()?.id === 'all' ? '' : this.selectedCondo()?.id || '',
      unitId: '',
      moveInDate: new Date(),
      emergencyContactName: '',
      emergencyContactPhone: ''
    });
    this.showModal.set(true);
  }

  openEditModal(resident: ResidentDetails): void {
    this.modalMode.set('edit');
    this.selectedResident.set(resident);
    this.formData.set({
      firstName: resident.firstName,
      lastName: resident.lastName,
      email: resident.email,
      phone: resident.phone,
      documentType: resident.documentType,
      documentNumber: resident.documentNumber,
      type: resident.type,
      condominiumId: resident.condominiumId,
      unitId: resident.unitId,
      moveInDate: resident.moveInDate,
      emergencyContactName: resident.emergencyContactName,
      emergencyContactPhone: resident.emergencyContactPhone
    });
    this.showModal.set(true);
  }

  openViewModal(resident: ResidentDetails): void {
    this.modalMode.set('view');
    this.selectedResident.set(resident);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.selectedResident.set(null);
  }

  saveResident(): void {
    const data = this.formData();
    
    if (!this.validateForm(data)) {
      return;
    }

    this.loading.set(true);

    if (this.modalMode() === 'create') {
      this.residentService.createResident(data as CreateResidentDto).subscribe({
        next: (response: ApiResponse<any>) => {
          if (response.success) {
            console.log('Residente creado:', response.message);
            this.closeModal();
            this.loadResidents();
          } else {
            this.error.set(response.error?.message || 'Error al crear el residente');
          }
          this.loading.set(false);
        },
        error: (err: any) => {
          console.error('Error creating resident:', err);
          this.error.set('Error al crear el residente');
          this.loading.set(false);
        }
      });
    } else if (this.modalMode() === 'edit') {
      const residentId = this.selectedResident()?.id;
      if (!residentId) return;

      this.residentService.updateResident(residentId, data as UpdateResidentDto).subscribe({
        next: (response: ApiResponse<any>) => {
          if (response.success) {
            console.log('Residente actualizado:', response.message);
            this.closeModal();
            this.loadResidents();
          } else {
            this.error.set(response.error?.message || 'Error al actualizar el residente');
          }
          this.loading.set(false);
        },
        error: (err: any) => {
          console.error('Error updating resident:', err);
          this.error.set('Error al actualizar el residente');
          this.loading.set(false);
        }
      });
    }
  }

  deactivateResident(resident: ResidentDetails): void {
    if (!confirm(`¿Está seguro de desactivar a ${resident.firstName} ${resident.lastName}?`)) {
      return;
    }

    this.loading.set(true);

    this.residentService.deactivateResident(resident.id).subscribe({
      next: (response: ApiResponse<any>) => {
        if (response.success) {
          console.log('Residente desactivado:', response.message);
          this.loadResidents();
        } else {
          this.error.set(response.error?.message || 'Error al desactivar el residente');
        }
        this.loading.set(false);
      },
      error: (err: any) => {
        console.error('Error deactivating resident:', err);
        this.error.set('Error al desactivar el residente');
        this.loading.set(false);
      }
    });
  }

  private validateForm(data: Partial<CreateResidentDto>): boolean {
    if (!data.firstName || !data.lastName || !data.email || !data.phone || 
        !data.documentNumber || !data.condominiumId || !data.unitId) {
      this.error.set('Por favor complete todos los campos obligatorios');
      return false;
    }
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      this.error.set('Por favor ingrese un email válido');
      return false;
    }
    
    return true;
  }

  // Pagination
  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.set(this.currentPage() + 1);
      this.loadResidents();
    }
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
      this.loadResidents();
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadResidents();
    }
  }

  // Filters
  onSearchChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
    this.currentPage.set(1);
    this.loadResidents();
  }

  onTypeFilterChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as ResidentType | '';
    this.typeFilter.set(value);
    this.currentPage.set(1);
    this.loadResidents();
  }

  onStatusFilterChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as 'active' | 'inactive' | '';
    this.statusFilter.set(value);
    this.currentPage.set(1);
    this.loadResidents();
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.typeFilter.set('');
    this.statusFilter.set('');
    this.currentPage.set(1);
    this.loadResidents();
  }

  getCondoName(): string {
    if (this.isOverviewMode()) {
      return 'Vista General - Todos los Condominios';
    }
    return this.selectedCondo()?.name || 'Sin Seleccionar';
  }

  onLogout(): void {
    this.router.navigate(['/login']);
  }

  // Utility methods
  getTypeBadgeClass(type: ResidentType): string {
    const classes: Record<ResidentType, string> = {
      [ResidentType.OWNER]: 'badge-primary',
      [ResidentType.TENANT]: 'badge-secondary',
      [ResidentType.BOTH]: 'badge-info'
    };
    return classes[type] || 'badge-neutral';
  }

  getTypeLabel(type: ResidentType): string {
    const labels: Record<ResidentType, string> = {
      [ResidentType.OWNER]: 'Propietario',
      [ResidentType.TENANT]: 'Inquilino',
      [ResidentType.BOTH]: 'Propietario/Residente'
    };
    return labels[type] || type;
  }

  getDocumentTypeLabel(type: DocumentType): string {
    const labels: Record<DocumentType, string> = {
      [DocumentType.DNI]: 'DNI',
      [DocumentType.PASSPORT]: 'Pasaporte',
      [DocumentType.RUC]: 'RUC',
      [DocumentType.CE]: 'Carné de Extranjería'
    };
    return labels[type] || type;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 0
    }).format(amount);
  }

  formatDate(date: Date | undefined): string {
    if (!date) return '-';
    return new Intl.DateTimeFormat('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  }

  formatDateForInput(date: Date | undefined): string {
    if (!date) return '';
    return new Date(date).toISOString().split('T')[0];
  }

  onDateChange(field: 'moveInDate' | 'moveOutDate', value: string): void {
    this.formData.update(current => ({
      ...current,
      [field]: value ? new Date(value) : undefined
    }));
  }

  getFullName(resident: ResidentDetails): string {
    return `${resident.firstName} ${resident.lastName}`;
  }
}
