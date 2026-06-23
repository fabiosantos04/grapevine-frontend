import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SolicitudesComponent } from './solicitudes.component';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';
import { RouterModule } from '@angular/router';
import { signal } from '@angular/core';

const mockRows = [
  { id: 1, productName: 'Corcho A', requestedBy: 'Juan', quantity: 10, justification: 'Stock bajo', status: 'PENDING',  purchaseCreated: false, createdAt: '2026-01-01' },
  { id: 2, productName: 'Pisco B',  requestedBy: 'Ana',  quantity: 5,  justification: 'Urgente',   status: 'APPROVED', purchaseCreated: true,  createdAt: '2026-01-02' },
];

const mockProducts = [
  { id: 1, name: 'Corcho A', stock: 3 },
  { id: 2, name: 'Pisco B',  stock: 0 },
];

describe('SolicitudesComponent', () => {
  let fixture: ComponentFixture<SolicitudesComponent>;
  let component: SolicitudesComponent;
  let apiSpy: jasmine.SpyObj<ApiService>;
  let toastSpy: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    apiSpy   = jasmine.createSpyObj('ApiService',   ['get', 'post', 'patch']);
    toastSpy = jasmine.createSpyObj('ToastService', ['success', 'error']);

    const authStub = { roles: signal(['admin']) };

    apiSpy.get.and.callFake((path: string): Promise<any> => {
      if (path === '/purchase-requests') return Promise.resolve(mockRows);
      if (path === '/products')          return Promise.resolve(mockProducts);
      return Promise.resolve([]);
    });

    await TestBed.configureTestingModule({
      imports: [SolicitudesComponent, RouterModule.forRoot([])],
      providers: [
        { provide: ApiService,   useValue: apiSpy   },
        { provide: AuthService,  useValue: authStub },
        { provide: ToastService, useValue: toastSpy },
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(SolicitudesComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe cargar solicitudes y productos al iniciar', async () => {
    await component.ngOnInit();
    expect(component.rows).toEqual(mockRows as any);
    expect(component.products).toEqual(mockProducts as any);
  });

  it('isAdmin debe ser true cuando el rol es admin', () => {
    expect(component.isAdmin).toBeTrue();
  });

  it('statusLabel debe retornar etiquetas correctas', () => {
    expect(component.statusLabel('PENDING')).toBe('Pendiente');
    expect(component.statusLabel('APPROVED')).toBe('Aprobada');
    expect(component.statusLabel('REJECTED')).toBe('Rechazada');
  });

  it('resetForm debe limpiar el formulario', () => {
    component.form = { productId: 1, quantity: 5, justification: 'test' };
    component.resetForm();
    expect(component.form.productId).toBe('');
    expect(component.form.quantity).toBe(1);
    expect(component.form.justification).toBe('');
  });

  it('submit debe enviar la solicitud y recargar la lista', async () => {
    apiSpy.post.and.resolveTo({});
    apiSpy.get.and.resolveTo(mockRows);
    component.form = { productId: 1, quantity: 3, justification: 'Falta stock' };

    await component.submit();

    expect(apiSpy.post).toHaveBeenCalledWith('/purchase-requests', jasmine.objectContaining({ quantity: 3 }));
    expect(toastSpy.success).toHaveBeenCalledWith('Solicitud enviada');
    expect(component.open).toBeFalse();
  });

  it('submit debe mostrar error si el API falla', async () => {
    apiSpy.post.and.rejectWith(new Error('fail'));
    await component.submit();
    expect(toastSpy.error).toHaveBeenCalledWith('Error al enviar solicitud');
  });

  it('approve debe llamar al endpoint correcto', async () => {
    apiSpy.patch.and.resolveTo({});
    apiSpy.get.and.resolveTo(mockRows);
    await component.approve(1);
    expect(apiSpy.patch).toHaveBeenCalledWith('/purchase-requests/1/approve');
    expect(toastSpy.success).toHaveBeenCalledWith('Solicitud aprobada');
  });

  it('reject debe llamar al endpoint correcto', async () => {
    apiSpy.patch.and.resolveTo({});
    apiSpy.get.and.resolveTo(mockRows);
    await component.reject(2);
    expect(apiSpy.patch).toHaveBeenCalledWith('/purchase-requests/2/reject');
    expect(toastSpy.success).toHaveBeenCalledWith('Solicitud rechazada');
  });

  it('approve debe mostrar error si el API falla', async () => {
    apiSpy.patch.and.rejectWith(new Error('fail'));
    await component.approve(1);
    expect(toastSpy.error).toHaveBeenCalledWith('Error al aprobar solicitud');
  });
});