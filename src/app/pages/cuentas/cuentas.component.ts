import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { PageHeaderComponent } from '../../layout/page-header.component';
import { ToastService } from '../../core/toast.service';

type AccountType = 'AHORRO' | 'CORRIENTE';
type Currency    = 'PEN' | 'USD';

type BankAccount = {
  id: number;
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
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  templateUrl: './cuentas.component.html',
  styleUrl: './cuentas.component.css',
})
export class CuentasComponent implements OnInit {
  private readonly api   = inject(ApiService);
  private readonly toast = inject(ToastService);

  list: BankAccount[] = [];
  open   = false;
  saving = false;
  form: { bank: string; accountNumber: string; type: AccountType; currency: Currency; balance: number } = {
    bank: '', accountNumber: '', type: 'AHORRO', currency: 'PEN', balance: 0,
  };

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async load(): Promise<void> {
    try {
      this.list = await this.api.get<BankAccount[]>('/bank-accounts');
    } catch {
      this.toast.error('Error al cargar cuentas bancarias');
    }
  }

  resetForm(): void {
    this.form = { bank: '', accountNumber: '', type: 'AHORRO', currency: 'PEN', balance: 0 };
  }

  async submit(): Promise<void> {
    this.saving = true;
    try {
      await this.api.post('/bank-accounts', this.form);
      this.toast.success('Cuenta creada');
      this.open = false;
      this.resetForm();
      await this.load();
    } catch {
      this.toast.error('Error al crear cuenta');
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