import { Component, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar';
import { SideMenuComponent } from '../../components/side-menu/side-menu';
import { ResidentWizardComponent, WizardCompletedData } from '../../components/resident-wizard/resident-wizard';
import { Condominium } from '../../models';
import { ResidentService, UnitService, BuildingService, CondominiumService } from '../../services';
import { 
  Resident, 
  ResidentDetails, 
  ResidentType, 
  DocumentType,
  CreateResidentDto,
  UpdateResidentDto,
  ApiResponse,
  UnitDetails,
  BuildingDetails
} from '../../models';

@Component({
  selector: 'app-residents',
  imports: [CommonModule, FormsModule, NavbarComponent, SideMenuComponent, ResidentWizardComponent],
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
  
  // Dropdown data
  protected readonly availableCondominiums = signal<Condominium[]>([]);
  protected readonly availableBuildings = signal<BuildingDetails[]>([]);
  protected readonly availableUnits = signal<UnitDetails[]>([]);
  
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
  
  // Toast notifications
  protected readonly showToast = signal(false);
  protected readonly toastMessage = signal('');
  protected readonly toastType = signal<'success' | 'error' | 'info'>('success');
  
  // Deactivate confirmation modal
  protected readonly showDeactivateModal = signal(false);
  protected readonly residentToDeactivate = signal<ResidentDetails | null>(null);
  protected readonly isDeactivating = signal(false);
  
  // Delete confirmation modal
  protected readonly showDeleteModal = signal(false);
  protected readonly residentToDelete = signal<ResidentDetails | null>(null);
  protected readonly isDeleting = signal(false);
  
  // Wizard state
  protected readonly showWizard = signal(false);
  
  // Form data
  protected readonly formData = signal<Partial<CreateResidentDto>>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    documentType: DocumentType.CURP,
    documentNumber: '',
    type: ResidentType.OWNER,
    condominiumId: '',
    buildingId: '',
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
    this.filteredResidents().filter(r => r.type === ResidentType.OWNER).length
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
    private residentService: ResidentService,
    private unitService: UnitService,
    private buildingService: BuildingService,
    private condominiumService: CondominiumService
  ) {
    // Load initial data
    effect(() => {
      const condo = this.selectedCondo();
      this.loadResidents();
    });
    
    // Load condominiums for dropdown
    this.loadCondominiums();
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
  loadCondominiums(): void {
    this.condominiumService.getAllCondominiums().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.availableCondominiums.set(response.data);
        }
      },
      error: (err) => console.error('Error loading condominiums:', err)
    });
  }

  loadBuildingsByCondominium(condominiumId: string): void {
    if (!condominiumId || condominiumId === 'all') {
      this.availableBuildings.set([]);
      this.availableUnits.set([]);
      return;
    }

    this.buildingService.getBuildings({ condominiumId }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.availableBuildings.set(response.data.items);
        }
      },
      error: (err) => console.error('Error loading buildings:', err)
    });
  }

  loadUnitsByBuilding(buildingId: string): void {
    if (!buildingId) {
      this.availableUnits.set([]);
      return;
    }

    const condominiumId = this.formData().condominiumId;
    
    this.unitService.getUnits({ 
      page: 1,
      condominiumId, 
      pageSize: 1000 // Obtener todas las unidades
    }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Filtrar unidades por edificio
          const units = response.data.items.filter(u => u.buildingId === buildingId);
          this.availableUnits.set(units);
        }
      },
      error: (err) => console.error('Error loading units:', err)
    });
  }

  onCondominiumChange(event: Event): void {
    const condominiumId = (event.target as HTMLSelectElement).value;
    this.formData.update(current => ({
      ...current,
      condominiumId,
      buildingId: '',
      unitId: ''
    }));
    this.loadBuildingsByCondominium(condominiumId);
  }

  onBuildingChange(event: Event): void {
    const buildingId = (event.target as HTMLSelectElement).value;
    this.formData.update(current => ({
      ...current,
      buildingId,
      unitId: ''
    }));
    this.loadUnitsByBuilding(buildingId);
  }

  onUnitChange(event: Event): void {
    const unitId = (event.target as HTMLSelectElement).value;
    // Buscar la unidad seleccionada para obtener el buildingId automáticamente
    const selectedUnit = this.availableUnits().find(u => u.id === unitId);
    
    this.formData.update(current => ({
      ...current,
      unitId,
      buildingId: selectedUnit?.buildingId || current.buildingId
    }));
  }

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
    
    const selectedCondoId = this.selectedCondo()?.id === 'all' ? '' : this.selectedCondo()?.id || '';
    
    this.formData.set({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      documentType: DocumentType.CURP,
      documentNumber: '',
      type: ResidentType.OWNER,
      condominiumId: selectedCondoId,
      buildingId: '',
      unitId: '',
      moveInDate: new Date(),
      emergencyContactName: '',
      emergencyContactPhone: ''
    });
    
    // Si hay un condominio seleccionado, cargar sus edificios
    if (selectedCondoId) {
      this.loadBuildingsByCondominium(selectedCondoId);
    }
    
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
      buildingId: resident.buildingId,
      unitId: resident.unitId,
      moveInDate: resident.moveInDate,
      emergencyContactName: resident.emergencyContactName,
      emergencyContactPhone: resident.emergencyContactPhone
    });
    
    // Cargar edificios y unidades del condominio actual
    if (resident.condominiumId) {
      this.loadBuildingsByCondominium(resident.condominiumId);
    }
    if (resident.buildingId) {
      this.loadUnitsByBuilding(resident.buildingId);
    }
    
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
            this.showToastMessage('Residente creado exitosamente', 'success');
            this.closeModal();
            this.loadResidents();
          } else {
            this.showToastMessage(response.error?.message || 'Error al crear el residente', 'error');
          }
          this.loading.set(false);
        },
        error: (err: any) => {
          console.error('Error creating resident:', err);
          this.showToastMessage('Error al crear el residente', 'error');
          this.loading.set(false);
        }
      });
    } else if (this.modalMode() === 'edit') {
      const residentId = this.selectedResident()?.id;
      if (!residentId) return;

      this.residentService.updateResident(residentId, data as UpdateResidentDto).subscribe({
        next: (response: ApiResponse<any>) => {
          if (response.success) {
            this.showToastMessage('Residente actualizado exitosamente', 'success');
            this.closeModal();
            this.loadResidents();
          } else {
            this.showToastMessage(response.error?.message || 'Error al actualizar el residente', 'error');
          }
          this.loading.set(false);
        },
        error: (err: any) => {
          console.error('Error updating resident:', err);
          this.showToastMessage('Error al actualizar el residente', 'error');
          this.loading.set(false);
        }
      });
    }
  }

  openDeactivateModal(resident: ResidentDetails): void {
    this.residentToDeactivate.set(resident);
    this.showDeactivateModal.set(true);
  }

  closeDeactivateModal(): void {
    this.showDeactivateModal.set(false);
    this.residentToDeactivate.set(null);
    this.isDeactivating.set(false);
  }

  confirmDeactivate(): void {
    const resident = this.residentToDeactivate();
    if (!resident) return;

    this.isDeactivating.set(true);

    this.residentService.deactivateResident(resident.id).subscribe({
      next: (response: ApiResponse<any>) => {
        if (response.success) {
          this.showToastMessage('Residente desactivado exitosamente', 'success');
          this.closeDeactivateModal();
          this.loadResidents();
        } else {
          this.showToastMessage(response.error?.message || 'Error al desactivar el residente', 'error');
          this.isDeactivating.set(false);
        }
      },
      error: (err: any) => {
        console.error('Error deactivating resident:', err);
        this.showToastMessage('Error al desactivar el residente', 'error');
        this.isDeactivating.set(false);
      }
    });
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

  deactivateResident(resident: ResidentDetails): void {
    // Now redirects to modal
    this.openDeactivateModal(resident);
  }

  openDeleteModal(resident: ResidentDetails): void {
    this.residentToDelete.set(resident);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.residentToDelete.set(null);
    this.isDeleting.set(false);
  }

  confirmDelete(): void {
    const resident = this.residentToDelete();
    if (!resident) return;

    this.isDeleting.set(true);

    this.residentService.deleteResident(resident.id).subscribe({
      next: (response: ApiResponse<any>) => {
        if (response.success) {
          this.showToastMessage('Residente eliminado exitosamente', 'success');
          this.closeDeleteModal();
          this.loadResidents();
        } else {
          this.showToastMessage(response.error?.message || 'Error al eliminar el residente', 'error');
          this.isDeleting.set(false);
        }
      },
      error: (err: any) => {
        console.error('Error deleting resident:', err);
        this.showToastMessage('Error al eliminar el residente', 'error');
        this.isDeleting.set(false);
      }
    });
  }

  private validateForm(data: Partial<CreateResidentDto>): boolean {
    if (!data.firstName || !data.lastName || !data.email || !data.phone || 
        !data.documentNumber || !data.condominiumId || !data.buildingId || !data.unitId) {
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

  // Wizard methods
  openWizard(): void {
    const selectedCondoId = this.selectedCondo()?.id;
    if (!selectedCondoId || selectedCondoId === 'all') {
      this.showToastMessage('Por favor seleccione un condominio específico', 'error');
      return;
    }
    this.showWizard.set(true);
  }

  onWizardComplete(data: WizardCompletedData): void {
    this.showWizard.set(false);
    this.showToastMessage('Asignación completada exitosamente', 'success');
    this.loadResidents(); // Reload data
  }

  onWizardCancel(): void {
    this.showWizard.set(false);
  }

  // Utility methods
  getTypeBadgeClass(type: ResidentType): string {
    const classes: Record<ResidentType, string> = {
      [ResidentType.OWNER]: 'badge-primary',
      [ResidentType.TENANT]: 'badge-secondary',
      [ResidentType.FAMILY_MEMBER]: 'badge-accent',
      [ResidentType.COHABITANT]: 'badge-neutral'
    };
    return classes[type] || 'badge-neutral';
  }

  getTypeLabel(type: ResidentType): string {
    const labels: Record<ResidentType, string> = {
      [ResidentType.OWNER]: 'Propietario',
      [ResidentType.TENANT]: 'Inquilino',
      [ResidentType.FAMILY_MEMBER]: 'Familiar',
      [ResidentType.COHABITANT]: 'Residente'
    };
    return labels[type] || type;
  }

  getDocumentTypeLabel(type: DocumentType): string {
    const labels: Record<DocumentType, string> = {
      [DocumentType.CURP]: 'CURP',
      [DocumentType.RFC]: 'RFC',
      [DocumentType.INE]: 'INE',
      [DocumentType.PASSPORT]: 'Pasaporte',
      [DocumentType.FM3]: 'FM3'
    };
    return labels[type] || type;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(amount);
  }

  formatDate(date: Date | undefined): string {
    if (!date) return '-';
    return new Intl.DateTimeFormat('es-MX', {
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
