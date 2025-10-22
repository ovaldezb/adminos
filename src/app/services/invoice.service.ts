import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { Invoice, InvoiceWithDetails, InvoiceStatus } from '../models/invoice.model';
import { ApiResponse, PaginatedResponse, PaginationParams } from '../models/api.model';

@Injectable({
  providedIn: 'root',
})
export class InvoiceService {
  // Simulated AWS Lambda endpoint
  private readonly lambdaEndpoint = 'https://api.example.com/invoices';

  // Mock data
  private mockInvoices: InvoiceWithDetails[] = [
    {
      id: 'INV-001',
      invoiceNumber: '2025-10-001',
      condominiumId: '1',
      unitId: 'U-101',
      residentId: 'R-001',
      residentName: 'Juan Pérez',
      unitNumber: '101',
      tower: 'Torre A',
      amount: 1500,
      dueDate: new Date('2025-11-05'),
      issueDate: new Date('2025-10-01'),
      status: InvoiceStatus.PENDING,
      period: '2025-10',
      description: 'Mantenimiento Mensual - Octubre 2025',
      items: [
        { id: '1', description: 'Mantenimiento Base', amount: 1200, type: 'maintenance' as any },
        { id: '2', description: 'Agua', amount: 150, type: 'water' as any },
        { id: '3', description: 'Gas', amount: 150, type: 'gas' as any },
      ],
      totalAmount: 1500,
      daysPastDue: 0,
      createdAt: new Date('2025-10-01'),
      updatedAt: new Date('2025-10-01'),
    },
    {
      id: 'INV-002',
      invoiceNumber: '2025-10-002',
      condominiumId: '1',
      unitId: 'U-102',
      residentId: 'R-002',
      residentName: 'María García',
      unitNumber: '102',
      tower: 'Torre A',
      amount: 1500,
      dueDate: new Date('2025-10-20'),
      issueDate: new Date('2025-10-01'),
      status: InvoiceStatus.OVERDUE,
      period: '2025-10',
      description: 'Mantenimiento Mensual - Octubre 2025',
      items: [
        { id: '1', description: 'Mantenimiento Base', amount: 1200, type: 'maintenance' as any },
        { id: '2', description: 'Agua', amount: 150, type: 'water' as any },
        { id: '3', description: 'Gas', amount: 150, type: 'gas' as any },
      ],
      lateFee: 75,
      totalAmount: 1575,
      daysPastDue: 2,
      createdAt: new Date('2025-10-01'),
      updatedAt: new Date('2025-10-20'),
    },
    {
      id: 'INV-003',
      invoiceNumber: '2025-09-045',
      condominiumId: '2',
      unitId: 'U-201',
      residentId: 'R-003',
      residentName: 'Carlos Rodríguez',
      unitNumber: '201',
      tower: 'Único',
      amount: 1800,
      dueDate: new Date('2025-09-05'),
      issueDate: new Date('2025-09-01'),
      status: InvoiceStatus.PAID,
      period: '2025-09',
      description: 'Mantenimiento Mensual - Septiembre 2025',
      items: [
        { id: '1', description: 'Mantenimiento Base', amount: 1400, type: 'maintenance' as any },
        { id: '2', description: 'Agua', amount: 200, type: 'water' as any },
        { id: '3', description: 'Gas', amount: 200, type: 'gas' as any },
      ],
      totalAmount: 1800,
      daysPastDue: 0,
      createdAt: new Date('2025-09-01'),
      updatedAt: new Date('2025-09-03'),
    },
  ];

  /**
   * Simulates AWS Lambda GET request to fetch all invoices
   * Lambda: getInvoices
   */
  getInvoices(
    params?: PaginationParams & { condominiumId?: string; status?: InvoiceStatus }
  ): Observable<ApiResponse<PaginatedResponse<InvoiceWithDetails>>> {
    let filtered = [...this.mockInvoices];

    // Filter by condominiumId
    if (params?.condominiumId && params.condominiumId !== 'all') {
      filtered = filtered.filter((i) => i.condominiumId === params.condominiumId);
    }

    // Filter by status
    if (params?.status) {
      filtered = filtered.filter((i) => i.status === params.status);
    }

    const page = params?.page || 1;
    const pageSize = params?.pageSize || 10;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const items = filtered.slice(start, end);

    const response: PaginatedResponse<InvoiceWithDetails> = {
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
      message: 'Facturas obtenidas exitosamente',
      timestamp: new Date(),
    }).pipe(delay(Math.random() * 500 + 300));
  }

  /**
   * Simulates AWS Lambda GET request to fetch single invoice
   * Lambda: getInvoiceById
   */
  getInvoiceById(id: string): Observable<ApiResponse<InvoiceWithDetails>> {
    const invoice = this.mockInvoices.find((i) => i.id === id);

    if (!invoice) {
      return of({
        success: false,
        error: {
          code: 'INVOICE_NOT_FOUND',
          message: 'Factura no encontrada',
        },
        timestamp: new Date(),
      }).pipe(delay(200));
    }

    return of({
      success: true,
      data: invoice,
      message: 'Factura obtenida exitosamente',
      timestamp: new Date(),
    }).pipe(delay(Math.random() * 400 + 200));
  }

  /**
   * Simulates AWS Lambda POST request to create invoice
   * Lambda: createInvoice
   */
  createInvoice(
    invoice: Partial<Invoice>
  ): Observable<ApiResponse<Invoice>> {
    const newInvoice: Invoice = {
      id: `INV-${String(Date.now()).slice(-6)}`,
      invoiceNumber: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(this.mockInvoices.length + 1).padStart(3, '0')}`,
      condominiumId: invoice.condominiumId!,
      unitId: invoice.unitId!,
      residentId: invoice.residentId!,
      amount: invoice.amount || 0,
      dueDate: invoice.dueDate || new Date(),
      issueDate: new Date(),
      status: InvoiceStatus.PENDING,
      period: invoice.period || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
      description: invoice.description || '',
      items: invoice.items || [],
      totalAmount: invoice.totalAmount || invoice.amount || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return of({
      success: true,
      data: newInvoice,
      message: 'Factura creada exitosamente',
      timestamp: new Date(),
    }).pipe(delay(Math.random() * 700 + 500));
  }

  /**
   * Simulates AWS Lambda PUT request to update invoice status
   * Lambda: updateInvoiceStatus
   */
  updateInvoiceStatus(
    id: string,
    status: InvoiceStatus
  ): Observable<ApiResponse<Invoice>> {
    const invoice = this.mockInvoices.find((i) => i.id === id);

    if (!invoice) {
      return of({
        success: false,
        error: {
          code: 'INVOICE_NOT_FOUND',
          message: 'Factura no encontrada',
        },
        timestamp: new Date(),
      }).pipe(delay(200));
    }

    invoice.status = status;
    invoice.updatedAt = new Date();

    return of({
      success: true,
      data: invoice,
      message: 'Estado de factura actualizado exitosamente',
      timestamp: new Date(),
    }).pipe(delay(Math.random() * 500 + 300));
  }

  /**
   * Simulates AWS Lambda GET request to fetch overdue invoices
   * Lambda: getOverdueInvoices
   */
  getOverdueInvoices(
    condominiumId?: string
  ): Observable<ApiResponse<InvoiceWithDetails[]>> {
    let overdue = this.mockInvoices.filter(
      (i) => i.status === InvoiceStatus.OVERDUE
    );

    if (condominiumId && condominiumId !== 'all') {
      overdue = overdue.filter((i) => i.condominiumId === condominiumId);
    }

    return of({
      success: true,
      data: overdue,
      message: 'Facturas vencidas obtenidas exitosamente',
      timestamp: new Date(),
    }).pipe(delay(Math.random() * 400 + 250));
  }

  /**
   * Simulates AWS Lambda POST request to send invoice reminder
   * Lambda: sendInvoiceReminder
   */
  sendInvoiceReminder(invoiceId: string): Observable<ApiResponse<void>> {
    const invoice = this.mockInvoices.find((i) => i.id === invoiceId);

    if (!invoice) {
      return of({
        success: false,
        error: {
          code: 'INVOICE_NOT_FOUND',
          message: 'Factura no encontrada',
        },
        timestamp: new Date(),
      }).pipe(delay(200));
    }

    return of({
      success: true,
      message: 'Recordatorio enviado exitosamente',
      timestamp: new Date(),
    }).pipe(delay(Math.random() * 800 + 600));
  }
}
