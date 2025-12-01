import { Component, signal, computed, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar';
import { SideMenuComponent } from '../../components/side-menu/side-menu';
import { BreadcrumbsComponent, BreadcrumbItem } from '../../components/breadcrumbs/breadcrumbs';
import { Condominium } from '../../models';
import { UnitService, BuildingService, CondominiumService } from '../../services';
import { 
  Unit, 
  UnitDetails, 
  UnitStatus, 
  PropertyType,
  CreateUnitDto,
  UpdateUnitDto,
  ApiResponse,
  BuildingDetails,
  UnitResident
} from '../../models';

@Component({
  selector: 'app-units',
  imports: [CommonModule, FormsModule, NavbarComponent, SideMenuComponent, BreadcrumbsComponent],
  templateUrl: './units.html',
  styleUrl: './units.css'
})
export class UnitsComponent implements OnInit {
  protected readonly sidebarOpen = signal(false);
  protected readonly userName = signal('Administrador');
  protected readonly selectedCondo = signal<Condominium | null>(null);
  protected readonly isOverviewMode = computed(() => !this.selectedCondo() || this.selectedCondo()?.id === 'all');
  
  // IDs from route
  protected readonly condominiumId = signal<string>('');
  protected readonly buildingId = signal<string>('');
  
  // Current entities
  protected readonly currentCondominium = signal<Condominium | null>(null);
  protected readonly currentBuilding = signal<BuildingDetails | null>(null);
  
  // Breadcrumbs
  protected readonly breadcrumbs = computed<BreadcrumbItem[]>(() => {
    const condo = this.currentCondominium();
    const building = this.currentBuilding();
    
    const items: BreadcrumbItem[] = [
      { label: 'Condominios', route: '/condominios', icon: 'ri-community-line' }
    ];
    
    if (condo) {
      items.push({ 
        label: condo.name, 
        route: `/condominios/${this.condominiumId()}/edificios`,
        icon: 'ri-building-line'
      });
    }
    
    if (building) {
      items.push({ 
        label: building.name,
        icon: 'ri-home-4-line'
      });
    }
    
    return items;
  });
  
  // Expose Math for template
  protected readonly Math = Math;
  
  // Dropdown data for buildings
  protected readonly availableCondominiums = signal<Condominium[]>([]);
  protected readonly availableBuildings = signal<BuildingDetails[]>([]);
  
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
  protected readonly buildingFilter = signal<string>(''); // Filtro por edificio
  
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
    buildingId: '',
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
    description: '',
    residents: []
  });
  
  // Resident management in form
  protected readonly unitResidents = signal<UnitResident[]>([]);
  
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
        (u.tower && u.tower.toLowerCase().includes(search)) ||
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
    private route: ActivatedRoute,
    private unitService: UnitService,
    private buildingService: BuildingService,
    private condominiumService: CondominiumService
  ) {
    // Effect to reload units when route params change
    effect(() => {
      this.route.params.subscribe(params => {
        const condoId = params['condoId'];
        const buildingId = params['buildingId'];
        
        if (condoId && buildingId) {
          this.condominiumId.set(condoId);
          this.buildingId.set(buildingId);
          this.loadCondominiumDetails(condoId);
          this.loadBuildingDetails(buildingId);
          this.loadUnits();
        }
      });
    });
  }

  ngOnInit(): void {
    console.log('[Units] ngOnInit - Initializing component');
    // Load condominiums first
    this.loadCondominiums();
  }

  toggleSidebar(): void {
    this.sidebarOpen.set(!this.sidebarOpen());
  }

  // Update when condo changes (from navbar)
  onCondoSelected(condo: Condominium | null): void {
    console.log('[Units] onCondoSelected - condo:', condo?.id);
    this.selectedCondo.set(condo);
  }

  // CRUD Operations
  loadCondominiums(): void {
    console.log('[Units] loadCondominiums - Starting...');
    this.condominiumService.getAllCondominiums().subscribe({
      next: (response) => {
        console.log('[Units] Condominiums loaded:', response);
        if (response.success && response.data) {
          const condos = response.data;
          console.log('[Units] Available condominiums count:', condos.length);
          this.availableCondominiums.set(condos);
        } else {
          console.warn('[Units] No condominiums data in response');
        }
      },
      error: (err) => {
        console.error('[Units] Error loading condominiums:', err);
      }
    });
  }

  loadCondominiumDetails(condoId: string): void {
    this.condominiumService.getCondominiumById(condoId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.currentCondominium.set(response.data);
          this.selectedCondo.set(response.data);
        }
      },
      error: (err) => {
        console.error('Error loading condominium details:', err);
        this.showToastMessage('Error al cargar los detalles del condominio', 'error');
      }
    });
  }

  loadBuildingDetails(buildingId: string): void {
    this.buildingService.getBuildingById(buildingId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.currentBuilding.set(response.data);
        }
      },
      error: (err) => {
        console.error('Error loading building details:', err);
        this.showToastMessage('Error al cargar los detalles del edificio', 'error');
      }
    });
  }

  loadBuildingsByCondominium(condominiumId: string): void {
    if (!condominiumId || condominiumId === 'all') {
      this.availableBuildings.set([]);
      return;
    }

    this.buildingService.getBuildings().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.availableBuildings.set(response.data.items);
        }
      },
      error: (err) => console.error('Error loading buildings:', err)
    });
  }

  onCondominiumChange(event: Event): void {
    const condominiumId = (event.target as HTMLSelectElement).value;
    this.formData.update(current => ({
      ...current,
      condominiumId,
      buildingId: '',
      tower: ''
    }));
    this.loadBuildingsByCondominium(condominiumId);
  }

  onBuildingChange(event: Event): void {
    const buildingId = (event.target as HTMLSelectElement).value;
    const selectedBuilding = this.availableBuildings().find(b => (b.id || b._id) === buildingId);
    
    console.log('[Units] onBuildingChange - buildingId:', buildingId);
    console.log('[Units] onBuildingChange - selectedBuilding:', selectedBuilding);
    
    // Usar el nombre del edificio como torre por defecto
    const towerName = selectedBuilding?.name || 'Torre Principal';
    console.log('[Units] onBuildingChange - tower will be:', towerName);
    
    this.formData.update(current => ({
      ...current,
      buildingId,
      tower: towerName
    }));
    
    console.log('[Units] onBuildingChange - formData after update:', this.formData());
  }

  loadUnits(): void {
    console.log('[Units] loadUnits - Starting...');
    
    const buildingId = this.buildingId();
    
    // Si no hay buildingId desde la ruta, no cargar
    if (!buildingId) {
      console.log('⚠️ No building ID from route - waiting');
      this.units.set([]);
      this.loading.set(false);
      return;
    }
    
    this.loading.set(true);
    this.error.set(null);
    
    console.log('[Units] loadUnits - Building ID:', buildingId);
    
    // Llamar al servicio SIN PARÁMETROS y filtrar localmente
    this.unitService.getUnits({ page: 1, pageSize: 1000 }).subscribe({
      next: (response) => {
        console.log('[Units] loadUnits - Response received:', response);
        if (response.success && response.data) {
          const allUnits = response.data.items || [];
          
          // Filter units by buildingId
          const filteredUnits = allUnits.filter((u: UnitDetails) => {
            const unitBuildingId = u.buildingId || (u as any).building_id;
            return unitBuildingId === buildingId;
          });
          
          console.log('[Units] Total units:', allUnits.length);
          console.log('[Units] Filtered units for buildingId:', buildingId, '->', filteredUnits.length);
          
          this.units.set(filteredUnits);
          this.totalPages.set(Math.ceil(filteredUnits.length / this.pageSize()));
          this.totalItems.set(filteredUnits.length);
        } else {
          console.warn('[Units] loadUnits - No data in response or error:', response.error);
          this.units.set([]);
          this.totalPages.set(1);
          this.totalItems.set(0);
          if (response.error?.message) {
            this.error.set(response.error.message);
          }
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('[Units] loadUnits - HTTP Error:', err);
        console.error('[Units] loadUnits - Error details:', {
          status: err.status,
          statusText: err.statusText,
          message: err.message,
          url: err.url
        });
        this.error.set('Error al cargar las unidades. Revisa la consola para más detalles.');
        this.units.set([]);
        this.totalPages.set(1);
        this.totalItems.set(0);
        this.loading.set(false);
      }
    });
  }

  openCreateModal(): void {
    this.modalMode.set('create');
    this.selectedUnit.set(null);
    
    const selectedCondoId = this.selectedCondo()?.id === 'all' ? '' : this.selectedCondo()?.id || '';
    
    this.formData.set({
      condominiumId: selectedCondoId,
      buildingId: '',
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
      description: '',
      residents: []
    });
    
    // Reset residents list
    this.unitResidents.set([]);
    
    this.showModal.set(true);
  }

  openEditModal(unit: UnitDetails): void {
    console.log('[Units] openEditModal - unit:', unit);
    
    this.modalMode.set('edit');
    this.selectedUnit.set(unit);
    
    // Cargar residentes existentes
    const existingResidents = unit.residents || unit.residentDetails || [];
    this.unitResidents.set([...existingResidents]);
    
    // Para editar solo necesitamos buildingId
    if (!unit.buildingId) {
      this.error.set('Error: La unidad no tiene un edificio asignado.');
      return;
    }
    
    // Función para establecer formData con el nombre del edificio correcto
    const setFormDataWithTower = () => {
      const currentBuilding = this.availableBuildings().find(b => (b.id || b._id) === unit.buildingId);
      const towerName = currentBuilding?.name || unit.tower || 'Torre Principal';
      
      console.log('[Units] openEditModal - buildingId:', unit.buildingId);
      console.log('[Units] openEditModal - availableBuildings:', this.availableBuildings().map(b => ({id: b.id || b._id, name: b.name})));
      console.log('[Units] openEditModal - currentBuilding:', currentBuilding);
      console.log('[Units] openEditModal - tower will be:', towerName);
      
      this.formData.set({
        condominiumId: unit.condominiumId || '',
        buildingId: unit.buildingId,
        unitNumber: unit.unitNumber || '',
        tower: towerName,
        floor: unit.floor || 1,
        area: unit.area || 0,
        bedrooms: unit.bedrooms || 0,
        bathrooms: unit.bathrooms || 0,
        parkingSpaces: unit.parkingSpaces || 0,
        storageSpaces: unit.storageSpaces || 0,
        status: unit.status || UnitStatus.VACANT,
        monthlyFee: unit.monthlyFee || 0,
        propertyType: unit.propertyType || PropertyType.APARTMENT,
        orientation: unit.orientation || '',
        hasBalcony: unit.hasBalcony || false,
        hasGarden: unit.hasGarden || false,
        isFurnished: unit.isFurnished || false,
        description: unit.description || ''
      });
      
      console.log('[Units] openEditModal - formData set:', this.formData());
    };
    
    // Si ya hay edificios cargados, usar directamente
    if (this.availableBuildings().length > 0) {
      setFormDataWithTower();
    } else {
      // Si no hay edificios, cargarlos primero
      console.log('[Units] openEditModal - Loading buildings first...');
      
      // Cargar edificios según condominiumId
      if (unit.condominiumId && unit.condominiumId !== 'undefined') {
        this.buildingService.getBuildings({ condominiumId: unit.condominiumId }).subscribe({
          next: (response) => {
            if (response.success && response.data) {
              const validBuildings = (response.data.items || []).filter(b => b.id || b._id);
              this.availableBuildings.set(validBuildings);
              console.log('[Units] openEditModal - Buildings loaded:', validBuildings.length);
              setFormDataWithTower();
            }
          },
          error: (err) => console.error('[Units] Error loading buildings:', err)
        });
      } else {
        // Cargar todos los edificios
        this.buildingService.getBuildings().subscribe({
          next: (response) => {
            if (response.success && response.data) {
              const validBuildings = (response.data.items || []).filter(b => b.id || b._id);
              this.availableBuildings.set(validBuildings);
              console.log('[Units] openEditModal - All buildings loaded:', validBuildings.length);
              setFormDataWithTower();
            }
          },
          error: (err) => console.error('[Units] Error loading buildings:', err)
        });
      }
    }
    
    this.showModal.set(true);
  }

  private setFormDataAndLoadBuildings(unit: UnitDetails, condominiumId: string): void {
    console.log('[Units] setFormDataAndLoadBuildings - condominiumId:', condominiumId);
    console.log('[Units] setFormDataAndLoadBuildings - buildingId:', unit.buildingId);
    
    // Validar que condominiumId sea válido
    if (!condominiumId || condominiumId === 'undefined' || condominiumId === 'null') {
      console.error('[Units] setFormDataAndLoadBuildings - Invalid condominiumId:', condominiumId);
      this.error.set('Error: ID de condominio inválido');
      return;
    }
    
    // Set form data con todos los campos
    this.formData.set({
      condominiumId: condominiumId,
      buildingId: unit.buildingId || '',
      unitNumber: unit.unitNumber || '',
      tower: unit.tower || '',
      floor: unit.floor || 1,
      area: unit.area || 0,
      bedrooms: unit.bedrooms || 0,
      bathrooms: unit.bathrooms || 0,
      parkingSpaces: unit.parkingSpaces || 0,
      storageSpaces: unit.storageSpaces || 0,
      status: unit.status || UnitStatus.VACANT,
      monthlyFee: unit.monthlyFee || 0,
      propertyType: unit.propertyType || PropertyType.APARTMENT,
      orientation: unit.orientation || '',
      hasBalcony: unit.hasBalcony || false,
      hasGarden: unit.hasGarden || false,
      isFurnished: unit.isFurnished || false,
      description: unit.description || ''
    });
    
    console.log('[Units] setFormDataAndLoadBuildings - formData set:', this.formData());
    console.log('[Units] setFormDataAndLoadBuildings - availableCondominiums:', this.availableCondominiums().map(c => ({id: c.id, name: c.name})));
    
    // Cargar edificios del condominio
    if (condominiumId) {
      console.log('[Units] setFormDataAndLoadBuildings - Loading buildings for condo:', condominiumId);
      this.loadBuildingsByCondominium(condominiumId);
    }
    
    // Abrir el modal después de cargar los datos
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
    console.log('==========================================');
    console.log('[Units] saveUnit - CALLED!');
    console.log('[Units] saveUnit - modalMode:', this.modalMode());
    console.log('[Units] saveUnit - formData:', this.formData());
    console.log('[Units] saveUnit - formData.tower:', this.formData().tower);
    console.log('[Units] saveUnit - unitResidents:', this.unitResidents());
    console.log('==========================================');
    
    const data = {
      ...this.formData(),
      residents: this.unitResidents()
    };
    
    console.log('[Units] saveUnit - data to send:', data);
    console.log('[Units] saveUnit - data.tower:', data.tower);
    
    if (!this.validateForm(data)) {
      console.warn('[Units] saveUnit - Validation failed');
      console.log('[Units] saveUnit - error message:', this.error());
      return;
    }

    console.log('[Units] saveUnit - Validation PASSED, setting loading...');
    this.loading.set(true);
    console.log('[Units] saveUnit - loading set to:', this.loading());

    if (this.modalMode() === 'create') {
      console.log('[Units] saveUnit - Creating unit...');
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
      const selectedUnit = this.selectedUnit();
      console.log('[Units] saveUnit - Editing unit with ID:', unitId);
      console.log('[Units] saveUnit - Selected unit:', selectedUnit);
      
      if (!unitId || !selectedUnit) {
        console.error('[Units] saveUnit - No unit ID found!');
        this.showToastMessage('Error: No se encontró el ID de la unidad', 'error');
        this.loading.set(false);
        return;
      }

      // Agregar createdAt desde la unidad original
      const updateData = {
        ...data,
        createdAt: selectedUnit.createdAt || new Date()
      };

      console.log('[Units] saveUnit - Calling updateUnit service...');
      console.log('[Units] saveUnit - Update data with createdAt:', updateData);
      this.unitService.updateUnit(unitId, updateData as UpdateUnitDto).subscribe({
        next: (response) => {
          console.log('[Units] saveUnit - Update response:', response);
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
    // Tanto en create como en edit, solo buildingId y unitNumber son obligatorios
    if (!data.buildingId || !data.unitNumber) {
      this.error.set('Por favor complete todos los campos obligatorios (Edificio, Número de Unidad)');
      return false;
    }
    
    if (!data.area || data.area <= 0) {
      this.error.set('El área debe ser mayor a 0');
      return false;
    }
    
    if (data.monthlyFee === undefined || data.monthlyFee === null || data.monthlyFee < 0) {
      this.error.set('La cuota mensual debe ser mayor o igual a 0');
      return false;
    }
    
    // Validar residentes si existen
    if (!this.validateResidents()) {
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

  onBuildingFilterChange(event: Event): void {
    const buildingId = (event.target as HTMLSelectElement).value;
    this.buildingFilter.set(buildingId);
    // Debug: log current condo and building selection
    console.log('[Units] Building filter changed:', {
      buildingId,
      selectedCondo: this.selectedCondo()?.id
    });
    this.currentPage.set(1);
    // Always fetch units when building changes
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

  getTypeLabel(type: any): string {
    // Para tipos de edificio
    const buildingLabels: Record<string, string> = {
      'tower': 'Torre',
      'building': 'Edificio',
      'private_residence': 'Privada',
      'cluster': 'Conjunto'
    };
    return buildingLabels[type] || type;
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

  // === Resident Management Methods ===
  
  addResident(): void {
    const newResident: UnitResident = {
      name: '',
      phone: '',
      email: '',
      isResident: true, // Por defecto vive ahí
      isManager: false,
      isOwner: false
    };
    this.unitResidents.update(residents => [...residents, newResident]);
  }

  removeResident(index: number): void {
    this.unitResidents.update(residents => 
      residents.filter((_, i) => i !== index)
    );
  }

  updateResident(index: number, field: keyof UnitResident, value: any): void {
    this.unitResidents.update(residents => 
      residents.map((r, i) => i === index ? { ...r, [field]: value } : r)
    );
  }

  // === Form Field Update Methods ===
  
  updateFormField(field: keyof CreateUnitDto, value: any): void {
    this.formData.update(current => ({
      ...current,
      [field]: value
    }));
  }

  onFormFieldChange(event: Event, field: keyof CreateUnitDto): void {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    let value: any = target.value;
    
    // Convert to appropriate type
    if (target.type === 'number') {
      value = parseFloat(value) || 0;
    } else if (target.type === 'checkbox') {
      value = (target as HTMLInputElement).checked;
    }
    
    this.updateFormField(field, value);
  }

  validateResidents(): boolean {
    const residents = this.unitResidents();
    
    // Validar que todos los residentes tengan nombre y celular
    for (let i = 0; i < residents.length; i++) {
      const resident = residents[i];
      
      if (!resident.name || !resident.name.trim()) {
        this.error.set(`El residente ${i + 1} debe tener un nombre`);
        return false;
      }
      
      if (!resident.phone || !resident.phone.trim()) {
        this.error.set(`El residente ${i + 1} debe tener un número de celular`);
        return false;
      }
      
      // Validar email si existe
      if (resident.email && resident.email.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(resident.email)) {
          this.error.set(`El correo del residente ${i + 1} no es válido`);
          return false;
        }
      }
    }
    
    return true;
  }

  getResidentLabel(resident: UnitResident, index: number): string {
    const labels = [];
    if (resident.isOwner) labels.push('Dueño');
    if (resident.isManager) labels.push('Encargado');
    if (resident.isResident) labels.push('Reside');
    if (!resident.isResident && resident.isOwner) labels.push('Solo Dueño');
    
    return labels.length > 0 ? labels.join(' | ') : `Residente ${index + 1}`;
  }

  // Navigation
  goBackToBuildings(): void {
    const condoId = this.condominiumId();
    this.router.navigate(['/condominios', condoId, 'edificios']);
  }

  goBackToCondominiums(): void {
    this.router.navigate(['/condominios']);
  }
}
