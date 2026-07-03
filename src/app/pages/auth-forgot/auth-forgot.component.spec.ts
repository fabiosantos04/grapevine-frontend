import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthForgotComponent } from './auth-forgot.component';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';
import { RouterModule } from '@angular/router';

describe('AuthForgotComponent', () => {
  let fixture: ComponentFixture<AuthForgotComponent>;
  let component: AuthForgotComponent;
  let apiSpy: jasmine.SpyObj<ApiService>;
  let toastSpy: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    apiSpy   = jasmine.createSpyObj('ApiService',   ['post']);
    toastSpy = jasmine.createSpyObj('ToastService', ['success', 'error']);

    await TestBed.configureTestingModule({
      imports: [AuthForgotComponent, RouterModule.forRoot([])],
      providers: [
        { provide: ApiService,   useValue: apiSpy   },
        { provide: ToastService, useValue: toastSpy },
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(AuthForgotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe iniciar con email vacío, loading false y sent false', () => {
    expect(component.email.value).toBe('');
    expect(component.loading).toBeFalse();
    expect(component.sent).toBeFalse();
  });

  it('onSubmit exitoso debe marcar sent como true', async () => {
    apiSpy.post.and.resolveTo({});
    component.form.setValue({ email: 'usuario@test.com' });

    await component.onSubmit();

    expect(apiSpy.post).toHaveBeenCalledWith(
      '/auth/forgot-password',
      { email: 'usuario@test.com' }
    );
    expect(component.sent).toBeTrue();
    expect(component.loading).toBeFalse();
  });

  it('onSubmit fallido debe mostrar error y no marcar sent', async () => {
    apiSpy.post.and.rejectWith(new Error('not found'));
    component.form.setValue({ email: 'noexiste@test.com' });

    await component.onSubmit();

    expect(toastSpy.error).toHaveBeenCalledWith(
      'No encontramos una cuenta con ese correo.'
    );
    expect(component.sent).toBeFalse();
    expect(component.loading).toBeFalse();
  });

  it('loading debe ser true durante el envío y false al finalizar', async () => {
    let resolvePost!: () => void;
    apiSpy.post.and.returnValue(
      new Promise<void>(res => { resolvePost = res; })
    );
    component.form.setValue({ email: 'test@test.com' });
    const promise = component.onSubmit();
    expect(component.loading).toBeTrue();
    resolvePost();
    await promise;
    expect(component.loading).toBeFalse();
  });
});