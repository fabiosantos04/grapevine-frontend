import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UsuariosComponent } from './usuarios.component';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';
import { RouterModule } from '@angular/router';
import { signal } from '@angular/core';

const mockUsers = [
  { id: 1, fullName: 'Admin User',  email: 'admin@test.com',  role: 'ADMIN',    enabled: true,  mustChangePassword: false },
  { id: 2, fullName: 'Cajero User', email: 'cajero@test.com', role: 'CAJERO',   enabled: true,  mustChangePassword: true  },
];

describe('UsuariosComponent', () => {
  let fixture: ComponentFixture<UsuariosComponent>;
  let component: UsuariosComponent;
  let apiSpy: jasmine.SpyObj<ApiService>;
  let toastSpy: jasmine.SpyObj<ToastService>;
  let authStub: any;

  beforeEach(async () => {
    apiSpy   = jasmine.createSpyObj('ApiService',   ['get', 'post', 'put']);
    toastSpy = jasmine.createSpyObj('ToastService', ['success', 'error']);

    authStub = {
      ready: Promise.resolve(),
      roles: signal(['admin']),
      user:  signal({ fullName: 'Admin', email: 'admin@test.com' }),
    };

    apiSpy.get.and.resolveTo(mockUsers);

    await TestBed.configureTestingModule({
      imports: [UsuariosComponent, RouterModule.forRoot([])],
      providers: [
        { provide: ApiService,   useValue: apiSpy   },
        { provide: AuthService,  useValue: authStub },
        { provide: ToastService, useValue: toastSpy },
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(UsuariosComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe cargar la lista de usuarios al iniciar', async () => {
    await component.ngOnInit();
    expect(apiSpy.get).toHaveBeenCalledWith('/users');
    expect(component.list).toEqual(mockUsers as any);
  });

  it('debe mostrar error si falla la carga', async () => {
    apiSpy.get.and.rejectWith(new Error('fail'));
    await component.load();
    expect(toastSpy.error).toHaveBeenCalledWith('Error al cargar usuarios');
  });

  it('openCreate debe resetear el formulario y abrir el modal', () => {
    component.editingId = 5;
    component.form = { fullName: 'Viejo', email: 'viejo@x.com', role: 'ADMIN', enabled: false };
    component.openCreate();
    expect(component.editingId).toBeNull();
    expect(component.form.fullName).toBe('');
    expect(component.form.role).toBe('CAJERO');
    expect(component.form.enabled).toBeTrue();
    expect(component.open).toBeTrue();
  });

  it('openEdit debe cargar los datos del usuario en el formulario', () => {
    component.openEdit(mockUsers[1] as any);
    expect(component.editingId).toBe(2);
    expect(component.form.fullName).toBe('Cajero User');
    expect(component.form.role).toBe('CAJERO');
    expect(component.open).toBeTrue();
  });

  it('submit debe crear un usuario nuevo y recargar la lista', async () => {
    apiSpy.post.and.resolveTo({});
    apiSpy.get.and.resolveTo(mockUsers);
    component.editingId = null;
    component.form = { fullName: 'Nuevo Usuario', email: 'nuevo@test.com', role: 'LOGISTICA', enabled: true };

    await component.submit();

    expect(apiSpy.post).toHaveBeenCalledWith('/users', jasmine.objectContaining({ fullName: 'Nuevo Usuario', email: 'nuevo@test.com' }));
    expect(toastSpy.success).toHaveBeenCalledWith('Usuario creado — se envió email con credenciales');
    expect(component.open).toBeFalse();
  });

  it('submit debe actualizar un usuario existente', async () => {
    apiSpy.put.and.resolveTo({});
    apiSpy.get.and.resolveTo(mockUsers);
    component.editingId = 2;
    component.form = { fullName: 'Cajero Editado', email: 'cajero@test.com', role: 'CAJERO', enabled: false };

    await component.submit();

    expect(apiSpy.put).toHaveBeenCalledWith('/users/2', jasmine.objectContaining({ fullName: 'Cajero Editado', enabled: false }));
    expect(toastSpy.success).toHaveBeenCalledWith('Usuario actualizado');
  });

  it('submit debe mostrar error al crear si el API falla', async () => {
    apiSpy.post.and.rejectWith(new Error('fail'));
    component.editingId = null;
    await component.submit();
    expect(toastSpy.error).toHaveBeenCalledWith('Error al crear usuario');
  });

  it('submit debe mostrar error al actualizar si el API falla', async () => {
    apiSpy.put.and.rejectWith(new Error('fail'));
    component.editingId = 1;
    await component.submit();
    expect(toastSpy.error).toHaveBeenCalledWith('Error al actualizar');
  });

  it('ROLES debe contener los 3 roles del sistema', () => {
    expect(component.ROLES).toContain('ADMIN');
    expect(component.ROLES).toContain('CAJERO');
    expect(component.ROLES).toContain('LOGISTICA');
  });
});