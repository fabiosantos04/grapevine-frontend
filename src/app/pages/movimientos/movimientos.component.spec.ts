import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MovimientosComponent } from './movimientos.component';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';
import { signal } from '@angular/core';

const mockCaja = {
  id: 1,
  status: 'OPEN',
  currentBalance: 500,
  movements: [
    { id: 1, type: 'INCOME', description: 'Venta', amount: 100, receiptUrl: null, status: 'APPROVED', createdAt: '2026-01-01' },
    { id: 2, type: 'EXPENSE', description: 'Pago', amount: 50,  receiptUrl: null, status: 'PENDING',  createdAt: '2026-01-02' },
  ],
};

describe('MovimientosComponent', () => {
  let fixture: ComponentFixture<MovimientosComponent>;
  let component: MovimientosComponent;
  let apiSpy: jasmine.SpyObj<ApiService>;
  let toastSpy: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    apiSpy   = jasmine.createSpyObj('ApiService',  ['get', 'post', 'patch']);
    toastSpy = jasmine.createSpyObj('ToastService', ['success', 'error']);

    const authStub = {
      roles: signal(['admin']),
    };

    apiSpy.get.and.resolveTo(mockCaja);

    await TestBed.configureTestingModule({
      imports: [MovimientosComponent],
      providers: [
        { provide: ApiService,   useValue: apiSpy   },
        { provide: AuthService,  useValue: authStub },
        { provide: ToastService, useValue: toastSpy },
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(MovimientosComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe cargar la caja al iniciar', async () => {
    await component.ngOnInit();
    expect(apiSpy.get).toHaveBeenCalledWith('/cash/current');
    expect(component.caja).toEqual(mockCaja as any);
  });

  it('isAdmin debe ser true cuando el rol es admin', () => {
    expect(component.isAdmin).toBeTrue();
  });

  it('statusLabel debe retornar etiquetas correctas', () => {
    expect(component.statusLabel('PENDING')).toBe('Pendiente');
    expect(component.statusLabel('APPROVED')).toBe('Aprobado');
    expect(component.statusLabel('REJECTED')).toBe('Rechazado');
  });

  it('resetForm debe limpiar el formulario', () => {
    component.form = { type: 'EXPENSE', description: 'test', amount: 99, receiptUrl: 'url' };
    component.resetForm();
    expect(component.form.description).toBe('');
    expect(component.form.amount).toBe(0);
    expect(component.form.type).toBe('INCOME');
    expect(component.receiptPreview).toBeNull();
  });

  it('submit debe llamar al API y recargar movimientos', async () => {
    apiSpy.post.and.resolveTo({});
    apiSpy.get.and.resolveTo(mockCaja);
    component.form = { type: 'INCOME', description: 'Test', amount: 100, receiptUrl: '' };

    await component.submit();

    expect(apiSpy.post).toHaveBeenCalledWith('/cash/movement', jasmine.objectContaining({ amount: 100 }));
    expect(toastSpy.success).toHaveBeenCalledWith('Movimiento registrado');
    expect(component.open).toBeFalse();
  });

  it('submit debe mostrar error si el API falla', async () => {
    apiSpy.post.and.rejectWith(new Error('fail'));
    await component.submit();
    expect(toastSpy.error).toHaveBeenCalledWith('Error al registrar movimiento');
  });

  it('approveMovement debe llamar al endpoint correcto', async () => {
    apiSpy.patch.and.resolveTo({});
    apiSpy.get.and.resolveTo(mockCaja);
    await component.approveMovement(1);
    expect(apiSpy.patch).toHaveBeenCalledWith('/cash/movements/1/approve');
    expect(toastSpy.success).toHaveBeenCalledWith('Movimiento aprobado');
  });

  it('rejectMovement debe llamar al endpoint correcto', async () => {
    apiSpy.patch.and.resolveTo({});
    apiSpy.get.and.resolveTo(mockCaja);
    await component.rejectMovement(2);
    expect(apiSpy.patch).toHaveBeenCalledWith('/cash/movements/2/reject');
    expect(toastSpy.success).toHaveBeenCalledWith('Movimiento rechazado');
  });

  it('debe manejar error si la caja no existe', async () => {
    apiSpy.get.and.rejectWith(new Error('no caja'));
    await component.load();
    expect(component.caja).toBeNull();
  });
});