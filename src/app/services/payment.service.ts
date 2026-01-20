import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, delay, catchError, map, throwError } from 'rxjs';
import { PaymentConfig, FundConfig, FundMovement } from '../models';
import { environment } from '../../environments/environment';
import { ApiResponse, PaginationParams, PaymentStatus, PaginatedResponse, PaymentWithDetails, Payment, AppPaymentRequest } from '../models';

@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/payment`;
  private readonly configUrl = `${environment.apiUrl}/payment-config`;
  private readonly fundsUrl = `${environment.apiUrl}/funds`;
  private readonly fundMovementsUrl = `${environment.apiUrl}/fund-movements`;


  saveFunds(config: FundConfig): Observable<ApiResponse<FundConfig>> {
    return this.http.post<ApiResponse<FundConfig>>(this.fundsUrl, config).pipe(
      catchError((error) => {
        console.error('Error saving funds config:', error);
        return throwError(() => error);
      })
    );
  }

  getFunds(buildingId: string, year: number): Observable<ApiResponse<FundConfig>> {
    const params = new HttpParams()
      .set('buildingId', buildingId)
      .set('year', year.toString());

    return this.http.get<ApiResponse<FundConfig>>(this.fundsUrl, { params }).pipe(
      catchError((error) => {
        console.error('Error fetching funds config:', error);
        return throwError(() => error);
      })
    );
  }

  savePaymentConfig(config: PaymentConfig): Observable<ApiResponse<PaymentConfig>> {
    return this.http.post<ApiResponse<PaymentConfig>>(this.configUrl, config).pipe(
      catchError((error) => {
        console.error('Error saving payment config:', error);
        return throwError(() => error);
      })
    );
  }

  getPaymentConfig(buildingId: string, year: number): Observable<ApiResponse<PaymentConfig>> {
    const params = new HttpParams()
      .set('buildingId', buildingId)
      .set('year', year.toString());

    return this.http.get<ApiResponse<PaymentConfig>>(this.configUrl, { params }).pipe(
      catchError((error) => {
        console.error('Error fetching payment config:', error);
        return throwError(() => error);
      })
    );
  }

  updatePaymentConfig(id: string, config: PaymentConfig): Observable<ApiResponse<PaymentConfig>> {
    return this.http.put<ApiResponse<PaymentConfig>>(`${this.configUrl}/${id}`, config).pipe(
      catchError((error) => {
        console.error('Error updating payment config:', error);
        return throwError(() => error);
      })
    );
  }



  /**
   * GET /payments - Fetch all payments via backend with pagination
   * Lambda: getPayments
   */
  getPayments(
    params?: PaginationParams & { condominiumId?: string; status?: PaymentStatus }
  ): Observable<ApiResponse<PaginatedResponse<PaymentWithDetails>>> {
    let httpParams = new HttpParams()
      .set('page', String(params?.page || 1))
      .set('pageSize', String(params?.pageSize || 10));

    if (params?.condominiumId && params.condominiumId !== 'all') {
      httpParams = httpParams.set('condominiumId', params.condominiumId);
    }
    if (params?.status) {
      httpParams = httpParams.set('status', params.status);
    }

    return this.http
      .get<ApiResponse<PaginatedResponse<PaymentWithDetails>>>(this.apiUrl, { params: httpParams })
      .pipe(
        catchError((error) => {
          console.error('Error fetching payments from backend:', error);
          return of({
            success: false,
            error: {
              code: 'BACKEND_ERROR',
              message: 'Error al obtener los pagos del servidor',
            },
            timestamp: new Date(),
          });
        })
      );
  }

  /**
   * GET /payments/:id - Fetch single payment via backend
   * Lambda: getPaymentById
   */
  getPaymentById(id: string): Observable<ApiResponse<PaymentWithDetails>> {
    return this.http
      .get<ApiResponse<PaymentWithDetails>>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError((error) => {
          console.error(`Error fetching payment ${id} from backend:`, error);
          return of({
            success: false,
            error: {
              code: 'BACKEND_ERROR',
              message: 'Error al obtener el pago del servidor',
            },
            timestamp: new Date(),
          });
        })
      );
  }

  /**
   * POST /payments - Register payment via backend
   * Lambda: registerPayment
   */
  registerPayment(
    payment: Partial<Payment>
  ): Observable<ApiResponse<Payment>> {
    return this.http
      .post<ApiResponse<Payment>>(this.apiUrl, payment)
      .pipe(
        catchError((error) => {
          console.error('Error registering payment in backend:', error);
          return of({
            success: false,
            error: {
              code: 'BACKEND_ERROR',
              message: 'Error al registrar el pago en el servidor',
            },
            timestamp: new Date(),
          });
        })
      );
  }

  /**
   * GET /payment - Get payment by resident and year
   */
  getPaymentByResidentAndYear(residentId: string, year: number): Observable<ApiResponse<any>> {
    const params = new HttpParams()
      .set('residentId', residentId)
      .set('year', year.toString());

    return this.http.get<ApiResponse<any>>(this.apiUrl, { params }).pipe(
      catchError((error) => {
        console.error('Error fetching payment by resident/year:', error);
        return of({ success: false, data: null, timestamp: new Date() });
      })
    );
  }

  /**
   * PUT /payment/:id - Update existing payment record (e.g., append to array)
   */
  updatePayment(id: string, payment: AppPaymentRequest): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/${id}`, payment).pipe(
      catchError((error) => {
        console.error('Error updating payment:', error);
        return of({ success: false, error, timestamp: new Date() });
      })
    );
  }

  /**
   * POST /payments - Create payment with new AppPaymentRequest structure
   */
  createPayment(
    payment: AppPaymentRequest
  ): Observable<ApiResponse<any>> {
    return this.http
      .post<ApiResponse<any>>(this.apiUrl, payment)
      .pipe(
        catchError((error) => {
          console.error('Error creating payment in backend:', error);
          return of({
            success: false,
            error: {
              code: 'BACKEND_ERROR',
              message: 'Error al crear el pago en el servidor',
            },
            timestamp: new Date(),
          });
        })
      );
  }

  /**
   * PUT /payments/:id/confirm - Confirm payment via backend
   * Lambda: confirmPayment
   */
  confirmPayment(id: string): Observable<ApiResponse<Payment>> {
    return this.http
      .put<ApiResponse<Payment>>(`${this.apiUrl}/${id}/confirm`, {})
      .pipe(
        catchError((error) => {
          console.error(`Error confirming payment ${id} in backend:`, error);
          return of({
            success: false,
            error: {
              code: 'BACKEND_ERROR',
              message: 'Error al confirmar el pago en el servidor',
            },
            timestamp: new Date(),
          });
        })
      );
  }

  /**
   * GET /payments/recent - Fetch recent payments via backend
   * Lambda: getRecentPayments
   */
  getRecentPayments(
    condominiumId?: string,
    limit = 10
  ): Observable<ApiResponse<PaymentWithDetails[]>> {
    let params = new HttpParams().set('limit', String(limit));
    if (condominiumId && condominiumId !== 'all') {
      params = params.set('condominiumId', condominiumId);
    }

    return this.http
      .get<ApiResponse<PaymentWithDetails[]>>(`${this.apiUrl}/recent`, { params })
      .pipe(
        catchError((error) => {
          console.error('Error fetching recent payments from backend:', error);
          return of({
            success: false,
            error: {
              code: 'BACKEND_ERROR',
              message: 'Error al obtener los pagos recientes del servidor',
            },
            timestamp: new Date(),
          });
        })
      );
  }

  /**
   * GET /payments/stats - Fetch payment statistics via backend
   * Lambda: getPaymentStats
   */
  getPaymentStats(
    condominiumId?: string
  ): Observable<ApiResponse<{ total: number; totalAmount: number; byMethod: Record<string, number> }>> {
    let params = new HttpParams();
    if (condominiumId && condominiumId !== 'all') {
      params = params.set('condominiumId', condominiumId);
    }

    return this.http
      .get<ApiResponse<{ total: number; totalAmount: number; byMethod: Record<string, number> }>>(
        `${this.apiUrl}/stats`,
        { params }
      )
      .pipe(
        catchError((error) => {
          console.error('Error fetching payment stats from backend:', error);
          return of({
            success: false,
            error: {
              code: 'BACKEND_ERROR',
              message: 'Error al obtener las estadísticas de pagos del servidor',
            },
            timestamp: new Date(),
          });
        })
      );
  }

  updateFundMovement(movement: FundMovement): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(this.fundMovementsUrl, movement).pipe(
      catchError((error) => {
        console.error('Error updating fund movement:', error);
        return of({ success: false, error, timestamp: new Date() });
      })
    );
  }
}
