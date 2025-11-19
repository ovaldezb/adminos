import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, delay, catchError, map } from 'rxjs';
import { Payment, PaymentWithDetails, PaymentMethod, PaymentStatus } from '../models/payment.model';
import { ApiResponse, PaginatedResponse, PaginationParams } from '../models/api.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/payments`;
  
  // Simulated AWS Lambda endpoint (DEPRECATED - usando apiUrl ahora)
  private readonly lambdaEndpoint = 'https://api.example.com/payments';

  // Mock data
  private mockPayments: PaymentWithDetails[] = [
    {
      id: 'PAY-001',
      paymentNumber: 'P-2025-10-001',
      invoiceId: 'INV-003',
      condominiumId: '2',
      unitId: 'U-201',
      residentId: 'R-003',
      residentName: 'Carlos Alberto Rodríguez López',
      unitNumber: '201',
      tower: 'Único',
      invoiceNumber: '2025-09-045',
      invoicePeriod: '2025-09',
      amount: 36000,
      paymentDate: new Date('2025-09-03'),
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      status: PaymentStatus.CONFIRMED,
      reference: 'SPEI-20250903-001',
      notes: 'Pago puntual',
      processedBy: 'admin-001',
      createdAt: new Date('2025-09-03'),
      updatedAt: new Date('2025-09-03'),
    },
    {
      id: 'PAY-002',
      paymentNumber: 'P-2025-10-002',
      invoiceId: 'INV-001',
      condominiumId: '1',
      unitId: 'U-101',
      residentId: 'R-001',
      residentName: 'Juan Carlos Pérez González',
      unitNumber: '101',
      tower: 'Torre A',
      invoiceNumber: '2025-10-001',
      invoicePeriod: '2025-10',
      amount: 30000,
      paymentDate: new Date('2025-10-15'),
      paymentMethod: PaymentMethod.CREDIT_CARD,
      status: PaymentStatus.CONFIRMED,
      reference: 'TC-20251015-445',
      processedBy: 'admin-001',
      createdAt: new Date('2025-10-15'),
      updatedAt: new Date('2025-10-15'),
    },
    {
      id: 'PAY-003',
      paymentNumber: 'P-2025-10-003',
      invoiceId: 'INV-002',
      condominiumId: '1',
      unitId: 'U-102',
      residentId: 'R-002',
      residentName: 'María Guadalupe García Martínez',
      unitNumber: '102',
      tower: 'Torre A',
      invoiceNumber: '2025-10-002',
      invoicePeriod: '2025-10',
      amount: 15000,
      paymentDate: new Date('2025-10-20'),
      paymentMethod: PaymentMethod.CASH,
      status: PaymentStatus.CONFIRMED,
      notes: 'Pago parcial',
      processedBy: 'admin-001',
      createdAt: new Date('2025-10-20'),
      updatedAt: new Date('2025-10-20'),
    },
    {
      id: 'PAY-004',
      paymentNumber: 'P-2025-10-004',
      invoiceId: 'INV-004',
      condominiumId: '1',
      unitId: 'U-502',
      residentId: 'R-006',
      residentName: 'Roberto Silva Méndez',
      unitNumber: '502',
      tower: 'Torre A',
      invoiceNumber: '2025-10-003',
      invoicePeriod: '2025-10',
      amount: 44000,
      paymentDate: new Date('2025-10-18'),
      paymentMethod: PaymentMethod.MOBILE_PAYMENT,
      status: PaymentStatus.CONFIRMED,
      reference: 'OXXO-20251018-789',
      notes: 'Pago en OXXO',
      processedBy: 'admin-001',
      createdAt: new Date('2025-10-18'),
      updatedAt: new Date('2025-10-18'),
    },
    {
      id: 'PAY-005',
      paymentNumber: 'P-2025-10-005',
      invoiceId: 'INV-005',
      condominiumId: '3',
      unitId: 'U-305',
      residentId: 'R-005',
      residentName: 'Luis Fernando Torres Ramírez',
      unitNumber: '305',
      tower: 'Torre B',
      invoiceNumber: '2025-10-004',
      invoicePeriod: '2025-10',
      amount: 33000,
      paymentDate: new Date('2025-10-01'),
      paymentMethod: PaymentMethod.DEBIT_CARD,
      status: PaymentStatus.CONFIRMED,
      reference: 'TD-20251001-123',
      processedBy: 'admin-001',
      createdAt: new Date('2025-10-01'),
      updatedAt: new Date('2025-10-01'),
    },
  ];

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
          console.error('Error fetching payments from backend, using mock:', error);
          // Fallback a mock
          let filtered = [...this.mockPayments];

          if (params?.condominiumId && params.condominiumId !== 'all') {
            filtered = filtered.filter((p) => p.condominiumId === params.condominiumId);
          }
          if (params?.status) {
            filtered = filtered.filter((p) => p.status === params.status);
          }

          const page = params?.page || 1;
          const pageSize = params?.pageSize || 10;
          const start = (page - 1) * pageSize;
          const end = start + pageSize;
          const items = filtered.slice(start, end);

          const response: PaginatedResponse<PaymentWithDetails> = {
            items,
            total: filtered.length,
            page,
            pageSize,
            totalPages: Math.ceil(filtered.length / pageSize),
            hasNext: end < filtered.length,
            hasPrevious: page > 1,
          };

          return of({
            success: true,
            data: response,
            message: 'Pagos obtenidos exitosamente (mock fallback)',
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
          console.error(`Error fetching payment ${id} from backend, using mock:`, error);
          // Fallback a mock
          const payment = this.mockPayments.find((p) => p.id === id);

          if (!payment) {
            return of({
              success: false,
              error: {
                code: 'PAYMENT_NOT_FOUND',
                message: 'Pago no encontrado',
              },
              timestamp: new Date(),
            });
          }

          return of({
            success: true,
            data: payment,
            message: 'Pago obtenido exitosamente (mock fallback)',
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
          console.error('Error registering payment in backend, using mock:', error);
          // Fallback a mock
          const newPayment: Payment = {
            id: `PAY-${String(Date.now()).slice(-6)}`,
            paymentNumber: `P-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(this.mockPayments.length + 1).padStart(3, '0')}`,
            invoiceId: payment.invoiceId!,
            condominiumId: payment.condominiumId!,
            unitId: payment.unitId!,
            residentId: payment.residentId!,
            amount: payment.amount || 0,
            paymentDate: payment.paymentDate || new Date(),
            paymentMethod: payment.paymentMethod || PaymentMethod.CASH,
            status: PaymentStatus.PENDING,
            reference: payment.reference,
            notes: payment.notes,
            processedBy: payment.processedBy || 'system',
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          return of({
            success: true,
            data: newPayment,
            message: 'Pago registrado exitosamente (mock fallback)',
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
          console.error(`Error confirming payment ${id} in backend, using mock:`, error);
          // Fallback a mock
          const payment = this.mockPayments.find((p) => p.id === id);

          if (!payment) {
            return of({
              success: false,
              error: {
                code: 'PAYMENT_NOT_FOUND',
                message: 'Pago no encontrado',
              },
              timestamp: new Date(),
            });
          }

          payment.status = PaymentStatus.CONFIRMED;
          payment.updatedAt = new Date();

          return of({
            success: true,
            data: payment,
            message: 'Pago confirmado exitosamente (mock fallback)',
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
          console.error('Error fetching recent payments from backend, using mock:', error);
          // Fallback a mock
          let payments = [...this.mockPayments].sort(
            (a, b) => b.paymentDate.getTime() - a.paymentDate.getTime()
          );

          if (condominiumId && condominiumId !== 'all') {
            payments = payments.filter((p) => p.condominiumId === condominiumId);
          }

          payments = payments.slice(0, limit);

          return of({
            success: true,
            data: payments,
            message: 'Pagos recientes obtenidos exitosamente (mock fallback)',
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
          console.error('Error fetching payment stats from backend, using mock:', error);
          // Fallback a mock
          let payments = [...this.mockPayments];

          if (condominiumId && condominiumId !== 'all') {
            payments = payments.filter((p) => p.condominiumId === condominiumId);
          }

          const byMethod: Record<string, number> = {};
          payments.forEach((p) => {
            byMethod[p.paymentMethod] = (byMethod[p.paymentMethod] || 0) + p.amount;
          });

          const stats = {
            total: payments.length,
            totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
            byMethod,
          };

          return of({
            success: true,
            data: stats,
            message: 'Estadísticas de pagos obtenidas exitosamente (mock fallback)',
            timestamp: new Date(),
          });
        })
      );
  }
}
