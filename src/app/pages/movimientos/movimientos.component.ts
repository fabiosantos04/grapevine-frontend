import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { PageHeaderComponent } from '../../layout/page-header.component';
import { ToastService } from '../../core/toast.service';

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
  templateUrl: './movimientos.component.html',
  styleUrl: './movimientos.component.css',
})
export class MovimientosComponent implements OnInit {
  private readonly api   = inject(ApiService);
  private readonly auth  = inject(AuthService);
  private readonly toast = inject(ToastService);

  caja: CashRegister | null = null;
  open          = false;
  saving        = false;
  previewImage: string | null  = null;
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
      this.receiptPreview   = reader.result as string;
      this.form.receiptUrl  = reader.result as string;
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