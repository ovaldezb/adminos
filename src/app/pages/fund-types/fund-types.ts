import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar';
import { SideMenuComponent } from '../../components/side-menu/side-menu';
import { BreadcrumbsComponent, BreadcrumbItem } from '../../components/breadcrumbs/breadcrumbs';
import { FundTypeService } from '../../services/fund-type.service';
import { 
  FundType, 
  FundTypeDetails, 
  FundCategory, 
  FundTypeColor,
  CreateFundTypeDto,
  UpdateFundTypeDto 
} from '../../models/fund-type.model';
import { Condominium } from '../../models';

@Component({
  selector: 'app-fund-types',
  imports: [CommonModule, FormsModule, NavbarComponent, SideMenuComponent, BreadcrumbsComponent],
  templateUrl: './fund-types.html',
  styleUrl: './fund-types.css'
})
export class FundTypesComponent implements OnInit {
  protected readonly sidebarOpen = signal(window.innerWidth >= 1024);
  protected readonly selectedCondo = signal<Condominium | null>(null);
  
  // Breadcrumbs
  protected readonly breadcrumbs = computed<BreadcrumbItem[]>(() => [
    { label: 'Configuración', route: '/configuracion', icon: 'ri-settings-3-line' },
    { label: 'Tipos de Fondos', icon: 'ri-money-dollar-circle-line' }
  ]);
  
  // Data
  protected readonly fundTypes = signal<FundTypeDetails[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  
  // Pagination
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly totalPages = signal(1);
  protected readonly totalItems = signal(0);
  
  // Filters
  protected readonly searchTerm = signal('');
  protected readonly categoryFilter = signal<FundCategory | ''>('');
  protected readonly activeFilter = signal<'all' | 'active' | 'inactive'>('all');
  
  // Categories and colors for dropdowns
  protected readonly categories: { value: FundCategory; label: string }[] = [];
  protected readonly colors: { value: FundTypeColor; label: string }[] = [];
  
  // Enum references for template
  protected readonly FundCategory = FundCategory;
  protected readonly FundTypeColor = FundTypeColor;
  
  // Computed stats for template
  protected readonly activeFundTypesCount = computed(() => 
    this.fundTypes().filter(f => f.isActive).length
  );
  
  protected readonly recurringFundTypesCount = computed(() => 
    this.fundTypes().filter(f => f.isRecurring).length
  );
  
  // Filtered fund types
  protected readonly filteredFundTypes = computed(() => {
    let result = this.fundTypes();
    
    const search = this.searchTerm().toLowerCase();
    if (search) {
      result = result.filter(f => 
        f.name.toLowerCase().includes(search) ||
        f.code.toLowerCase().includes(search) ||
        f.description.toLowerCase().includes(search)
      );
    }
    
    if (this.categoryFilter()) {
      result = result.filter(f => f.category === this.categoryFilter());
    }
    
    if (this.activeFilter() === 'active') {
      result = result.filter(f => f.isActive);
    } else if (this.activeFilter() === 'inactive') {
      result = result.filter(f => !f.isActive);
    }
    
    return result;
  });
  
  // Modal state
  protected readonly showModal = signal(false);
  protected readonly modalMode = signal<'create' | 'edit' | 'view'>('create');
  protected readonly selectedFundType = signal<FundTypeDetails | null>(null);
  
  // Form data
  protected formData: CreateFundTypeDto = this.getEmptyFormData();
  
  // Toast
  protected readonly showToast = signal(false);
  protected readonly toastMessage = signal('');
  protected readonly toastType = signal<'success' | 'error' | 'info'>('success');
  
  // Delete confirmation
  protected readonly showDeleteModal = signal(false);
  protected readonly fundTypeToDelete = signal<FundTypeDetails | null>(null);
  protected readonly isDeleting = signal(false);
  
  // Math for template
  protected readonly Math = Math;

  constructor(
    private router: Router,
    private fundTypeService: FundTypeService
  ) {
    this.categories = this.fundTypeService.getCategories();
    this.colors = this.fundTypeService.getColors();
  }

  ngOnInit() {
    this.loadFundTypes();
  }

  toggleSidebar() {
    this.sidebarOpen.update(v => !v);
  }

  async loadFundTypes() {
    this.loading.set(true);
    this.error.set(null);
    
    try {
      const response = await this.fundTypeService.getFundTypes({
        page: this.currentPage(),
        limit: this.pageSize(),
        search: this.searchTerm(),
        category: this.categoryFilter() || undefined,
        isActive: this.activeFilter() === 'all' ? undefined : this.activeFilter() === 'active'
      });
      
      if (response.success && response.data) {
        this.fundTypes.set(response.data.items);
        this.totalItems.set(response.data.total);
        this.totalPages.set(response.data.totalPages);
      } else {
        this.error.set(response.message || 'Error desconocido');
      }
    } catch (err) {
      this.error.set('Error al cargar los tipos de fondos');
    } finally {
      this.loading.set(false);
    }
  }

  // Filter handlers
  onSearchChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
    this.currentPage.set(1);
    this.loadFundTypes();
  }

  onCategoryFilterChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value as FundCategory | '';
    this.categoryFilter.set(value);
    this.currentPage.set(1);
    this.loadFundTypes();
  }

  onActiveFilterChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value as 'all' | 'active' | 'inactive';
    this.activeFilter.set(value);
    this.currentPage.set(1);
    this.loadFundTypes();
  }

  clearFilters() {
    this.searchTerm.set('');
    this.categoryFilter.set('');
    this.activeFilter.set('all');
    this.currentPage.set(1);
    this.loadFundTypes();
  }

  // Pagination
  previousPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
      this.loadFundTypes();
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
      this.loadFundTypes();
    }
  }

  goToPage(page: number) {
    this.currentPage.set(page);
    this.loadFundTypes();
  }

  // Modal handlers
  openCreateModal() {
    this.modalMode.set('create');
    this.selectedFundType.set(null);
    this.formData = this.getEmptyFormData();
    this.showModal.set(true);
  }

  openEditModal(fundType: FundTypeDetails) {
    this.modalMode.set('edit');
    this.selectedFundType.set(fundType);
    this.formData = {
      name: fundType.name,
      description: fundType.description,
      code: fundType.code,
      category: fundType.category,
      isRecurring: fundType.isRecurring,
      defaultAmount: fundType.defaultAmount,
      isActive: fundType.isActive,
      color: fundType.color,
      icon: fundType.icon,
      priority: fundType.priority
    };
    this.showModal.set(true);
  }

  openViewModal(fundType: FundTypeDetails) {
    this.modalMode.set('view');
    this.selectedFundType.set(fundType);
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.selectedFundType.set(null);
    this.formData = this.getEmptyFormData();
  }

  async saveForm() {
    if (!this.validateForm()) {
      return;
    }
    
    this.loading.set(true);
    
    try {
      let response;
      
      if (this.modalMode() === 'create') {
        response = await this.fundTypeService.createFundType(this.formData);
      } else {
        const id = this.selectedFundType()?.id || '';
        response = await this.fundTypeService.updateFundType(id, this.formData);
      }
      
      if (response.success) {
        this.showNotification(
          this.modalMode() === 'create' 
            ? 'Tipo de fondo creado correctamente' 
            : 'Tipo de fondo actualizado correctamente',
          'success'
        );
        this.closeModal();
        this.loadFundTypes();
      } else {
        this.showNotification(response.message || 'Error al guardar', 'error');
      }
    } catch (err) {
      this.showNotification('Error al guardar el tipo de fondo', 'error');
    } finally {
      this.loading.set(false);
    }
  }

  validateForm(): boolean {
    if (!this.formData.name?.trim()) {
      this.showNotification('El nombre es requerido', 'error');
      return false;
    }
    if (!this.formData.code?.trim()) {
      this.showNotification('El código es requerido', 'error');
      return false;
    }
    if (!this.formData.category) {
      this.showNotification('La categoría es requerida', 'error');
      return false;
    }
    return true;
  }

  // Delete handlers
  openDeleteModal(fundType: FundTypeDetails) {
    this.fundTypeToDelete.set(fundType);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal() {
    this.showDeleteModal.set(false);
    this.fundTypeToDelete.set(null);
  }

  async confirmDelete() {
    const fundType = this.fundTypeToDelete();
    if (!fundType) return;
    
    this.isDeleting.set(true);
    
    try {
      const response = await this.fundTypeService.deleteFundType(fundType.id);
      
      if (response.success) {
        this.showNotification('Tipo de fondo eliminado correctamente', 'success');
        this.closeDeleteModal();
        this.loadFundTypes();
      } else {
        this.showNotification(response.message || 'Error al eliminar', 'error');
      }
    } catch (err) {
      this.showNotification('Error al eliminar el tipo de fondo', 'error');
    } finally {
      this.isDeleting.set(false);
    }
  }

  // Utility methods
  private getEmptyFormData(): CreateFundTypeDto {
    return {
      name: '',
      description: '',
      code: '',
      category: FundCategory.MAINTENANCE,
      isRecurring: true,
      defaultAmount: undefined,
      isActive: true,
      color: FundTypeColor.PRIMARY,
      icon: 'ri-money-dollar-circle-line',
      priority: this.fundTypes().length + 1
    };
  }

  getCategoryLabel(category: FundCategory): string {
    return this.fundTypeService.getCategoryLabel(category);
  }

  getCategoryBadgeClass(category: FundCategory): string {
    const classes: Record<FundCategory, string> = {
      [FundCategory.MAINTENANCE]: 'bg-primary/10 text-primary border-primary/20',
      [FundCategory.RESERVE]: 'bg-secondary/10 text-secondary border-secondary/20',
      [FundCategory.EXTRAORDINARY]: 'bg-warning/10 text-warning border-warning/20',
      [FundCategory.IMPROVEMENT]: 'bg-info/10 text-info border-info/20',
      [FundCategory.INSURANCE]: 'bg-neutral-100 text-neutral-700 border-neutral-200',
      [FundCategory.UTILITIES]: 'bg-info/10 text-info border-info/20',
      [FundCategory.SECURITY]: 'bg-error/10 text-error border-error/20',
      [FundCategory.CLEANING]: 'bg-success/10 text-success border-success/20',
      [FundCategory.GARDEN]: 'bg-success/10 text-success border-success/20',
      [FundCategory.ADMINISTRATION]: 'bg-neutral-100 text-neutral-700 border-neutral-200',
      [FundCategory.OTHER]: 'bg-neutral-100 text-neutral-700 border-neutral-200'
    };
    return classes[category] || 'bg-neutral-100 text-neutral-700 border-neutral-200';
  }

  getColorClass(color: FundTypeColor): string {
    const classes: Record<FundTypeColor, string> = {
      [FundTypeColor.PRIMARY]: 'bg-primary text-white',
      [FundTypeColor.SECONDARY]: 'bg-secondary text-white',
      [FundTypeColor.SUCCESS]: 'bg-success text-white',
      [FundTypeColor.WARNING]: 'bg-warning text-white',
      [FundTypeColor.ERROR]: 'bg-error text-white',
      [FundTypeColor.INFO]: 'bg-info text-white',
      [FundTypeColor.NEUTRAL]: 'bg-neutral-500 text-white'
    };
    return classes[color] || 'bg-neutral-500 text-white';
  }

  getColorBgClass(color: FundTypeColor): string {
    const classes: Record<FundTypeColor, string> = {
      [FundTypeColor.PRIMARY]: 'bg-primary/10',
      [FundTypeColor.SECONDARY]: 'bg-secondary/10',
      [FundTypeColor.SUCCESS]: 'bg-success/10',
      [FundTypeColor.WARNING]: 'bg-warning/10',
      [FundTypeColor.ERROR]: 'bg-error/10',
      [FundTypeColor.INFO]: 'bg-info/10',
      [FundTypeColor.NEUTRAL]: 'bg-neutral-100'
    };
    return classes[color] || 'bg-neutral-100';
  }

  getColorTextClass(color: FundTypeColor): string {
    const classes: Record<FundTypeColor, string> = {
      [FundTypeColor.PRIMARY]: 'text-primary',
      [FundTypeColor.SECONDARY]: 'text-secondary',
      [FundTypeColor.SUCCESS]: 'text-success',
      [FundTypeColor.WARNING]: 'text-warning',
      [FundTypeColor.ERROR]: 'text-error',
      [FundTypeColor.INFO]: 'text-info',
      [FundTypeColor.NEUTRAL]: 'text-neutral-600'
    };
    return classes[color] || 'text-neutral-600';
  }

  formatCurrency(amount: number | undefined): string {
    if (amount === undefined || amount === null) return '-';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  }

  // Toast notification
  showNotification(message: string, type: 'success' | 'error' | 'info') {
    this.toastMessage.set(message);
    this.toastType.set(type);
    this.showToast.set(true);
    
    setTimeout(() => {
      this.showToast.set(false);
    }, 4000);
  }

  // Common icons for selection
  readonly availableIcons = [
    { icon: 'ri-money-dollar-circle-line', label: 'Dinero' },
    { icon: 'ri-tools-line', label: 'Herramientas' },
    { icon: 'ri-safe-2-line', label: 'Caja Fuerte' },
    { icon: 'ri-shield-check-line', label: 'Seguridad' },
    { icon: 'ri-sparkles-line', label: 'Limpieza' },
    { icon: 'ri-plant-line', label: 'Jardinería' },
    { icon: 'ri-flashlight-line', label: 'Servicios' },
    { icon: 'ri-error-warning-line', label: 'Alerta' },
    { icon: 'ri-shield-star-line', label: 'Seguro' },
    { icon: 'ri-home-gear-line', label: 'Mantenimiento' },
    { icon: 'ri-building-line', label: 'Edificio' },
    { icon: 'ri-water-flash-line', label: 'Agua' },
    { icon: 'ri-lightbulb-line', label: 'Electricidad' },
    { icon: 'ri-recycle-line', label: 'Reciclaje' },
    { icon: 'ri-community-line', label: 'Comunidad' }
  ];
}
