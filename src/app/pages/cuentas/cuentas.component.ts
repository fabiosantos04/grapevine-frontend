import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { PageHeaderComponent } from '../../layout/page-header.component';
import { ToastService } from '../../core/toast.service';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';

type AccountType = 'AHORRO' | 'CORRIENTE';
type Currency    = 'PEN' | 'USD';

type BankAccount = {
  id: number;
  accountName: string | null;
  bank: string;
  accountNumber: string;
  type: AccountType;
  currency: Currency;
  balance: number;
  active: boolean;
};

@Component({
  selector: 'app-cuentas',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, LoadingSpinnerComponent],
  templateUrl: './cuentas.component.html',
  styleUrl: './cuentas.component.css',
})
export class CuentasComponent implements OnInit {
  private readonly api   = inject(ApiService);
  private readonly toast = inject(ToastService);
  loading = true;

  list: BankAccount[] = [];
  open      = false;
  saving    = false;
  editingId: number | null = null;

  search = '';
  filterBank = '';
  filterType: AccountType | '' = '';
  filterCurrency: Currency | '' = '';
  filterEstado: 'todos' | 'activas' | 'inactivas' = 'todos';

  form: { accountName: string; bank: string; accountNumber: string; type: AccountType; currency: Currency; balance: number } = {
    accountName: '', bank: '', accountNumber: '', type: 'AHORRO', currency: 'PEN', balance: 0,
  };

  async ngOnInit(): Promise<void> {
    await this.load();
    this.loading = false;
  }

  async load(): Promise<void> {
    try {
      this.list = await this.api.get<BankAccount[]>('/bank-accounts');
    } catch {
      this.toast.error('Error al cargar cuentas bancarias');
    }
  }

  get banks(): string[] {
    return Array.from(new Set(this.list.map(a => a.bank))).sort();
  }

  get filtered(): BankAccount[] {
    const term = this.search.trim().toLowerCase();
    return this.list.filter(a => {
      const matchSearch = !term
        || (a.accountName ?? '').toLowerCase().includes(term)
        || a.bank.toLowerCase().includes(term)
        || a.accountNumber.toLowerCase().includes(term);
      const matchBank = !this.filterBank || a.bank === this.filterBank;
      const matchType = !this.filterType || a.type === this.filterType;
      const matchCurrency = !this.filterCurrency || a.currency === this.filterCurrency;
      const matchEstado = this.filterEstado === 'todos'
        || (this.filterEstado === 'activas' && a.active)
        || (this.filterEstado === 'inactivas' && !a.active);
      return matchSearch && matchBank && matchType && matchCurrency && matchEstado;
    });
  }

  resetForm(): void {
    this.form = { accountName: '', bank: '', accountNumber: '', type: 'AHORRO', currency: 'PEN', balance: 0 };
    this.editingId = null;
  }

  openCreate(): void {
    this.resetForm();
    this.open = true;
  }

  openEdit(a: BankAccount): void {
    this.editingId = a.id;
    this.form = {
      accountName: a.accountName ?? '',
      bank: a.bank,
      accountNumber: a.accountNumber,
      type: a.type,
      currency: a.currency,
      balance: a.balance,
    };
    this.open = true;
  }

  async submit(): Promise<void> {
    this.saving = true;
    try {
      if (this.editingId) {
        await this.api.put(`/bank-accounts/${this.editingId}`, {
          accountName: this.form.accountName,
          bank: this.form.bank,
          accountNumber: this.form.accountNumber,
          type: this.form.type,
          currency: this.form.currency,
        });
        this.toast.success('Cuenta actualizada');
      } else {
        await this.api.post('/bank-accounts', this.form);
        this.toast.success('Cuenta creada');
      }
      this.open = false;
      this.resetForm();
      await this.load();
    } catch {
      this.toast.error(this.editingId ? 'Error al actualizar cuenta' : 'Error al crear cuenta');
    } finally {
      this.saving = false;
    }
  }

  async toggleActive(a: BankAccount): Promise<void> {
    try {
      const updated = await this.api.patch<BankAccount>(`/bank-accounts/${a.id}/toggle-active`);
      this.list = this.list.map(c => c.id === updated.id ? updated : c);
      this.toast.success(updated.active ? 'Cuenta habilitada' : 'Cuenta inhabilitada');
    } catch {
      this.toast.error('Error al cambiar estado de la cuenta');
    }
  }
}