import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PerfilComponent } from './perfil.component';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';
import { signal } from '@angular/core';

const mockProfile = {
  id: 1, fullName: 'Juan Pérez', email: 'juan@test.com',
  role: 'ADMIN', enabled: true, mustChangePassword: false, avatar: null,
};

describe('PerfilComponent', () => {
  let fixture: ComponentFixture<PerfilComponent>;
  let component: PerfilComponent;
  let apiSpy: jasmine.SpyObj<ApiService>;
  let toastSpy: jasmine.SpyObj<ToastService>;
  let authStub: any;

  beforeEach(async () => {
    apiSpy   = jasmine.createSpyObj('ApiService',   ['get', 'put']);
    toastSpy = jasmine.createSpyObj('ToastService', ['success', 'error']);

    authStub = {
      ready:      Promise.resolve(),
      user:       signal({ fullName: 'Juan Pérez', email: 'juan@test.com' }),
      roles:      signal(['admin']),
      updateUser: jasmine.createSpy('updateUser'),
    };

    apiSpy.get.and.resolveTo(mockProfile);

    await TestBed.configureTestingModule({
      imports: [PerfilComponent],
      providers: [
        { provide: ApiService,   useValue: apiSpy   },
        { provide: AuthService,  useValue: authStub },
        { provide: ToastService, useValue: toastSpy },
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(PerfilComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe cargar el perfil al iniciar', async () => {
    await component.ngOnInit();
    expect(apiSpy.get).toHaveBeenCalledWith('/profile');
    expect(component.fullName).toBe('Juan Pérez');
    expect(component.avatar).toBeNull();
  });

  it('loading debe quedar en false luego de cargar', async () => {
    await component.ngOnInit();
    expect(component.loading).toBeFalse();
  });

  it('initials debe retornar las iniciales del nombre completo', () => {
    component.fullName = '';
    // El nombre viene del auth.user()
    expect(component.initials()).toBe('JP');
  });

  it('saveProfile debe actualizar el perfil y llamar a updateUser', async () => {
    apiSpy.put.and.resolveTo({});
    component.fullName = 'Nombre Nuevo';

    await component.saveProfile();

    expect(apiSpy.put).toHaveBeenCalledWith('/profile', { fullName: 'Nombre Nuevo' });
    expect(authStub.updateUser).toHaveBeenCalledWith({ fullName: 'Nombre Nuevo' });
    expect(toastSpy.success).toHaveBeenCalledWith('Perfil actualizado');
  });

  it('saveProfile no debe guardar si fullName está vacío', async () => {
    component.fullName = '   ';
    await component.saveProfile();
    expect(apiSpy.put).not.toHaveBeenCalled();
  });

  it('saveProfile debe mostrar error si el API falla', async () => {
    apiSpy.put.and.rejectWith(new Error('fail'));
    component.fullName = 'Test';
    await component.saveProfile();
    expect(toastSpy.error).toHaveBeenCalledWith('Error al actualizar perfil');
  });

  it('savePassword debe mostrar error si las contraseñas no coinciden', async () => {
    component.newPassword     = 'abc123';
    component.confirmPassword = 'abc999';
    await component.savePassword();
    expect(component.passwordError).toBe('Las contraseñas no coinciden');
    expect(apiSpy.put).not.toHaveBeenCalled();
  });

  it('savePassword debe mostrar error si la contraseña tiene menos de 6 caracteres', async () => {
    component.newPassword     = 'abc';
    component.confirmPassword = 'abc';
    await component.savePassword();
    expect(component.passwordError).toBe('Mínimo 6 caracteres');
  });

  it('savePassword debe cambiar la contraseña correctamente', async () => {
    apiSpy.put.and.resolveTo({});
    component.currentPassword = 'oldPass';
    component.newPassword     = 'newPass1';
    component.confirmPassword = 'newPass1';

    await component.savePassword();

    expect(apiSpy.put).toHaveBeenCalledWith('/profile/change-password', jasmine.objectContaining({ newPassword: 'newPass1' }));
    expect(toastSpy.success).toHaveBeenCalledWith('Contraseña cambiada correctamente');
    expect(component.currentPassword).toBe('');
    expect(component.newPassword).toBe('');
  });

  it('savePassword debe mostrar error si el API falla', async () => {
    apiSpy.put.and.rejectWith(new Error('fail'));
    component.newPassword     = 'newPass1';
    component.confirmPassword = 'newPass1';
    await component.savePassword();
    expect(component.passwordError).toBe('Contraseña actual incorrecta');
  });
});