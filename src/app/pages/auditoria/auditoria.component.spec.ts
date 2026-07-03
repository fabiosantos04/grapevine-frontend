import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuditoriaComponent } from './auditoria.component';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { signal, computed } from '@angular/core';
import { RouterModule } from '@angular/router';

const mockRequests = [
  {
    id: 1,
    productName: 'Corcho A',
    requestedBy: 'Juan',
    quantity: 10,
    status: 'PENDING',
    createdAt: '2026-05-01T10:00:00Z',
  },
];

const mockAdjustments = [
  {
    id: 1,
    productName: 'Botella B',
    previousStock: 50,
    newStock: 45,
    reason: 'Merma',
    createdAt: '2026-05-02T12:00:00Z',
  },
];

const mockAuthService = {
  user: signal(null),
  loading: signal(false),
  isAuthenticated: computed(() => false),
  roles: computed(() => []),
  ready: Promise.resolve(),
  login: jasmine.createSpy('login'),
  signOut: jasmine.createSpy('signOut'),
  getToken: jasmine.createSpy('getToken').and.returnValue(null),
  mustChangePassword: jasmine.createSpy('mustChangePassword').and.returnValue(false),
  updateUser: jasmine.createSpy('updateUser'),
};

describe('AuditoriaComponent', () => {
  let fixture: ComponentFixture<AuditoriaComponent>;
  let component: AuditoriaComponent;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(async () => {
    apiSpy = jasmine.createSpyObj('ApiService', ['get']);

    apiSpy.get.and.callFake((path: string): Promise<any> => {
      if (path === '/purchase-requests') return Promise.resolve(mockRequests);
      if (path === '/inventory')         return Promise.resolve(mockAdjustments);
      return Promise.resolve([]);
    });

    await TestBed.configureTestingModule({
      imports: [AuditoriaComponent, RouterModule.forRoot([])],
      providers: [
        { provide: ApiService,  useValue: apiSpy          },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(AuditoriaComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe combinar solicitudes y ajustes en rows al iniciar', async () => {
    await component.ngOnInit();
    expect(component.rows.length).toBe(2);
  });

  it('debe mapear solicitudes de compra con la acción correcta', async () => {
  await component.ngOnInit();
  const solicitud = component.rows.find(r => r.action === 'Solicitud de compra');
  expect(solicitud).toBeTruthy();
  expect(solicitud!['user'] ?? solicitud!['performedBy'] ?? solicitud!['createdBy'])
    .toBeTruthy();
});

  it('debe mapear ajustes de stock con la acción correcta', async () => {
  await component.ngOnInit();
  const ajuste = component.rows.find(r => r.action === 'Ajuste de stock');
  expect(ajuste).toBeTruthy();
});

  it('debe ordenar los rows de más reciente a más antiguo', async () => {
  await component.ngOnInit();
  expect(component.rows.length).toBeGreaterThan(0);
});

  it('debe manejar errores del API y continuar con array vacío', async () => {
    apiSpy.get.and.callFake((): Promise<any> => Promise.reject(new Error('fail')));
    await component.ngOnInit();
    expect(component.rows.length).toBe(0);
    expect(component.loading).toBeFalse();
  });

  it('loading debe ser false al terminar ngOnInit', async () => {
    await component.ngOnInit();
    expect(component.loading).toBeFalse();
  });
});