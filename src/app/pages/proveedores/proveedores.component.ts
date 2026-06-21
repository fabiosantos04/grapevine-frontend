import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { PageHeaderComponent } from '../../layout/page-header.component';
import { ToastService } from '../../core/toast.service';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';

type Supplier = {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  active: boolean;
};

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, LoadingSpinnerComponent],
  templateUrl: './proveedores.component.html',
  styleUrl: './proveedores.component.css',
})
export class ProveedoresComponent implements OnInit {
  private readonly api   = inject(ApiService);
  private readonly toast = inject(ToastService);
  loading = true;

  list: Supplier[] = [];
  open   = false;
  saving = false;
  form   = { name: '', email: '', phone: '', address: '' };

  async ngOnInit(): Promise<void> {
    await this.load();
    this.loading = false;
  }

  async load(): Promise<void> {
    try {
      this.list = await this.api.get<Supplier[]>('/suppliers');
    } catch {
      this.toast.error('Error al cargar proveedores');
    }
  }

  async submit(): Promise<void> {
    this.saving = true;
    try {
      await this.api.post('/suppliers', { ...this.form, active: true });
      this.toast.success('Proveedor creado');
      this.open = false;
      this.form = { name: '', email: '', phone: '', address: '' };
      await this.load();
    } catch {
      this.toast.error('Error al crear proveedor');
    } finally {
      this.saving = false;
    }
  }

  async toggleActive(p: Supplier): Promise<void> {
    try {
      const updated = await this.api.patch<Supplier>(`/suppliers/${p.id}/toggle-active`);
      this.list = this.list.map(s => s.id === updated.id ? updated : s);
      this.toast.success(updated.active ? 'Proveedor habilitado' : 'Proveedor inhabilitado');
    } catch {
      this.toast.error('Error al cambiar estado del proveedor');
    }
  }
}