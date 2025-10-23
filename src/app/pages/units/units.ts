import { Component, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar';
import { SideMenuComponent } from '../../components/side-menu/side-menu';
import type { Condominium } from '../../components/condo-selector/condo-selector';
import { UnitService } from '../../services';
import { 
  Unit, 
  UnitDetails, 
  UnitStatus, 
  PropertyType,
  CreateUnitDto,
  UpdateUnitDto,
  ApiResponse
} from '../../models';

@Component({
  selector: 'app-units',
  imports: [CommonModule, FormsModule, NavbarComponent, SideMenuComponent],
  templateUrl: './units.html',
  styleUrl: './units.css'
})
export class UnitsComponent {
  protected readonly sidebarOpen = signal(false);
  protected readonly userName = signal('Administrador');
  protected readonly selectedCondo = signal<Condominium | null>(null);
  protected readonly isOverviewMode = computed(() => !this.selectedCondo() || this.selectedCondo()?.id === 'all');
  
  // Expose Math for template
  protected readonly Math = Math;
  
  // Data signals
  protected readonly units = signal<UnitDetails[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  
  // Pagination
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly totalPages = signal(1);
  protected readonly totalItems = signal(0);
  
  // Filters
  protected readonly searchTerm = signal('');
  protected readonly statusFilter = signal<UnitStatus | ''>('');
  protected readonly propertyTypeFilter = signal<PropertyType | ''>('');
  
  // Modal state
  protected readonly showModal = signal(false);
  protected readonly modalMode = signal<'create' | 'edit' | 'view'>('create');
  protected readonly selectedUnit = signal<UnitDetails | null>(null);
  
  // Toast notifications
  protected readonly showToast = signal(false);
  protected readonly toastMessage = signal('');
  protected readonly toastType = signal<'success' | 'error' | 'info'>('success');
  
  // Delete confirmation modal
  protected readonly showDeleteModal = signal(false);
  protected readonly unitToDelete = signal<UnitDetails | null>(null);
  protected readonly isDeleting = signal(false);
  
  // Form data
  protected readonly formData = signal<Partial<CreateUnitDto>>({
    condominiumId: '',
    unitNumber: '',
    tower: '',
    floor: 1,
    area: 0,
    bedrooms: 0,
    bathrooms: 0,
    parkingSpaces: 0,
    storageSpaces: 0,
    status: UnitStatus.VACANT,
    monthlyFee: 0,
    propertyType: PropertyType.APARTMENT,
    orientation: '',
    hasBalcony: false,
    hasGarden: false,
    isFurnished: false,
    description: ''
  });
  
  // Enums for template
  protected readonly UnitStatus = UnitStatus;
  protected readonly PropertyType = PropertyType;
  
  // Computed filtered units
  protected readonly filteredUnits = computed(() => {
    let filtered = this.units();
    
    const search = this.searchTerm().toLowerCase();
    if (search) {
      filtered = filtered.filter(u =>
        u.unitNumber.toLowerCase().includes(search) ||
        u.tower.toLowerCase().includes(search) ||
        u.ownerName?.toLowerCase().includes(search) ||
        u.residentName?.toLowerCase().includes(search)
      );
    }
    
    const status = this.statusFilter();
    if (status) {
      filtered = filtered.filter(u => u.status === status);
    }
    
    const propertyType = this.propertyTypeFilter();
    if (propertyType) {
      filtered = filtered.filter(u => u.propertyType === propertyType);
    }
    
    return filtered;
  });

  // Computed statistics
  protected readonly totalOccupied = computed(() => 
    this.filteredUnits().filter(u => u.status === UnitStatus.OCCUPIED).length
  );

  protected readonly totalVacant = computed(() => 
    this.filteredUnits().filter(u => u.status === UnitStatus.VACANT).length
  );

  protected readonly totalWithDebt = computed(() => 
    this.filteredUnits().filter(u => u.hasDebt).length
  );

  constructor(
    private router: Router,
    private unitService: UnitService
  ) {
    // Load initial data
    effect(() => {
      const condo = this.selectedCondo();
      this.loadUnits();
    });
  }

  toggleSidebar(): void {
    this.sidebarOpen.set(!this.sidebarOpen());
  }

  onCondoSelected(condo: Condominium | null): void {
    console.log('Units recibió selección:', condo?.name);
    this.selectedCondo.set(condo);
    this.currentPage.set(1);
    this.loadUnits();
  }

  // CRUD Operations
  loadUnits(): void {
    this.loading.set(true);
    this.error.set(null);
    
    const condoId = this.selectedCondo()?.id;
    
    this.unitService.getUnits({
      page: this.currentPage(),
      pageSize: this.pageSize(),
      condominiumId: condoId,
      search: this.searchTerm() || undefined,
      status: this.statusFilter() || undefined
    }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.units.set(response.data.items);
          this.totalPages.set(response.data.totalPages);
          this.totalItems.set(response.data.total);
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading units:', err);
        this.error.set('Error al cargar las unidades');
        this.loading.set(false);
      }
    });
  }

  openCreateModal(): void {
    this.modalMode.set('create');
    this.selectedUnit.set(null);
    this.formData.set({
      condominiumId: this.selectedCondo()?.id === 'all' ? '' : this.selectedCondo()?.id || '',
      unitNumber: '',
      tower: '',
      floor: 1,
      area: 0,
      bedrooms: 0,
      bathrooms: 0,
      parkingSpaces: 0,
      storageSpaces: 0,
      status: UnitStatus.VACANT,
      monthlyFee: 0,
      propertyType: PropertyType.APARTMENT,
      orientation: '',
      hasBalcony: false,
      hasGarden: false,
      isFurnished: false,
      description: ''
    });
    this.showModal.set(true);
  }

  openEditModal(unit: UnitDetails): void {
    this.modalMode.set('edit');
    this.selectedUnit.set(unit);
    this.formData.set({
      condominiumId: unit.condominiumId,
      unitNumber: unit.unitNumber,
      tower: unit.tower,
      floor: unit.floor,
      area: unit.area,
      bedrooms: unit.bedrooms,
      bathrooms: unit.bathrooms,
      parkingSpaces: unit.parkingSpaces,
      storageSpaces: unit.storageSpaces,
      status: unit.status,
      monthlyFee: unit.monthlyFee,
      propertyType: unit.propertyType,
      orientation: unit.orientation,
      hasBalcony: unit.hasBalcony,
      hasGarden: unit.hasGarden,
      isFurnished: unit.isFurnished,
      description: unit.description
    });
    this.showModal.set(true);
  }

  openViewModal(unit: UnitDetails): void {
    this.modalMode.set('view');
    this.selectedUnit.set(unit);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.selectedUnit.set(null);
  }

  saveUnit(): void {
    const data = this.formData();
    
    if (!this.validateForm(data)) {
      return;
    }

    this.loading.set(true);

    if (this.modalMode() === 'create') {
      this.unitService.createUnit(data as CreateUnitDto).subscribe({
        next: (response) => {
          if (response.success) {
            this.showToastMessage('Unidad creada exitosamente', 'success');
            this.closeModal();
            this.loadUnits();
          } else {
            this.showToastMessage(response.error?.message || 'Error al crear la unidad', 'error');
          }
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error creating unit:', err);
          this.showToastMessage('Error al crear la unidad', 'error');
          this.loading.set(false);
        }
      });
    } else if (this.modalMode() === 'edit') {
      const unitId = this.selectedUnit()?.id;
      if (!unitId) return;

      this.unitService.updateUnit(unitId, data as UpdateUnitDto).subscribe({
        next: (response) => {
          if (response.success) {
            this.showToastMessage('Unidad actualizada exitosamente', 'success');
            this.closeModal();
            this.loadUnits();
          } else {
            this.showToastMessage(response.error?.message || 'Error al actualizar la unidad', 'error');
          }
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error updating unit:', err);
          this.showToastMessage('Error al actualizar la unidad', 'error');
          this.loading.set(false);
        }
      });
    }
  }

  openDeleteModal(unit: UnitDetails): void {
    this.unitToDelete.set(unit);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.unitToDelete.set(null);
    this.isDeleting.set(false);
  }

  confirmDelete(): void {
    const unit = this.unitToDelete();
    if (!unit) return;

    this.isDeleting.set(true);

    this.unitService.deleteUnit(unit.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.showToastMessage('Unidad eliminada exitosamente', 'success');
          this.closeDeleteModal();
          this.loadUnits();
        } else {
          this.showToastMessage(response.error?.message || 'Error al eliminar la unidad', 'error');
          this.isDeleting.set(false);
        }
      },
      error: (err) => {
        console.error('Error deleting unit:', err);
        this.showToastMessage('Error al eliminar la unidad', 'error');
        this.isDeleting.set(false);
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

  private validateForm(data: Partial<CreateUnitDto>): boolean {
    if (!data.condominiumId || !data.unitNumber || !data.tower) {
      this.error.set('Por favor complete todos los campos obligatorios');
      return false;
    }
    return true;
  }

  // Pagination
  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.set(this.currentPage() + 1);
      this.loadUnits();
    }
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
      this.loadUnits();
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadUnits();
    }
  }

  // Filters
  onSearchChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
    this.currentPage.set(1);
    this.loadUnits();
  }

  onStatusFilterChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as UnitStatus | '';
    this.statusFilter.set(value);
    this.currentPage.set(1);
    this.loadUnits();
  }

  onPropertyTypeFilterChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as PropertyType | '';
    this.propertyTypeFilter.set(value);
    this.currentPage.set(1);
    this.loadUnits();
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.statusFilter.set('');
    this.propertyTypeFilter.set('');
    this.currentPage.set(1);
    this.loadUnits();
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
  getStatusBadgeClass(status: UnitStatus): string {
    const classes: Record<UnitStatus, string> = {
      [UnitStatus.OCCUPIED]: 'badge-success',
      [UnitStatus.VACANT]: 'badge-warning',
      [UnitStatus.UNDER_MAINTENANCE]: 'badge-info',
      [UnitStatus.FOR_SALE]: 'badge-secondary',
      [UnitStatus.FOR_RENT]: 'badge-primary'
    };
    return classes[status] || 'badge-neutral';
  }

  getStatusLabel(status: UnitStatus): string {
    const labels: Record<UnitStatus, string> = {
      [UnitStatus.OCCUPIED]: 'Ocupada',
      [UnitStatus.VACANT]: 'Vacante',
      [UnitStatus.UNDER_MAINTENANCE]: 'En Mantenimiento',
      [UnitStatus.FOR_SALE]: 'En Venta',
      [UnitStatus.FOR_RENT]: 'En Alquiler'
    };
    return labels[status] || status;
  }

  getPropertyTypeLabel(type: PropertyType): string {
    const labels: Record<PropertyType, string> = {
      [PropertyType.APARTMENT]: 'Departamento',
      [PropertyType.PENTHOUSE]: 'Penthouse',
      [PropertyType.DUPLEX]: 'Dúplex',
      [PropertyType.STUDIO]: 'Studio',
      [PropertyType.LOFT]: 'Loft',
      [PropertyType.TOWNHOUSE]: 'Casa'
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
}
