import { Component, signal, computed, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../components/navbar/navbar';
import { SideMenuComponent } from '../../components/side-menu/side-menu';
import { ProviderService } from '../../services/provider.service';
import {
  Provider,
  ProviderDetails,
  ProviderCategory,
  CreateProviderDto,
  UpdateProviderDto,
} from '../../models/provider.model';

type ModalMode = 'create' | 'edit' | 'view';

@Component({
  selector: 'app-providers',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, SideMenuComponent],
  templateUrl: './providers.html',
  styleUrl: './providers.css',
})
export class ProvidersComponent {
  // Signals
  protected readonly providers = signal<ProviderDetails[]>([]);
  protected readonly isLoading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);

  // Modal state
  protected readonly showModal = signal<boolean>(false);
  protected readonly modalMode = signal<ModalMode>('view');
  protected readonly selectedProvider = signal<ProviderDetails | null>(null);

  // Filters
  protected readonly searchTerm = signal<string>('');
  protected readonly filterCategory = signal<string>('all');
  protected readonly filterStatus = signal<string>('all');

  // Pagination
  protected readonly currentPage = signal<number>(1);
  protected readonly pageSize = signal<number>(10);
  protected readonly totalPages = signal<number>(1);

  // Categories
  protected readonly ProviderCategory = ProviderCategory;
  protected readonly categories = [
    { value: ProviderCategory.CLEANING, label: 'Limpieza' },
    { value: ProviderCategory.SECURITY, label: 'Seguridad' },
    { value: ProviderCategory.MAINTENANCE, label: 'Mantenimiento' },
    { value: ProviderCategory.GARDENING, label: 'Jardinería' },
    { value: ProviderCategory.PLUMBING, label: 'Gasfitería' },
    { value: ProviderCategory.ELECTRICAL, label: 'Electricidad' },
    { value: ProviderCategory.PAINTING, label: 'Pintura' },
    { value: ProviderCategory.CONSTRUCTION, label: 'Construcción' },
    { value: ProviderCategory.SUPPLIES, label: 'Suministros' },
    { value: ProviderCategory.LEGAL, label: 'Legal' },
    { value: ProviderCategory.ACCOUNTING, label: 'Contabilidad' },
    { value: ProviderCategory.INSURANCE, label: 'Seguros' },
    { value: ProviderCategory.TECHNOLOGY, label: 'Tecnología' },
    { value: ProviderCategory.OTHER, label: 'Otros' },
  ];

  // Form data
  protected readonly formData = signal<Partial<CreateProviderDto>>({
    businessName: '',
    tradeName: '',
    ruc: '',
    category: ProviderCategory.OTHER,
    address: '',
    city: 'Lima',
    country: 'Perú',
    contactName: '',
    email: '',
    phone: '',
    mobile: '',
    website: '',
    bankName: '',
    bankAccount: '',
    rating: 0,
    notes: '',
  });

  // Computed signals
  protected readonly filteredProviders = computed(() => {
    let result = this.providers();

    // Apply search filter
    const search = this.searchTerm().toLowerCase();
    if (search) {
      result = result.filter(
        (p) =>
          p.businessName.toLowerCase().includes(search) ||
          p.tradeName?.toLowerCase().includes(search) ||
          p.ruc.includes(search) ||
          p.contactName.toLowerCase().includes(search) ||
          p.email.toLowerCase().includes(search)
      );
    }

    // Apply category filter
    const category = this.filterCategory();
    if (category !== 'all') {
      result = result.filter((p) => p.category === category);
    }

    // Apply status filter
    const status = this.filterStatus();
    if (status !== 'all') {
      result = result.filter((p) => (status === 'active' ? p.isActive : !p.isActive));
    }

    return result;
  });

  protected readonly totalProviders = computed(() => this.filteredProviders().length);
  protected readonly totalActive = computed(() => this.filteredProviders().filter((p) => p.isActive).length);
  protected readonly totalInactive = computed(() => this.filteredProviders().filter((p) => !p.isActive).length);
  protected readonly averageRating = computed(() => {
    const providers = this.filteredProviders();
    if (providers.length === 0) return 0;
    const total = providers.reduce((sum, p) => sum + (p.rating || 0), 0);
    return total / providers.length;
  });

  constructor(private providerService: ProviderService) {
    // Load providers on init
    effect(() => {
      this.loadProviders();
    });
  }

  // ===============================
  // CRUD OPERATIONS
  // ===============================

  loadProviders(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.providerService
      .getProviders({
        page: this.currentPage(),
        pageSize: this.pageSize(),
      })
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.providers.set(response.data.items);
            this.totalPages.set(response.data.totalPages);
          }
          this.isLoading.set(false);
        },
        error: (err) => {
          this.error.set('Error al cargar proveedores');
          this.isLoading.set(false);
          console.error('Error loading providers:', err);
        },
      });
  }

  createProvider(): void {
    if (!this.validateForm()) {
      return;
    }

    this.isLoading.set(true);
    this.providerService.createProvider(this.formData() as CreateProviderDto).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadProviders();
          this.closeModal();
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set('Error al crear proveedor');
        this.isLoading.set(false);
        console.error('Error creating provider:', err);
      },
    });
  }

  updateProvider(): void {
    if (!this.selectedProvider() || !this.validateForm()) {
      return;
    }

    this.isLoading.set(true);
    const id = this.selectedProvider()!.id;
    this.providerService.updateProvider(id, this.formData() as UpdateProviderDto).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadProviders();
          this.closeModal();
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set('Error al actualizar proveedor');
        this.isLoading.set(false);
        console.error('Error updating provider:', err);
      },
    });
  }

  deactivateProvider(id: string): void {
    if (!confirm('¿Está seguro de desactivar este proveedor?')) {
      return;
    }

    this.isLoading.set(true);
    this.providerService.deactivateProvider(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadProviders();
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set('Error al desactivar proveedor');
        this.isLoading.set(false);
        console.error('Error deactivating provider:', err);
      },
    });
  }

  activateProvider(id: string): void {
    this.isLoading.set(true);
    this.providerService.activateProvider(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadProviders();
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set('Error al activar proveedor');
        this.isLoading.set(false);
        console.error('Error activating provider:', err);
      },
    });
  }

  // ===============================
  // MODAL MANAGEMENT
  // ===============================

  openCreateModal(): void {
    this.modalMode.set('create');
    this.selectedProvider.set(null);
    this.formData.set({
      businessName: '',
      tradeName: '',
      ruc: '',
      category: ProviderCategory.OTHER,
      address: '',
      city: 'Lima',
      country: 'Perú',
      contactName: '',
      email: '',
      phone: '',
      mobile: '',
      website: '',
      bankName: '',
      bankAccount: '',
      rating: 0,
      notes: '',
    });
    this.showModal.set(true);
  }

  openEditModal(provider: ProviderDetails): void {
    this.modalMode.set('edit');
    this.selectedProvider.set(provider);
    this.formData.set({
      businessName: provider.businessName,
      tradeName: provider.tradeName,
      ruc: provider.ruc,
      category: provider.category,
      address: provider.address,
      city: provider.city,
      country: provider.country,
      contactName: provider.contactName,
      email: provider.email,
      phone: provider.phone,
      mobile: provider.mobile,
      website: provider.website,
      bankName: provider.bankName,
      bankAccount: provider.bankAccount,
      rating: provider.rating,
      notes: provider.notes,
    });
    this.showModal.set(true);
  }

  openViewModal(provider: ProviderDetails): void {
    this.modalMode.set('view');
    this.selectedProvider.set(provider);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.selectedProvider.set(null);
    this.error.set(null);
  }

  // ===============================
  // PAGINATION & FILTERS
  // ===============================

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
    this.currentPage.set(1); // Reset to first page
  }

  onCategoryFilterChange(value: string): void {
    this.filterCategory.set(value);
    this.currentPage.set(1);
  }

  onStatusFilterChange(value: string): void {
    this.filterStatus.set(value);
    this.currentPage.set(1);
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.filterCategory.set('all');
    this.filterStatus.set('all');
    this.currentPage.set(1);
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((p) => p + 1);
      this.loadProviders();
    }
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update((p) => p - 1);
      this.loadProviders();
    }
  }

  // ===============================
  // UTILITY METHODS
  // ===============================

  validateForm(): boolean {
    const data = this.formData();
    if (!data.businessName?.trim()) {
      this.error.set('La razón social es requerida');
      return false;
    }
    if (!data.ruc?.trim() || data.ruc.length !== 11) {
      this.error.set('El RUC debe tener 11 dígitos');
      return false;
    }
    if (!data.contactName?.trim()) {
      this.error.set('El nombre de contacto es requerido');
      return false;
    }
    if (!data.email?.trim()) {
      this.error.set('El email es requerido');
      return false;
    }
    if (!data.phone?.trim()) {
      this.error.set('El teléfono es requerido');
      return false;
    }
    return true;
  }

  getCategoryBadgeClass(category: ProviderCategory): string {
    const classes: Record<ProviderCategory, string> = {
      [ProviderCategory.CLEANING]: 'badge-info',
      [ProviderCategory.SECURITY]: 'badge-error',
      [ProviderCategory.MAINTENANCE]: 'badge-warning',
      [ProviderCategory.GARDENING]: 'badge-success',
      [ProviderCategory.PLUMBING]: 'badge-primary',
      [ProviderCategory.ELECTRICAL]: 'badge-accent',
      [ProviderCategory.PAINTING]: 'badge-secondary',
      [ProviderCategory.CONSTRUCTION]: 'badge-neutral',
      [ProviderCategory.SUPPLIES]: 'badge-info',
      [ProviderCategory.LEGAL]: 'badge-error',
      [ProviderCategory.ACCOUNTING]: 'badge-primary',
      [ProviderCategory.INSURANCE]: 'badge-accent',
      [ProviderCategory.TECHNOLOGY]: 'badge-secondary',
      [ProviderCategory.OTHER]: 'badge-ghost',
    };
    return classes[category] || 'badge-ghost';
  }

  getCategoryLabel(category: ProviderCategory): string {
    const found = this.categories.find((c) => c.value === category);
    return found?.label || category;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(amount);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  getStars(rating: number): number[] {
    return Array(5).fill(0).map((_, i) => i < Math.round(rating) ? 1 : 0);
  }

  parseFloat(value: string): number {
    return parseFloat(value);
  }

  onFormFieldChange(field: keyof CreateProviderDto, value: any): void {
    this.formData.update((current) => ({
      ...current,
      [field]: value,
    }));
  }
}
