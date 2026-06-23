import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AlmacenesComponent } from './almacenes.component';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';
import { RouterModule } from '@angular/router';

const mockWarehouses = [
  {
    id: 1,
    name: 'Almacén Central',
    address: 'Av. Principal 123',
    active: true,
    ubigeoCode: '150101',
    department: 'LIMA',
    province: 'LIMA',
    district: 'LIMA',
  },
];

const mockUbigeo = [
  {
    name: 'LIMA',
    provinces: [
      {
        name: 'LIMA',
        districts: [
          { id: '150101', name: 'LIMA' },
          { id: '150102', name: 'BREÑA' },
        ],
      },
    ],
  },
];

describe('AlmacenesComponent', () => {
  let fixture: ComponentFixture<AlmacenesComponent>;
  let component: AlmacenesComponent;
  let apiSpy: jasmine.SpyObj<ApiService>;
  let toastSpy: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    apiSpy   = jasmine.createSpyObj('ApiService',   ['get', 'post', 'put', 'patch']);
    toastSpy = jasmine.createSpyObj('ToastService', ['success', 'error']);

    apiSpy.get.and.callFake((path: string): Promise<any> => {
      if (path === '/warehouses') return Promise.resolve(mockWarehouses);
      return Promise.resolve([]);
    });

    spyOn(window, 'fetch').and.returnValue(
      Promise.resolve({ json: () => Promise.resolve(mockUbigeo) } as Response)
    );

    await TestBed.configureTestingModule({
      imports: [AlmacenesComponent, RouterModule.forRoot([])],
      providers: [
        { provide: ApiService,   useValue: apiSpy   },
        { provide: ToastService, useValue: toastSpy },
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(AlmacenesComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe cargar la lista de almacenes al iniciar', async () => {
    await component.ngOnInit();
    expect(component.list).toEqual(mockWarehouses as any);
  });

  it('openCreate debe abrir el modal con el formulario en blanco', () => {
    component.openCreate();
    expect(component.open).toBeTrue();
    expect(component.editingId).toBeNull();
    expect(component.form.name).toBe('');
  });

  it('openEdit debe cargar los datos del almacén en el formulario', () => {
    component.ubigeoData = mockUbigeo as any;
    component.openEdit(mockWarehouses[0] as any);
    expect(component.open).toBeTrue();
    expect(component.editingId).toBe(1);
    expect(component.form.name).toBe('Almacén Central');
    expect(component.form.department).toBe('LIMA');
  });

  it('onDepartmentChange debe filtrar provincias y limpiar distrito', () => {
    component.ubigeoData = mockUbigeo as any;
    component.form.department = 'LIMA';
    component.onDepartmentChange();
    expect(component.filteredProvinces.length).toBe(1);
    expect(component.filteredDistricts.length).toBe(0);
    expect(component.form.province).toBe('');
    expect(component.form.ubigeoCode).toBe('');
  });

  it('onProvinceChange debe filtrar distritos y limpiar ubigeoCode', () => {
    component.ubigeoData = mockUbigeo as any;
    component.form.department = 'LIMA';
    component.onDepartmentChange();
    component.form.province = 'LIMA';
    component.onProvinceChange();
    expect(component.filteredDistricts.length).toBe(2);
    expect(component.form.district).toBe('');
    expect(component.form.ubigeoCode).toBe('');
  });

  it('onDistrictChange debe asignar el ubigeoCode correcto', () => {
    component.ubigeoData = mockUbigeo as any;
    component.form.department = 'LIMA';
    component.onDepartmentChange();
    component.form.province = 'LIMA';
    component.onProvinceChange();
    component.form.district = 'LIMA';
    component.onDistrictChange();
    expect(component.form.ubigeoCode).toBe('150101');
  });

  it('submit debe crear un almacén nuevo y mostrar éxito', async () => {
    apiSpy.post.and.resolveTo({});
    apiSpy.get.and.resolveTo(mockWarehouses);
    component.form.name = 'Nuevo Almacén';
    await component.submit();
    expect(apiSpy.post).toHaveBeenCalledWith('/warehouses', jasmine.any(Object));
    expect(toastSpy.success).toHaveBeenCalledWith('Almacén creado');
    expect(component.open).toBeFalse();
  });

  it('submit debe actualizar un almacén existente', async () => {
    apiSpy.put.and.resolveTo({});
    apiSpy.get.and.resolveTo(mockWarehouses);
    component.editingId = 1;
    component.form.name = 'Almacén Editado';
    await component.submit();
    expect(apiSpy.put).toHaveBeenCalledWith('/warehouses/1', jasmine.any(Object));
    expect(toastSpy.success).toHaveBeenCalledWith('Almacén actualizado');
  });

  it('submit debe mostrar error si el API falla', async () => {
    apiSpy.post.and.rejectWith(new Error('fail'));
    await component.submit();
    expect(toastSpy.error).toHaveBeenCalledWith('Error al guardar almacén');
  });

  it('toggleActive debe cambiar el estado del almacén y recargar lista', async () => {
    apiSpy.patch.and.resolveTo({});
    apiSpy.get.and.resolveTo(mockWarehouses);
    await component.toggleActive(mockWarehouses[0] as any);
    expect(apiSpy.patch).toHaveBeenCalledWith('/warehouses/1/toggle-active');
    expect(toastSpy.success).toHaveBeenCalledWith('Almacén inhabilitado');
  });

  it('toggleActive debe mostrar error si el API falla', async () => {
    apiSpy.patch.and.rejectWith(new Error('fail'));
    await component.toggleActive(mockWarehouses[0] as any);
    expect(toastSpy.error).toHaveBeenCalledWith('Error al cambiar estado');
  });

  it('resetForm debe limpiar el formulario y el editingId', () => {
    component.editingId = 5;
    component.form.name = 'Algo';
    component.resetForm();
    expect(component.editingId).toBeNull();
    expect(component.form.name).toBe('');
    expect(component.filteredProvinces.length).toBe(0);
    expect(component.filteredDistricts.length).toBe(0);
  });
});