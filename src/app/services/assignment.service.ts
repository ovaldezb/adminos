import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { 
  Person, 
  PersonDetails, 
  CreatePersonDto, 
  UpdatePersonDto,
  UnitAssignment,
  UnitAssignmentDetails,
  CreateUnitAssignmentDto,
  UpdateUnitAssignmentDto,
  ApiResponse,
  PaginatedResponse 
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class AssignmentService {
  private readonly apiUrl = `${environment.apiUrl}/assignments`;
  private readonly personApiUrl = `${environment.apiUrl}/persons`;

  constructor(private http: HttpClient) {}

  // Person CRUD operations
  getPersons(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    type?: string;
    isActive?: boolean;
  }): Observable<ApiResponse<PaginatedResponse<PersonDetails>>> {
    let httpParams = new HttpParams();
    
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.pageSize) httpParams = httpParams.set('pageSize', params.pageSize.toString());
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.type) httpParams = httpParams.set('type', params.type);
    if (params?.isActive !== undefined) httpParams = httpParams.set('isActive', params.isActive.toString());

    return this.http.get<ApiResponse<PaginatedResponse<PersonDetails>>>(this.personApiUrl, { params: httpParams });
  }

  getPersonById(id: string): Observable<ApiResponse<PersonDetails>> {
    return this.http.get<ApiResponse<PersonDetails>>(`${this.personApiUrl}/${id}`);
  }

  createPerson(personData: CreatePersonDto): Observable<ApiResponse<Person>> {
    return this.http.post<ApiResponse<Person>>(this.personApiUrl, personData);
  }

  updatePerson(id: string, personData: UpdatePersonDto): Observable<ApiResponse<Person>> {
    return this.http.put<ApiResponse<Person>>(`${this.personApiUrl}/${id}`, personData);
  }

  deactivatePerson(id: string): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${this.personApiUrl}/${id}/deactivate`, {});
  }

  deletePerson(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.personApiUrl}/${id}`);
  }

  // Email validation
  validatePersonEmail(email: string, excludeId?: string): Observable<ApiResponse<{ isUnique: boolean }>> {
    let params = new HttpParams().set('email', email);
    if (excludeId) {
      params = params.set('excludeId', excludeId);
    }
    return this.http.get<ApiResponse<{ isUnique: boolean }>>(`${this.personApiUrl}/validate-email`, { params });
  }

  // Unit Assignment CRUD operations
  getAssignments(params?: {
    page?: number;
    pageSize?: number;
    unitId?: string;
    ownerId?: string;
    residentId?: string;
    isActive?: boolean;
    condominiumId?: string;
    buildingId?: string;
  }): Observable<ApiResponse<PaginatedResponse<UnitAssignmentDetails>>> {
    let httpParams = new HttpParams();
    
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.pageSize) httpParams = httpParams.set('pageSize', params.pageSize.toString());
    if (params?.unitId) httpParams = httpParams.set('unitId', params.unitId);
    if (params?.ownerId) httpParams = httpParams.set('ownerId', params.ownerId);
    if (params?.residentId) httpParams = httpParams.set('residentId', params.residentId);
    if (params?.isActive !== undefined) httpParams = httpParams.set('isActive', params.isActive.toString());
    if (params?.condominiumId) httpParams = httpParams.set('condominiumId', params.condominiumId);
    if (params?.buildingId) httpParams = httpParams.set('buildingId', params.buildingId);

    return this.http.get<ApiResponse<PaginatedResponse<UnitAssignmentDetails>>>(this.apiUrl, { params: httpParams });
  }

  getAssignmentById(id: string): Observable<ApiResponse<UnitAssignmentDetails>> {
    return this.http.get<ApiResponse<UnitAssignmentDetails>>(`${this.apiUrl}/${id}`);
  }

  createAssignment(assignmentData: CreateUnitAssignmentDto): Observable<ApiResponse<UnitAssignment>> {
    return this.http.post<ApiResponse<UnitAssignment>>(this.apiUrl, assignmentData);
  }

  updateAssignment(id: string, assignmentData: UpdateUnitAssignmentDto): Observable<ApiResponse<UnitAssignment>> {
    return this.http.put<ApiResponse<UnitAssignment>>(`${this.apiUrl}/${id}`, assignmentData);
  }

  endAssignment(id: string, endDate?: Date): Observable<ApiResponse<UnitAssignment>> {
    const data = { endDate: endDate || new Date() };
    return this.http.patch<ApiResponse<UnitAssignment>>(`${this.apiUrl}/${id}/end`, data);
  }

  deleteAssignment(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  // Get current assignment for a unit
  getCurrentAssignmentByUnit(unitId: string): Observable<ApiResponse<UnitAssignmentDetails | null>> {
    return this.http.get<ApiResponse<UnitAssignmentDetails | null>>(`${this.apiUrl}/unit/${unitId}/current`);
  }

  // Get all assignments for a unit (historical)
  getAssignmentHistoryByUnit(unitId: string): Observable<ApiResponse<UnitAssignmentDetails[]>> {
    return this.http.get<ApiResponse<UnitAssignmentDetails[]>>(`${this.apiUrl}/unit/${unitId}/history`);
  }

  // Validate assignment business rules
  validateAssignment(assignmentData: CreateUnitAssignmentDto): Observable<ApiResponse<{ isValid: boolean; errors?: string[] }>> {
    return this.http.post<ApiResponse<{ isValid: boolean; errors?: string[] }>>(`${this.apiUrl}/validate`, assignmentData);
  }
}