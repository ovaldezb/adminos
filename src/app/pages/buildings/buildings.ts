import { Component, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar';
import { SideMenuComponent } from '../../components/side-menu/side-menu';
import { BuildingService, CondominiumService } from '../../services';
import { 
  Building, 
  BuildingDetails, 
  BuildingType, 
  BuildingStatus,
  CreateBuildingDto,
  UpdateBuildingDto,
  ApiResponse,
  Condominium,
  CreateCondominiumDto,
  CondominiumType,
  CondominiumStatus
} from '../../models';

@Component({
  selector: 'app-buildings',
  imports: [CommonModule, FormsModule, NavbarComponent, SideMenuComponent, RouterLink],
  templateUrl: './buildings.html'
})
export class BuildingsComponent {
  protected readonly sidebarOpen = signal(window.innerWidth >= 1024); // Abierto solo en desktop
  protected readonly userName = signal('Administrador');
  protected readonly selectedCondo = signal<Condominium | null>(null);
  protected readonly isOverviewMode = computed(() => !this.selectedCondo() || this.selectedCondo()?.id === 'all');
  
  // Expose Math for template
  protected readonly Math = Math;
  
  // Dropdown data
  protected readonly availableCondominiums = signal<Condominium[]>([]);
  
  // Data signals
  protected readonly buildings = signal<BuildingDetails[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  
  // Pagination
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly totalPages = signal(1);
  protected readonly totalItems = signal(0);
  
  // Filters
  protected readonly searchTerm = signal('');
  protected readonly typeFilter = signal<BuildingType | ''>('');
  protected readonly statusFilter = signal<BuildingStatus | ''>('');
  
  // Modal state
  protected readonly showModal = signal(false);
  protected readonly modalMode = signal<'create' | 'edit' | 'view'>('create');
  protected readonly selectedBuilding = signal<BuildingDetails | null>(null);
  
  // Toast notifications
  protected readonly showToast = signal(false);
  protected readonly toastMessage = signal('');
  protected readonly toastType = signal<'success' | 'error' | 'info'>('success');
  
  // Delete confirmation modal
  protected readonly showDeleteModal = signal(false);
  protected readonly buildingToDelete = signal<BuildingDetails | null>(null);
  protected readonly isDeleting = signal(false);
  
  // Condominium creation modal
  protected readonly showCondoModal = signal(false);
  protected readonly condoLoading = signal(false);
  protected readonly condoError = signal<string | null>(null);
  
  // Condominium form data
  protected readonly condoFormData = signal<Partial<CreateCondominiumDto>>({
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
    rfc: '',
    description: ''
  });
  
  // Form data
  protected readonly formData = signal<Partial<CreateBuildingDto>>({
    condominiumId: '',
    name: '',
    type: BuildingType.BUILDING,
    mainEntranceAddress: '',
    totalUnits: 0,
    floors: 1,
    hasCommonAreas: false,
    commonAreasDescription: '',
    commonAreaRentalRate: 0,
    status: BuildingStatus.ACTIVE,
    yearBuilt: new Date().getFullYear(),
    parkingSpots: 0,
    elevators: 0,
    securityFeatures: [],
    amenities: [],
    description: ''
  });
  
  // Temporary arrays for security features and amenities
  protected readonly newSecurityFeature = signal('');
  protected readonly newAmenity = signal('');
  
  // Enums for template
  protected readonly BuildingType = BuildingType;
  protected readonly BuildingStatus = BuildingStatus;
  
  // Computed filtered buildings
  protected readonly filteredBuildings = computed(() => {
    let filtered = this.buildings();
    
    const search = this.searchTerm().toLowerCase();
    if (search) {
      filtered = filtered.filter(b =>
        b.name.toLowerCase().includes(search) ||
        b.mainEntranceAddress.toLowerCase().includes(search) ||
        b.description?.toLowerCase().includes(search)
      );
    }
    
    const type = this.typeFilter();
    if (type) {
      filtered = filtered.filter(b => b.type === type);
    }
    
    const status = this.statusFilter();
    if (status) {
      filtered = filtered.filter(b => b.status === status);
    }
    
    return filtered;
  });

  // Computed statistics
  protected readonly totalActive = computed(() => 
    this.filteredBuildings().filter(b => b.status === BuildingStatus.ACTIVE).length
  );

  protected readonly totalUnits = computed(() => 
    this.filteredBuildings().reduce((sum, b) => sum + b.totalUnits, 0)
  );

  protected readonly totalWithCommonAreas = computed(() => 
    this.filteredBuildings().filter(b => b.hasCommonAreas).length
  );

  protected readonly averageOccupancy = computed(() => {
    const buildings = this.filteredBuildings();
    if (buildings.length === 0) return 0;
    return buildings.reduce((sum, b) => sum + b.occupancyRate, 0) / buildings.length;
  });

  constructor(
    private router: Router,
    private buildingService: BuildingService,
    private condominiumService: CondominiumService
  ) {
    // Load initial data
    effect(() => {
      const condo = this.selectedCondo();
      this.loadBuildings();
    });
    
    // Load condominiums for dropdown
    this.loadCondominiums();
  }

  toggleSidebar(): void {
    this.sidebarOpen.set(!this.sidebarOpen());
  }

  onCondoSelected(condo: Condominium | null): void {
    this.selectedCondo.set(condo);
    this.currentPage.set(1);
    this.loadBuildings();
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

  loadBuildings(): void {
    this.loading.set(true);
    this.error.set(null);
    
    const condoId = this.selectedCondo()?.id;
    
    this.buildingService.getBuildings({
      page: this.currentPage(),
      pageSize: this.pageSize(),
      condominiumId: condoId,
      search: this.searchTerm() || undefined,
      type: this.typeFilter() || undefined,
      status: this.statusFilter() || undefined
    }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.buildings.set(response.data.items);
          this.totalPages.set(response.data.totalPages);
          this.totalItems.set(response.data.total);
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading buildings:', err);
        this.error.set('Error al cargar los edificios');
        this.loading.set(false);
      }
    });
  }

  openCreateModal(): void {
    this.modalMode.set('create');
    this.selectedBuilding.set(null);
    
    // Si hay un condominio específico seleccionado, lo usamos; si no, dejamos que el usuario seleccione
    const selectedCondoId = this.selectedCondo()?.id;
    const defaultCondoId = selectedCondoId === 'all' ? '' : selectedCondoId || '';
    
    this.formData.set({
      condominiumId: defaultCondoId,
      name: '',
      type: BuildingType.BUILDING,
      mainEntranceAddress: '',
      totalUnits: 0,
      floors: 1,
      hasCommonAreas: false,
      commonAreasDescription: '',
      commonAreaRentalRate: 0,
      status: BuildingStatus.ACTIVE,
      yearBuilt: new Date().getFullYear(),
      parkingSpots: 0,
      elevators: 0,
      securityFeatures: [],
      amenities: [],
      description: ''
    });
    this.showModal.set(true);
  }

  openEditModal(building: BuildingDetails): void {
    this.modalMode.set('edit');
    this.selectedBuilding.set(building);
    this.formData.set({
      condominiumId: building.condominiumId,
      name: building.name,
      type: building.type,
      mainEntranceAddress: building.mainEntranceAddress,
      totalUnits: building.totalUnits,
      floors: building.floors,
      hasCommonAreas: building.hasCommonAreas,
      commonAreasDescription: building.commonAreasDescription,
      commonAreaRentalRate: building.commonAreaRentalRate,
      status: building.status,
      yearBuilt: building.yearBuilt,
      parkingSpots: building.parkingSpots,
      elevators: building.elevators,
      securityFeatures: building.securityFeatures || [],
      amenities: building.amenities || [],
      description: building.description
    });
    this.showModal.set(true);
  }

  openViewModal(building: BuildingDetails): void {
    this.modalMode.set('view');
    this.selectedBuilding.set(building);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.selectedBuilding.set(null);
    this.newSecurityFeature.set('');
    this.newAmenity.set('');
  }

  saveBuilding(): void {
    const data = this.formData();
    
    if (!this.validateForm(data)) {
      return;
    }

    this.loading.set(true);

    if (this.modalMode() === 'create') {
      this.buildingService.createBuilding(data as CreateBuildingDto).subscribe({
        next: (response) => {
          if (response.success) {
            this.showToastMessage('Edificio creado exitosamente', 'success');
            this.closeModal();
            this.loadBuildings();
          } else {
            this.showToastMessage(response.error?.message || 'Error al crear el edificio', 'error');
          }
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error creating building:', err);
          this.showToastMessage('Error al crear el edificio', 'error');
          this.loading.set(false);
        }
      });
    } else if (this.modalMode() === 'edit') {
      const buildingId = this.selectedBuilding()?.id;
      if (!buildingId) return;

      this.buildingService.updateBuilding(buildingId, data as UpdateBuildingDto).subscribe({
        next: (response) => {
          if (response.success) {
            this.showToastMessage('Edificio actualizado exitosamente', 'success');
            this.closeModal();
            this.loadBuildings();
          } else {
            this.showToastMessage(response.error?.message || 'Error al actualizar el edificio', 'error');
          }
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error updating building:', err);
          this.showToastMessage('Error al actualizar el edificio', 'error');
          this.loading.set(false);
        }
      });
    }
  }

  openDeleteModal(building: BuildingDetails): void {
    this.buildingToDelete.set(building);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.buildingToDelete.set(null);
    this.isDeleting.set(false);
  }

  confirmDelete(): void {
    const building = this.buildingToDelete();
    if (!building) return;

    this.isDeleting.set(true);

    this.buildingService.deleteBuilding(building.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.showToastMessage('Edificio eliminado exitosamente', 'success');
          this.closeDeleteModal();
          this.loadBuildings();
        } else {
          this.showToastMessage(response.error?.message || 'Error al eliminar el edificio', 'error');
          this.isDeleting.set(false);
        }
      },
      error: (err) => {
        console.error('Error deleting building:', err);
        this.showToastMessage('Error al eliminar el edificio', 'error');
        this.isDeleting.set(false);
      }
    });
  }

  // Array management for security features and amenities
  addSecurityFeature(): void {
    const feature = this.newSecurityFeature().trim();
    if (feature) {
      const current = this.formData();
      this.formData.set({
        ...current,
        securityFeatures: [...(current.securityFeatures || []), feature]
      });
      this.newSecurityFeature.set('');
    }
  }

  removeSecurityFeature(index: number): void {
    const current = this.formData();
    const features = [...(current.securityFeatures || [])];
    features.splice(index, 1);
    this.formData.set({
      ...current,
      securityFeatures: features
    });
  }

  addAmenity(): void {
    const amenity = this.newAmenity().trim();
    if (amenity) {
      const current = this.formData();
      this.formData.set({
        ...current,
        amenities: [...(current.amenities || []), amenity]
      });
      this.newAmenity.set('');
    }
  }

  removeAmenity(index: number): void {
    const current = this.formData();
    const amenities = [...(current.amenities || [])];
    amenities.splice(index, 1);
    this.formData.set({
      ...current,
      amenities: amenities
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

  private showToastMessage(message: string, type: 'success' | 'error' | 'info'): void {
    this.toastMessage.set(message);
    this.toastType.set(type);
    this.showToast.set(true);
    
    // Auto hide after 3 seconds
    setTimeout(() => {
      this.showToast.set(false);
    }, 3000);
  }

  private validateForm(data: Partial<CreateBuildingDto>): boolean {
    if (!data.condominiumId || !data.name || !data.mainEntranceAddress || !data.totalUnits) {
      this.error.set('Por favor complete todos los campos obligatorios');
      return false;
    }
    
    if (data.totalUnits <= 0) {
      this.error.set('El número de viviendas debe ser mayor a 0');
      return false;
    }
    
    return true;
  }

  // Pagination
  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.set(this.currentPage() + 1);
      this.loadBuildings();
    }
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
      this.loadBuildings();
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadBuildings();
    }
  }

  // Filters
  onSearchChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
    this.currentPage.set(1);
    this.loadBuildings();
  }

  onTypeFilterChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as BuildingType | '';
    this.typeFilter.set(value);
    this.currentPage.set(1);
    this.loadBuildings();
  }

  onStatusFilterChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as BuildingStatus | '';
    this.statusFilter.set(value);
    this.currentPage.set(1);
    this.loadBuildings();
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.typeFilter.set('');
    this.statusFilter.set('');
    this.currentPage.set(1);
    this.loadBuildings();
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

  // Condominium Modal Methods
  openCondoModal(): void {
    this.condoFormData.set({
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
      rfc: '',
      description: ''
    });
    this.condoError.set(null);
    this.showCondoModal.set(true);
  }

  closeCondoModal(): void {
    this.showCondoModal.set(false);
    this.condoError.set(null);
    this.condoLoading.set(false);
  }

  updateCondoField(field: string, value: string): void {
    const current = this.condoFormData();
    this.condoFormData.set({
      ...current,
      [field]: value
    });
  }

  saveCondominium(): void {
    const data = this.condoFormData();
    
    if (!this.validateCondoForm(data)) {
      return;
    }

    // Agregar campos requeridos por la lambda (solo para creación)
    const now = new Date();
    data.createdAt = now;
    data.updatedAt = now;
    data.status = CondominiumStatus.ACTIVE;

    this.condoLoading.set(true);
    this.condoError.set(null);

    this.condominiumService.createCondominium(data as CreateCondominiumDto).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.showToastMessage('Condominio creado exitosamente', 'success');
          this.closeCondoModal();
          // Reload condominiums and select the new one
          this.loadCondominiums();
          // Auto-select the new condominium in the building form
          setTimeout(() => {
            this.updateFormField('condominiumId', response.data!.id);
          }, 100);
        } else {
          this.condoError.set(response.error?.message || 'Error al crear el condominio');
        }
        this.condoLoading.set(false);
      },
      error: (err) => {
        console.error('Error creating condominium:', err);
        this.condoError.set('Error al crear el condominio');
        this.condoLoading.set(false);
      }
    });
  }

  private validateCondoForm(data: Partial<CreateCondominiumDto>): boolean {
    if (!data.name || !data.streetAddress || !data.neighborhood || 
        !data.zipCode || !data.city || !data.state || !data.country) {
      this.condoError.set('Por favor complete todos los campos obligatorios');
      return false;
    }
    
    if (data.name.length < 3) {
      this.condoError.set('El nombre debe tener al menos 3 caracteres');
      return false;
    }
    
    return true;
  }

  // Utility methods
  getTypeBadgeClass(type: BuildingType): string {
    const classes: Record<BuildingType, string> = {
      [BuildingType.TOWER]: 'badge-primary',
      [BuildingType.BUILDING]: 'badge-secondary',
      [BuildingType.PRIVATE_RESIDENCE]: 'badge-info',
      [BuildingType.CLUSTER]: 'badge-accent'
    };
    return classes[type] || 'badge-neutral';
  }

  getTypeLabel(type: BuildingType): string {
    const labels: Record<BuildingType, string> = {
      [BuildingType.TOWER]: 'Torre',
      [BuildingType.BUILDING]: 'Edificio',
      [BuildingType.PRIVATE_RESIDENCE]: 'Privada',
      [BuildingType.CLUSTER]: 'Conjunto'
    };
    return labels[type] || type;
  }

  getStatusBadgeClass(status: BuildingStatus): string {
    const classes: Record<BuildingStatus, string> = {
      [BuildingStatus.ACTIVE]: 'badge-success',
      [BuildingStatus.UNDER_CONSTRUCTION]: 'badge-warning',
      [BuildingStatus.UNDER_MAINTENANCE]: 'badge-info',
      [BuildingStatus.INACTIVE]: 'badge-error'
    };
    return classes[status] || 'badge-neutral';
  }

  getStatusLabel(status: BuildingStatus): string {
    const labels: Record<BuildingStatus, string> = {
      [BuildingStatus.ACTIVE]: 'Activo',
      [BuildingStatus.UNDER_CONSTRUCTION]: 'En Construcción',
      [BuildingStatus.UNDER_MAINTENANCE]: 'En Mantenimiento',
      [BuildingStatus.INACTIVE]: 'Inactivo'
    };
    return labels[status] || status;
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

  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }
}
