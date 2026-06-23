import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GuiasComponent } from './guias.component';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';

const mockGuias = [
  { id: 1, type: 'TRASLADO', status: 'BORRADOR', originWarehouse: 'Lima', originWarehouseId: 1, destinationWarehouse: 'Cusco', destinationWarehouseId: 2, description: 'Envío 1', createdBy: 'Admin', createdAt: '2026-01-01', updatedAt: '2026-01-01', incidentReason: null, incidentEvidenceUrl: null, stockRecoverable: null, items: [] },
];

const mockWarehouses = [
  { id: 1, name: 'Lima'  },
  { id: 2, name: 'Cusco' },
];

const mockProducts = [
  { id: 1, name: 'Vino Tinto', stock: 50 },
  { id: 2, name: 'Pisco',      stock: 20 },
];

describe('GuiasComponent', () => {
  let fixture: ComponentFixture<GuiasComponent>;
  let component: GuiasComponent;
  let apiSpy: jasmine.SpyObj<ApiService>;
  let toastSpy: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    apiSpy   = jasmine.createSpyObj('ApiService',   ['get', 'post', 'patch']);
    toastSpy = jasmine.createSpyObj('ToastService', ['success', 'error']);

    apiSpy.get.and.callFake((path: string): Promise<any> => {
      if (path === '/transfer-guides') return Promise.resolve(mockGuias);
      if (path === '/warehouses')      return Promise.resolve(mockWarehouses);
      if (path === '/products')        return Promise.resolve(mockProducts);
      return Promise.resolve([]);
    });

    await TestBed.configureTestingModule({
      imports: [GuiasComponent],
      providers: [
        { provide: ApiService,   useValue: apiSpy   },
        { provide: ToastService, useValue: toastSpy },
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(GuiasComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe cargar guías, almacenes y productos al iniciar', async () => {
    await component.ngOnInit();
    expect(component.rows).toEqual(mockGuias as any);
    expect(component.warehouses).toEqual(mockWarehouses as any);
    expect(component.products).toEqual(mockProducts as any);
  });

  it('typeLabel debe retornar etiquetas en español', () => {
    expect(component.typeLabel('TRASLADO')).toBe('Traslado');
    expect(component.typeLabel('COMPRA')).toBe('Compra');
    expect(component.typeLabel('VENTA')).toBe('Venta');
    expect(component.typeLabel('IMPORTACION')).toBe('Importación');
  });

  it('statusLabel debe retornar etiquetas en español', () => {
    expect(component.statusLabel('BORRADOR')).toBe('Borrador');
    expect(component.statusLabel('EN_TRANSITO')).toBe('En tránsito');
    expect(component.statusLabel('ENTREGADO')).toBe('Entregado');
    expect(component.statusLabel('INCIDENCIA')).toBe('Incidencia');
  });

  it('addItem debe agregar un producto a la lista de items', () => {
    component.products = mockProducts as any;
    component.selectedProductId = '1';
    component.addItem();
    expect(component.items.length).toBe(1);
    expect(component.items[0].productName).toBe('Vino Tinto');
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
      { productId: 1, productName: 'Vino Tinto', quantity: 1 },
      { productId: 2, productName: 'Pisco',       quantity: 2 },
    ];
    component.removeItem(0);
    expect(component.items.length).toBe(1);
    expect(component.items[0].productName).toBe('Pisco');
  });

  it('resetForm debe limpiar el formulario e items', () => {
    component.items = [{ productId: 1, productName: 'X', quantity: 1 }];
    component.form  = { type: 'COMPRA', originWarehouseId: 1, destinationWarehouseId: 2, description: 'Test' };
    component.resetForm();
    expect(component.items.length).toBe(0);
    expect(component.form.type).toBe('TRASLADO');
    expect(component.form.description).toBe('');
  });

  it('submit debe crear la guía y recargar la lista', async () => {
    apiSpy.post.and.resolveTo({});
    apiSpy.get.and.resolveTo(mockGuias);
    component.form = { type: 'TRASLADO', originWarehouseId: 1, destinationWarehouseId: 2, description: 'Test' };
    component.items = [{ productId: 1, productName: 'Vino Tinto', quantity: 3 }];

    await component.submit();

    expect(apiSpy.post).toHaveBeenCalledWith('/transfer-guides', jasmine.objectContaining({ type: 'TRASLADO' }));
    expect(toastSpy.success).toHaveBeenCalledWith('Guía creada');
    expect(component.open).toBeFalse();
  });

  it('submit debe mostrar error si el API falla', async () => {
    apiSpy.post.and.rejectWith(new Error('fail'));
    await component.submit();
    expect(toastSpy.error).toHaveBeenCalledWith('Error al crear guía');
  });

  it('advance debe actualizar el estado de la guía', async () => {
    const updated = { ...mockGuias[0], status: 'PREPARANDO' };
    apiSpy.patch.and.resolveTo(updated);
    component.rows = [...mockGuias as any];

    await component.advance(1, 'prepare');

    expect(apiSpy.patch).toHaveBeenCalledWith('/transfer-guides/1/prepare');
    expect(component.rows[0].status).toBe('PREPARANDO');
    expect(toastSpy.success).toHaveBeenCalledWith('Estado actualizado');
  });

  it('advance debe mostrar error si el API falla', async () => {
    apiSpy.patch.and.rejectWith({ error: { message: 'Error personalizado' } });
    await component.advance(1, 'prepare');
    expect(toastSpy.error).toHaveBeenCalledWith('Error personalizado');
  });
});