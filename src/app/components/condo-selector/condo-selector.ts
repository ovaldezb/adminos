import { Component, signal, output, HostListener, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Condominium, CondominiumType, CondominiumStatus } from '../../models';
import { CondominiumService } from '../../services';

@Component({
  selector: 'app-condo-selector',
  imports: [CommonModule],
  templateUrl: './condo-selector.html',
  styleUrl: './condo-selector.css'
})
export class CondoSelectorComponent {
  readonly condoSelected = output<Condominium | null>();
  
  protected readonly showSelector = signal(false);
  protected readonly selectedCondo = signal<Condominium | null>(null);
  protected readonly condominiums = signal<Condominium[]>([]);
  protected readonly loading = signal(false);

  constructor(
    private elementRef: ElementRef,
    private condominiumService: CondominiumService
  ) {
    // Cargar condominios desde el servicio
    this.loadCondominiums();
    
    // Sincronizar con el servicio global
    effect(() => {
      const globalCondo = this.condominiumService.selectedCondominium();
      if (globalCondo && globalCondo.id !== this.selectedCondo()?.id) {
        this.selectedCondo.set(globalCondo);
      }
    });
  }

  private loadCondominiums(): void {
    this.loading.set(true);
    this.condominiumService.getAllCondominiums().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Agregar opción "Todos" al inicio
          const allOption: Condominium = {
            id: 'all',
            name: 'Todos los Condominios',
            type: CondominiumType.TOWER,
            streetAddress: 'Vista General',
            neighborhood: 'Global',
            city: 'Global',
            zipCode: '00000',
            state: 'Global',
            country: 'Global',
            conventionalPenalty: 0,
            initialFolioNumber: 1,
            isActive: true,
            hasAC: false,
            buildingsId: [],
            buildings: [],
            privateStreets: [],
            amenities: [],
            status: CondominiumStatus.ACTIVE,
            createdAt: new Date(),
            updatedAt: new Date(),
            // Legacy para compatibilidad
            number: '0',
            paymentDay: 1,
            rfc: 'XAXX010101000',
            totalUnits: 0,
            occupiedUnits: 0,
            color: 'from-neutral-600 to-neutral-400',
            description: 'Vista general de todos los condominios'
          };
          
          this.condominiums.set([allOption, ...response.data]);
          
          // Seleccionar "Todos" por defecto SOLO si no hay selección previa
          const currentSelection = this.condominiumService.selectedCondominium();
          if (!currentSelection) {
            this.selectedCondo.set(allOption);
            this.condominiumService.setSelectedCondominium(allOption);
            this.condoSelected.emit(allOption);
          } else {
            // Mantener la selección actual
            this.selectedCondo.set(currentSelection);
          }
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading condominiums:', err);
        this.loading.set(false);
      }
    });
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    // Si el click fue fuera del componente, cerrar el selector
    const clickedInside = this.elementRef.nativeElement.contains(event.target);
    if (!clickedInside && this.showSelector()) {
      this.showSelector.set(false);
    }
  }

  toggleSelector(event: Event): void {
    event.stopPropagation();
    const newState = !this.showSelector();
    this.showSelector.set(newState);
  }

  selectCondo(condo: Condominium, event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.selectedCondo.set(condo);
    this.showSelector.set(false);
    
    // Actualizar el servicio global
    this.condominiumService.setSelectedCondominium(condo);
    
    // Emitir el evento
    this.condoSelected.emit(condo);
  }

  getTotalUnits(): number {
    return this.condominiums()
      .filter(c => c.id !== 'all')
      .reduce((sum, c) => sum + (c.totalUnits || c.units || 0), 0);
  }

  getTotalTowers(): number {
    return this.condominiums()
      .filter(c => c.id !== 'all')
      .reduce((sum, c) => {
        if (c.towers && Array.isArray(c.towers)) {
          return sum + c.towers.length;
        }
        return sum;
      }, 0);
  }

  getCondoAddress(condo: Condominium): string {
    if (condo.id === 'all') {
      return 'Vista general de todos los condominios';
    }
    return `${condo.streetAddress}, ${condo.neighborhood}, ${condo.city}`;
  }

  getCondoUnits(condo: Condominium): number {
    return condo.totalUnits || condo.units || 0;
  }

  getCondoTowers(condo: Condominium): number | string {
    if (condo.towers && Array.isArray(condo.towers)) {
      return condo.towers.length;
    }
    return '-';
  }
}
