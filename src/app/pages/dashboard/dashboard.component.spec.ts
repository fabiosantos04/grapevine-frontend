import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { ApiService } from '../../core/api.service';

const mockDashboard = {
  totalProducts:    80,
  totalOrders:      15,
  totalPurchases:   7,
  totalSales:       9500,
  todaySales:       1200,
  lowStockProducts: 3,
};

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let component: DashboardComponent;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(async () => {
    apiSpy = jasmine.createSpyObj('ApiService', ['get']);
    apiSpy.get.and.resolveTo(mockDashboard);

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        { provide: ApiService, useValue: apiSpy },
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe cargar los datos del dashboard al iniciar', async () => {
    await component.ngOnInit();
    expect(apiSpy.get).toHaveBeenCalledWith('/dashboard');
    expect(component.s).toEqual(mockDashboard);
  });

  it('las cards deben estar definidas con sus keys correctas', () => {
    const keys = component.cards.map(c => c.key);
    expect(keys).toContain('totalProducts');
    expect(keys).toContain('totalOrders');
    expect(keys).toContain('totalPurchases');
    expect(keys).toContain('totalSales');
    expect(keys).toContain('todaySales');
    expect(keys).toContain('lowStockProducts');
  });

  it('las cards con money:true deben tener el flag correcto', () => {
    const moneyCards = component.cards.filter(c => c.money);
    expect(moneyCards.length).toBe(2);
    const moneyKeys = moneyCards.map(c => c.key);
    expect(moneyKeys).toContain('totalSales');
    expect(moneyKeys).toContain('todaySales');
  });

  it('loading debe quedar en false luego de cargar', async () => {
    await component.ngOnInit();
    expect(component.loading).toBeFalse();
  });

  it('debe manejar error del API sin romper la app', async () => {
    apiSpy.get.and.rejectWith(new Error('fail'));
    await component.ngOnInit();
    expect(component.loading).toBeFalse();
  });
});