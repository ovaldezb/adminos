import { Component, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar';
import { SideMenuComponent } from '../../components/side-menu/side-menu';
import { Condominium } from '../../models';
import { PaymentService, InvoiceService, BuildingService, ResidentService } from '../../services';
import { ResidentDetails } from '../../models/resident.model';
import {
  Payment,
  PaymentWithDetails,
  PaymentMethod,
  PaymentStatus,
  InvoiceWithDetails,
  ApiResponse,
  BuildingDetails,
  PaymentConfig,
  AppPaymentRequest
} from '../../models';

@Component({
  selector: 'app-payments',
  imports: [CommonModule, FormsModule, NavbarComponent, SideMenuComponent],
  templateUrl: './payments.html',
  styleUrl: './payments.css',
})
export class PaymentsComponent {
  protected readonly sidebarOpen = signal(false);
  protected readonly userName = signal('Administrador');
  protected readonly selectedCondo = signal<Condominium | null>(null);
  protected readonly isOverviewMode = computed(
    () => !this.selectedCondo() || this.selectedCondo()?.id === 'all'
  );

  // Expose Math for template
  protected readonly Math = Math;

  // Data signals
  protected readonly payments = signal<PaymentWithDetails[]>([]);
  protected readonly pendingInvoices = signal<InvoiceWithDetails[]>([]);
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
  protected readonly statusFilter = signal<PaymentStatus | ''>('');
  protected readonly methodFilter = signal<PaymentMethod | ''>('');

  // Modal state
  protected readonly showModal = signal(false);
  protected readonly modalMode = signal<'register' | 'view' | 'config'>('register');
  protected readonly selectedPayment = signal<PaymentWithDetails | null>(null);
  protected readonly existingResidentPayment = signal<any | null>(null);

  // Toast notifications
  protected readonly showToast = signal(false);
  protected readonly toastMessage = signal('');
  protected readonly toastType = signal<'success' | 'error' | 'info'>('success');

  // Form data
  protected readonly formData = signal<Partial<Payment>>({
    invoiceId: '',
    condominiumId: '',
    unitId: '',
    residentId: '',
    amount: 0,
    paymentDate: new Date(),
    paymentMethod: PaymentMethod.CASH,
    reference: '',
    notes: '',
  });

  // Configuration State
  protected readonly configYear = signal(new Date().getFullYear());
  protected readonly configAnnualTotal = signal(0);
  protected readonly configMonthlyAmounts = signal<number[]>(new Array(12).fill(0));
  protected readonly configBuildingId = signal('');
  protected readonly configId = signal<string | null>(null);

  protected readonly monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  updateAnnualTotal(amount: number): void {
    this.configAnnualTotal.set(amount);
    const monthly = Number((amount / 12).toFixed(2));
    this.configMonthlyAmounts.set(new Array(12).fill(monthly));
  }

  updateMonthlyAmount(index: number, amount: number): void {
    const current = [...this.configMonthlyAmounts()];
    current[index] = amount;
    this.configMonthlyAmounts.set(current);

    // Update total to match sum of months
    const sum = current.reduce((a, b) => a + b, 0);
    this.configAnnualTotal.set(Number(sum.toFixed(2)));
  }

  // Enums for template
  protected readonly PaymentMethod = PaymentMethod;
  protected readonly PaymentStatus = PaymentStatus;

  // Payment methods for dropdown
  protected readonly paymentMethods = [
    { value: PaymentMethod.CASH, label: 'Efectivo' },
    { value: PaymentMethod.BANK_TRANSFER, label: 'Transferencia Bancaria (SPEI)' },
    { value: PaymentMethod.CREDIT_CARD, label: 'Tarjeta de Crédito' },
    { value: PaymentMethod.DEBIT_CARD, label: 'Tarjeta de Débito' },
    { value: PaymentMethod.CHECK, label: 'Cheque' },
    { value: PaymentMethod.MOBILE_PAYMENT, label: 'Pago Móvil (OXXO/7-Eleven)' },
    { value: PaymentMethod.OTHER, label: 'Otro' },
  ];

  // Computed filtered payments
  protected readonly filteredPayments = computed(() => {
    let filtered = this.payments() || [];

    const search = this.searchTerm().toLowerCase();
    if (search) {
      filtered = filtered.filter(
        (p) =>
          p.residentName.toLowerCase().includes(search) ||
          p.paymentNumber.toLowerCase().includes(search) ||
          p.invoiceNumber.toLowerCase().includes(search) ||
          p.reference?.toLowerCase().includes(search)
      );
    }

    const status = this.statusFilter();
    if (status) {
      filtered = filtered.filter((p) => p.status === status);
    }

    const method = this.methodFilter();
    if (method) {
      filtered = filtered.filter((p) => p.paymentMethod === method);
    }

    return filtered;
  });

  // Computed statistics
  protected readonly totalPayments = computed(() => (this.filteredPayments() || []).length);

  protected readonly totalAmount = computed(() =>
    (this.filteredPayments() || []).reduce((sum, p) => sum + p.amount, 0)
  );

  protected readonly totalPending = computed(() =>
    (this.filteredPayments() || []).filter((p) => p.status === PaymentStatus.PENDING).length
  );

  protected readonly totalConfirmed = computed(() =>
    (this.filteredPayments() || []).filter((p) => p.status === PaymentStatus.CONFIRMED).length
  );

  loadPaymentConfig(buildingId: string, year: number): void {
    this.paymentService.getPaymentConfig(buildingId, year).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.configId.set(response.data.id || response.data._id || null);
          const amounts = new Array(12).fill(0);
          let total = 0;

          if (response.data.monthlyAmounts) {
            response.data.monthlyAmounts.forEach(m => {
              if (m.month >= 1 && m.month <= 12) {
                amounts[m.month - 1] = m.amount;
                total += m.amount;
              }
            });
          }

          this.configMonthlyAmounts.set(amounts);
          this.configAnnualTotal.set(Number(total.toFixed(2)));
        } else {
          // Reset if not found
          this.configId.set(null);
          this.configAnnualTotal.set(0);
          this.configMonthlyAmounts.set(new Array(12).fill(0));
        }
      },
      error: () => {
        // Reset on error (likely 404 not found)
        this.configId.set(null);
        this.configAnnualTotal.set(0);
        this.configMonthlyAmounts.set(new Array(12).fill(0));
      }
    });
  }



  // Resident Search State
  protected readonly residentSearchQuery = signal('');
  protected readonly residentSearchResults = signal<ResidentDetails[]>([]);
  protected readonly isSearchingResident = signal(false);
  protected readonly isSearchingPaymentConfig = signal(false);
  protected readonly selectedResidentName = signal('');
  protected readonly searchDebounce = signal<any>(null);
  protected readonly selectedResidentConfig = signal<PaymentConfig | null>(null);
  protected readonly selectedMonth = signal<number | null>(null);

  constructor(
    private router: Router,
    private paymentService: PaymentService,
    private invoiceService: InvoiceService,
    private buildingService: BuildingService,
    private residentService: ResidentService
  ) {
    // Load initial data
    effect(() => {
      const condo = this.selectedCondo();
      this.loadPayments();
      // Load pending invoices
      this.loadPendingInvoices();
      // Load buildings for config
      this.loadBuildings();
    });

    // Auto-load config when building or year changes
    effect(() => {
      const buildingId = this.configBuildingId();
      const year = this.configYear();
      if (buildingId && year) {
        this.loadPaymentConfig(buildingId, year);
      }
    }, { allowSignalWrites: true });
  }



  onResidentSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.residentSearchQuery.set(input.value);

    // Simple debounce
    if (this.searchDebounce()) {
      clearTimeout(this.searchDebounce());
    }

    if (input.value.length >= 3) {
      const timeout = setTimeout(() => {
        this.searchResident();
      }, 500);
      this.searchDebounce.set(timeout);
    } else {
      this.residentSearchResults.set([]);
    }
  }

  searchResident(): void {
    const query = this.residentSearchQuery();
    if (!query || query.length < 3) return;

    this.isSearchingResident.set(true);
    this.residentService.searchResidents(query).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.residentSearchResults.set(response.data.residents);
        } else {
          this.residentSearchResults.set([]);
        }
        this.isSearchingResident.set(false);
      },
      error: (err) => {
        console.error('Error searching residents:', err);
        this.isSearchingResident.set(false);
        this.residentSearchResults.set([]);
      }
    });
  }

  selectResident(resident: ResidentDetails): void {
    this.formData.update(curr => ({
      ...curr,
      residentId: resident.id,
      condominiumId: resident.condominiumId,
      unitId: typeof resident.unit === 'object' ? resident.unit.id : resident.unitId
    }));
    this.selectedResidentName.set(`${resident.firstName} ${resident.lastName}`);
    this.residentSearchQuery.set('');
    this.residentSearchResults.set([]);

    // Fetch payment config for resident's building
    const buildingId = typeof resident.unit === 'object' ? resident.unit.buildingId : resident.buildingId;
    const currentYear = new Date().getFullYear();

    if (buildingId) {
      this.isSearchingPaymentConfig.set(true);
      this.paymentService.getPaymentConfig(buildingId, currentYear).subscribe({
        next: (response) => {
          this.isSearchingPaymentConfig.set(false);
          if (response.success && response.data) {
            this.selectedResidentConfig.set(response.data);
          } else {
            this.selectedResidentConfig.set(null);
            this.showToastMessage('No se encontró configuración de pagos para esta torre/edificio', 'error');
          }
        },
        error: (err) => {
          this.isSearchingPaymentConfig.set(false);
          console.error('Error fetching payment config:', err);
          this.selectedResidentConfig.set(null);
          this.showToastMessage('Error al buscar la configuración de pagos', 'error');
        }
      });
    }

    // NEW: Fetch existing payments for this resident and year
    this.paymentService.getPaymentByResidentAndYear(resident.id, currentYear).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.existingResidentPayment.set(response.data);
          console.log('Existing payment found:', response.data);
        } else {
          this.existingResidentPayment.set(null);
        }
      },
      error: (err) => {
        console.error('Error loading existing resident payment:', err);
        this.existingResidentPayment.set(null);
      }
    });
  }

  onMonthSelect(monthIndex: number, amount: number): void {
    this.selectedMonth.set(monthIndex);
    this.formData.update(curr => ({
      ...curr,
      amount: amount,
      notes: `Pago Mantenimiento ${this.monthNames[monthIndex]} ${new Date().getFullYear()}`
    }));
  }

  toggleSidebar(): void {
    this.sidebarOpen.set(!this.sidebarOpen());
  }

  // CRUD Operations
  loadPayments(): void {
    this.loading.set(true);
    this.error.set(null);

    const condoId = this.selectedCondo()?.id;

    this.paymentService
      .getPayments({
        page: this.currentPage(),
        pageSize: this.pageSize(),
        condominiumId: condoId,
        status: this.statusFilter() || undefined,
      })
      .subscribe({
        next: (response: ApiResponse<any>) => {
          if (response.success && response.data) {
            this.payments.set(response.data.payments || response.data.items || []);
            this.totalPages.set(response.data.totalPages || 1);
            this.totalItems.set(response.data.total || (response.data.payments || []).length || 0);
          }
          this.loading.set(false);
        },
        error: (err: any) => {
          console.error('Error loading payments:', err);
          this.error.set('Error al cargar los pagos');
          this.loading.set(false);
        },
      });
  }

  loadPendingInvoices(): void {
    const condoId = this.selectedCondo()?.id;

    this.invoiceService
      .getInvoices({
        page: 1,
        pageSize: 100,
        condominiumId: condoId,
        status: 'pending' as any,
      })
      .subscribe({
        next: (response: ApiResponse<any>) => {
          if (response.success && response.data) {
            this.pendingInvoices.set(response.data.items);
          }
        },
        error: (err: any) => {
          console.error('Error loading pending invoices:', err);
        },
      });
  }

  loadBuildings(): void {
    const condoId = this.selectedCondo()?.id;
    const params = (condoId && condoId !== 'all') ? { condominiumId: condoId } : {};

    this.buildingService.getBuildings(params).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.buildings.set(response.data.items);
        }
      },
      error: (err) => console.error('Error loading buildings:', err)
    });
  }

  openRegisterModal(): void {
    this.modalMode.set('register');
    this.selectedPayment.set(null);
    this.formData.set({
      invoiceId: '',
      condominiumId:
        this.selectedCondo()?.id === 'all' ? '' : this.selectedCondo()?.id || '',
      unitId: '',
      residentId: '',
      amount: 0,
      paymentDate: new Date(),
      paymentMethod: PaymentMethod.CASH,
      reference: '',
      notes: '',
    });
    this.showModal.set(true);
  }

  openConfigModal(): void {
    this.modalMode.set('config');
    this.configBuildingId.set('');
    this.configAnnualTotal.set(0);
    this.configMonthlyAmounts.set(new Array(12).fill(0));
    this.loadBuildings();
    this.showModal.set(true);
  }

  saveConfig(): void {
    if (!this.configBuildingId()) {
      this.showToastMessage('Por favor seleccione un edificio', 'error');
      return;
    }

    this.loading.set(true);
    const config = {
      buildingId: this.configBuildingId(),
      paymentYear: this.configYear(),
      monthlyAmounts: this.configMonthlyAmounts().map((amount, index) => ({
        month: index + 1,
        amount: amount
      }))
    };

    const request$ = this.configId()
      ? this.paymentService.updatePaymentConfig(this.configId()!, config)
      : this.paymentService.savePaymentConfig(config);

    request$.subscribe({
      next: (response) => {
        if (response.success) {
          const action = this.configId() ? 'actualizada' : 'guardada';
          this.showToastMessage(`Configuración ${action} exitosamente`, 'success');
          this.closeModal();
        } else {
          this.showToastMessage('Error al guardar la configuración', 'error');
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error saving config:', err);
        this.showToastMessage('Error al guardar la configuración', 'error');
        this.loading.set(false);
      }
    });
  }

  openViewModal(payment: PaymentWithDetails): void {
    this.modalMode.set('view');
    this.selectedPayment.set(payment);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.selectedPayment.set(null);
    this.modalMode.set('register'); // Reset to default

    // Reset Data
    this.formData.set({
      invoiceId: '',
      condominiumId: this.selectedCondo()?.id === 'all' ? '' : this.selectedCondo()?.id || '',
      unitId: '',
      residentId: '',
      amount: 0,
      paymentDate: new Date(),
      paymentMethod: PaymentMethod.CASH,
      reference: '',
      notes: '',
    });

    // Reset Search & Selection State
    this.selectedResidentConfig.set(null);
    this.selectedMonth.set(null);
    this.residentSearchQuery.set('');
    this.residentSearchResults.set([]);
    this.selectedResidentName.set('');
    this.existingResidentPayment.set(null); // NEW: Reset existingResidentPayment
    this.isSearchingResident.set(false);
  }

  registerPayment(): void {
    const data = this.formData();
    const currentYear = new Date().getFullYear();

    // Validate required fields for new structure
    if (!data.residentId) {
      this.error.set('Por favor seleccione un residente');
      return;
    }
    if (this.selectedMonth() === null) {
      this.error.set('Por favor seleccione una mensualidad');
      return;
    }
    if (!data.amount || data.amount <= 0) {
      this.error.set('El monto debe ser mayor a cero');
      return;
    }

    this.loading.set(true);
    this.error.set(null); // Reset error before new operation

    const existing = this.existingResidentPayment();

    const newPaymentDetail = {
      paymentDate: data.paymentDate || new Date(),
      amount: data.amount!,
      reference: data.reference || undefined,
      paymentType: data.paymentMethod || PaymentMethod.CASH,
      notes: data.notes || `Pago Mantenimiento ${this.monthNames[this.selectedMonth()!]} ${currentYear}`
    };

    if (existing) {
      // Perform UPDATE (PUT) - Append to existing array
      const payload: AppPaymentRequest = {
        residentId: existing.residentId,
        year: existing.year,
        payments: [...existing.payments, newPaymentDetail]
      };

      this.paymentService.updatePayment(existing.id || existing._id!, payload).subscribe({
        next: (response) => {
          if (response.success) {
            this.showToastMessage('Pago registrado correctamente (actualización)', 'success');
            this.closeModal();
            this.loadPayments();
          } else {
            this.error.set(response.error?.message || 'Error al actualizar el pago');
          }
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error updating payment:', err);
          this.error.set('Error de conexión al actualizar el pago');
          this.loading.set(false);
        }
      });
    } else {
      // Perform CREATE (POST) - New record
      const payload: AppPaymentRequest = {
        residentId: data.residentId!,
        year: currentYear,
        payments: [newPaymentDetail]
      };

      this.paymentService.createPayment(payload).subscribe({
        next: (response: ApiResponse<any>) => {
          if (response.success) {
            this.showToastMessage('Pago registrado correctamente', 'success');
            this.closeModal();
            this.loadPayments();
          } else {
            this.showToastMessage(
              response.error?.message || 'Error al registrar el pago',
              'error'
            );
          }
          this.loading.set(false);
        },
        error: (err: any) => {
          console.error('Error creating payment:', err);
          this.showToastMessage('Error al registrar el pago', 'error');
          this.loading.set(false);
        },
      });
    }
  }

  private showToastMessage(
    message: string,
    type: 'success' | 'error' | 'info'
  ): void {
    this.toastMessage.set(message);
    this.toastType.set(type);
    this.showToast.set(true);

    // Auto hide after 3 seconds
    setTimeout(() => {
      this.showToast.set(false);
    }, 3000);
  }

  private validateForm(data: Partial<Payment>): boolean {
    // Legacy validation - kept for potential future use
    if (!data.residentId || !data.amount) {
      this.error.set('Por favor complete todos los campos obligatorios');
      return false;
    }

    if (data.amount <= 0) {
      this.error.set('El monto debe ser mayor a cero');
      return false;
    }

    return true;
  }

  // Pagination
  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.set(this.currentPage() + 1);
      this.loadPayments();
    }
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
      this.loadPayments();
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadPayments();
    }
  }

  // Filters
  onSearchChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }

  onStatusFilterChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as PaymentStatus | '';
    this.statusFilter.set(value);
    this.currentPage.set(1);
    this.loadPayments();
  }

  onMethodFilterChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as PaymentMethod | '';
    this.methodFilter.set(value);
    this.currentPage.set(1);
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.statusFilter.set('');
    this.methodFilter.set('');
    this.currentPage.set(1);
    this.loadPayments();
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
  getStatusBadgeClass(status: PaymentStatus): string {
    const classes: Record<PaymentStatus, string> = {
      [PaymentStatus.PENDING]: 'badge-warning',
      [PaymentStatus.CONFIRMED]: 'badge-success',
      [PaymentStatus.REJECTED]: 'badge-error',
      [PaymentStatus.REFUNDED]: 'badge-info',
    };
    return classes[status] || 'badge-neutral';
  }

  getStatusLabel(status: PaymentStatus): string {
    const labels: Record<PaymentStatus, string> = {
      [PaymentStatus.PENDING]: 'Pendiente',
      [PaymentStatus.CONFIRMED]: 'Confirmado',
      [PaymentStatus.REJECTED]: 'Rechazado',
      [PaymentStatus.REFUNDED]: 'Reembolsado',
    };
    return labels[status] || status;
  }

  getMethodLabel(method: PaymentMethod): string {
    const found = this.paymentMethods.find((m) => m.value === method);
    return found?.label || method;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
    }).format(amount);
  }

  formatDate(date: Date | undefined): string {
    if (!date) return '-';
    return new Intl.DateTimeFormat('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  }

  formatDateForInput(date: Date | undefined): string {
    if (!date) return '';
    return new Date(date).toISOString().split('T')[0];
  }

  onDateChange(value: string): void {
    this.formData.update((current) => ({
      ...current,
      paymentDate: value ? new Date(value) : new Date(),
    }));
  }

  onInvoiceChange(event: Event): void {
    const invoiceId = (event.target as HTMLSelectElement).value;
    const invoice = this.pendingInvoices().find((i) => i.id === invoiceId);

    if (invoice) {
      this.formData.update((current) => ({
        ...current,
        invoiceId: invoice.id,
        condominiumId: invoice.condominiumId,
        unitId: invoice.unitId,
        residentId: invoice.residentId,
        amount: invoice.totalAmount,
      }));
    }
  }

  onFormFieldChange(field: keyof Payment, value: any): void {
    this.formData.update((current) => ({
      ...current,
      [field]: value,
    }));
  }
}
