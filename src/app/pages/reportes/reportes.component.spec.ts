import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReportesComponent } from './reportes.component';
import { ApiService } from '../../core/api.service';

const mockReport = {
  totalOrders: 10,
  totalSales: 5000,
  openedRegisters: 3,
  totalCash: 1200,
  totalProducts: 80,
  lowStockProducts: 5,
  totalPurchases: 7,
  totalSpent: 3000,
  monthly: [
    { month: 'Ene', sales: 1000, purchases: 500 },
    { month: 'Feb', sales: 1500, purchases: 700 },
  ],
};

describe('ReportesComponent', () => {
  let fixture: ComponentFixture<ReportesComponent>;
  let component: ReportesComponent;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(async () => {
    apiSpy = jasmine.createSpyObj('ApiService', ['get']);
    apiSpy.get.and.resolveTo(mockReport);

    await TestBed.configureTestingModule({
      imports: [ReportesComponent],
      providers: [
        { provide: ApiService, useValue: apiSpy },
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(ReportesComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe cargar el reporte al iniciar', async () => {
    await component.ngOnInit();
    expect(apiSpy.get).toHaveBeenCalledWith('/reports/full');
    expect(component.report).toEqual(mockReport);
  });

  it('debe construir las cards con los valores del reporte', async () => {
    await component.ngOnInit();
    expect(component.cards.length).toBe(8);
    const labelsEsperados = [
      'Órdenes totales',
      'Total en ventas',
      'Efectivo en caja',
      'Total en compras',
      'Productos registrados',
      'Bajo stock',
      'Compras registradas',
      'Cajas registradas',
    ];
    labelsEsperados.forEach((label, i) => {
      expect(component.cards[i].label).toBe(label);
    });
  });

  it('las cards con money:true deben tener el flag correcto', async () => {
    await component.ngOnInit();
    const moneyCards = component.cards.filter(c => c.money);
    expect(moneyCards.length).toBe(3);
  });

  it('loading debe quedar en false luego de cargar', async () => {
    await component.ngOnInit();
    expect(component.loading).toBeFalse();
  });

  it('debe manejar error del API sin romper la app', async () => {
    apiSpy.get.and.rejectWith(new Error('fail'));
    await component.ngOnInit();
    expect(component.loading).toBeFalse();
    expect(component.report).toBeNull();
  });
});