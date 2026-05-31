import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { PageHeaderComponent } from '../../layout/page-header.component';
import { ToastService } from '../../core/toast.service';

type DocumentType = 'DNI' | 'RUC' | 'CE';

type Customer = {
  id: number;
  razonSocial: string;
  tipoDocumento: DocumentType;
  documento: string;
  contacto: string;
  telefono: string;
  email: string;
  segmento: string;
  active: boolean;
};

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  templateUrl: './clientes.component.html',
  styleUrl: './clientes.component.css',
})
export class ClientesComponent implements OnInit {
  private readonly api   = inject(ApiService);
  private readonly toast = inject(ToastService);

  list: Customer[] = [];
  open   = false;
  saving = false;
  form: {
    razonSocial: string;
    tipoDocumento: DocumentType;
    documento: string;
    contacto: string;
    telefono: string;
    email: string;
    segmento: string;
  } = { razonSocial: '', tipoDocumento: 'DNI', documento: '', contacto: '', telefono: '', email: '', segmento: '' };

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async load(): Promise<void> {
    try {
      this.list = await this.api.get<Customer[]>('/customers');
    } catch {
      this.toast.error('Error al cargar clientes');
    }
  }

  resetForm(): void {
    this.form = { razonSocial: '', tipoDocumento: 'DNI', documento: '', contacto: '', telefono: '', email: '', segmento: '' };
  }

  async submit(): Promise<void> {
    this.saving = true;
    try {
      await this.api.post('/customers', this.form);
      this.toast.success('Cliente creado');
      this.open = false;
      this.resetForm();
      await this.load();
    } catch {
      this.toast.error('Error al crear cliente');
    } finally {
      this.saving = false;
    }
  }
}