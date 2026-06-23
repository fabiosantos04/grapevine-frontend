import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InventarioComponent } from './inventario.component';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';
import { RouterModule } from '@angular/router';

const mockStock = [
  { warehouseStockId: 1, warehouseId: 1, warehouseName: 'Lima', productId: 1, productName: 'Vino Tinto', productCategory: 'VINO_TINTO', stock: 30 },
];

const mockAdjustments = [
  { id: 1, productName: 'Vino Tinto', warehouseName: 'Lima', previousStock: 20, newStock: 30, reason: 'Reposición', createdAt: '2026-01-01' },
];

const mockWarehouses = [{ id: 1, name: 'Lima', active: true }];
const mockProducts   = [{ id: 1, name: 'Vino Tinto', stock: 30 }];

describe('InventarioComponent', () => {
  let fixture: ComponentFixture<InventarioComponent>;
  let component: InventarioComponent;
  let apiSpy: jasmine.SpyObj<ApiService>;
  let toastSpy: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    apiSpy   = jasmine.createSpyObj('ApiService',   ['get', 'post']);
    toastSpy = jasmine.createSpyObj('ToastService', ['success', 'error']);

    apiSpy.get.and.callFake((path: string): Promise<any> => {
      if (path === '/warehouses')      return Promise.resolve(mockWarehouses);
      if (path === '/products')        return Promise.resolve(mockProducts);
      if (path.startsWith('/inventory/stock')) return Promise.resolve(mockStock);
      if (path.startsWith('/inventory'))       return Promise.resolve(mockAdjustments);
      return Promise.resolve([]);
    });

    await TestBed.configureTestingModule({
      imports: [InventarioComponent, RouterModule.forRoot([])],
      providers: [
        { provide: ApiService,   useValue: apiSpy   },
        { provide: ToastService, useValue: toastSpy },
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(InventarioComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe cargar warehouses, productos, stock y ajustes al iniciar', async () => {
    await component.ngOnInit();
    expect(component.warehouses).toEqual(mockWarehouses as any);
    expect(component.products).toEqual(mockProducts as any);
    expect(component.stockRows).toEqual(mockStock as any);
    expect(component.rows).toEqual(mockAdjustments as any);
  });

  it('loading debe quedar en false luego de cargar', async () => {
    await component.ngOnInit();
    expect(component.loading).toBeFalse();
  });

  it('resetForm debe limpiar el formulario', () => {
    component.form = { productId: 1, warehouseId: 1, newStock: 50, reason: 'Test' };
    component.resetForm();
    expect(component.form.productId).toBe('');
    expect(component.form.warehouseId).toBe('');
    expect(component.form.newStock).toBe(0);
    expect(component.form.reason).toBe('');
  });

  it('onProductChange debe precargar el stock actual del producto seleccionado', () => {
    component.products = mockProducts as any;
    component.onProductChange(1);
    expect(component.form.newStock).toBe(30);
  });

  it('submit debe ajustar el stock y recargar', async () => {
    apiSpy.post.and.resolveTo({});
    apiSpy.get.and.callFake((path: string): Promise<any> => {
      if (path.startsWith('/inventory/stock')) return Promise.resolve(mockStock);
      if (path.startsWith('/inventory'))       return Promise.resolve(mockAdjustments);
      if (path === '/products')                return Promise.resolve(mockProducts);
      return Promise.resolve([]);
    });
    component.form = { productId: 1, warehouseId: 1, newStock: 40, reason: 'Reposición' };

    await component.submit();

    expect(apiSpy.post).toHaveBeenCalledWith('/inventory/adjust', jasmine.objectContaining({ newStock: 40, reason: 'Reposición' }));
    expect(toastSpy.success).toHaveBeenCalledWith('Stock ajustado');
    expect(component.open).toBeFalse();
  });

  it('submit debe mostrar error si el API falla', async () => {
    apiSpy.post.and.rejectWith(new Error('fail'));
    await component.submit();
    expect(toastSpy.error).toHaveBeenCalledWith('Error al ajustar stock');
  });

  it('debe mostrar error si falla la carga de stock', async () => {
    apiSpy.get.and.callFake((path: string): Promise<any> => {
      if (path.startsWith('/inventory/stock')) return Promise.reject(new Error('fail'));
      return Promise.resolve([]);
    });
    await component.loadStock();
    expect(toastSpy.error).toHaveBeenCalledWith('Error al cargar stock');
  });
});