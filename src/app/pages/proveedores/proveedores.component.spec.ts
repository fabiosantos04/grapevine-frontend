import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProveedoresComponent } from './proveedores.component';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';

const mockSuppliers = [
  { id: 1, name: 'Proveedor A', email: 'a@test.com', phone: '999111222', address: 'Lima',  active: true  },
  { id: 2, name: 'Proveedor B', email: 'b@test.com', phone: '999333444', address: 'Cusco', active: false },
];

describe('ProveedoresComponent', () => {
  let fixture: ComponentFixture<ProveedoresComponent>;
  let component: ProveedoresComponent;
  let apiSpy: jasmine.SpyObj<ApiService>;
  let toastSpy: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    apiSpy   = jasmine.createSpyObj('ApiService',   ['get', 'post', 'patch']);
    toastSpy = jasmine.createSpyObj('ToastService', ['success', 'error']);

    apiSpy.get.and.resolveTo(mockSuppliers);

    await TestBed.configureTestingModule({
      imports: [ProveedoresComponent],
      providers: [
        { provide: ApiService,   useValue: apiSpy   },
        { provide: ToastService, useValue: toastSpy },
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(ProveedoresComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe cargar la lista de proveedores al iniciar', async () => {
    await component.ngOnInit();
    expect(apiSpy.get).toHaveBeenCalledWith('/suppliers');
    expect(component.list).toEqual(mockSuppliers as any);
  });

  it('debe mostrar error si falla la carga', async () => {
    apiSpy.get.and.rejectWith(new Error('fail'));
    await component.load();
    expect(toastSpy.error).toHaveBeenCalledWith('Error al cargar proveedores');
  });

  it('submit debe crear un proveedor y recargar la lista', async () => {
    apiSpy.post.and.resolveTo({});
    apiSpy.get.and.resolveTo(mockSuppliers);
    component.form = { name: 'Nuevo', email: 'nuevo@test.com', phone: '999000111', address: 'Arequipa' };

    await component.submit();

    expect(apiSpy.post).toHaveBeenCalledWith('/suppliers', jasmine.objectContaining({ name: 'Nuevo', active: true }));
    expect(toastSpy.success).toHaveBeenCalledWith('Proveedor creado');
    expect(component.open).toBeFalse();
    expect(component.form.name).toBe('');
  });

  it('submit debe mostrar error si el API falla', async () => {
    apiSpy.post.and.rejectWith(new Error('fail'));
    await component.submit();
    expect(toastSpy.error).toHaveBeenCalledWith('Error al crear proveedor');
  });

  it('toggleActive debe habilitar un proveedor inhabilitado', async () => {
    const proveedorInactivo = mockSuppliers[1];
    const proveedorActualizado = { ...proveedorInactivo, active: true };
    apiSpy.patch.and.resolveTo(proveedorActualizado);
    component.list = [...mockSuppliers as any];

    await component.toggleActive(proveedorInactivo as any);

    expect(apiSpy.patch).toHaveBeenCalledWith('/suppliers/2/toggle-active');
    expect(toastSpy.success).toHaveBeenCalledWith('Proveedor habilitado');
    const actualizado = component.list.find(s => s.id === 2);
    expect(actualizado?.active).toBeTrue();
  });

  it('toggleActive debe inhabilitar un proveedor activo', async () => {
    const proveedorActivo = mockSuppliers[0];
    const proveedorActualizado = { ...proveedorActivo, active: false };
    apiSpy.patch.and.resolveTo(proveedorActualizado);
    component.list = [...mockSuppliers as any];

    await component.toggleActive(proveedorActivo as any);

    expect(toastSpy.success).toHaveBeenCalledWith('Proveedor inhabilitado');
  });

  it('toggleActive debe mostrar error si el API falla', async () => {
    apiSpy.patch.and.rejectWith(new Error('fail'));
    await component.toggleActive(mockSuppliers[0] as any);
    expect(toastSpy.error).toHaveBeenCalledWith('Error al cambiar estado del proveedor');
  });
});