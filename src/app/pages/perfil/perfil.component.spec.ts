import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PerfilComponent } from './perfil.component';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';
import { signal, computed } from '@angular/core';
import { RouterModule } from '@angular/router';

const mockUser = {
  token: 'tok', refreshToken: 'ref', id: 1,
  fullName: 'Test User', email: 'test@test.com',
  role: 'ADMIN', mustChangePassword: false,
};

const mockAuthService = {
  user:            signal(mockUser),
  loading:         signal(false),
  isAuthenticated: computed(() => true),
  roles:           computed(() => ['admin'] as any),
  ready:           Promise.resolve(),
  login:           jasmine.createSpy('login'),
  signOut:         jasmine.createSpy('signOut'),
  getToken:        jasmine.createSpy('getToken').and.returnValue('tok'),
  mustChangePassword: jasmine.createSpy('mustChangePassword').and.returnValue(false),
  updateUser:      jasmine.createSpy('updateUser'),
};

describe('PerfilComponent', () => {
  let fixture: ComponentFixture<PerfilComponent>;
  let component: PerfilComponent;
  let apiSpy: jasmine.SpyObj<ApiService>;
  let toastSpy: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    apiSpy   = jasmine.createSpyObj('ApiService',   ['get', 'put']);
    toastSpy = jasmine.createSpyObj('ToastService', ['success', 'error']);

    apiSpy.get.and.resolveTo({
      id: 1, fullName: 'Test User', email: 'test@test.com',
      role: 'ADMIN', enabled: true, mustChangePassword: false, avatar: null,
    });

    await TestBed.configureTestingModule({
      imports: [PerfilComponent, RouterModule.forRoot([])],
      providers: [
        { provide: ApiService,  useValue: apiSpy          },
        { provide: AuthService, useValue: mockAuthService },
        { provide: ToastService, useValue: toastSpy       },
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
    expect(component.fullName).toBe('Test User');
    expect(component.loading).toBeFalse();
  });

  it('initials debe retornar las iniciales del usuario', () => {
    expect(component.initials()).toBe('TU');
  });

  it('saveProfile debe llamar a api.put y mostrar éxito', async () => {
    apiSpy.put.and.resolveTo({});
    component.fullName = 'Nuevo Nombre';
    await component.saveProfile();
    expect(apiSpy.put).toHaveBeenCalledWith('/profile', { fullName: 'Nuevo Nombre' });
    expect(toastSpy.success).toHaveBeenCalledWith('Perfil actualizado');
  });

  it('saveProfile debe mostrar error si falla', async () => {
    apiSpy.put.and.rejectWith(new Error('fail'));
    component.fullName = 'Fallo';
    await component.saveProfile();
    expect(toastSpy.error).toHaveBeenCalledWith('Error al actualizar perfil');
  });

  it('passwordForm debe iniciar vacío', () => {
    expect(component.currentPassword.value).toBe('');
    expect(component.newPassword.value).toBe('');
    expect(component.confirmPassword.value).toBe('');
  });

  it('savePassword con contraseñas que no coinciden no debe llamar a api', async () => {
    component.passwordForm.setValue({
      currentPassword: 'oldPass',
      newPassword:     'NewPass1@',
      confirmPassword: 'Diferente1@',
    });
    await component.savePassword();
    expect(apiSpy.put).not.toHaveBeenCalled();
  });

  it('savePassword exitoso debe resetear el formulario', async () => {
    apiSpy.put.and.resolveTo({});
    component.passwordForm.setValue({
      currentPassword: 'oldPass',
      newPassword:     'NewPass1@',
      confirmPassword: 'NewPass1@',
    });
    await component.savePassword();
    expect(toastSpy.success).toHaveBeenCalledWith('Contraseña cambiada correctamente');
    expect(component.currentPassword.value).toBe('');
    expect(component.newPassword.value).toBe('');
  });

  it('savePassword fallido debe marcar error en el formulario', async () => {
    apiSpy.put.and.rejectWith(new Error('wrong'));
    component.passwordForm.setValue({
      currentPassword: 'wrongPass',
      newPassword:     'NewPass1@',
      confirmPassword: 'NewPass1@',
    });
    await component.savePassword();
    expect(component.passwordForm.hasError('wrongCurrent')).toBeTrue();
  });

  it('savingPassword debe ser false al terminar', async () => {
    apiSpy.put.and.resolveTo({});
    component.passwordForm.setValue({
      currentPassword: 'oldPass',
      newPassword:     'NewPass1@',
      confirmPassword: 'NewPass1@',
    });
    await component.savePassword();
    expect(component.savingPassword).toBeFalse();
  });
});