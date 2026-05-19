import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { PageHeaderComponent } from '../layout/page-header.component';
import { ToastService } from '../core/toast.service';

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
  template: `
    <div>
      <app-page-header title="Cuentas bancarias" description="Gestión de cuentas de ahorro y corriente.">
        <div slot="actions">
          <button type="button"
            class="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
            (click)="open = true; resetForm()">
            + Nueva cuenta
          </button>
        </div>
      </app-page-header>

      @if (open) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" (click.self)="open = false">
          <div class="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg">
            <h2 class="font-display text-lg font-semibold">Nueva cuenta bancaria</h2>
            <div class="mt-4 space-y-3">
              <div>
                <label class="text-sm">Banco</label>
                <input class="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm"
                  [(ngModel)]="form.bank" [ngModelOptions]="{ standalone: true }"
                  placeholder="Ej: BCP, BBVA, Interbank…" />
              </div>
              <div>
                <label class="text-sm">Número de cuenta</label>
                <input class="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm"
                  [(ngModel)]="form.accountNumber" [ngModelOptions]="{ standalone: true }" />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="text-sm">Tipo</label>
                  <select class="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    [(ngModel)]="form.type" [ngModelOptions]="{ standalone: true }">
                    <option value="AHORRO">Ahorro</option>
                    <option value="CORRIENTE">Corriente</option>
                  </select>
                </div>
                <div>
                  <label class="text-sm">Moneda</label>
                  <select class="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    [(ngModel)]="form.currency" [ngModelOptions]="{ standalone: true }">
                    <option value="PEN">Soles (PEN)</option>
                    <option value="USD">Dólares (USD)</option>
                  </select>
                </div>
              </div>
              <div>
                <label class="text-sm">Saldo inicial</label>
                <input type="number" min="0" step="0.01"
                  class="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm"
                  [(ngModel)]="form.balance" [ngModelOptions]="{ standalone: true }" />
              </div>
            </div>
            <div class="mt-6 flex justify-end gap-2">
              <button type="button"
                class="rounded-md border border-border px-4 py-2 text-sm"
                (click)="open = false">Cancelar</button>
              <button type="button"
                class="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
                [disabled]="saving || !form.bank || !form.accountNumber"
                (click)="submit()">
                {{ saving ? 'Guardando…' : 'Guardar' }}
              </button>
            </div>
          </div>
        </div>
      }

      <div class="overflow-hidden rounded-xl border border-border/60 bg-card">
        <table class="w-full text-sm">
          <thead class="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th class="p-3">Banco</th>
              <th class="p-3">Número de cuenta</th>
              <th class="p-3">Tipo</th>
              <th class="p-3">Moneda</th>
              <th class="p-3 text-right">Saldo</th>
              <th class="p-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            @for (a of list; track a.id) {
              <tr class="border-t border-border/60">
                <td class="p-3 font-medium">{{ a.bank }}</td>
                <td class="p-3 font-mono text-muted-foreground">{{ a.accountNumber }}</td>
                <td class="p-3 text-muted-foreground">{{ a.type === 'AHORRO' ? 'Ahorro' : 'Corriente' }}</td>
                <td class="p-3 text-muted-foreground">{{ a.currency }}</td>
                <td class="p-3 text-right font-mono text-accent">
                  {{ a.currency === 'PEN' ? 'S/' : '$' }} {{ a.balance | number: '1.2-2' }}
                </td>
                <td class="p-3">
                  <span class="rounded-full px-2 py-0.5 text-xs"
                    [class]="a.active ? 'bg-accent/20 text-accent' : 'bg-muted text-muted-foreground'">
                    {{ a.active ? 'Activa' : 'Inactiva' }}
                  </span>
                </td>
              </tr>
            }
            @if (!list.length) {
              <tr>
                <td colspan="6" class="p-6 text-center text-muted-foreground">Sin cuentas bancarias registradas.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
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
}