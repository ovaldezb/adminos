import { Component, signal, computed, OnInit, Input, Output, EventEmitter, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, AsyncValidatorFn } from '@angular/forms';
import { Observable, of, debounceTime, switchMap, map, catchError, timer } from 'rxjs';
import {
  BuildingService,
  UnitService,
  AssignmentService,
  CondominiumService
} from '../../services';
import {
  Building,
  BuildingDetails,
  CreateBuildingDto,
  Unit,
  UnitDetails,
  CreateUnitDto,
  Person,
  PersonDetails,
  CreatePersonDto,
  CreateUnitAssignmentDto,
  WizardData,
  PersonType,
  UnitStatus,
  PropertyType,
  BuildingType,
  BuildingStatus,
  ApiResponse,
  PaginatedResponse
} from '../../models';

export interface WizardCompletedData {
  building: Building;
  unit: Unit;
  owner: Person;
  resident?: Person;
  assignment: any; // UnitAssignment después de creado
}

@Component({
  selector: 'app-resident-wizard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './resident-wizard.html',
  styleUrl: './resident-wizard.css'
})
export class ResidentWizardComponent implements OnInit {
  @Input() condominiumId!: string;
  @Input() isVisible = false;
  @Output() onComplete = new EventEmitter<WizardCompletedData>();
  @Output() onCancel = new EventEmitter<void>();

  // Wizard state
  protected readonly currentStep = signal(1);
  protected readonly totalSteps = 3;
  protected readonly isSubmitting = signal(false);
  protected readonly submitError = signal<string | null>(null);

  // Forms for each step
  protected step1Form!: FormGroup;
  protected step2Form!: FormGroup;
  protected step3Form!: FormGroup;

  // Data signals
  protected readonly availableBuildings = signal<BuildingDetails[]>([]);
  protected readonly availableUnits = signal<UnitDetails[]>([]);
  protected readonly availableOwners = signal<PersonDetails[]>([]);
  protected readonly availableResidents = signal<PersonDetails[]>([]);

  // Loading states
  protected readonly loadingBuildings = signal(false);
  protected readonly loadingUnits = signal(false);
  protected readonly loadingOwners = signal(false);
  protected readonly loadingResidents = signal(false);

  // Step UI states
  protected readonly showCreateBuildingModal = signal(false);
  protected readonly showCreateUnitModal = signal(false);
  protected readonly showCreateOwnerModal = signal(false);
  protected readonly showCreateResidentModal = signal(false);

  // Step selection states
  protected readonly selectedBuildingId = signal<string>('');
  protected readonly selectedUnitId = signal<string>('');
  protected readonly selectedOwnerId = signal<string>('');
  protected readonly selectedResidentId = signal<string>('');
  protected readonly ownerInhabits = signal(false);

  // Enums for template
  protected readonly BuildingType = BuildingType;
  protected readonly BuildingStatus = BuildingStatus;
  protected readonly UnitStatus = UnitStatus;
  protected readonly PropertyType = PropertyType;
  protected readonly PersonType = PersonType;

  // Helper properties
  protected readonly currentYear = new Date().getFullYear();

  // Computed validations
  protected readonly hasValidCondominium = computed(() => {
    return !!this.condominiumId && this.condominiumId !== '' && this.condominiumId !== 'all';
  });

  // Computed properties
  protected readonly selectedBuilding = computed(() => {
    const id = this.selectedBuildingId();
    return this.availableBuildings().find(b => b.id === id);
  });

  protected readonly selectedUnit = computed(() => {
    const id = this.selectedUnitId();
    return this.availableUnits().find(u => u.id === id);
  });

  protected readonly selectedOwner = computed(() => {
    const id = this.selectedOwnerId();
    return this.availableOwners().find(o => o.id === id);
  });

  protected readonly selectedResident = computed(() => {
    const id = this.selectedResidentId();
    return this.availableResidents().find(r => r.id === id);
  });

  protected readonly canProceedStep1 = computed(() => {
    return this.step1Form?.valid && (this.selectedBuildingId() || this.step1Form.get('isCreatingBuilding')?.value);
  });

  protected readonly canProceedStep2 = computed(() => {
    return this.step2Form?.valid && (this.selectedUnitId() || this.step2Form.get('isCreatingUnit')?.value);
  });

  protected readonly canProceedStep3 = computed(() => {
    const ownerValid = this.selectedOwnerId() || this.step3Form.get('isCreatingOwner')?.value;
    const residentValid = this.ownerInhabits() || this.selectedResidentId() || this.step3Form.get('isCreatingResident')?.value;
    return this.step3Form?.valid && ownerValid && residentValid;
  });

  constructor(
    private fb: FormBuilder,
    private buildingService: BuildingService,
    private unitService: UnitService,
    private assignmentService: AssignmentService,
    private condominiumService: CondominiumService
  ) {
    this.initializeForms();

    // Auto-load data when condominium changes
    effect(() => {
      if (this.condominiumId) {
        this.loadBuildings();
        this.loadOwners();
        this.loadResidents();
      }
    });
  }

  ngOnInit(): void {
    if (this.condominiumId) {
      this.loadBuildings();
      this.loadOwners();
      this.loadResidents();
    }
  }

  private initializeForms(): void {
    // Step 1: Building Selection/Creation
    this.step1Form = this.fb.group({
      selectedBuildingId: [''],
      isCreatingBuilding: [false],
      // Building creation fields
      name: ['', [Validators.required, Validators.minLength(2)]],
      type: [BuildingType.BUILDING, Validators.required],
      mainEntranceAddress: ['', Validators.required],
      totalUnits: [1, [Validators.required, Validators.min(1)]],
      floors: [1, Validators.min(1)],
      hasCommonAreas: [false],
      commonAreasDescription: [''],
      commonAreaRentalRate: [0, Validators.min(0)],
      yearBuilt: [new Date().getFullYear(), Validators.min(1900)],
      parkingSpots: [0, Validators.min(0)],
      elevators: [0, Validators.min(0)],
      description: ['']
    });

    // Step 2: Unit Selection/Creation
    this.step2Form = this.fb.group({
      selectedUnitId: [''],
      isCreatingUnit: [false],
      // Unit creation fields
      unitNumber: ['', [Validators.required], [this.unitNumberAsyncValidator()]],
      tower: [''],
      floor: [1, [Validators.required, Validators.min(1)]],
      area: [50, [Validators.required, Validators.min(1)]],
      bedrooms: [1, [Validators.required, Validators.min(0)]],
      bathrooms: [1, [Validators.required, Validators.min(1)]],
      parkingSpaces: [1, [Validators.required, Validators.min(0)]],
      storageSpaces: [0, Validators.min(0)],
      status: [UnitStatus.VACANT, Validators.required],
      monthlyFee: [1000, [Validators.required, Validators.min(0)]],
      propertyType: [PropertyType.APARTMENT, Validators.required],
      orientation: [''],
      hasBalcony: [false],
      hasGarden: [false],
      isFurnished: [false],
      description: ['']
    });

    // Step 3: Owner/Resident Assignment
    this.step3Form = this.fb.group({
      selectedOwnerId: [''],
      isCreatingOwner: [false],
      selectedResidentId: [''],
      isCreatingResident: [false],
      ownerInhabits: [true],
      // Owner creation fields
      ownerFirstName: ['', [Validators.required, Validators.minLength(2)]],
      ownerLastName: ['', [Validators.required, Validators.minLength(2)]],
      ownerEmail: ['', [Validators.required, Validators.email], [this.emailAsyncValidator('owner')]],
      ownerPhone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      // Resident creation fields
      residentFirstName: ['', [Validators.minLength(2)]],
      residentLastName: ['', [Validators.minLength(2)]],
      residentEmail: ['', [Validators.email], [this.emailAsyncValidator('resident')]],
      residentPhone: ['', [Validators.pattern(/^[0-9]{10}$/)]],
      // Assignment fields
      startDate: [new Date().toISOString().split('T')[0], Validators.required],
      notes: ['']
    });

    // Watch for form changes
    this.setupFormWatchers();
  }

  private setupFormWatchers(): void {
    // Step 1 watchers
    this.step1Form.get('isCreatingBuilding')?.valueChanges.subscribe(isCreating => {
      this.toggleBuildingFormValidators(isCreating);
    });

    this.step1Form.get('selectedBuildingId')?.valueChanges.subscribe(buildingId => {
      this.selectedBuildingId.set(buildingId || '');
      if (buildingId && this.currentStep() >= 2) {
        this.loadUnitsByBuilding(buildingId);
      }
    });

    // Step 2 watchers
    this.step2Form.get('isCreatingUnit')?.valueChanges.subscribe(isCreating => {
      this.toggleUnitFormValidators(isCreating);
    });

    this.step2Form.get('selectedUnitId')?.valueChanges.subscribe(unitId => {
      this.selectedUnitId.set(unitId || '');
    });

    // Step 3 watchers
    this.step3Form.get('isCreatingOwner')?.valueChanges.subscribe(isCreating => {
      this.toggleOwnerFormValidators(isCreating);
    });

    this.step3Form.get('isCreatingResident')?.valueChanges.subscribe(isCreating => {
      this.toggleResidentFormValidators(isCreating);
    });

    this.step3Form.get('ownerInhabits')?.valueChanges.subscribe(inhabits => {
      this.ownerInhabits.set(inhabits);
      this.toggleResidentRequirement(!inhabits);
    });

    this.step3Form.get('selectedOwnerId')?.valueChanges.subscribe(ownerId => {
      this.selectedOwnerId.set(ownerId || '');
    });

    this.step3Form.get('selectedResidentId')?.valueChanges.subscribe(residentId => {
      this.selectedResidentId.set(residentId || '');
    });
  }

  // Form validator toggles
  private toggleBuildingFormValidators(isCreating: boolean): void {
    const buildingFields = ['name', 'type', 'mainEntranceAddress', 'totalUnits'];

    buildingFields.forEach(field => {
      const control = this.step1Form.get(field);
      if (control) {
        if (isCreating) {
          control.addValidators(Validators.required);
        } else {
          control.clearValidators();
          if (field === 'type') control.addValidators(Validators.required);
          if (field === 'totalUnits') control.addValidators([Validators.required, Validators.min(1)]);
        }
        control.updateValueAndValidity();
      }
    });
  }

  private toggleUnitFormValidators(isCreating: boolean): void {
    const unitFields = ['unitNumber', 'floor', 'area', 'bedrooms', 'bathrooms', 'parkingSpaces', 'monthlyFee'];

    unitFields.forEach(field => {
      const control = this.step2Form.get(field);
      if (control) {
        if (isCreating) {
          control.addValidators(Validators.required);
          if (['floor', 'area', 'bedrooms', 'bathrooms', 'parkingSpaces', 'monthlyFee'].includes(field)) {
            control.addValidators(Validators.min(0));
          }
        } else {
          control.clearValidators();
        }
        control.updateValueAndValidity();
      }
    });
  }

  private toggleOwnerFormValidators(isCreating: boolean): void {
    const ownerFields = ['ownerFirstName', 'ownerLastName', 'ownerEmail', 'ownerPhone'];

    ownerFields.forEach(field => {
      const control = this.step3Form.get(field);
      if (control) {
        if (isCreating) {
          control.addValidators(Validators.required);
          if (field === 'ownerEmail') control.addValidators(Validators.email);
          if (field === 'ownerPhone') control.addValidators(Validators.pattern(/^[0-9]{10}$/));
        } else {
          control.clearValidators();
        }
        control.updateValueAndValidity();
      }
    });
  }

  private toggleResidentFormValidators(isCreating: boolean): void {
    const residentFields = ['residentFirstName', 'residentLastName', 'residentEmail', 'residentPhone'];

    residentFields.forEach(field => {
      const control = this.step3Form.get(field);
      if (control) {
        if (isCreating) {
          control.addValidators(Validators.required);
          if (field === 'residentEmail') control.addValidators(Validators.email);
          if (field === 'residentPhone') control.addValidators(Validators.pattern(/^[0-9]{10}$/));
        } else {
          control.clearValidators();
        }
        control.updateValueAndValidity();
      }
    });
  }

  private toggleResidentRequirement(isRequired: boolean): void {
    const residentSelection = this.step3Form.get('selectedResidentId');
    const residentCreation = this.step3Form.get('isCreatingResident');

    if (isRequired) {
      // Require either selection or creation
      residentSelection?.addValidators(this.requiredIfNotCreating('isCreatingResident'));
    } else {
      // Optional
      residentSelection?.clearValidators();
    }
    residentSelection?.updateValueAndValidity();
  }

  // Custom validators
  private requiredIfNotCreating(creatingFieldName: string) {
    return (control: AbstractControl): ValidationErrors | null => {
      const isCreating = control.parent?.get(creatingFieldName)?.value;
      if (!isCreating && !control.value) {
        return { required: true };
      }
      return null;
    };
  }

  private unitNumberAsyncValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value) {
        return of(null);
      }

      return timer(300).pipe(
        switchMap(() => {
          const buildingId = this.selectedBuildingId();
          if (!buildingId) {
            return of(null);
          }

          return this.unitService.validateUnitNumber(buildingId, control.value).pipe(
            map((response: ApiResponse<{ isUnique: boolean }>) => {
              if (response.success && response.data?.isUnique) {
                return null;
              }
              return { unitNumberTaken: true };
            }),
            catchError(() => of(null))
          );
        })
      );
    };
  }

  private emailAsyncValidator(type: 'owner' | 'resident'): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value) {
        return of(null);
      }

      return timer(300).pipe(
        switchMap(() => {
          return this.assignmentService.validatePersonEmail(control.value).pipe(
            map((response: ApiResponse<{ isUnique: boolean }>) => {
              if (response.success && response.data?.isUnique) {
                return null;
              }
              return { emailTaken: true };
            }),
            catchError(() => of(null))
          );
        })
      );
    };
  }

  // Data loading methods
  private loadBuildings(): void {
    this.loadingBuildings.set(true);

    this.buildingService.getBuildings().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.availableBuildings.set(response.data.items);
        }
        this.loadingBuildings.set(false);
      },
      error: (err) => {
        console.error('Error loading buildings:', err);
        this.loadingBuildings.set(false);
      }
    });
  }

  private loadUnitsByBuilding(buildingId: string): void {
    this.loadingUnits.set(true);

    this.unitService.getUnits({
      page: 1,
      buildingId,
      pageSize: 1000,
      status: UnitStatus.VACANT // Solo unidades disponibles
    }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.availableUnits.set(response.data.items);
        }
        this.loadingUnits.set(false);
      },
      error: (err) => {
        console.error('Error loading units:', err);
        this.loadingUnits.set(false);
      }
    });
  }

  private loadOwners(): void {
    this.loadingOwners.set(true);

    this.assignmentService.getPersons({
      page: 1,
      type: PersonType.OWNER,
      isActive: true,
      pageSize: 1000
    }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.availableOwners.set(response.data.items);
        }
        this.loadingOwners.set(false);
      },
      error: (err) => {
        console.error('Error loading owners:', err);
        this.loadingOwners.set(false);
      }
    });
  }

  private loadResidents(): void {
    this.loadingResidents.set(true);

    this.assignmentService.getPersons({
      page: 1,
      type: PersonType.RESIDENT,
      isActive: true,
      pageSize: 1000
    }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.availableResidents.set(response.data.items);
        }
        this.loadingResidents.set(false);
      },
      error: (err) => {
        console.error('Error loading residents:', err);
        this.loadingResidents.set(false);
      }
    });
  }

  // Navigation methods
  nextStep(): void {
    if (this.currentStep() < this.totalSteps) {
      const nextStep = this.currentStep() + 1;

      if (nextStep === 2 && this.selectedBuildingId()) {
        this.loadUnitsByBuilding(this.selectedBuildingId());
      }

      this.currentStep.set(nextStep);
    }
  }

  previousStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.set(this.currentStep() - 1);
    }
  }

  // Quick create modal methods
  openCreateBuildingModal(): void {
    this.showCreateBuildingModal.set(true);
  }

  closeCreateBuildingModal(): void {
    this.showCreateBuildingModal.set(false);
  }

  openCreateUnitModal(): void {
    this.showCreateUnitModal.set(true);
  }

  closeCreateUnitModal(): void {
    this.showCreateUnitModal.set(false);
  }

  openCreateOwnerModal(): void {
    this.showCreateOwnerModal.set(true);
  }

  closeCreateOwnerModal(): void {
    this.showCreateOwnerModal.set(false);
  }

  openCreateResidentModal(): void {
    this.showCreateResidentModal.set(true);
  }

  closeCreateResidentModal(): void {
    this.showCreateResidentModal.set(false);
  }

  // Quick create methods
  quickCreateBuilding(): void {
    if (!this.step1Form.valid) return;

    const buildingData: CreateBuildingDto = {
      condominiumId: this.condominiumId,
      name: this.step1Form.get('name')?.value,
      type: this.step1Form.get('type')?.value,
      mainEntranceAddress: this.step1Form.get('mainEntranceAddress')?.value,
      totalUnits: this.step1Form.get('totalUnits')?.value,
      num_floors: this.step1Form.get('floors')?.value,
      hasCommonAreas: this.step1Form.get('hasCommonAreas')?.value,
      commonAreasDescription: this.step1Form.get('commonAreasDescription')?.value,
      commonAreaRentalRate: this.step1Form.get('commonAreaRentalRate')?.value,
      status: BuildingStatus.ACTIVE,
      yearBuilt: this.step1Form.get('yearBuilt')?.value,
      parkingSpots: this.step1Form.get('parkingSpots')?.value,
      elevators: this.step1Form.get('elevators')?.value,
      description: this.step1Form.get('description')?.value
    };

    this.buildingService.createBuilding(buildingData).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.loadBuildings();
          this.step1Form.patchValue({
            selectedBuildingId: response.data.id,
            isCreatingBuilding: false
          });
          this.closeCreateBuildingModal();
        }
      },
      error: (err) => {
        console.error('Error creating building:', err);
      }
    });
  }

  quickCreateUnit(): void {
    if (!this.step2Form.valid) return;

    const selectedBuilding = this.selectedBuilding();
    if (!selectedBuilding) return;

    const unitData: CreateUnitDto = {
      condominiumId: this.condominiumId,
      buildingId: selectedBuilding.id,
      unitNumber: this.step2Form.get('unitNumber')?.value,
      tower: this.step2Form.get('tower')?.value || selectedBuilding.name,
      floor: this.step2Form.get('floor')?.value,
      area: this.step2Form.get('area')?.value,
      bedrooms: this.step2Form.get('bedrooms')?.value,
      bathrooms: this.step2Form.get('bathrooms')?.value,
      parkingSpaces: this.step2Form.get('parkingSpaces')?.value,
      storageSpaces: this.step2Form.get('storageSpaces')?.value,
      status: this.step2Form.get('status')?.value,
      monthlyFee: this.step2Form.get('monthlyFee')?.value,
      propertyType: this.step2Form.get('propertyType')?.value,
      orientation: this.step2Form.get('orientation')?.value,
      hasBalcony: this.step2Form.get('hasBalcony')?.value,
      hasGarden: this.step2Form.get('hasGarden')?.value,
      isFurnished: this.step2Form.get('isFurnished')?.value,
      description: this.step2Form.get('description')?.value
    };

    this.unitService.createUnit(unitData).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.loadUnitsByBuilding(selectedBuilding.id);
          this.step2Form.patchValue({
            selectedUnitId: response.data.id,
            isCreatingUnit: false
          });
          this.closeCreateUnitModal();
        }
      },
      error: (err) => {
        console.error('Error creating unit:', err);
      }
    });
  }

  quickCreateOwner(): void {
    const ownerControls = ['ownerFirstName', 'ownerLastName', 'ownerEmail', 'ownerPhone'];
    const hasValidOwnerData = ownerControls.every(field => this.step3Form.get(field)?.valid);

    if (!hasValidOwnerData) return;

    const ownerData: CreatePersonDto = {
      firstName: this.step3Form.get('ownerFirstName')?.value,
      lastName: this.step3Form.get('ownerLastName')?.value,
      email: this.step3Form.get('ownerEmail')?.value,
      phone: this.step3Form.get('ownerPhone')?.value,
      type: PersonType.OWNER
    };

    this.assignmentService.createPerson(ownerData).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.loadOwners();
          this.step3Form.patchValue({
            selectedOwnerId: response.data.id,
            isCreatingOwner: false
          });
          this.closeCreateOwnerModal();
        }
      },
      error: (err) => {
        console.error('Error creating owner:', err);
      }
    });
  }

  quickCreateResident(): void {
    const residentControls = ['residentFirstName', 'residentLastName', 'residentEmail', 'residentPhone'];
    const hasValidResidentData = residentControls.every(field => this.step3Form.get(field)?.valid);

    if (!hasValidResidentData) return;

    const residentData: CreatePersonDto = {
      firstName: this.step3Form.get('residentFirstName')?.value,
      lastName: this.step3Form.get('residentLastName')?.value,
      email: this.step3Form.get('residentEmail')?.value,
      phone: this.step3Form.get('residentPhone')?.value,
      type: PersonType.RESIDENT
    };

    this.assignmentService.createPerson(residentData).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.loadResidents();
          this.step3Form.patchValue({
            selectedResidentId: response.data.id,
            isCreatingResident: false
          });
          this.closeCreateResidentModal();
        }
      },
      error: (err) => {
        console.error('Error creating resident:', err);
      }
    });
  }

  // Final submission
  async submitWizard(): Promise<void> {
    if (!this.hasValidCondominium()) {
      this.submitError.set('Condominio requerido para completar la asignación');
      return;
    }

    if (!this.canProceedStep3()) return;

    this.isSubmitting.set(true);
    this.submitError.set(null);

    try {
      // 1. Create/get building
      let building: Building;
      if (this.step1Form.get('isCreatingBuilding')?.value) {
        const buildingResponse = await this.createBuildingFromForm();
        building = buildingResponse.data!;
      } else {
        building = this.selectedBuilding()!;
      }

      // 2. Create/get unit
      let unit: Unit;
      if (this.step2Form.get('isCreatingUnit')?.value) {
        const unitResponse = await this.createUnitFromForm(building.id);
        unit = unitResponse.data!;
      } else {
        unit = this.selectedUnit()!;
      }

      // 3. Create/get owner
      let owner: Person;
      if (this.step3Form.get('isCreatingOwner')?.value) {
        const ownerResponse = await this.createOwnerFromForm();
        owner = ownerResponse.data!;
      } else {
        owner = this.selectedOwner()!;
      }

      // 4. Create/get resident (if not owner inhabits)
      let resident: Person | undefined;
      if (!this.ownerInhabits()) {
        if (this.step3Form.get('isCreatingResident')?.value) {
          const residentResponse = await this.createResidentFromForm();
          resident = residentResponse.data;
        } else {
          resident = this.selectedResident();
        }
      }

      // 5. Create assignment
      const assignmentData: CreateUnitAssignmentDto = {
        unitId: unit.id,
        ownerId: owner.id,
        residentId: this.ownerInhabits() ? owner.id : resident?.id,
        startDate: new Date(this.step3Form.get('startDate')?.value),
        notes: this.step3Form.get('notes')?.value
      };

      const assignmentResponse = await new Promise<ApiResponse<any>>((resolve, reject) => {
        this.assignmentService.createAssignment(assignmentData).subscribe({
          next: (response) => {
            if (response.success) {
              resolve(response);
            } else {
              reject(new Error(response.error?.message || 'Error creating assignment'));
            }
          },
          error: (err) => reject(err)
        });
      });

      if (assignmentResponse?.success) {
        const completedData: WizardCompletedData = {
          building,
          unit,
          owner,
          resident,
          assignment: assignmentResponse.data
        };

        this.onComplete.emit(completedData);
        this.resetWizard();
      } else {
        throw new Error('Error creating assignment');
      }

    } catch (error: any) {
      console.error('Error submitting wizard:', error);
      this.submitError.set(error.message || 'Error procesando la asignación');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private async createBuildingFromForm(): Promise<ApiResponse<Building>> {
    const buildingData: CreateBuildingDto = {
      condominiumId: this.condominiumId,
      name: this.step1Form.get('name')?.value,
      type: this.step1Form.get('type')?.value,
      mainEntranceAddress: this.step1Form.get('mainEntranceAddress')?.value,
      totalUnits: this.step1Form.get('totalUnits')?.value,
      num_floors: this.step1Form.get('floors')?.value,
      hasCommonAreas: this.step1Form.get('hasCommonAreas')?.value,
      commonAreasDescription: this.step1Form.get('commonAreasDescription')?.value,
      commonAreaRentalRate: this.step1Form.get('commonAreaRentalRate')?.value,
      status: BuildingStatus.ACTIVE,
      yearBuilt: this.step1Form.get('yearBuilt')?.value,
      parkingSpots: this.step1Form.get('parkingSpots')?.value,
      elevators: this.step1Form.get('elevators')?.value,
      description: this.step1Form.get('description')?.value
    };

    return new Promise((resolve, reject) => {
      this.buildingService.createBuilding(buildingData).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            resolve({
              success: true,
              data: response.data as Building,
              message: response.message,
              timestamp: response.timestamp
            });
          } else {
            reject(new Error(response.error?.message || 'Error creating building'));
          }
        },
        error: (err) => reject(err)
      });
    });
  }

  private async createUnitFromForm(buildingId: string): Promise<ApiResponse<Unit>> {
    const unitData: CreateUnitDto = {
      condominiumId: this.condominiumId,
      buildingId,
      unitNumber: this.step2Form.get('unitNumber')?.value,
      tower: this.step2Form.get('tower')?.value,
      floor: this.step2Form.get('floor')?.value,
      area: this.step2Form.get('area')?.value,
      bedrooms: this.step2Form.get('bedrooms')?.value,
      bathrooms: this.step2Form.get('bathrooms')?.value,
      parkingSpaces: this.step2Form.get('parkingSpaces')?.value,
      storageSpaces: this.step2Form.get('storageSpaces')?.value,
      status: this.step2Form.get('status')?.value,
      monthlyFee: this.step2Form.get('monthlyFee')?.value,
      propertyType: this.step2Form.get('propertyType')?.value,
      orientation: this.step2Form.get('orientation')?.value,
      hasBalcony: this.step2Form.get('hasBalcony')?.value,
      hasGarden: this.step2Form.get('hasGarden')?.value,
      isFurnished: this.step2Form.get('isFurnished')?.value,
      description: this.step2Form.get('description')?.value
    };

    return new Promise((resolve, reject) => {
      this.unitService.createUnit(unitData).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            resolve(response);
          } else {
            reject(new Error(response.error?.message || 'Error creating unit'));
          }
        },
        error: (err) => reject(err)
      });
    });
  }

  private async createOwnerFromForm(): Promise<ApiResponse<Person>> {
    const ownerData: CreatePersonDto = {
      firstName: this.step3Form.get('ownerFirstName')?.value,
      lastName: this.step3Form.get('ownerLastName')?.value,
      email: this.step3Form.get('ownerEmail')?.value,
      phone: this.step3Form.get('ownerPhone')?.value,
      type: PersonType.OWNER
    };

    return new Promise((resolve, reject) => {
      this.assignmentService.createPerson(ownerData).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            resolve(response);
          } else {
            reject(new Error(response.error?.message || 'Error creating owner'));
          }
        },
        error: (err) => reject(err)
      });
    });
  }

  private async createResidentFromForm(): Promise<ApiResponse<Person>> {
    const residentData: CreatePersonDto = {
      firstName: this.step3Form.get('residentFirstName')?.value,
      lastName: this.step3Form.get('residentLastName')?.value,
      email: this.step3Form.get('residentEmail')?.value,
      phone: this.step3Form.get('residentPhone')?.value,
      type: PersonType.RESIDENT
    };

    return new Promise((resolve, reject) => {
      this.assignmentService.createPerson(residentData).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            resolve(response);
          } else {
            reject(new Error(response.error?.message || 'Error creating resident'));
          }
        },
        error: (err) => reject(err)
      });
    });
  }

  // Utility methods
  cancel(): void {
    this.onCancel.emit();
    this.resetWizard();
  }

  private resetWizard(): void {
    this.currentStep.set(1);
    this.selectedBuildingId.set('');
    this.selectedUnitId.set('');
    this.selectedOwnerId.set('');
    this.selectedResidentId.set('');
    this.ownerInhabits.set(true);
    this.isSubmitting.set(false);
    this.submitError.set(null);

    this.step1Form.reset();
    this.step2Form.reset();
    this.step3Form.reset();

    // Reset form defaults
    this.step1Form.patchValue({
      isCreatingBuilding: false,
      type: BuildingType.BUILDING,
      totalUnits: 1,
      num_floors: 1,
      hasCommonAreas: false,
      yearBuilt: new Date().getFullYear(),
      parkingSpots: 0,
      elevators: 0
    });

    this.step2Form.patchValue({
      isCreatingUnit: false,
      floor: 1,
      area: 50,
      bedrooms: 1,
      bathrooms: 1,
      parkingSpaces: 1,
      storageSpaces: 0,
      status: UnitStatus.VACANT,
      monthlyFee: 1000,
      propertyType: PropertyType.APARTMENT,
      hasBalcony: false,
      hasGarden: false,
      isFurnished: false
    });

    this.step3Form.patchValue({
      isCreatingOwner: false,
      isCreatingResident: false,
      ownerInhabits: true,
      startDate: new Date().toISOString().split('T')[0]
    });
  }

  // Template helper methods
  getStepTitle(step: number): string {
    const titles = {
      1: 'Seleccionar Edificio',
      2: 'Seleccionar Unidad',
      3: 'Asignar Propietario y Residente'
    };
    return titles[step as keyof typeof titles] || '';
  }

  getUnitStatusBadgeClass(status: UnitStatus): string {
    const classes: Record<UnitStatus, string> = {
      [UnitStatus.VACANT]: 'badge-success',
      [UnitStatus.OCCUPIED]: 'badge-warning',
      [UnitStatus.UNDER_MAINTENANCE]: 'badge-error',
      [UnitStatus.FOR_SALE]: 'badge-info',
      [UnitStatus.FOR_RENT]: 'badge-secondary',
      [UnitStatus.INACTIVE]: 'badge-error'
    };
    return classes[status] || 'badge-neutral';
  }

  getUnitStatusLabel(status: UnitStatus): string {
    const labels: Record<UnitStatus, string> = {
      [UnitStatus.VACANT]: 'Disponible',
      [UnitStatus.OCCUPIED]: 'Ocupada',
      [UnitStatus.UNDER_MAINTENANCE]: 'Mantenimiento',
      [UnitStatus.FOR_SALE]: 'En Venta',
      [UnitStatus.FOR_RENT]: 'En Renta',
      [UnitStatus.INACTIVE]: 'Inactivo'
    };
    return labels[status] || status;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(amount);
  }
}