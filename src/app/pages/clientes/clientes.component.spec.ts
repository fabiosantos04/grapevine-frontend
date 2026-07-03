import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClientesComponent } from './clientes.component';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';

const mockClientes = [
  { id: 1, razonSocial: 'Empresa A', tipoDocumento: 'RUC', documento: '20123456789', contacto: 'Juan', telefono: '999111222', email: 'a@test.com', segmento: 'premium', active: true  },
  { id: 2, razonSocial: 'Persona B', tipoDocumento: 'DNI', documento: '12345678',    contacto: 'Ana',  telefono: '999333444', email: 'b@test.com', segmento: 'normal',  active: false },
];

describe('ClientesComponent', () => {
  let fixture: ComponentFixture<ClientesComponent>;
  let component: ClientesComponent;
  let apiSpy: jasmine.SpyObj<ApiService>;
  let toastSpy: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    apiSpy   = jasmine.createSpyObj('ApiService',   ['get', 'post', 'put', 'patch']);
    toastSpy = jasmine.createSpyObj('ToastService', ['success', 'error']);

    apiSpy.get.and.resolveTo(mockClientes);

    await TestBed.configureTestingModule({
      imports: [ClientesComponent],
      providers: [
        { provide: ApiService,   useValue: apiSpy   },
        { provide: ToastService, useValue: toastSpy },
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(ClientesComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe cargar la lista de clientes al iniciar', async () => {
    await component.ngOnInit();
    expect(apiSpy.get).toHaveBeenCalledWith('/customers');
    expect(component.list).toEqual(mockClientes as any);
  });

  it('debe mostrar error si falla la carga', async () => {
    apiSpy.get.and.rejectWith(new Error('fail'));
    await component.load();
    expect(toastSpy.error).toHaveBeenCalledWith('Error al cargar clientes');
  });

  it('filtered debe retornar todos los clientes sin filtros', () => {
    component.list   = mockClientes as any;
    component.search = '';
    expect(component.filtered.length).toBe(2);
  });

  it('filtered debe filtrar por término de búsqueda', () => {
    component.list   = mockClientes as any;
    component.search = 'empresa';
    expect(component.filtered.length).toBe(1);
    expect(component.filtered[0].razonSocial).toBe('Empresa A');
  });

  it('filtered debe filtrar por estado activo', () => {
    component.list         = mockClientes as any;
    component.filterEstado = 'activos';
    expect(component.filtered.length).toBe(1);
    expect(component.filtered[0].active).toBeTrue();
  });

  it('filtered debe filtrar por tipo de documento', () => {
    component.list                = mockClientes as any;
    component.filterTipoDocumento = 'DNI';
    expect(component.filtered.length).toBe(1);
    expect(component.filtered[0].tipoDocumento).toBe('DNI');
  });

  it('resetForm debe limpiar el formulario y editingId', () => {
    component.editingId   = 5;
    component.form.get('razonSocial')!.setValue('Test');
    component.resetForm();
    expect(component.form.get('razonSocial')!.value).toBe('');
    expect(component.form.get('tipoDocumento')!.value).toBe('DNI');
    expect(component.editingId).toBeNull();
  });

  it('submit debe crear un cliente nuevo y recargar la lista', async () => {
    apiSpy.post.and.resolveTo({});
    apiSpy.get.and.resolveTo(mockClientes);
    component.form.setValue({
      razonSocial: 'Nuevo', tipoDocumento: 'DNI',
      documento: '99999999', contacto: 'Pedro',
      telefono: '111', email: 'n@n.com', segmento: 'normal'
});

    await component.submit();

    expect(apiSpy.post).toHaveBeenCalledWith('/customers', jasmine.objectContaining({ razonSocial: 'Nuevo' }));
    expect(toastSpy.success).toHaveBeenCalledWith('Cliente creado');
    expect(component.open).toBeFalse();
  });

  it('submit debe actualizar un cliente existente', async () => {
    apiSpy.put.and.resolveTo({});
    apiSpy.get.and.resolveTo(mockClientes);
    component.editingId = 1;
    component.form = { razonSocial: 'Editado', tipoDocumento: 'RUC', documento: '20123456789', contacto: 'Juan', telefono: '999', email: 'e@e.com', segmento: 'vip' };

    await component.submit();

    expect(apiSpy.put).toHaveBeenCalledWith('/customers/1', jasmine.anything());
    expect(toastSpy.success).toHaveBeenCalledWith('Cliente actualizado');
  });

  it('submit debe mostrar error al crear si el API falla', async () => {
    apiSpy.post.and.rejectWith(new Error('fail'));
    component.editingId = null;
    await component.submit();
    expect(toastSpy.error).toHaveBeenCalledWith('Error al crear cliente');
  });

  it('submit debe mostrar error al actualizar si el API falla', async () => {
    apiSpy.put.and.rejectWith(new Error('fail'));
    component.editingId = 1;
    await component.submit();
    expect(toastSpy.error).toHaveBeenCalledWith('Error al actualizar cliente');
  });

  it('toggleActive debe habilitar un cliente inactivo', async () => {
    apiSpy.patch.and.resolveTo({});
    apiSpy.get.and.resolveTo(mockClientes);
    await component.toggleActive(mockClientes[1] as any);
    expect(apiSpy.patch).toHaveBeenCalledWith('/customers/2/toggle-active');
    expect(toastSpy.success).toHaveBeenCalledWith('Cliente habilitado');
  });

  it('toggleActive debe inhabilitar un cliente activo', async () => {
    apiSpy.patch.and.resolveTo({});
    apiSpy.get.and.resolveTo(mockClientes);
    await component.toggleActive(mockClientes[0] as any);
    expect(toastSpy.success).toHaveBeenCalledWith('Cliente inhabilitado');
  });

  it('historyTotal debe sumar el total de las órdenes del historial', () => {
    component.historyOrders = [
      { id: 1, total: 100, customerName: '', customerDocument: '', warehouseName: '', status: 'PAID', createdAt: '', details: [] },
      { id: 2, total: 250, customerName: '', customerDocument: '', warehouseName: '', status: 'PAID', createdAt: '', details: [] },
    ] as any;
    expect(component.historyTotal()).toBe(350);
  });
});