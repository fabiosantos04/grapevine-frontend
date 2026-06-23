import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthLoginComponent } from './auth-login.component';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';
import { Router, RouterModule } from '@angular/router';

describe('AuthLoginComponent', () => {
  let fixture: ComponentFixture<AuthLoginComponent>;
  let component: AuthLoginComponent;
  let authSpy: jasmine.SpyObj<AuthService>;
  let toastSpy: jasmine.SpyObj<ToastService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    authSpy   = jasmine.createSpyObj('AuthService',  ['login']);
    toastSpy  = jasmine.createSpyObj('ToastService', ['success', 'error']);
    routerSpy = jasmine.createSpyObj('Router',       ['navigateByUrl']);

    routerSpy.navigateByUrl.and.resolveTo(true);

    await TestBed.configureTestingModule({
      imports: [AuthLoginComponent, RouterModule.forRoot([])],
      providers: [
        { provide: AuthService,  useValue: authSpy   },
        { provide: ToastService, useValue: toastSpy  },
        { provide: Router,       useValue: routerSpy },
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(AuthLoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe iniciar con email y password vacíos', () => {
    expect(component.email).toBe('');
    expect(component.password).toBe('');
  });

  it('onSubmit exitoso debe navegar al dashboard y mostrar bienvenida', async () => {
    authSpy.login.and.resolveTo();
    component.email    = 'admin@test.com';
    component.password = '1234';

    await component.onSubmit();

    expect(authSpy.login).toHaveBeenCalledWith({
      email:    'admin@test.com',
      password: '1234',
    });
    expect(toastSpy.success).toHaveBeenCalledWith('Bienvenido');
    expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/app/dashboard');
  });

  it('onSubmit fallido debe mostrar error de credenciales', async () => {
    authSpy.login.and.rejectWith(new Error('Unauthorized'));
    component.email    = 'malo@test.com';
    component.password = 'wrong';

    await component.onSubmit();

    expect(toastSpy.error).toHaveBeenCalledWith('Credenciales incorrectas');
    expect(routerSpy.navigateByUrl).not.toHaveBeenCalled();
  });
});