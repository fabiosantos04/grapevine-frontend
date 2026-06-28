import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { PageHeaderComponent } from '../../layout/page-header.component';
import { ToastService } from '../../core/toast.service';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';

type BankAccount = { id: number; accountName: string | null; bank: string; accountNumber: string; balance: number; currency: string; active: boolean };

type CashMovement = {
  id: number;
  type: 'INCOME' | 'EXPENSE';
  description: string;
  amount: number;
  createdAt: string;
};

type CashRegister = {
  id: number;
  openingAmount: number;
  closingAmount: number | null;
  currentBalance: number;
  status: 'OPEN' | 'CLOSED';
  openedAt: string;
  closedAt: string | null;
  movements: CashMovement[];
};

@Component({
  selector: 'app-cajas',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, LoadingSpinnerComponent],
  templateUrl: './cajas.component.html',
  styleUrl: './cajas.component.css',
})
export class CajasComponent implements OnInit {
  private readonly api   = inject(ApiService);
  private readonly toast = inject(ToastService);
  loading = true;

  caja: CashRegister | null = null;
  bankAccounts: BankAccount[] = [];
  saving           = false;
  openingAmount    = 0;
  depositAccountId = '' as number | '';
  movForm = { type: 'INCOME' as 'INCOME' | 'EXPENSE', description: '', amount: 0 };

  async ngOnInit(): Promise<void> {
    await Promise.all([this.load(), this.loadBankAccounts()]);
    this.loading = false;
  }

  async load(): Promise<void> {
    try {
      this.caja = await this.api.get<CashRegister>('/cash/current');
    } catch {
      this.caja = null;
    }
  }

  async loadBankAccounts(): Promise<void> {
    try {
      const all = await this.api.get<BankAccount[]>('/bank-accounts');
      this.bankAccounts = all.filter(b => b.active);
    } catch {}
  }

  get canClose(): boolean {
    return !this.saving && !!this.depositAccountId;
  }

  async openCash(): Promise<void> {
    this.saving = true;
    try {
      await this.api.post('/cash/open', { openingAmount: this.openingAmount });
      this.toast.success('Caja abierta');
      await this.load();
    } catch {
      this.toast.error('Error al abrir caja');
    } finally {
      this.saving = false;
    }
  }

  async closeCash(): Promise<void> {
    if (!this.canClose) return;
    this.saving = true;
    try {
      await this.api.post('/cash/close', {
        closingAmount: this.caja?.currentBalance,
        bankAccountId: Number(this.depositAccountId),
      });
      this.toast.success('Caja cerrada y depósito registrado');
      this.depositAccountId = '';
      await this.load();
    } catch {
      this.toast.error('Error al cerrar caja');
    } finally {
      this.saving = false;
    }
  }

  async addMovement(): Promise<void> {
    this.saving = true;
    try {
      await this.api.post('/cash/movement', this.movForm);
      this.toast.success('Movimiento registrado');
      this.movForm = { type: 'INCOME', description: '', amount: 0 };
      await this.load();
    } catch {
      this.toast.error('Error al registrar movimiento');
    } finally {
      this.saving = false;
    }
  }
}