import { Component, signal, computed, effect, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar';
import { SideMenuComponent } from '../../components/side-menu/side-menu';
import { BreadcrumbsComponent, BreadcrumbItem } from '../../components/breadcrumbs/breadcrumbs';
import { Building, Condominium } from '../../models';
import { UnitService, BuildingService, CondominiumService, ResidentService } from '../../services';
import { 
  Unit, 
  UnitDetails, 
  UnitStatus, 
  PropertyType,
  CreateUnitDto,
  UpdateUnitDto,
  ApiResponse,
  BuildingDetails,
  UnitResident,
  CreateResidentDto,
  DocumentType,
  ResidentType
} from '../../models';

@Component({
  selector: 'app-units',
  imports: [CommonModule, FormsModule, NavbarComponent, SideMenuComponent, BreadcrumbsComponent],
  templateUrl: './units.html',
  styleUrl: './units.css'
})
export class UnitsComponent implements OnInit, OnDestroy {
  protected readonly sidebarOpen = signal(false);
  protected readonly userName = signal('Administrador');
  protected readonly selectedCondo = signal<Condominium | null>(null);
  protected readonly isOverviewMode = computed(() => !this.selectedCondo() || this.selectedCondo()?.id === 'all');
  
  // IDs from route
  protected readonly condominiumId = signal<string>('');
  protected readonly buildingId = signal<string>('');
  
  // Current entities
  protected readonly currentCondominium = signal<Condominium | null>(null);
  protected readonly currentBuilding = signal<Building | null>(null);
  
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

  // Event listeners para limpieza
  private buildingCreatedListener?: (event: Event) => void;
  private condominiumCreatedListener?: (event: Event) => void;
  
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
    private condominiumService: CondominiumService,
    private residentService: ResidentService
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

    // Debug effect for unitResidents
    effect(() => {
      console.log('[Units] Constructor effect - unitResidents changed:', this.unitResidents());
    });

    // Escuchar eventos de edificios creados para actualizar la lista automáticamente
    this.setupBuildingCreatedListener();
    
    // Escuchar eventos de condominios creados para actualizar la lista automáticamente
    this.setupCondominiumCreatedListener();
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

  // Configurar listener para eventos de edificios creados
  private setupBuildingCreatedListener(): void {
    console.log('[Units] Configurando listener para eventos de edificios creados...');
    
    // Crear listener function que puede ser removido después
    this.buildingCreatedListener = (event: any) => {
      const eventData = event.detail;
      console.log('🏢 [Units] Edificio creado detectado:', eventData);
      
      // Si el edificio pertenece al condominio actual, actualizar la lista
      const currentCondoId = this.condominiumId();
      if (eventData.condominiumId === currentCondoId) {
        console.log('🔄 [Units] Actualizando lista de edificios...');
        this.loadBuildingsByCondominium(currentCondoId);
        
        // Si el modal está abierto, preseleccionar el nuevo edificio
        if (this.showModal() && this.modalMode() === 'create') {
          setTimeout(() => {
            console.log('✨ [Units] Preseleccionando nuevo edificio en formulario...');
            this.preselectNewBuilding(eventData.building);
          }, 500); // Esperar un poco para que se cargue la lista
        }
      }
    };
    
    // Registrar el listener
    window.addEventListener('buildingCreated', this.buildingCreatedListener);
  }

  // Preseleccionar el edificio recién creado en el formulario
  private preselectNewBuilding(newBuilding: any): void {
    console.log('🎯 [Units] Preseleccionando edificio:', newBuilding);
    
    const buildingId = newBuilding.id || newBuilding._id;
    if (buildingId) {
      const currentBuildingId = this.formData().buildingId;
      
      // Solo preseleccionar si no hay edificio ya seleccionado o si está vacío
      if (!currentBuildingId || currentBuildingId === '') {
        // Actualizar el formulario con el nuevo edificio
        this.formData.update(current => ({
          ...current,
          buildingId: buildingId,
          tower: newBuilding.name || 'Torre Principal'
        }));
        
        console.log('✅ [Units] Edificio preseleccionado:', buildingId);
        this.showToastMessage(`Edificio "${newBuilding.name}" seleccionado automáticamente`, 'success');
      } else {
        // Si ya hay un edificio seleccionado, solo mostrar notificación
        console.log('ℹ️ [Units] Edificio ya seleccionado, solo notificando');
        this.showToastMessage(`Nuevo edificio "${newBuilding.name}" disponible en la lista`, 'info');
      }
      
      // Siempre actualizar el filtro de edificio para reflejar el nuevo edificio disponible
      if (!this.buildingFilter() || this.buildingFilter() === '') {
        this.buildingFilter.set(buildingId);
      }
    }
  }

  // Configurar listener para eventos de condominios creados
  private setupCondominiumCreatedListener(): void {
    console.log('[Units] Configurando listener para eventos de condominios creados...');
    
    // Crear listener function que puede ser removido después
    this.condominiumCreatedListener = (event: any) => {
      const eventData = event.detail;
      console.log('🏘️ [Units] Condominio creado detectado:', eventData);
      
      // Actualizar la lista de condominios disponibles
      console.log('🔄 [Units] Actualizando lista de condominios...');
      this.loadCondominiums();
      
      // Si el modal está abierto, preseleccionar el nuevo condominio
      if (this.showModal() && this.modalMode() === 'create') {
        setTimeout(() => {
          console.log('✨ [Units] Preseleccionando nuevo condominio en formulario...');
          this.preselectNewCondominium(eventData.condominium);
        }, 500); // Esperar un poco para que se cargue la lista
      }
    };
    
    // Registrar el listener
    window.addEventListener('condominiumCreated', this.condominiumCreatedListener);
  }

  // Preseleccionar el condominio recién creado en el formulario
  private preselectNewCondominium(newCondominium: any): void {
    console.log('🎯 [Units] Preseleccionando condominio:', newCondominium);
    
    const condoId = newCondominium.id || newCondominium._id;
    if (condoId) {
      const currentCondoId = this.formData().condominiumId;
      
      // Solo preseleccionar si no hay condominio ya seleccionado o si está vacío
      if (!currentCondoId || currentCondoId === '') {
        // Actualizar el formulario con el nuevo condominio
        this.formData.update(current => ({
          ...current,
          condominiumId: condoId
        }));
        
        // También limpiar el edificio seleccionado ya que cambió el condominio
        this.formData.update(current => ({
          ...current,
          buildingId: ''
        }));
        
        // Cargar edificios del nuevo condominio
        this.loadBuildingsByCondominium(condoId);
        
        console.log('✅ [Units] Condominio preseleccionado:', condoId);
        this.showToastMessage(`Condominio "${newCondominium.name}" seleccionado automáticamente`, 'success');
      } else {
        // Si ya hay un condominio seleccionado, solo mostrar notificación
        console.log('ℹ️ [Units] Condominio ya seleccionado, solo notificando');
        this.showToastMessage(`Nuevo condominio "${newCondominium.name}" disponible en la lista`, 'info');
      }
    }
  }

  // CRUD Operations
  loadCondominiums(): void {
    console.log('[Units] loadCondominiums - Starting...');
    this.condominiumService.getAllCondominiums().subscribe({
      next: (response) => {
        
        if (response.success && response.data) {
          const condos = response.data;
          //console.log('[Units] Available condominiums count:', condos.length);
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
    console.log('[Units] loadBuildingsByCondominium - condominiumId:', condominiumId);  
    if (!condominiumId || condominiumId === 'all') {
      this.availableBuildings.set([]);
      return;
    }

    this.buildingService.getBuildings({ condominiumId }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const validBuildings = (response.data.items || []).filter(b => b.id || b._id);
          console.log('[Units] loadBuildingsByCondominium - Buildings loaded:', validBuildings.length);
          this.availableBuildings.set(validBuildings);
        } else {
          console.warn('[Units] loadBuildingsByCondominium - No buildings found');
          this.availableBuildings.set([]);
        }
      },
      error: (err) => {
        console.error('[Units] Error loading buildings:', err);
        this.availableBuildings.set([]);
      }
    });
  }

  onCondominiumChange(event: Event): void {
    const condominiumId = (event.target as HTMLSelectElement).value;
    console.log('[Units] onCondominiumChange - condominiumId:', condominiumId);
    
    // Actualizar formData y limpiar campos dependientes
    this.formData.update(current => ({
      ...current,
      condominiumId,
      buildingId: '',
      tower: ''
    }));
    
    // Cargar edificios del condominio seleccionado
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
    this.loading.set(true);
    this.error.set(null);
    
    const condoId = this.condominiumId() || this.selectedCondo()?.id;
    const buildingId = this.buildingId();
    
    console.log('[Units] loadUnits - condoId:', condoId, 'buildingId:', buildingId);
    
    const params = {
      page: this.currentPage(),
      pageSize: this.pageSize(),
      condominiumId: condoId && condoId !== 'all' ? condoId : undefined,
      buildingId: buildingId || undefined,
      search: this.searchTerm() || undefined,
      status: this.statusFilter() || undefined
    };
    
    this.unitService.getUnits(params).subscribe({
      next: (response) => {
        console.log('[Units] loadUnits - Response received:', response);
        if (response.success && response.data) {
          const items = response.data.items || [];
          console.log('[Units] loadUnits - Units loaded:', items.length);
          this.units.set(items);
          this.totalPages.set(response.data.totalPages || 1);
          this.totalItems.set(response.data.total || 0);
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
    console.log('[Units] openCreateModal - Starting...');
    this.modalMode.set('create');
    this.selectedUnit.set(null);
    this.loading.set(true);
    
    // Usar los IDs de la ruta actual como valores predeterminados
    const currentCondoId = this.condominiumId();
    const currentBuildingId = this.buildingId();
    
    console.log('[Units] openCreateModal - Route IDs:', { currentCondoId, currentBuildingId });
    
    // Inicializar datos del formulario con los valores de la ruta
    this.formData.set({
      condominiumId: currentCondoId || '',
      buildingId: currentBuildingId || '',
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
    
    // Asegurar que tenemos condominios cargados
    if (this.availableCondominiums().length === 0) {
      console.log('[Units] openCreateModal - Loading condominiums...');
      this.condominiumService.getAllCondominiums().subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.availableCondominiums.set(response.data);
            console.log('[Units] openCreateModal - Condominiums loaded:', response.data.length);
          }
          
          // Cargar buildings si hay condominio seleccionado
          if (currentCondoId && currentCondoId !== 'all') {
            this.loadBuildingsByCondominium(currentCondoId);
          }
          
          // Si ya tenemos el edificio actual cargado, precargar la torre
          if (currentBuildingId && this.currentBuilding()) {
            this.formData.update(current => ({
              ...current,
              tower: this.currentBuilding()?.name || 'Torre Principal'
            }));
          }
          
          this.loading.set(false);
          this.showModal.set(true);
        },
        error: (err) => {
          console.error('[Units] openCreateModal - Error loading condominiums:', err);
          this.error.set('Error al cargar los condominios disponibles');
          this.loading.set(false);
        }
      });
    } else {
      // Ya tenemos condominios, cargar buildings si es necesario
      if (currentCondoId && currentCondoId !== 'all') {
        this.loadBuildingsByCondominium(currentCondoId);
      }
      
      // Si ya tenemos el edificio actual cargado, precargar la torre
      if (currentBuildingId && this.currentBuilding()) {
        this.formData.update(current => ({
          ...current,
          tower: this.currentBuilding()?.name || 'Torre Principal'
        }));
      }
      
      this.loading.set(false);
      this.showModal.set(true);
    }
  }

  openEditModal(unit: UnitDetails): void {
    console.log('[Units] openEditModal - unit:', unit);
    
    this.modalMode.set('edit');
    this.selectedUnit.set(unit);
    this.loading.set(true);
    
    // Usar los IDs de la ruta actual como fuente de verdad
    const currentCondoId = this.condominiumId();
    const currentBuildingId = this.buildingId();
    
    console.log('[Units] openEditModal - Route IDs:', { currentCondoId, currentBuildingId });
    console.log('[Units] openEditModal - Unit IDs:', { condominiumId: unit.condominiumId, buildingId: unit.buildingId });
    
    // Validaciones usando los IDs de la ruta
    if (!currentBuildingId) {
      this.error.set('Error: No se puede editar la unidad, falta el ID del edificio en la ruta.');
      this.loading.set(false);
      return;
    }

    if (!currentCondoId) {
      this.error.set('Error: No se puede editar la unidad, falta el ID del condominio en la ruta.');
      this.loading.set(false);
      return;
    }

    // Cargar residentes existentes y mapearlos al formato correcto
    const existingResidents = unit.residents || unit.residentDetails || [];
    console.log('[Units] openEditModal - Existing residents:', existingResidents);
    console.log('[Units] openEditModal - Residents count:', existingResidents.length);
    
    // Mapear residentes del backend al formato del formulario
    const mappedResidents: UnitResident[] = existingResidents.map((resident: any) => {
      console.log('[Units] openEditModal - Mapping resident:', resident);
      
      const fullName = resident.firstName && resident.lastName 
        ? `${resident.firstName} ${resident.lastName}`.trim()
        : resident.name || '';
      
      const mapped = {
        id: resident.id || resident._id,
        name: fullName,
        phone: resident.phone || '',
        email: resident.email || '',
        isResident: true,
        isManager: false,
        isOwner: resident.type === 'OWNER' || resident.type === ResidentType.OWNER
      } as UnitResident;
      
      console.log('[Units] openEditModal - Mapped resident result:', mapped);
      return mapped;
    });
    
    console.log('[Units] openEditModal - Mapped residents for form:', mappedResidents);
    console.log('[Units] openEditModal - Setting unitResidents signal...');
    this.unitResidents.set(mappedResidents);
    console.log('[Units] openEditModal - unitResidents signal value after set:', this.unitResidents());
    
    // Función para establecer todos los datos del formulario
    const setCompleteFormData = (condominiums: Condominium[], buildings: BuildingDetails[]) => {
      // Usar el edificio actual de la ruta como fuente de verdad
      const currentBuilding = buildings.find(b => (b.id || b._id) === currentBuildingId);
      const currentCondominium = condominiums.find(c => (c.id || c._id) === currentCondoId);
      const towerName = currentBuilding?.name || unit.tower || 'Torre Principal';
      
      console.log('[Units] openEditModal - Setting complete form data:');
      console.log('- Current building from route:', currentBuilding);
      console.log('- Current condominium from route:', currentCondominium);
      console.log('- Tower name:', towerName);
      
      this.formData.set({
        condominiumId: currentCondoId,
        buildingId: currentBuildingId,
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
        description: unit.description || '',
        residents: existingResidents
      });
      
      console.log('[Units] openEditModal - Form data set complete:', this.formData());
      this.loading.set(false);
      this.showModal.set(true);
    };
    
    // Verificar si ya tenemos todos los datos necesarios
    const hasCondominiums = this.availableCondominiums().length > 0;
    const hasBuildings = this.availableBuildings().length > 0;
    const hasBuildingForUnit = hasBuildings && this.availableBuildings().some(b => (b.id || b._id) === unit.buildingId);
    
    if (hasCondominiums && hasBuildingForUnit) {
      // Ya tenemos todos los datos
      console.log('[Units] openEditModal - Using existing data');
      setCompleteFormData(this.availableCondominiums(), this.availableBuildings());
    } else {
      // Necesitamos cargar datos
      console.log('[Units] openEditModal - Loading required data...');
      
      // Cargar condominiums y buildings en paralelo
      const condominiumsPromise = hasCondominiums 
        ? Promise.resolve({ success: true, data: this.availableCondominiums() })
        : this.condominiumService.getAllCondominiums().toPromise();
        
      const buildingsPromise = this.buildingService.getBuildings({ 
        condominiumId: currentCondoId 
      }).toPromise();
      
      Promise.all([condominiumsPromise, buildingsPromise])
        .then(([condoResponse, buildingResponse]) => {
          console.log('[Units] openEditModal - Data loaded:', { condoResponse, buildingResponse });
          
          let condominiums: Condominium[] = [];
          let buildings: BuildingDetails[] = [];
          
          // Procesar condominiums
          if (hasCondominiums) {
            condominiums = this.availableCondominiums();
          } else if (condoResponse && 'success' in condoResponse && condoResponse.success && condoResponse.data) {
            condominiums = condoResponse.data;
            this.availableCondominiums.set(condominiums);
          }
          
          // Procesar buildings
          if (buildingResponse?.success && buildingResponse.data) {
            buildings = (buildingResponse.data.items || []).filter(b => b.id || b._id);
            this.availableBuildings.set(buildings);
          }
          
          console.log('[Units] openEditModal - Final data:', {
            condominiums: condominiums.length,
            buildings: buildings.length,
            targetBuildingId: unit.buildingId
          });
          
          setCompleteFormData(condominiums, buildings);
        })
        .catch((error) => {
          console.error('[Units] openEditModal - Error loading data:', error);
          this.error.set('Error al cargar los datos necesarios para editar la unidad');
          this.loading.set(false);
        });
    }
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
    
    // Filtrar residentes que tengan datos válidos (nombre y teléfono)
    const allResidents = this.unitResidents();
    console.log('[Units] saveUnit - All residents raw:', allResidents);
    console.log('[Units] saveUnit - All residents count:', allResidents.length);
    
    const validResidents = allResidents.filter(resident => {
      const isValid = resident.name && resident.name.trim() && 
                      resident.phone && resident.phone.trim();
      console.log('[Units] saveUnit - Checking resident:', resident, 'valid:', isValid);
      return isValid;
    });
    
    console.log('[Units] saveUnit - All residents:', this.unitResidents());
    console.log('[Units] saveUnit - Valid residents after filter:', validResidents);
    console.log('[Units] saveUnit - Valid residents count:', validResidents.length);
    
    const data = {
      ...this.formData(),
      residents: validResidents
    };
    
    console.log('[Units] saveUnit - data to send:', data);
    console.log('[Units] saveUnit - data.tower:', data.tower);
    console.log('[Units] saveUnit - data.residents:', data.residents);
    console.log('[Units] saveUnit - residents valid:', data.residents?.every(r => r.name && r.phone));
    
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
      
      if (validResidents.length === 0) {
        // Crear unidad sin residentes
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
      } else {
        // Crear unidad y luego crear residentes
        this.createUnitWithResidents(data as CreateUnitDto, validResidents);
      }
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

      // Procesar residentes: crear nuevos y mantener existentes
      this.processResidentsForUnit(unitId, validResidents, data, selectedUnit);
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
    console.log('[Units] addResident - Called');
    console.log('[Units] addResident - Current residents before add:', this.unitResidents());
    
    const newResident: UnitResident = {
      name: '',
      phone: '',
      email: '',
      isResident: true, // Por defecto vive ahí
      isManager: false,
      isOwner: false
    };
    
    console.log('[Units] addResident - New resident to add:', newResident);
    this.unitResidents.update(residents => {
      const updated = [...residents, newResident];
      console.log('[Units] addResident - Updated residents array:', updated);
      return updated;
    });
    
    console.log('[Units] addResident - Residents after update:', this.unitResidents());
  }

  removeResident(index: number): void {
    this.unitResidents.update(residents => 
      residents.filter((_, i) => i !== index)
    );
  }

  updateResident(index: number, field: keyof UnitResident, value: any): void {
    console.log('[Units] updateResident - Called with:', { index, field, value });
    console.log('[Units] updateResident - Current residents:', this.unitResidents());
    
    this.unitResidents.update(residents => {
      const updated = residents.map((r, i) => i === index ? { ...r, [field]: value } : r);
      console.log('[Units] updateResident - Updated residents:', updated);
      return updated;
    });
    
    console.log('[Units] updateResident - Final residents:', this.unitResidents());
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
    
    // Si no hay residentes, está bien (es opcional)
    if (residents.length === 0) {
      return true;
    }
    
    // Validar solo residentes que tengan al menos nombre o teléfono (no vacíos)
    const residentsWithData = residents.filter(r => 
      (r.name && r.name.trim()) || (r.phone && r.phone.trim())
    );
    
    for (let i = 0; i < residentsWithData.length; i++) {
      const resident = residentsWithData[i];
      const originalIndex = residents.indexOf(resident) + 1;
      
      if (!resident.name || !resident.name.trim()) {
        this.error.set(`El residente ${originalIndex} debe tener un nombre`);
        return false;
      }
      
      if (!resident.phone || !resident.phone.trim()) {
        this.error.set(`El residente ${originalIndex} debe tener un número de celular`);
        return false;
      }
      
      // Validar email si existe
      if (resident.email && resident.email.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(resident.email)) {
          this.error.set(`El correo del residente ${originalIndex} no es válido`);
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

  // Método de prueba para debuggear signals
  testResidentsSignal(): void {
    console.log('=== TEST RESIDENTS SIGNAL ===');
    console.log('Current unitResidents value:', this.unitResidents());
    
    // Test 1: Set some test data
    const testResidents = [
      { name: 'Test User 1', phone: '123456789', email: 'test1@email.com', isResident: true, isManager: false, isOwner: true },
      { name: 'Test User 2', phone: '987654321', email: 'test2@email.com', isResident: true, isManager: false, isOwner: false }
    ];
    
    this.unitResidents.set(testResidents);
    console.log('After setting test data:', this.unitResidents());
    
    // Test 2: Update using the update method
    this.unitResidents.update(residents => [...residents, { 
      name: 'Test User 3', 
      phone: '555666777', 
      email: 'test3@email.com', 
      isResident: true, 
      isManager: true, 
      isOwner: false 
    }]);
    
    console.log('After update method:', this.unitResidents());
    console.log('=== END TEST ===');
  }

  /**
   * Procesa los residentes para una unidad: crea nuevos residentes, actualiza existentes, y actualiza la unidad con sus IDs
   */
  private processResidentsForUnit(unitId: string, validResidents: UnitResident[], unitData: any, selectedUnit: UnitDetails): void {
    console.log('[Units] processResidentsForUnit - Starting...');
    console.log('[Units] processResidentsForUnit - unitId:', unitId);
    console.log('[Units] processResidentsForUnit - validResidents:', validResidents);

    if (validResidents.length === 0) {
      // Si no hay residentes, solo actualizar la unidad
      this.updateUnitWithoutResidents(unitId, unitData, selectedUnit);
      return;
    }

    // Separar residentes existentes (que tienen ID) de nuevos (sin ID)
    const existingResidents = validResidents.filter(r => r.id);
    const newResidents = validResidents.filter(r => !r.id);

    console.log('[Units] processResidentsForUnit - Existing residents:', existingResidents);
    console.log('[Units] processResidentsForUnit - New residents:', newResidents);

    // IDs de residentes existentes
    const existingResidentIds = existingResidents.map(r => r.id!);

    if (newResidents.length === 0) {
      // Solo hay residentes existentes, actualizar unidad directamente
      this.updateUnitWithResidents(unitId, unitData, selectedUnit, existingResidentIds);
      return;
    }

    // Crear solo los residentes nuevos
    const residentPromises = newResidents.map(resident => {
      const residentData: CreateResidentDto = {
        firstName: resident.name.split(' ')[0] || '',
        lastName: resident.name.split(' ').slice(1).join(' ') || '',
        phone: resident.phone,
        email: resident.email || '',
        unitId: unitId,
        condominiumId: unitData.condominiumId,
        buildingId: unitData.buildingId,
        type: resident.isOwner ? ResidentType.OWNER : ResidentType.TENANT,
        documentType: DocumentType.CURP,
        documentNumber: '',
        moveInDate: new Date(),
        emergencyContactName: '',
        emergencyContactPhone: ''
      };

      console.log('[Units] processResidentsForUnit - Creating new resident:', residentData);

      return this.residentService.createResident(residentData).toPromise();
    });

    // Esperar a que todos los nuevos residentes se creen
    Promise.all(residentPromises)
      .then(responses => {
        console.log('[Units] processResidentsForUnit - New resident creation responses:', responses);
        
        // Obtener IDs de residentes creados exitosamente
        const newResidentIds = responses
          .filter(response => response?.success && response.data)
          .map(response => {
            const data = response!.data! as any;
            return data.id || data._id;
          })
          .filter(id => id);

        console.log('[Units] processResidentsForUnit - New resident IDs:', newResidentIds);

        // Combinar IDs existentes con nuevos
        const allResidentIds = [...existingResidentIds, ...newResidentIds];
        console.log('[Units] processResidentsForUnit - All resident IDs:', allResidentIds);

        // Actualizar la unidad con todos los IDs de residentes
        this.updateUnitWithResidents(unitId, unitData, selectedUnit, allResidentIds);
      })
      .catch(error => {
        console.error('[Units] processResidentsForUnit - Error creating new residents:', error);
        this.showToastMessage('Error al crear los nuevos residentes', 'error');
        this.loading.set(false);
      });
  }

  /**
   * Crea una unidad y luego crea sus residentes
   */
  private createUnitWithResidents(unitData: CreateUnitDto, residents: UnitResident[]): void {
    console.log('[Units] createUnitWithResidents - Starting...');
    console.log('[Units] createUnitWithResidents - Unit data:', unitData);
    console.log('[Units] createUnitWithResidents - Residents:', residents);

    // Primero crear la unidad sin residentes
    const unitDataWithoutResidents = { ...unitData };
    delete (unitDataWithoutResidents as any).residents;

    this.unitService.createUnit(unitDataWithoutResidents).subscribe({
      next: (response) => {
        console.log('[Units] createUnitWithResidents - Unit creation response:', response);
        
        if (!response.success || !response.data) {
          this.showToastMessage(response.error?.message || 'Error al crear la unidad', 'error');
          this.loading.set(false);
          return;
        }

        const createdUnit = response.data;
        const unitId = createdUnit.id || (createdUnit as any)._id;

        if (!unitId) {
          this.showToastMessage('Error: No se pudo obtener el ID de la unidad creada', 'error');
          this.loading.set(false);
          return;
        }

        console.log('[Units] createUnitWithResidents - Created unit ID:', unitId);

        // Ahora crear los residentes
        const residentPromises = residents.map(resident => {
          const residentData: CreateResidentDto = {
            firstName: resident.name.split(' ')[0] || '',
            lastName: resident.name.split(' ').slice(1).join(' ') || '',
            phone: resident.phone,
            email: resident.email || '',
            unitId: unitId,
            condominiumId: unitData.condominiumId,
            buildingId: unitData.buildingId,
            type: resident.isOwner ? ResidentType.OWNER : ResidentType.TENANT,
            documentType: DocumentType.CURP,
            documentNumber: '',
            moveInDate: new Date(),
            emergencyContactName: '',
            emergencyContactPhone: ''
          };

          console.log('[Units] createUnitWithResidents - Creating resident:', residentData);
          return this.residentService.createResident(residentData).toPromise();
        });

        // Crear todos los residentes
        Promise.all(residentPromises)
          .then(residentResponses => {
            console.log('[Units] createUnitWithResidents - Resident responses:', residentResponses);
            
            const createdResidentIds = residentResponses
              .filter(response => response?.success && response.data)
              .map(response => {
                const data = response!.data! as any;
                return data.id || data._id;
              })
              .filter(id => id);

            console.log('[Units] createUnitWithResidents - Created resident IDs:', createdResidentIds);

            if (createdResidentIds.length > 0) {
              // Actualizar la unidad con los IDs de residentes
              const updateData = {
                ...unitDataWithoutResidents,
                id: unitId,
                residentsId: createdResidentIds
              };

              this.unitService.updateUnit(unitId, updateData as UpdateUnitDto).subscribe({
                next: (updateResponse) => {
                  console.log('[Units] createUnitWithResidents - Update response:', updateResponse);
                  const message = `Unidad creada exitosamente con ${createdResidentIds.length} residente(s)`;
                  this.showToastMessage(message, 'success');
                  this.closeModal();
                  this.loadUnits();
                  this.loading.set(false);
                },
                error: (err) => {
                  console.error('[Units] createUnitWithResidents - Error updating unit with residents:', err);
                  this.showToastMessage('Unidad creada pero error al asociar residentes', 'error');
                  this.closeModal();
                  this.loadUnits();
                  this.loading.set(false);
                }
              });
            } else {
              // No se crearon residentes, pero la unidad está creada
              this.showToastMessage('Unidad creada, pero no se pudieron crear los residentes', 'error');
              this.closeModal();
              this.loadUnits();
              this.loading.set(false);
            }
          })
          .catch(error => {
            console.error('[Units] createUnitWithResidents - Error creating residents:', error);
            this.showToastMessage('Unidad creada, pero error al crear los residentes', 'error');
            this.closeModal();
            this.loadUnits();
            this.loading.set(false);
          });
      },
      error: (err) => {
        console.error('[Units] createUnitWithResidents - Error creating unit:', err);
        this.showToastMessage('Error al crear la unidad', 'error');
        this.loading.set(false);
      }
    });
  }

  /**
   * Actualiza una unidad con la lista de IDs de residentes
   */
  private updateUnitWithResidents(unitId: string, unitData: any, selectedUnit: UnitDetails, residentIds: string[]): void {
    const updateData = {
      ...unitData,
      createdAt: selectedUnit.createdAt || new Date(),
      residentsId: residentIds
    };

    // Remover residentes del objeto de actualización ya que ahora usamos residentsId
    delete updateData.residents;

    console.log('[Units] updateUnitWithResidents - Update data:', updateData);

    this.unitService.updateUnit(unitId, updateData as UpdateUnitDto).subscribe({
      next: (response) => {
        console.log('[Units] updateUnitWithResidents - Response:', response);
        if (response.success) {
          const message = `Unidad actualizada exitosamente con ${residentIds.length} residente(s)`;
          this.showToastMessage(message, 'success');
          this.closeModal();
          this.loadUnits();
        } else {
          this.showToastMessage(response.error?.message || 'Error al actualizar la unidad', 'error');
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('[Units] updateUnitWithResidents - Error:', err);
        this.showToastMessage('Error al actualizar la unidad', 'error');
        this.loading.set(false);
      }
    });
  }

  /**
   * Actualiza una unidad sin residentes
   */
  private updateUnitWithoutResidents(unitId: string, unitData: any, selectedUnit: UnitDetails): void {
    const updateData = {
      ...unitData,
      createdAt: selectedUnit.createdAt || new Date(),
      residentsId: []
    };

    // Remover residentes del objeto de actualización
    delete updateData.residents;

    console.log('[Units] updateUnitWithoutResidents - Update data:', updateData);

    this.unitService.updateUnit(unitId, updateData as UpdateUnitDto).subscribe({
      next: (response) => {
        console.log('[Units] updateUnitWithoutResidents - Response:', response);
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
        console.error('[Units] updateUnitWithoutResidents - Error:', err);
        this.showToastMessage('Error al actualizar la unidad', 'error');
        this.loading.set(false);
      }
    });
  }

  ngOnDestroy(): void {
    // Limpiar event listeners para evitar memory leaks
    if (this.buildingCreatedListener) {
      window.removeEventListener('buildingCreated', this.buildingCreatedListener);
    }
    if (this.condominiumCreatedListener) {
      window.removeEventListener('condominiumCreated', this.condominiumCreatedListener);
    }
  }
}
