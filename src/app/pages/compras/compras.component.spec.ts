import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComprasComponent } from './compras.component';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';
import { RouterModule } from '@angular/router';

const mockSuppliers    = [{ id: 1, name: 'Proveedor A' }];
const mockProducts     = [{ id: 1, name: 'Corcho A', price: 10 }];
const mockBankAccounts = [{ id: 1, bank: 'BCP', accountNumber: '123', balance: 5000, currency: 'PEN' }];
const mockPurchases    = [
  { id: 1, supplierName: 'Proveedor A', bankAccountName: 'BCP', status: 'DRAFT', total: 100, createdAt: '2026-01-01', items: [] },
];

describe('ComprasComponent', () => {
  let fixture: ComponentFixture<ComprasComponent>;
  let component: ComprasComponent;
  let apiSpy: jasmine.SpyObj<ApiService>;
  let toastSpy: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    apiSpy   = jasmine.createSpyObj('ApiService',   ['get', 'post', 'put', 'patch']);
    toastSpy = jasmine.createSpyObj('ToastService', ['success', 'error']);

    apiSpy.get.and.callFake((path: string): Promise<any> => {
      if (path === '/suppliers')     return Promise.resolve(mockSuppliers);
      if (path === '/products')      return Promise.resolve(mockProducts);
      if (path === '/purchases')     return Promise.resolve(mockPurchases);
      if (path === '/bank-accounts') return Promise.resolve(mockBankAccounts);
      return Promise.resolve([]);
    });

    await TestBed.configureTestingModule({
      imports: [ComprasComponent, RouterModule.forRoot([])],
      providers: [
        { provide: ApiService,   useValue: apiSpy   },
        { provide: ToastService, useValue: toastSpy },
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(ComprasComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe cargar proveedores, productos, compras y cuentas al iniciar', async () => {
    await component.ngOnInit();
    expect(component.suppliers).toEqual(mockSuppliers as any);
    expect(component.products).toEqual(mockProducts as any);
    expect(component.rows).toEqual(mockPurchases as any);
    expect(component.bankAccounts).toEqual(mockBankAccounts as any);
  });

  it('statusLabel debe retornar etiquetas en español', () => {
    expect(component.statusLabel('DRAFT')).toBe('Borrador');
    expect(component.statusLabel('SENT')).toBe('Enviado');
    expect(component.statusLabel('CONFIRMED')).toBe('Confirmado');
    expect(component.statusLabel('RECEIVED')).toBe('Recibido');
    expect(component.statusLabel('PAID')).toBe('Pagado');
    expect(component.statusLabel('CANCELLED')).toBe('Cancelado');
  });

  it('addItem debe agregar un producto a la lista de items', () => {
    component.products = mockProducts as any;
    component.selectedProductId = '1';
    component.addItem();
    expect(component.items.length).toBe(1);
    expect(component.items[0].productName).toBe('Corcho A');
    expect(component.selectedProductId).toBe('');
  });

  it('addItem debe incrementar cantidad si el producto ya existe', () => {
    component.products = mockProducts as any;
    component.selectedProductId = '1';
    component.addItem();
    component.selectedProductId = '1';
    component.addItem();
    expect(component.items.length).toBe(1);
    expect(component.items[0].quantity).toBe(2);
  });

  it('removeItem debe eliminar el item en el índice dado', () => {
    component.items = [
      { productId: 1, productName: 'Corcho A', quantity: 1, price: 10 },
      { productId: 2, productName: 'Pisco B',  quantity: 2, price: 20 },
    ];
    component.removeItem(0);
    expect(component.items.length).toBe(1);
    expect(component.items[0].productName).toBe('Pisco B');
  });

  it('total debe calcular correctamente la suma de items', () => {
    component.items = [
      { productId: 1, productName: 'Corcho A', quantity: 3, price: 10 },
      { productId: 2, productName: 'Pisco B',  quantity: 2, price: 25 },
    ];
    expect(component.total()).toBe(80);
  });

  it('resetForm debe limpiar el formulario completamente', () => {
    component.supplierId        = '1';
    component.bankAccountId     = 1;
    component.selectedProductId = '1';
    component.items             = [{ productId: 1, productName: 'X', quantity: 1, price: 5 }];
    component.prefillRequestId  = 99;

    component.resetForm();

    expect(component.supplierId).toBe('');
    expect(component.bankAccountId).toBeFalsy();
    expect(component.items.length).toBe(0);
    expect(component.prefillRequestId).toBeNull();
  });

  it('submit debe crear la compra y agregarla al inicio de la lista', async () => {
    const nuevaCompra = { id: 2, supplierName: 'Proveedor A', bankAccountName: 'BCP', status: 'DRAFT', total: 30, createdAt: '2026-06-01', items: [] };
    apiSpy.post.and.resolveTo(nuevaCompra);
    component.supplierId = '1';
    component.items = [{ productId: 1, productName: 'Corcho A', quantity: 3, price: 10 }];

    await component.submit();

    expect(apiSpy.post).toHaveBeenCalledWith('/purchases', jasmine.objectContaining({ supplierId: 1 }));
    expect(component.rows[0]).toEqual(nuevaCompra as any);
    expect(toastSpy.success).toHaveBeenCalledWith('Orden creada en borrador');
    expect(component.open).toBeFalse();
  });

  it('submit debe mostrar error si el API falla', async () => {
    apiSpy.post.and.rejectWith(new Error('fail'));
    await component.submit();
    expect(toastSpy.error).toHaveBeenCalledWith('Error al crear orden');
  });

  it('advance debe actualizar el estado de una compra', async () => {
    const updated = { ...mockPurchases[0], status: 'SENT' };
    apiSpy.patch.and.resolveTo(updated);
    component.rows = [...mockPurchases as any];

    await component.advance(1, 'send');

    expect(apiSpy.patch).toHaveBeenCalledWith('/purchases/1/send');
    expect(component.rows[0].status).toBe('SENT');
    expect(toastSpy.success).toHaveBeenCalledWith('Estado actualizado');
  });

  it('advance debe mostrar error si el API falla', async () => {
    apiSpy.patch.and.rejectWith(new Error('fail'));
    await component.advance(1, 'send');
    expect(toastSpy.error).toHaveBeenCalledWith('Error al actualizar estado');
  });
});