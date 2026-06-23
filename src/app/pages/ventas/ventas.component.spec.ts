import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VentasComponent } from './ventas.component';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';

const mockOrders = [
  { id: 1, customerName: 'Empresa A', customerDocument: '20123456789', warehouseName: 'Lima', total: 200, status: 'PENDING', createdAt: '2026-01-01', cancelReason: null, cancelledAt: null, details: [] },
  { id: 2, customerName: 'Persona B', customerDocument: '12345678',    warehouseName: 'Cusco', total: 80,  status: 'PAID',    createdAt: '2026-01-02', cancelReason: null, cancelledAt: null, details: [] },
];

const mockWarehouses = [
  { id: 1, name: 'Lima',  active: true  },
  { id: 2, name: 'Cusco', active: true  },
  { id: 3, name: 'Inactivo', active: false },
];

const mockCustomers = [
  { id: 1, razonSocial: 'Empresa A', tipoDocumento: 'RUC', documento: '20123456789', active: true  },
  { id: 2, razonSocial: 'Inactivo',  tipoDocumento: 'DNI', documento: '11111111',    active: false },
];

const mockStock = [
  { productId: 1, productName: 'Vino Tinto', stock: 10 },
  { productId: 2, productName: 'Pisco',       stock: 0  },
];

describe('VentasComponent', () => {
  let fixture: ComponentFixture<VentasComponent>;
  let component: VentasComponent;
  let apiSpy: jasmine.SpyObj<ApiService>;
  let toastSpy: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    apiSpy   = jasmine.createSpyObj('ApiService',   ['get', 'post', 'patch']);
    toastSpy = jasmine.createSpyObj('ToastService', ['success', 'error']);

    apiSpy.get.and.callFake((path: string): Promise<any> => {
      if (path === '/orders')      return Promise.resolve(mockOrders);
      if (path === '/warehouses')  return Promise.resolve(mockWarehouses);
      if (path === '/customers')   return Promise.resolve(mockCustomers);
      if (path.startsWith('/inventory/stock')) return Promise.resolve(mockStock);
      return Promise.resolve([]);
    });

    await TestBed.configureTestingModule({
      imports: [VentasComponent],
      providers: [
        { provide: ApiService,   useValue: apiSpy   },
        { provide: ToastService, useValue: toastSpy },
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(VentasComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe cargar órdenes, almacenes activos y clientes activos al iniciar', async () => {
    await component.ngOnInit();
    expect(component.rows.length).toBe(2);
    expect(component.warehouses.every(w => w.active)).toBeTrue();
    expect(component.customers.every(c => c.active)).toBeTrue();
  });

  it('filtered debe retornar todas las órdenes sin filtros', () => {
    component.rows   = mockOrders as any;
    component.search = '';
    expect(component.filtered.length).toBe(2);
  });

  it('filtered debe filtrar por nombre de cliente', () => {
    component.rows   = mockOrders as any;
    component.search = 'empresa';
    expect(component.filtered.length).toBe(1);
    expect(component.filtered[0].customerName).toBe('Empresa A');
  });

  it('filtered debe filtrar por estado', () => {
    component.rows         = mockOrders as any;
    component.filterStatus = 'PAID';
    expect(component.filtered.length).toBe(1);
    expect(component.filtered[0].status).toBe('PAID');
  });

  it('total debe calcular correctamente la suma de items', () => {
    component.items = [
      { productId: 1, productName: 'Vino Tinto', quantity: 2, price: 80 },
      { productId: 2, productName: 'Pisco',       quantity: 1, price: 55 },
    ];
    expect(component.total()).toBe(215);
  });

  it('removeItem debe eliminar el item en el índice dado', () => {
    component.items = [
      { productId: 1, productName: 'Vino Tinto', quantity: 1, price: 80 },
      { productId: 2, productName: 'Pisco',       quantity: 2, price: 55 },
    ];
    component.removeItem(0);
    expect(component.items.length).toBe(1);
    expect(component.items[0].productName).toBe('Pisco');
  });

  it('resetForm debe limpiar el formulario completamente', () => {
    component.form = { customerName: 'Test', customerDocument: '123', warehouseId: 1 };
    component.items = [{ productId: 1, productName: 'X', quantity: 1, price: 10 }];
    component.clienteRegistrado = false;

    component.resetForm();

    expect(component.form.customerName).toBe('');
    expect(component.items.length).toBe(0);
    expect(component.clienteRegistrado).toBeTrue();
    expect(component.selectedCustomerId).toBe('');
  });

  it('onCustomerSelect debe rellenar nombre y documento desde el cliente seleccionado', () => {
    component.customers = mockCustomers as any;
    component.selectedCustomerId = 1;
    component.onCustomerSelect();
    expect(component.form.customerName).toBe('Empresa A');
    expect(component.form.customerDocument).toBe('20123456789');
  });

  it('onClienteModeChange debe limpiar el cliente seleccionado y el formulario', () => {
    component.selectedCustomerId     = 1;
    component.form.customerName      = 'Empresa A';
    component.form.customerDocument  = '20123456789';
    component.onClienteModeChange();
    expect(component.selectedCustomerId).toBe('');
    expect(component.form.customerName).toBe('');
    expect(component.form.customerDocument).toBe('');
  });

  it('canSubmit debe retornar false si no hay almacén o items', () => {
    component.form.warehouseId = '';
    component.items = [];
    expect(component.canSubmit()).toBeFalse();
  });

  it('canSubmit debe retornar true si hay almacén, items y cliente registrado seleccionado', () => {
    component.form.warehouseId     = 1;
    component.items                = [{ productId: 1, productName: 'X', quantity: 1, price: 10 }];
    component.clienteRegistrado    = true;
    component.selectedCustomerId   = 1;
    expect(component.canSubmit()).toBeTrue();
  });

  it('confirmCancel debe anular la venta y recargar', async () => {
    apiSpy.patch.and.resolveTo({});
    apiSpy.get.and.resolveTo(mockOrders);
    component.cancelOrder  = mockOrders[0] as any;
    component.cancelReason = 'Error de cliente';

    await component.confirmCancel();

    expect(apiSpy.patch).toHaveBeenCalledWith('/orders/1/cancel', { reason: 'Error de cliente' });
    expect(toastSpy.success).toHaveBeenCalledWith('Venta anulada y stock repuesto');
    expect(component.cancelOpen).toBeFalse();
    expect(component.cancelOrder).toBeNull();
  });

  it('confirmCancel debe mostrar error si el API falla', async () => {
    apiSpy.patch.and.rejectWith({ error: { message: 'Stock insuficiente' } });
    component.cancelOrder = mockOrders[0] as any;
    await component.confirmCancel();
    expect(toastSpy.error).toHaveBeenCalledWith('Stock insuficiente');
  });
});