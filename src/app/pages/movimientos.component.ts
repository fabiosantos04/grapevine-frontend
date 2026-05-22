import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { PageHeaderComponent } from '../layout/page-header.component';
import { ToastService } from '../core/toast.service';

type MovementStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

type CashMovement = {
  id: number;
  type: 'INCOME' | 'EXPENSE';
  description: string;
  amount: number;
  receiptUrl: string | null;
  status: MovementStatus;
  createdAt: string;
};

type CashRegister = {
  id: number;
  status: 'OPEN' | 'CLOSED';
  currentBalance: number;
  movements: CashMovement[];
};

@Component({
  selector: 'app-movimientos',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  template: `
    <div>
      <app-page-header title="Movimientos de caja" description="Historial de ingresos y egresos. Los egresos con comprobante requieren aprobación." />

      @if (previewImage) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          (click)="previewImage = null">
          <div class="relative max-h-[90vh] max-w-2xl overflow-auto rounded-lg">
            <img [src]="previewImage" alt="Comprobante" class="rounded-lg" />
            <button type="button"
              class="absolute right-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-sm text-white hover:bg-black/70"
              (click)="previewImage = null">✕</button>
          </div>
        </div>
      }

      @if (!caja) {
        <div class="rounded-xl border border-border/60 bg-card p-8 text-center text-muted-foreground">
          No hay una caja abierta. Abre una caja desde el módulo de Cajas para registrar movimientos.
        </div>
      } @else {
        <div class="mb-4 flex items-center justify-between">
          <p class="text-sm text-muted-foreground">
            Balance actual: <span class="font-mono font-semibold text-accent">S/ {{ caja.currentBalance | number: '1.2-2' }}</span>
          </p>
          <button type="button"
            class="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
            (click)="open = true; resetForm()">
            + Nuevo movimiento
          </button>
        </div>

        @if (open) {
          <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" (click.self)="open = false">
            <div class="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg">
              <h2 class="font-display text-lg font-semibold">Nuevo movimiento</h2>
              <div class="mt-4 space-y-3">
                <div>
                  <label class="text-sm">Tipo</label>
                  <select class="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    [(ngModel)]="form.type" [ngModelOptions]="{ standalone: true }">
                    <option value="INCOME">Ingreso</option>
                    <option value="EXPENSE">Egreso</option>
                  </select>
                </div>
                <div>
                  <label class="text-sm">Descripción</label>
                  <input class="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm"
                    [(ngModel)]="form.description" [ngModelOptions]="{ standalone: true }" />
                </div>
                <div>
                  <label class="text-sm">Monto (S/)</label>
                  <input type="number" min="0" step="0.01"
                    class="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm"
                    [(ngModel)]="form.amount" [ngModelOptions]="{ standalone: true }" />
                </div>
                @if (form.type === 'EXPENSE') {
                  <div>
                    <label class="text-sm">Comprobante <span class="text-muted-foreground text-xs">(opcional — si adjuntas uno, el egreso quedará pendiente de aprobación)</span></label>
                    <input type="file" accept="image/*"
                      class="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm"
                      (change)="onReceiptChange($event)" />
                    @if (receiptPreview) {
                      <img [src]="receiptPreview" alt="Comprobante" class="mt-2 h-24 rounded-md object-cover border border-border" />
                    }
                  </div>
                }
              </div>
              <div class="mt-6 flex justify-end gap-2">
                <button type="button"
                  class="rounded-md border border-border px-4 py-2 text-sm"
                  (click)="open = false">Cancelar</button>
                <button type="button"
                  class="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
                  [disabled]="saving || !form.description || !form.amount"
                  (click)="submit()">
                  {{ saving ? 'Guardando…' : 'Registrar' }}
                </button>
              </div>
            </div>
          </div>
        }

        <div class="overflow-hidden rounded-xl border border-border/60 bg-card">
          <table class="w-full text-sm">
            <thead class="bg-card-foreground/5 text-xs uppercase text-muted-foreground">
              <tr>
                <th class="px-4 py-3 text-left">Fecha</th>
                <th class="px-4 py-3 text-left">Tipo</th>
                <th class="px-4 py-3 text-left">Descripción</th>
                <th class="px-4 py-3 text-right">Monto</th>
                <th class="px-4 py-3 text-left">Estado</th>
                <th class="px-4 py-3 text-left">Comprobante</th>
                @if (isAdmin) {
                  <th class="px-4 py-3 text-left">Acciones</th>
                }
              </tr>
            </thead>
            <tbody>
              @if (!caja.movements.length) {
                <tr>
                  <td [colSpan]="isAdmin ? 7 : 6" class="px-4 py-12 text-center text-muted-foreground">
                    Sin movimientos registrados
                  </td>
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
                    <td class="px-4 py-3">
                      <span class="rounded-full px-2 py-0.5 text-xs"
                        [class]="{
                          'bg-yellow-500/20 text-yellow-600':   m.status === 'PENDING',
                          'bg-accent/20 text-accent':           m.status === 'APPROVED',
                          'bg-destructive/20 text-destructive': m.status === 'REJECTED'
                        }">
                        {{ statusLabel(m.status) }}
                      </span>
                    </td>
                    <td class="px-4 py-3">
                      @if (m.receiptUrl) {
                        <button type="button"
                          class="text-xs text-accent hover:underline"
                          (click)="previewImage = m.receiptUrl">
                          Ver
                        </button>
                      } @else {
                        <span class="text-xs text-muted-foreground">—</span>
                      }
                    </td>
                    @if (isAdmin) {
                      <td class="px-4 py-3">
                        @if (m.status === 'PENDING') {
                          <div class="flex gap-2">
                            <button type="button"
                              class="rounded-md bg-accent/20 px-2 py-1 text-xs text-accent hover:bg-accent/30"
                              (click)="approveMovement(m.id)">Aprobar</button>
                            <button type="button"
                              class="rounded-md bg-destructive/20 px-2 py-1 text-xs text-destructive hover:bg-destructive/30"
                              (click)="rejectMovement(m.id)">Rechazar</button>
                          </div>
                        } @else {
                          <span class="text-xs text-muted-foreground">—</span>
                        }
                      </td>
                    }
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
})
export class MovimientosComponent implements OnInit {
  private readonly api   = inject(ApiService);
  private readonly auth  = inject(AuthService);
  private readonly toast = inject(ToastService);

  caja: CashRegister | null = null;
  open          = false;
  saving        = false;
  previewImage: string | null = null;
  receiptPreview: string | null = null;
  form = { type: 'INCOME' as 'INCOME' | 'EXPENSE', description: '', amount: 0, receiptUrl: '' };

  get isAdmin(): boolean {
    return this.auth.roles().includes('admin');
  }

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async load(): Promise<void> {
    try {
      this.caja = await this.api.get<CashRegister>('/cash/current');
    } catch {
      this.caja = null;
    }
  }

  resetForm(): void {
    this.form = { type: 'INCOME', description: '', amount: 0, receiptUrl: '' };
    this.receiptPreview = null;
  }

  onReceiptChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.receiptPreview      = reader.result as string;
      this.form.receiptUrl = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  statusLabel(s: MovementStatus): string {
    return { PENDING: 'Pendiente', APPROVED: 'Aprobado', REJECTED: 'Rechazado' }[s];
  }

  async submit(): Promise<void> {
    this.saving = true;
    try {
      await this.api.post('/cash/movement', {
        type:        this.form.type,
        description: this.form.description,
        amount:      this.form.amount,
        receiptUrl:  this.form.receiptUrl || null,
      });
      this.toast.success('Movimiento registrado');
      this.open = false;
      this.resetForm();
      await this.load();
    } catch {
      this.toast.error('Error al registrar movimiento');
    } finally {
      this.saving = false;
    }
  }

  async approveMovement(id: number): Promise<void> {
    try {
      await this.api.patch(`/cash/movements/${id}/approve`);
      this.toast.success('Movimiento aprobado');
      await this.load();
    } catch {
      this.toast.error('Error al aprobar');
    }
  }

  async rejectMovement(id: number): Promise<void> {
    try {
      await this.api.patch(`/cash/movements/${id}/reject`);
      this.toast.success('Movimiento rechazado');
      await this.load();
    } catch {
      this.toast.error('Error al rechazar');
    }
  }
}