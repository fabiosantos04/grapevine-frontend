import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductosComponent } from './productos.component';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';

const mockProducts = [
  { id: 1, name: 'Vino Tinto Premium', description: 'Desc', price: 80, stock: 12, category: 'VINO_TINTO',  volume: 750,  year: 2020, imageUrl: null, active: true },
  { id: 2, name: 'Pisco Puro',         description: 'Desc', price: 55, stock: 5,  category: 'PISCO',        volume: 500,  year: null, imageUrl: null, active: true },
];

describe('ProductosComponent', () => {
  let fixture: ComponentFixture<ProductosComponent>;
  let component: ProductosComponent;
  let apiSpy: jasmine.SpyObj<ApiService>;
  let toastSpy: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    apiSpy   = jasmine.createSpyObj('ApiService',   ['get', 'post']);
    toastSpy = jasmine.createSpyObj('ToastService', ['success', 'error']);

    apiSpy.get.and.resolveTo(mockProducts);

    await TestBed.configureTestingModule({
      imports: [ProductosComponent],
      providers: [
        { provide: ApiService,   useValue: apiSpy   },
        { provide: ToastService, useValue: toastSpy },
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(ProductosComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe cargar la lista de productos al iniciar', async () => {
    await component.ngOnInit();
    expect(apiSpy.get).toHaveBeenCalledWith('/products');
    expect(component.list).toEqual(mockProducts as any);
  });

  it('debe mostrar error si falla la carga', async () => {
    apiSpy.get.and.rejectWith(new Error('fail'));
    await component.load();
    expect(toastSpy.error).toHaveBeenCalledWith('Error al cargar productos');
  });

  it('loading debe quedar en false luego de cargar', async () => {
    await component.ngOnInit();
    expect(component.loading).toBeFalse();
  });

  it('categoryLabel debe retornar la etiqueta legible de la categoría', () => {
    expect(component.categoryLabel('VINO_TINTO')).toBe('Vino Tinto');
    expect(component.categoryLabel('VINO_BLANCO')).toBe('Vino Blanco');
    expect(component.categoryLabel('ESPUMANTE')).toBe('Espumante');
    expect(component.categoryLabel('PISCO')).toBe('Pisco');
    expect(component.categoryLabel('DESCONOCIDO')).toBe('DESCONOCIDO');
  });

  it('resetForm debe limpiar el formulario', () => {
    component.form = { name: 'X', description: 'Y', price: 100, stock: 10, category: 'PISCO', volume: 500, year: 2020, imageUrl: 'url' };
    component.resetForm();
    expect(component.form.name).toBe('');
    expect(component.form.price).toBe(0);
    expect(component.form.category).toBe('VINO_TINTO');
    expect(component.form.volume).toBeNull();
    expect(component.form.year).toBeNull();
  });

  it('submit debe crear el producto y recargar la lista', async () => {
    apiSpy.post.and.resolveTo({});
    apiSpy.get.and.resolveTo(mockProducts);
    component.form = { name: 'Nuevo Vino', description: 'Rico', price: 70, stock: 5, category: 'VINO_ROSADO', volume: 750, year: 2021, imageUrl: '' };

    await component.submit();

    expect(apiSpy.post).toHaveBeenCalledWith('/products', jasmine.objectContaining({ name: 'Nuevo Vino' }));
    expect(toastSpy.success).toHaveBeenCalledWith('Producto creado');
    expect(component.open).toBeFalse();
  });

  it('submit debe mostrar error si el API falla', async () => {
    apiSpy.post.and.rejectWith(new Error('fail'));
    await component.submit();
    expect(toastSpy.error).toHaveBeenCalledWith('Error al crear producto');
  });

  it('CATEGORIES debe contener las 5 categorías esperadas', () => {
    const values = component.CATEGORIES.map(c => c.value);
    expect(values).toContain('VINO_TINTO');
    expect(values).toContain('VINO_BLANCO');
    expect(values).toContain('VINO_ROSADO');
    expect(values).toContain('ESPUMANTE');
    expect(values).toContain('PISCO');
  });
});