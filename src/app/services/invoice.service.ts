import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, delay, catchError, map } from 'rxjs';
import { Invoice, InvoiceWithDetails, InvoiceStatus } from '../models/invoice.model';
import { ApiResponse, PaginatedResponse, PaginationParams } from '../models/api.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class InvoiceService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/invoices`;

  

  /**
   * GET /invoices - Fetch all invoices via backend with pagination
   * Lambda: getInvoices
   */
  getInvoices(
    params?: PaginationParams & { condominiumId?: string; status?: InvoiceStatus }
  ): Observable<ApiResponse<PaginatedResponse<InvoiceWithDetails>>> {
    let httpParams = new HttpParams()
      .set('page', String(params?.page || 1))
      .set('pageSize', String(params?.pageSize || 10));

    if (params?.condominiumId && params.condominiumId !== 'all') {
      httpParams = httpParams.set('condominiumId', params.condominiumId);
    }
    if (params?.status) {
      httpParams = httpParams.set('status', params.status);
    }

    return this.http.get<ApiResponse<PaginatedResponse<InvoiceWithDetails>>>(this.apiUrl, { params: httpParams }).pipe(
      catchError((error) => {
        console.error('Error fetching invoices from backend:', error);
        return of({
          success: false,
          error: {
            code: 'BACKEND_ERROR',
            message: 'Error al obtener las facturas del servidor',
          },
          timestamp: new Date(),
        });
      })
    );
  }

  /**
   * GET /invoices/:id - Fetch single invoice via backend
   * Lambda: getInvoiceById
   */
  getInvoiceById(id: string): Observable<ApiResponse<InvoiceWithDetails>> {
    return this.http.get<ApiResponse<InvoiceWithDetails>>(`${this.apiUrl}/${id}`).pipe(
      catchError((error) => {
        console.error(`Error fetching invoice ${id} from backend:`, error);
        return of({
          success: false,
          error: {
            code: 'BACKEND_ERROR',
            message: 'Error al obtener la factura del servidor',
          },
          timestamp: new Date(),
        });
      })
    );
  }

  /**
   * POST /invoices - Create invoice via backend
   * Lambda: createInvoice
   */
  createInvoice(
    invoice: Partial<Invoice>
  ): Observable<ApiResponse<Invoice>> {
    return this.http.post<ApiResponse<Invoice>>(this.apiUrl, invoice).pipe(
      catchError((error) => {
        console.error('Error creating invoice in backend:', error);
        return of({
          success: false,
          error: {
            code: 'BACKEND_ERROR',
            message: 'Error al crear la factura en el servidor',
          },
          timestamp: new Date(),
        });
      })
    );
  }

  /**
   * PUT /invoices/:id/status - Update invoice status via backend
   * Lambda: updateInvoiceStatus
   */
  updateInvoiceStatus(
    id: string,
    status: InvoiceStatus
  ): Observable<ApiResponse<Invoice>> {
    return this.http.put<ApiResponse<Invoice>>(`${this.apiUrl}/${id}/status`, { status }).pipe(
      catchError((error) => {
        console.error(`Error updating invoice ${id} status in backend:`, error);
        return of({
          success: false,
          error: {
            code: 'BACKEND_ERROR',
            message: 'Error al actualizar el estado de la factura en el servidor',
          },
          timestamp: new Date(),
        });
      })
    );
  }

  /**
   * GET /invoices/overdue - Fetch overdue invoices via backend
   * Lambda: getOverdueInvoices
   */
  getOverdueInvoices(
    condominiumId?: string
  ): Observable<ApiResponse<InvoiceWithDetails[]>> {
    let params = new HttpParams();
    if (condominiumId && condominiumId !== 'all') {
      params = params.set('condominiumId', condominiumId);
    }

    return this.http.get<ApiResponse<InvoiceWithDetails[]>>(`${this.apiUrl}/overdue`, { params }).pipe(
      catchError((error) => {
        console.error('Error fetching overdue invoices from backend:', error);
        return of({
          success: false,
          error: {
            code: 'BACKEND_ERROR',
            message: 'Error al obtener las facturas vencidas del servidor',
          },
          timestamp: new Date(),
        });
      })
    );
  }

  /**
   * POST /invoices/:id/reminder - Send invoice reminder via backend
   * Lambda: sendInvoiceReminder
   */
  sendInvoiceReminder(invoiceId: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/${invoiceId}/reminder`, {}).pipe(
      catchError((error) => {
        console.error(`Error sending invoice reminder for ${invoiceId}:`, error);
        return of({
          success: false,
          error: {
            code: 'BACKEND_ERROR',
            message: 'Error al enviar el recordatorio de factura',
          },
          timestamp: new Date(),
        });
      })
    );
  }
}
