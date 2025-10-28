import { Component, signal, output, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Condominium } from '../../models';

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
  
  protected readonly condominiums = signal<Condominium[]>([
    {
      id: 'all',
      name: 'Todos los Condominios',
      address: 'Vista General',
      city: 'Global',
      state: 'Global',
      zipCode: '00000',
      country: 'Global',
      units: 0,
      towers: 0,
      color: 'from-neutral-600 to-neutral-400',
      description: 'Vista general de todos los condominios',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '1',
      name: 'Torres del Sol',
      address: 'Av. Principal 123, Col. Centro',
      city: 'Guadalajara',
      state: 'Jalisco',
      zipCode: '44100',
      country: 'México',
      units: 248,
      towers: 3,
      color: 'from-primary to-sky-400',
      description: 'Moderno complejo residencial con vista al sol',
      createdAt: new Date('2020-01-15'),
      updatedAt: new Date()
    },
    {
      id: '2',
      name: 'Residencial Las Palmas',
      address: 'Calle Palma Real 456, Col. Norte',
      city: 'Guadalajara',
      state: 'Jalisco',
      zipCode: '44200',
      country: 'México',
      units: 186,
      towers: 2,
      color: 'from-success to-green-400',
      description: 'Exclusivo residencial familiar',
      createdAt: new Date('2019-06-10'),
      updatedAt: new Date()
    },
    {
      id: '3',
      name: 'Conjunto Villa Verde',
      address: 'Blvd. Jardines 789, Col. Sur',
      city: 'Zapopan',
      state: 'Jalisco',
      zipCode: '45030',
      country: 'México',
      units: 124,
      towers: 2,
      color: 'from-secondary to-purple-400',
      description: 'Conjunto residencial ecológico',
      createdAt: new Date('2021-03-20'),
      updatedAt: new Date()
    },
    {
      id: '4',
      name: 'Edificio Mirador',
      address: 'Av. Mirador 321, Col. Este',
      city: 'Guadalajara',
      state: 'Jalisco',
      zipCode: '44300',
      country: 'México',
      units: 96,
      towers: 1,
      color: 'from-warning to-yellow-400',
      description: 'Torre con vista panorámica de la ciudad',
      createdAt: new Date('2018-11-25'),
      updatedAt: new Date()
    },
    {
      id: '5',
      name: 'Terrazas del Parque',
      address: 'Calle del Parque 654, Col. Oeste',
      city: 'Guadalajara',
      state: 'Jalisco',
      zipCode: '44400',
      country: 'México',
      units: 142,
      towers: 2,
      color: 'from-info to-cyan-400',
      description: 'Residencial con vista al parque central',
      createdAt: new Date('2022-02-14'),
      updatedAt: new Date()
    }
  ]);

  constructor(private elementRef: ElementRef) {
    // Seleccionar "Todos" por defecto
    this.selectedCondo.set(this.condominiums()[0]);
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    // Si el click fue fuera del componente, cerrar el selector
    const clickedInside = this.elementRef.nativeElement.contains(event.target);
    if (!clickedInside && this.showSelector()) {
      console.log('Click fuera detectado - cerrando dropdown');
      this.showSelector.set(false);
    }
  }

  toggleSelector(event: Event): void {
    event.stopPropagation();
    const newState = !this.showSelector();
    this.showSelector.set(newState);
    console.log('Dropdown toggled:', newState ? 'ABIERTO' : 'CERRADO');
  }

  selectCondo(condo: Condominium, event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    console.log('✅ Condominio seleccionado:', condo.name);
    this.selectedCondo.set(condo);
    this.showSelector.set(false);
    this.condoSelected.emit(condo);
  }

  getTotalUnits(): number {
    return this.condominiums()
      .filter(c => c.id !== 'all')
      .reduce((sum, c) => sum + c.units, 0);
  }

  getTotalTowers(): number {
    return this.condominiums()
      .filter(c => c.id !== 'all')
      .reduce((sum, c) => sum + c.towers, 0);
  }
}
