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
  MonthlyAmount,
  AppPaymentRequest,
  FundConfig,
  FundItem,
  FundMovement
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
  protected readonly modalMode = signal<'register' | 'view' | 'config' | 'funds'>('register');
  protected readonly selectedPayment = signal<PaymentWithDetails | null>(null);
  protected readonly existingResidentPayment = signal<any | null>(null);

  // Toast notifications
  protected readonly showToast = signal(false);
  protected readonly toastMessage = signal('');
  protected readonly toastType = signal<'success' | 'error' | 'info'>('success');

  // Form data
  protected readonly formData = signal<any>({
    invoiceId: '',
    condominiumId: '',
    unitId: '',
    residentId: '',
    totalAmount: 0,
    paymentDate: new Date(),
    paymentMethod: PaymentMethod.CASH,
    reference: '',
    notes: '',
    fundName: '',
    buildingId: '',
    paymentFundDetails: []
  });

  protected readonly monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Configuration State
  protected readonly configYear = signal(new Date().getFullYear());
  protected readonly configAnnualTotal = signal(0);
  protected readonly configMonthlyAmounts = signal<MonthlyAmount[]>(
    this.monthNames.map((name, i) => ({ month: i + 1, amount: 0, title: name }))
  );
  protected readonly configBuildingId = signal('');
  protected readonly configId = signal<string | null>(null);

  // Funds Configuration State
  protected readonly fundsYear = signal(new Date().getFullYear());
  protected readonly fundsBuildingId = signal('');
  protected readonly fundsLoading = signal(false);
  protected readonly configFunds = signal<{ name: string }[]>([]);
  protected readonly isUpdatingFunds = signal(false);

  updateAnnualTotal(amount: number): void {
    const monthly = Number((amount / 12).toFixed(2));

    this.configMonthlyAmounts.update(current =>
      current.map((item, i) => (i < 12 ? { ...item, amount: monthly } : item))
    );

    // Update the overall annual total sum (maintenance + special payments)
    const sum = this.configMonthlyAmounts().reduce((acc, curr) => acc + curr.amount, 0);
    this.configAnnualTotal.set(Number(sum.toFixed(2)));
  }

  updateMonthlyAmount(index: number, amount: number): void {
    this.configMonthlyAmounts.update(current => {
      const updated = [...current];
      updated[index] = { ...updated[index], amount };
      return updated;
    });

    // Update total to match sum of months
    const sum = this.configMonthlyAmounts().reduce((acc, curr) => acc + curr.amount, 0);
    this.configAnnualTotal.set(Number(sum.toFixed(2)));
  }

  updateMonthlyTitle(index: number, title: string): void {
    this.configMonthlyAmounts.update(current => {
      const updated = [...current];
      updated[index] = { ...updated[index], title };
      return updated;
    });
  }

  addSpecialPayment(): void {
    this.configMonthlyAmounts.update(current => [
      ...current,
      {
        month: current.length + 1,
        amount: 0,
        title: 'Nuevo Pago'
      }
    ]);
  }

  openFundsModal(): void {
    this.modalMode.set('funds');
    this.fundsBuildingId.set('');
    this.fundsYear.set(new Date().getFullYear());
    this.configFunds.set([]); // Reset funds list
    this.isUpdatingFunds.set(false);
    this.showModal.set(true);
  }

  onFundsBuildingChange(event: Event): void {
    const buildingId = (event.target as HTMLSelectElement).value;
    this.fundsBuildingId.set(buildingId);
    if (buildingId) {
      this.loadFundsConfig();
    } else {
      this.configFunds.set([]);
    }
  }

  onFundsYearChange(event: Event): void {
    const year = +(event.target as HTMLInputElement).value;
    this.fundsYear.set(year);
    if (this.fundsBuildingId()) {
      this.loadFundsConfig();
    }
  }

  loadFundsConfig(): void {
    const buildingId = this.fundsBuildingId();
    const year = this.fundsYear();

    if (!buildingId) return;

    this.fundsLoading.set(true);
    this.paymentService.getFunds(buildingId, year).subscribe({
      next: (response) => {
        this.fundsLoading.set(false);
        if (response.success && response.data) {
          this.isUpdatingFunds.set(true);
          // Map backend items to frontend structure
          this.configFunds.set(response.data.fundList.map(f => ({
            name: f.fundName
          })));
        } else {
          this.isUpdatingFunds.set(false);
          this.configFunds.set([]);
        }
      },
      error: (err) => {
        this.fundsLoading.set(false);
        this.isUpdatingFunds.set(false);
        console.error('Error loading funds config:', err);
        this.configFunds.set([]);
      }
    });
  }

  addFund(): void {
    this.configFunds.update(prev => [...prev, { name: '' }]);
  }

  removeFund(index: number): void {
    this.configFunds.update(prev => prev.filter((_, i) => i !== index));
  }

  updateFundName(index: number, name: string): void {
    this.configFunds.update(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], name };
      return updated;
    });
  }

  saveFundsConfig(): void {
    if (!this.fundsBuildingId()) {
      this.showToastMessage('Seleccione un edificio/torre', 'error');
      return;
    }

    this.fundsLoading.set(true);

    const payload: FundConfig = {
      buildingId: this.fundsBuildingId(),
      fiscalYear: this.fundsYear(),
      fundList: this.configFunds().map((f, index) => ({
        fundId: index,
        fundName: f.name
      }))
    };

    this.paymentService.saveFunds(payload).subscribe({
      next: (response) => {
        this.fundsLoading.set(false);
        if (response.success) {
          this.showToastMessage('Configuración de fondos guardada correctamente', 'success');
          this.closeModal();
        } else {
          this.showToastMessage('Error al guardar la configuración de fondos', 'error');
        }
      },
      error: (err) => {
        this.fundsLoading.set(false);
        console.error('Error saving funds config:', err);
        this.showToastMessage('Error de conexión con el servidor', 'error');
      }
    });
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
    (this.filteredPayments() || []).reduce((sum, p) => sum + p.totalAmount, 0)
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
          const amounts: MonthlyAmount[] = this.monthNames.map((name, i) => ({
            month: i + 1,
            amount: 0,
            title: name
          }));
          let total = 0;

          if (response.data.monthlyAmounts) {
            response.data.monthlyAmounts.forEach(m => {
              if (m.month >= 1 && m.month <= 12) {
                amounts[m.month - 1] = {
                  month: m.month,
                  amount: m.amount,
                  title: m.title || this.monthNames[m.month - 1]
                };
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
          this.configMonthlyAmounts.set(
            this.monthNames.map((name, i) => ({ month: i + 1, amount: 0, title: name }))
          );
        }
      },
      error: (err) => {
        console.error('Error fetching payment config:', err);
        this.configId.set(null);
        this.configAnnualTotal.set(0);
        this.configMonthlyAmounts.set(
          this.monthNames.map((name, i) => ({ month: i + 1, amount: 0, title: name }))
        );
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
  protected readonly selectedResidentFunds = signal<FundItem[]>([]);
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
      unitId: typeof resident.unit === 'object' ? resident.unit.id : resident.unitId,
      buildingId: typeof resident.unit === 'object' ? resident.unit.buildingId : resident.buildingId
    }));
    this.selectedResidentName.set(resident.name);
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

    // NEW: Fetch ALL existing payments for this resident and year for history display
    this.paymentService.getPaymentByResidentAndYear(resident.id, currentYear).subscribe({
      next: (response) => {
        if (response.success && response.data && Array.isArray(response.data)) {
          // Flatten all payments from all months into a single array
          const allPayments = response.data.reduce((acc: any[], doc: any) => {
            return [...acc, ...(doc.payments || [])];
          }, []);

          this.existingResidentPayment.set({
            year: currentYear,
            payments: allPayments,
            docs: response.data
          });
          console.log('Total resident payments for year loaded:', allPayments.length);
        } else {
          this.existingResidentPayment.set(null);
        }
      },
      error: (err) => {
        console.error('Error loading resident payment history:', err);
        this.existingResidentPayment.set(null);
      }
    });

    // Clear existing resident payment state until data is loaded
    this.existingResidentPayment.set(null);

    // NEW: Fetch funds configuration for resident's building
    if (buildingId) {
      this.paymentService.getFunds(buildingId, currentYear).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.selectedResidentFunds.set(response.data.fundList || []);
          } else {
            this.selectedResidentFunds.set([]);
          }
        },
        error: (err) => {
          console.error('Error fetching resident funds:', err);
          this.selectedResidentFunds.set([]);
        }
      });
    }

    this.openRegisterModal(false);
  }

  onMonthSelect(monthIndex: number, amount: number): void {
    const item = this.selectedResidentConfig()?.monthlyAmounts[monthIndex];
    this.selectedMonth.set(monthIndex);

    // If there is only one fund, assign the full amount to it automatically
    let fundDetails = [];
    if (this.selectedResidentFunds().length === 1) {
      fundDetails = [{
        fundName: this.selectedResidentFunds()[0].fundName,
        amount: amount
      }];
    } else {
      // For multiple funds, initialize them with 0 or however the user prefers
      // Usually, maintenance is the main fund. Let's initialize with 0 for all.
      fundDetails = this.selectedResidentFunds().map(f => ({
        fundName: f.fundName,
        amount: 0
      }));
    }

    this.formData.update(curr => ({
      ...curr,
      totalAmount: amount,
      paymentFundDetails: fundDetails,
      notes: `Pago ${item?.title || this.monthNames[monthIndex]} ${new Date().getFullYear()}`
    }));
  }

  getFundAmount(fundName: string): number {
    const details = this.formData().paymentFundDetails || [];
    const fund = details.find((f: any) => f.fundName === fundName);
    return fund ? fund.amount : 0;
  }

  onFundAmountChange(fundName: string, amount: number): void {
    const details = [...(this.formData().paymentFundDetails || [])];
    const index = details.findIndex((f: any) => f.fundName === fundName);

    if (index !== -1) {
      details[index] = { ...details[index], amount };
    } else {
      details.push({ fundName, amount });
    }

    this.formData.update(curr => ({
      ...curr,
      paymentFundDetails: details
    }));
  }

  calculatePendingAmount(): number {
    const total = this.formData().totalAmount || 0;
    const assigned = (this.formData().paymentFundDetails || []).reduce(
      (sum: number, fund: any) => sum + (fund.amount || 0),
      0
    );
    return Number((total - assigned).toFixed(2));
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

  openRegisterModal(reset = true): void {
    this.modalMode.set('register');
    this.selectedPayment.set(null);
    if (reset) {
      this.formData.set({
        invoiceId: '',
        condominiumId:
          this.selectedCondo()?.id === 'all' ? '' : this.selectedCondo()?.id || '',
        unitId: '',
        residentId: '',
        totalAmount: 0,
        paymentDate: new Date(),
        paymentMethod: PaymentMethod.CASH,
        reference: '',
        notes: '',
        fundName: '',
        buildingId: ''
      });
    }
    this.showModal.set(true);
  }

  openViewModal(payment: PaymentWithDetails): void {
    this.modalMode.set('view');
    this.selectedPayment.set(payment);
    this.showModal.set(true);
  }

  openConfigModal(): void {
    this.modalMode.set('config');
    this.configBuildingId.set('');
    this.configAnnualTotal.set(0);
    this.configMonthlyAmounts.set(
      this.monthNames.map((name, i) => ({ month: i + 1, amount: 0, title: name }))
    );
    this.loadBuildings();
    this.showModal.set(true);
  }

  saveConfig(): void {
    if (!this.configBuildingId()) {
      this.showToastMessage('Por favor seleccione un edificio', 'error');
      return;
    }

    this.loading.set(true);
    const config: PaymentConfig = {
      buildingId: this.configBuildingId(),
      paymentYear: this.configYear(),
      monthlyAmounts: this.configMonthlyAmounts()
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
      totalAmount: 0,
      paymentDate: new Date(),
      paymentMethod: PaymentMethod.CASH,
      reference: '',
      notes: '',
      paymentFundDetails: []
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

    // Strictly use the current actual month for the database document
    const targetMonth = new Date().getMonth() + 1;

    const totalAmount = data.totalAmount;
    const pendingAmount = this.calculatePendingAmount();

    if (totalAmount <= 0) {
      this.error.set('El monto total debe ser mayor a cero');
      return;
    }

    if (pendingAmount !== 0) {
      this.error.set(`Monto pendiente de asignar: $${pendingAmount}. Por favor distribuya el monto total entre los fondos para que el monto pendiente sea $0.`);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const existingHistory = this.existingResidentPayment();
    // Find if we already have a record for this specific month in the year history
    const existingDocForMonth = existingHistory?.docs?.find((doc: any) => doc.month === targetMonth);

    const newPaymentDetail = {
      paymentDate: data.paymentDate || new Date(),
      totalAmount: totalAmount,
      reference: data.reference || undefined,
      paymentType: data.paymentMethod || PaymentMethod.CASH,
      paymentFundDetails: data.paymentFundDetails,
      notes: data.notes || `Pago Mantenimiento ${this.monthNames[targetMonth - 1]} ${currentYear}`
    };

    if (existingDocForMonth) {
      // Perform UPDATE (PUT) - Append to the specific month's array
      const payload: AppPaymentRequest = {
        residentId: existingDocForMonth.residentId,
        year: existingDocForMonth.year,
        month: existingDocForMonth.month,
        payments: [...(existingDocForMonth.payments || []), newPaymentDetail]
      };

      this.paymentService.updatePayment(existingDocForMonth.id || existingDocForMonth._id!, payload).subscribe({
        next: (response) => {
          if (response.success) {
            this.showToastMessage('Pago registrado correctamente (actualización)', 'success');

            if (data.buildingId && totalAmount && data.paymentFundDetails) {
              // Trigger movement for each fund
              data.paymentFundDetails.forEach((fund: any) => {
                if (fund.amount > 0) {
                  this.triggerFundMovementUpdate(data.buildingId, fund.amount, fund.fundName);
                }
              });
            }

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
      // Perform CREATE (POST) - New record for this month
      const payload: AppPaymentRequest = {
        residentId: data.residentId!,
        year: currentYear,
        month: targetMonth,
        payments: [newPaymentDetail]
      };

      this.paymentService.createPayment(payload).subscribe({
        next: (response: ApiResponse<any>) => {
          if (response.success) {
            this.showToastMessage('Pago registrado correctamente', 'success');

            if (data.buildingId && totalAmount && data.paymentFundDetails) {
              // Trigger movement for each fund
              data.paymentFundDetails.forEach((fund: any) => {
                if (fund.amount > 0) {
                  this.triggerFundMovementUpdate(data.buildingId, fund.amount, fund.fundName);
                }
              });
            }

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

  private validateForm(data: any): boolean {
    // Legacy validation - kept for potential future use
    if (!data.residentId || !data.totalAmount) {
      this.error.set('Por favor complete todos los campos obligatorios');
      return false;
    }

    if (data.totalAmount <= 0) {
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
        totalAmount: invoice.totalAmount,
      }));
    }
  }

  onFormFieldChange(field: keyof Payment, value: any): void {
    this.formData.update((current) => ({
      ...current,
      [field]: value,
    }));
  }

  private triggerFundMovementUpdate(buildingId: string, amount: number, fundName: string): void {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1; // 1-12

    const movement: FundMovement = {
      buildingId,
      fiscalYear: currentYear,
      month: currentMonth,
      funds: [
        {
          fundName,
          incomes: amount,
          expenses: 0,
          previousBalance: 0,
          finalBalance: 0
        }
      ]
    };

    console.log('Sending fund movement update:', movement);
    this.paymentService.updateFundMovement(movement).subscribe({
      next: (response) => {
        if (response.success) {
          console.log('Fund movement updated successfully');
        } else {
          console.error('Error updating fund movement:', response.error?.message);
        }
      },
      error: (err) => console.error('Error in fund movement update call:', err)
    });
  }
}
