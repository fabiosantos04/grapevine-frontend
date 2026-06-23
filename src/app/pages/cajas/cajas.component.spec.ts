import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CajasComponent } from './cajas.component';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';

const mockCaja = {
  id: 1,
  openingAmount: 200,
  closingAmount: null,
  currentBalance: 350,
  status: 'OPEN',
  openedAt: '2026-01-01T08:00:00',
  closedAt: null,
  movements: [
    { id: 1, type: 'INCOME',  description: 'Venta', amount: 200, createdAt: '2026-01-01' },
    { id: 2, type: 'EXPENSE', description: 'Pago',  amount: 50,  createdAt: '2026-01-01' },
  ],
};

const mockBankAccounts = [
  { id: 1, bank: 'BCP', accountNumber: '123-456', balance: 5000, currency: 'PEN' },
];

describe('CajasComponent', () => {
  let fixture: ComponentFixture<CajasComponent>;
  let component: CajasComponent;
  let apiSpy: jasmine.SpyObj<ApiService>;
  let toastSpy: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    apiSpy   = jasmine.createSpyObj('ApiService',   ['get', 'post']);
    toastSpy = jasmine.createSpyObj('ToastService', ['success', 'error']);

    apiSpy.get.and.callFake((path: string): Promise<any> => {
      if (path === '/cash/current')  return Promise.resolve(mockCaja);
      if (path === '/bank-accounts') return Promise.resolve(mockBankAccounts);
      return Promise.resolve([]);
    });

    await TestBed.configureTestingModule({
      imports: [CajasComponent],
      providers: [
        { provide: ApiService,   useValue: apiSpy   },
        { provide: ToastService, useValue: toastSpy },
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(CajasComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe cargar la caja actual y las cuentas bancarias al iniciar', async () => {
    await component.ngOnInit();
    expect(apiSpy.get).toHaveBeenCalledWith('/cash/current');
    expect(apiSpy.get).toHaveBeenCalledWith('/bank-accounts');
    expect(component.caja).toEqual(mockCaja as any);
    expect(component.bankAccounts).toEqual(mockBankAccounts as any);
  });

  it('caja debe ser null si no hay caja activa', async () => {
    apiSpy.get.and.callFake((path: string): Promise<any> => {
      if (path === '/cash/current')  return Promise.reject(new Error('no caja'));
      if (path === '/bank-accounts') return Promise.resolve([]);
      return Promise.resolve([]);
    });
    await component.load();
    expect(component.caja).toBeNull();
  });

  it('openCash debe abrir una caja y recargar', async () => {
    apiSpy.post.and.resolveTo({});
    apiSpy.get.and.resolveTo(mockCaja);
    component.openingAmount = 300;

    await component.openCash();

    expect(apiSpy.post).toHaveBeenCalledWith('/cash/open', { openingAmount: 300 });
    expect(toastSpy.success).toHaveBeenCalledWith('Caja abierta');
  });

  it('openCash debe mostrar error si el API falla', async () => {
    apiSpy.post.and.rejectWith(new Error('fail'));
    await component.openCash();
    expect(toastSpy.error).toHaveBeenCalledWith('Error al abrir caja');
  });

  it('closeCash debe cerrar la caja y recargar', async () => {
    apiSpy.post.and.resolveTo({});
    apiSpy.get.and.resolveTo(null);
    component.caja = mockCaja as any;
    component.depositAccountId = 1;

    await component.closeCash();

    expect(apiSpy.post).toHaveBeenCalledWith('/cash/close', jasmine.objectContaining({ bankAccountId: 1 }));
    expect(toastSpy.success).toHaveBeenCalledWith('Caja cerrada');
    expect(component.depositAccountId).toBe('');
  });

  it('closeCash debe mostrar error si el API falla', async () => {
    apiSpy.post.and.rejectWith(new Error('fail'));
    component.caja = mockCaja as any;
    await component.closeCash();
    expect(toastSpy.error).toHaveBeenCalledWith('Error al cerrar caja');
  });

  it('addMovement debe registrar movimiento y limpiar el formulario', async () => {
    apiSpy.post.and.resolveTo({});
    apiSpy.get.and.resolveTo(mockCaja);
    component.movForm = { type: 'EXPENSE', description: 'Compra insumo', amount: 80 };

    await component.addMovement();

    expect(apiSpy.post).toHaveBeenCalledWith('/cash/movement', jasmine.objectContaining({ amount: 80, description: 'Compra insumo' }));
    expect(toastSpy.success).toHaveBeenCalledWith('Movimiento registrado');
    expect(component.movForm.amount).toBe(0);
    expect(component.movForm.description).toBe('');
    expect(component.movForm.type).toBe('INCOME');
  });

  it('addMovement debe mostrar error si el API falla', async () => {
    apiSpy.post.and.rejectWith(new Error('fail'));
    await component.addMovement();
    expect(toastSpy.error).toHaveBeenCalledWith('Error al registrar movimiento');
  });
});