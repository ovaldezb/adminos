import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { Payment, PaymentWithDetails, PaymentMethod, PaymentStatus } from '../models/payment.model';
import { ApiResponse, PaginatedResponse, PaginationParams } from '../models/api.model';

@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  // Simulated AWS Lambda endpoint
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
      residentName: 'Carlos Rodríguez',
      unitNumber: '201',
      tower: 'Único',
      invoiceNumber: '2025-09-045',
      invoicePeriod: '2025-09',
      amount: 1800,
      paymentDate: new Date('2025-09-03'),
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      status: PaymentStatus.CONFIRMED,
      reference: 'TRF-20250903-001',
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
      residentName: 'Juan Pérez',
      unitNumber: '101',
      tower: 'Torre A',
      invoiceNumber: '2025-10-001',
      invoicePeriod: '2025-10',
      amount: 1500,
      paymentDate: new Date('2025-10-15'),
      paymentMethod: PaymentMethod.CREDIT_CARD,
      status: PaymentStatus.CONFIRMED,
      reference: 'CC-20251015-445',
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
      residentName: 'María García',
      unitNumber: '102',
      tower: 'Torre A',
      invoiceNumber: '2025-10-002',
      invoicePeriod: '2025-10',
      amount: 750,
      paymentDate: new Date('2025-10-20'),
      paymentMethod: PaymentMethod.CASH,
      status: PaymentStatus.CONFIRMED,
      notes: 'Pago parcial',
      processedBy: 'admin-001',
      createdAt: new Date('2025-10-20'),
      updatedAt: new Date('2025-10-20'),
    },
  ];

  /**
   * Simulates AWS Lambda GET request to fetch all payments
   * Lambda: getPayments
   */
  getPayments(
    params?: PaginationParams & { condominiumId?: string; status?: PaymentStatus }
  ): Observable<ApiResponse<PaginatedResponse<PaymentWithDetails>>> {
    let filtered = [...this.mockPayments];

    // Filter by condominiumId
    if (params?.condominiumId && params.condominiumId !== 'all') {
      filtered = filtered.filter((p) => p.condominiumId === params.condominiumId);
    }

    // Filter by status
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
      message: 'Pagos obtenidos exitosamente',
      timestamp: new Date(),
    }).pipe(delay(Math.random() * 500 + 300));
  }

  /**
   * Simulates AWS Lambda GET request to fetch single payment
   * Lambda: getPaymentById
   */
  getPaymentById(id: string): Observable<ApiResponse<PaymentWithDetails>> {
    const payment = this.mockPayments.find((p) => p.id === id);

    if (!payment) {
      return of({
        success: false,
        error: {
          code: 'PAYMENT_NOT_FOUND',
          message: 'Pago no encontrado',
        },
        timestamp: new Date(),
      }).pipe(delay(200));
    }

    return of({
      success: true,
      data: payment,
      message: 'Pago obtenido exitosamente',
      timestamp: new Date(),
    }).pipe(delay(Math.random() * 400 + 200));
  }

  /**
   * Simulates AWS Lambda POST request to register payment
   * Lambda: registerPayment
   */
  registerPayment(
    payment: Partial<Payment>
  ): Observable<ApiResponse<Payment>> {
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
      message: 'Pago registrado exitosamente',
      timestamp: new Date(),
    }).pipe(delay(Math.random() * 700 + 500));
  }

  /**
   * Simulates AWS Lambda PUT request to confirm payment
   * Lambda: confirmPayment
   */
  confirmPayment(id: string): Observable<ApiResponse<Payment>> {
    const payment = this.mockPayments.find((p) => p.id === id);

    if (!payment) {
      return of({
        success: false,
        error: {
          code: 'PAYMENT_NOT_FOUND',
          message: 'Pago no encontrado',
        },
        timestamp: new Date(),
      }).pipe(delay(200));
    }

    payment.status = PaymentStatus.CONFIRMED;
    payment.updatedAt = new Date();

    return of({
      success: true,
      data: payment,
      message: 'Pago confirmado exitosamente',
      timestamp: new Date(),
    }).pipe(delay(Math.random() * 500 + 300));
  }

  /**
   * Simulates AWS Lambda GET request to fetch recent payments
   * Lambda: getRecentPayments
   */
  getRecentPayments(
    condominiumId?: string,
    limit = 10
  ): Observable<ApiResponse<PaymentWithDetails[]>> {
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
      message: 'Pagos recientes obtenidos exitosamente',
      timestamp: new Date(),
    }).pipe(delay(Math.random() * 400 + 250));
  }

  /**
   * Simulates AWS Lambda GET request to fetch payment statistics
   * Lambda: getPaymentStats
   */
  getPaymentStats(
    condominiumId?: string
  ): Observable<ApiResponse<{ total: number; totalAmount: number; byMethod: Record<string, number> }>> {
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
      message: 'Estadísticas de pagos obtenidas exitosamente',
      timestamp: new Date(),
    }).pipe(delay(Math.random() * 400 + 300));
  }
}
