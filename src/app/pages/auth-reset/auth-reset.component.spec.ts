import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthResetComponent } from './auth-reset.component';
import { Router, RouterModule } from '@angular/router';

describe('AuthResetComponent', () => {
  let fixture: ComponentFixture<AuthResetComponent>;
  let component: AuthResetComponent;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl']);
    routerSpy.navigateByUrl.and.resolveTo(true);

    await TestBed.configureTestingModule({
      imports: [AuthResetComponent, RouterModule.forRoot([])],
      providers: [
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(AuthResetComponent);
    component = fixture.componentInstance;
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit debe redirigir a /auth/login de inmediato', async () => {
    await component.ngOnInit();
    expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/auth/login');
  });

  it('debe redirigir también al montar el componente (via fixture)', async () => {
    await fixture.whenStable();
    expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/auth/login');
  });
});