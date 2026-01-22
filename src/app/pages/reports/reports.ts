import { Component, signal, computed, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../components/navbar/navbar';
import { SideMenuComponent } from '../../components/side-menu/side-menu';
import { BreadcrumbsComponent, BreadcrumbItem } from '../../components/breadcrumbs/breadcrumbs';
import { Condominium, BuildingDetails } from '../../models';
import { CondominiumService, BuildingService } from '../../services';

@Component({
    selector: 'app-reports',
    imports: [CommonModule, NavbarComponent, SideMenuComponent, BreadcrumbsComponent],
    templateUrl: './reports.html',
    styleUrl: './reports.css',
    providers: [CondominiumService, BuildingService]
})
export class ReportsComponent implements OnInit {
    protected readonly sidebarOpen = signal(false);
    protected readonly userName = signal('Administrador');
    protected readonly selectedCondo = signal<Condominium | null>(null);
    protected readonly isOverviewMode = computed(() => !this.selectedCondo() || this.selectedCondo()?.id === 'all');
    protected readonly buildings = signal<BuildingDetails[]>([]);
    protected readonly loading = signal(false);
    protected readonly selectedBuildingReport = signal<any>(null);
    protected readonly showReportDetail = signal(false);
    protected readonly currentYear = signal(new Date().getFullYear());
    protected readonly activeMonthTab = signal<number | null>(null);

    // Breadcrumbs
    protected readonly breadcrumbs: BreadcrumbItem[] = [
        {
            label: 'Reportes',
            icon: 'ri-bar-chart-box-line'
        }
    ];

    constructor(
        private buildingService: BuildingService,
        private condominiumService: CondominiumService
    ) {
        // Sincronizar con el servicio de condominios global
        effect(() => {
            const condo = this.condominiumService.selectedCondominium();
            if (condo) {
                this.selectedCondo.set(condo);
                this.loadBuildings();
            }
        });
    }

    ngOnInit(): void {
        this.loadBuildings();
    }

    private loadBuildings(): void {
        this.loading.set(true);
        const condoId = this.selectedCondo()?.id || 'all';

        this.buildingService.getBuildings({ condominiumId: condoId }).subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.buildings.set(response.data.items);
                }
                this.loading.set(false);
            },
            error: (error) => {
                console.error('Error loading buildings for reports:', error);
                this.loading.set(false);
            }
        });
    }

    toggleSidebar(): void {
        this.sidebarOpen.set(!this.sidebarOpen());
    }

    onCondoSelected(condo: Condominium | null): void {
        this.selectedCondo.set(condo);
        this.loadBuildings();
    }

    onBuildingClick(building: BuildingDetails): void {
        this.loading.set(true);
        this.selectedBuildingReport.set(null);

        this.buildingService.getBuildingReport(building.id, this.currentYear()).subscribe({
            next: (response) => {
                if (response.success) {
                    const data = response.data;

                    // Pre-process resident data for monthly statements
                    if (data.residents && data.paymentConfigs) {
                        const configs = data.paymentConfigs[0]?.monthlyAmounts || [];

                        data.residents = data.residents.map((res: any) => {
                            let runningBalance = 0;
                            const monthlyMovements: any = {};

                            // Process month by month
                            for (let m = 1; m <= 12; m++) {
                                const config = configs.find((c: any) => c.month === m);
                                const cargoDelMes = config ? config.amount : 0;

                                const paymentsInMonth = res.payments?.payments?.filter((d: any) => {
                                    return d.targetMonth === m;
                                }) || [];

                                const maintenancePaid = paymentsInMonth
                                    .filter((p: any) => !p.fundName || p.fundName === 'Mantenimiento')
                                    .reduce((sum: number, p: any) => sum + p.amount, 0);

                                const fundPaid = paymentsInMonth
                                    .filter((p: any) => p.fundName && p.fundName !== 'Mantenimiento')
                                    .reduce((sum: number, p: any) => sum + p.amount, 0);

                                const saldoAnterior = runningBalance;

                                const cuotaFondo = 0; // Placeholder
                                const cuotaExtra = 0; // Placeholder
                                const otro = 0; // Placeholder

                                const totalAPagar = cargoDelMes + cuotaFondo + cuotaExtra + otro + saldoAnterior;
                                const saldoActual = totalAPagar - (maintenancePaid + fundPaid);

                                const lastPayment = paymentsInMonth.length > 0 ? paymentsInMonth[paymentsInMonth.length - 1] : null;

                                monthlyMovements[m] = {
                                    saldoAnterior,
                                    cargoDelMes,
                                    cuotaFondo,
                                    cuotaExtra,
                                    otro,
                                    totalAPagar,
                                    mantenimiento: maintenancePaid,
                                    fondo: fundPaid,
                                    saldoActual,
                                    formaDePago: lastPayment ? lastPayment.paymentType : '-',
                                    fecha: lastPayment ? lastPayment.paymentDate : null
                                };

                                runningBalance = saldoActual;
                            }

                            return { ...res, monthlyMovements };
                        });
                    }

                    this.selectedBuildingReport.set(data);

                    // Set default tab to the first month available
                    if (data.funds && data.funds.length > 0) {
                        this.activeMonthTab.set(data.funds[0].month);
                    }

                    this.showReportDetail.set(true);
                }
                this.loading.set(false);
            },
            error: (error) => {
                console.error('Error loading building report:', error);
                this.loading.set(false);
            }
        });
    }

    closeReport(): void {
        this.showReportDetail.set(false);
        this.selectedBuildingReport.set(null);
    }

    getMonthName(month: number): string {
        const months = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        return months[month - 1] || `Mes ${month}`;
    }

    getCondoName(): string {
        if (this.isOverviewMode()) {
            return 'Vista General - Todos los Condominios';
        }
        return this.selectedCondo()?.name || 'Sin Seleccionar';
    }
}
