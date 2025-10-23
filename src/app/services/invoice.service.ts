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
      residentName: 'Juan Carlos Pérez González',
      unitNumber: '101',
      tower: 'Torre A',
      amount: 30000,
      dueDate: new Date('2025-11-05'),
      issueDate: new Date('2025-10-01'),
      status: InvoiceStatus.PAID,
      period: '2025-10',
      description: 'Cuota de Mantenimiento - Octubre 2025',
      items: [
        { id: '1', description: 'Mantenimiento General', amount: 24000, type: 'maintenance' as any },
        { id: '2', description: 'Agua', amount: 3000, type: 'water' as any },
        { id: '3', description: 'Gas', amount: 3000, type: 'gas' as any },
      ],
      totalAmount: 30000,
      daysPastDue: 0,
      createdAt: new Date('2025-10-01'),
      updatedAt: new Date('2025-10-15'),
    },
    {
      id: 'INV-002',
      invoiceNumber: '2025-10-002',
      condominiumId: '1',
      unitId: 'U-102',
      residentId: 'R-002',
      residentName: 'María Guadalupe García Martínez',
      unitNumber: '102',
      tower: 'Torre A',
      amount: 30000,
      dueDate: new Date('2025-10-20'),
      issueDate: new Date('2025-10-01'),
      status: InvoiceStatus.OVERDUE,
      period: '2025-10',
      description: 'Cuota de Mantenimiento - Octubre 2025',
      items: [
        { id: '1', description: 'Mantenimiento General', amount: 24000, type: 'maintenance' as any },
        { id: '2', description: 'Agua', amount: 3000, type: 'water' as any },
        { id: '3', description: 'Gas', amount: 3000, type: 'gas' as any },
      ],
      lateFee: 1500,
      totalAmount: 31500,
      daysPastDue: 3,
      createdAt: new Date('2025-10-01'),
      updatedAt: new Date('2025-10-20'),
    },
    {
      id: 'INV-003',
      invoiceNumber: '2025-09-045',
      condominiumId: '2',
      unitId: 'U-201',
      residentId: 'R-003',
      residentName: 'Carlos Alberto Rodríguez López',
      unitNumber: '201',
      tower: 'Único',
      amount: 36000,
      dueDate: new Date('2025-09-05'),
      issueDate: new Date('2025-09-01'),
      status: InvoiceStatus.PAID,
      period: '2025-09',
      description: 'Cuota de Mantenimiento - Septiembre 2025',
      items: [
        { id: '1', description: 'Mantenimiento General', amount: 28000, type: 'maintenance' as any },
        { id: '2', description: 'Agua', amount: 4000, type: 'water' as any },
        { id: '3', description: 'Gas', amount: 4000, type: 'gas' as any },
      ],
      totalAmount: 36000,
      daysPastDue: 0,
      createdAt: new Date('2025-09-01'),
      updatedAt: new Date('2025-09-03'),
    },
    {
      id: 'INV-004',
      invoiceNumber: '2025-10-003',
      condominiumId: '1',
      unitId: 'U-502',
      residentId: 'R-006',
      residentName: 'Roberto Silva Méndez',
      unitNumber: '502',
      tower: 'Torre A',
      amount: 44000,
      dueDate: new Date('2025-11-05'),
      issueDate: new Date('2025-10-01'),
      status: InvoiceStatus.PAID,
      period: '2025-10',
      description: 'Cuota de Mantenimiento - Octubre 2025 (Penthouse)',
      items: [
        { id: '1', description: 'Mantenimiento General', amount: 35000, type: 'maintenance' as any },
        { id: '2', description: 'Agua', amount: 4500, type: 'water' as any },
        { id: '3', description: 'Gas', amount: 4500, type: 'gas' as any },
      ],
      totalAmount: 44000,
      daysPastDue: 0,
      createdAt: new Date('2025-10-01'),
      updatedAt: new Date('2025-10-18'),
    },
    {
      id: 'INV-005',
      invoiceNumber: '2025-10-004',
      condominiumId: '3',
      unitId: 'U-305',
      residentId: 'R-005',
      residentName: 'Luis Fernando Torres Ramírez',
      unitNumber: '305',
      tower: 'Torre B',
      amount: 33000,
      dueDate: new Date('2025-11-05'),
      issueDate: new Date('2025-10-01'),
      status: InvoiceStatus.PAID,
      period: '2025-10',
      description: 'Cuota de Mantenimiento - Octubre 2025',
      items: [
        { id: '1', description: 'Mantenimiento General', amount: 26000, type: 'maintenance' as any },
        { id: '2', description: 'Agua', amount: 3500, type: 'water' as any },
        { id: '3', description: 'Gas', amount: 3500, type: 'gas' as any },
      ],
      totalAmount: 33000,
      daysPastDue: 0,
      createdAt: new Date('2025-10-01'),
      updatedAt: new Date('2025-10-01'),
    },
    {
      id: 'INV-006',
      invoiceNumber: '2025-11-001',
      condominiumId: '1',
      unitId: 'U-101',
      residentId: 'R-001',
      residentName: 'Juan Carlos Pérez González',
      unitNumber: '101',
      tower: 'Torre A',
      amount: 30000,
      dueDate: new Date('2025-12-05'),
      issueDate: new Date('2025-11-01'),
      status: InvoiceStatus.PENDING,
      period: '2025-11',
      description: 'Cuota de Mantenimiento - Noviembre 2025',
      items: [
        { id: '1', description: 'Mantenimiento General', amount: 24000, type: 'maintenance' as any },
        { id: '2', description: 'Agua', amount: 3000, type: 'water' as any },
        { id: '3', description: 'Gas', amount: 3000, type: 'gas' as any },
      ],
      totalAmount: 30000,
      daysPastDue: 0,
      createdAt: new Date('2025-11-01'),
      updatedAt: new Date('2025-11-01'),
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
