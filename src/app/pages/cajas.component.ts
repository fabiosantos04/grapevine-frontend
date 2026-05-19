import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { PageHeaderComponent } from '../layout/page-header.component';
import { ToastService } from '../core/toast.service';

type BankAccount = { id: number; bank: string; accountNumber: string; balance: number; currency: string };

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
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  template: `
    <div>
      <app-page-header title="Caja" description="Apertura, cierre y movimientos de caja." />

      @if (!caja) {
        <div class="rounded-xl border border-border/60 bg-card p-8 text-center">
          <p class="mb-4 text-muted-foreground">No hay caja abierta actualmente.</p>
          <div class="mx-auto flex max-w-xs flex-col gap-3">
            <label class="text-left text-sm">Monto inicial (S/)</label>
            <input type="number" min="0" step="0.01"
              class="rounded-md border border-input px-3 py-2 text-sm"
              [(ngModel)]="openingAmount" [ngModelOptions]="{ standalone: true }" />
            <button type="button"
              class="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
              [disabled]="saving"
              (click)="openCash()">
              {{ saving ? 'Abriendo…' : 'Abrir caja' }}
            </button>
          </div>
        </div>
      } @else {
        <div class="space-y-6">
          <div class="grid gap-4 sm:grid-cols-3">
            <div class="rounded-xl border border-border/60 bg-card p-5">
              <p class="text-xs uppercase tracking-wider text-muted-foreground">Monto inicial</p>
              <p class="mt-2 font-display text-3xl font-bold">S/ {{ caja.openingAmount | number: '1.2-2' }}</p>
            </div>
            <div class="rounded-xl border border-border/60 bg-card p-5">
              <p class="text-xs uppercase tracking-wider text-muted-foreground">Balance actual</p>
              <p class="mt-2 font-display text-3xl font-bold text-accent">S/ {{ caja.currentBalance | number: '1.2-2' }}</p>
            </div>
            <div class="rounded-xl border border-border/60 bg-card p-5">
              <p class="text-xs uppercase tracking-wider text-muted-foreground">Estado</p>
              <p class="mt-2">
                <span class="rounded-full px-3 py-1 text-sm"
                  [class]="caja.status === 'OPEN' ? 'bg-accent/20 text-accent' : 'bg-muted text-muted-foreground'">
                  {{ caja.status === 'OPEN' ? 'Abierta' : 'Cerrada' }}
                </span>
              </p>
            </div>
          </div>

          @if (caja.status === 'OPEN') {
            <div class="rounded-xl border border-border/60 bg-card p-5">
              <h3 class="mb-4 font-semibold">Registrar movimiento</h3>
              <div class="grid gap-3 sm:grid-cols-3">
                <div>
                  <label class="text-sm">Tipo</label>
                  <select class="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    [(ngModel)]="movForm.type" [ngModelOptions]="{ standalone: true }">
                    <option value="INCOME">Ingreso</option>
                    <option value="EXPENSE">Egreso</option>
                  </select>
                </div>
                <div>
                  <label class="text-sm">Descripción</label>
                  <input class="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm"
                    [(ngModel)]="movForm.description" [ngModelOptions]="{ standalone: true }" />
                </div>
                <div>
                  <label class="text-sm">Monto (S/)</label>
                  <input type="number" min="0" step="0.01"
                    class="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm"
                    [(ngModel)]="movForm.amount" [ngModelOptions]="{ standalone: true }" />
                </div>
              </div>

              <div class="mt-4 space-y-3">
                <div>
                  <label class="text-sm">Depositar a cuenta bancaria al cerrar <span class="text-muted-foreground text-xs">(opcional)</span></label>
                  <select class="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    [(ngModel)]="depositAccountId" [ngModelOptions]="{ standalone: true }">
                    <option value="">No depositar</option>
                    @for (b of bankAccounts; track b.id) {
                      <option [value]="b.id">
                        {{ b.bank }} - {{ b.accountNumber }} ({{ b.currency === 'PEN' ? 'S/' : '$' }} {{ b.balance | number: '1.2-2' }})
                      </option>
                    }
                  </select>
                </div>
                <div class="flex gap-2">
                  <button type="button"
                    class="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
                    [disabled]="saving || !movForm.description || !movForm.amount"
                    (click)="addMovement()">
                    {{ saving ? 'Guardando…' : 'Registrar' }}
                  </button>
                  <button type="button"
                    class="rounded-md border border-destructive px-4 py-2 text-sm text-destructive hover:bg-destructive/10"
                    [disabled]="saving"
                    (click)="closeCash()">
                    Cerrar caja
                  </button>
                </div>
              </div>
            </div>
          }

          <div class="overflow-hidden rounded-xl border border-border/60 bg-card">
            <table class="w-full text-sm">
              <thead class="bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th class="px-4 py-3 text-left">Fecha</th>
                  <th class="px-4 py-3 text-left">Tipo</th>
                  <th class="px-4 py-3 text-left">Descripción</th>
                  <th class="px-4 py-3 text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                @if (!caja.movements.length) {
                  <tr>
                    <td colspan="4" class="px-4 py-8 text-center text-muted-foreground">Sin movimientos</td>
                  </tr>
                } @else {
                  @for (m of caja.movements; track m.id) {
                    <tr class="border-t border-border/40">
                      <td class="px-4 py-3">{{ m.createdAt | date: 'dd/MM/yyyy HH:mm' }}</td>
                      <td class="px-4 py-3">
                        <span class="rounded-full px-2 py-0.5 text-xs"
                          [class]="m.type === 'INCOME' ? 'bg-accent/20 text-accent' : 'bg-destructive/20 text-destructive'">
                          {{ m.type === 'INCOME' ? 'Ingreso' : 'Egreso' }}
                        </span>
                      </td>
                      <td class="px-4 py-3 text-muted-foreground">{{ m.description }}</td>
                      <td class="px-4 py-3 text-right font-mono"
                        [class]="m.type === 'INCOME' ? 'text-accent' : 'text-destructive'">
                        {{ m.type === 'INCOME' ? '+' : '-' }}S/ {{ m.amount | number: '1.2-2' }}
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  `,
})
export class CajasComponent implements OnInit {
  private readonly api   = inject(ApiService);
  private readonly toast = inject(ToastService);

  caja: CashRegister | null = null;
  bankAccounts: BankAccount[] = [];
  saving           = false;
  openingAmount    = 0;
  depositAccountId = '' as number | '';
  movForm = { type: 'INCOME' as 'INCOME' | 'EXPENSE', description: '', amount: 0 };

  async ngOnInit(): Promise<void> {
    await Promise.all([this.load(), this.loadBankAccounts()]);
  }

  async load(): Promise<void> {
    try {
      this.caja = await this.api.get<CashRegister>('/cash/current');
    } catch {
      this.caja = null;
    }
  }

  async loadBankAccounts(): Promise<void> {
    try { this.bankAccounts = await this.api.get<BankAccount[]>('/bank-accounts'); } catch {}
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
    this.saving = true;
    try {
      await this.api.post('/cash/close', {
        closingAmount: this.caja?.currentBalance,
        bankAccountId: this.depositAccountId ? Number(this.depositAccountId) : null,
      });
      this.toast.success('Caja cerrada');
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