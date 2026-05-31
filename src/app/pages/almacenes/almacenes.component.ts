import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { PageHeaderComponent } from '../../layout/page-header.component';
import { ToastService } from '../../core/toast.service';

type Warehouse = {
  id: number;
  name: string;
  address: string;
  active: boolean;
};

@Component({
  selector: 'app-almacenes',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  templateUrl: './almacenes.component.html',
  styleUrl: './almacenes.component.css',
})
export class AlmacenesComponent implements OnInit {
  private readonly api   = inject(ApiService);
  private readonly toast = inject(ToastService);

  list: Warehouse[] = [];
  open   = false;
  saving = false;
  form   = { name: '', address: '' };

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async load(): Promise<void> {
    try {
      this.list = await this.api.get<Warehouse[]>('/warehouses');
    } catch {
      this.toast.error('Error al cargar almacenes');
    }
  }

  resetForm(): void {
    this.form = { name: '', address: '' };
  }

  async submit(): Promise<void> {
    this.saving = true;
    try {
      await this.api.post('/warehouses', this.form);
      this.toast.success('Almacén creado');
      this.open = false;
      this.resetForm();
      await this.load();
    } catch {
      this.toast.error('Error al crear almacén');
    } finally {
      this.saving = false;
    }
  }
}