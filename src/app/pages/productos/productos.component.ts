import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { PageHeaderComponent } from '../../layout/page-header.component';
import { ToastService } from '../../core/toast.service';

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  volume: number | null;
  year: number | null;
  imageUrl: string | null;
  active: boolean;
};

const CATEGORIES = [
  { value: 'VINO_TINTO',  label: 'Vino Tinto' },
  { value: 'VINO_BLANCO', label: 'Vino Blanco' },
  { value: 'VINO_ROSADO', label: 'Vino Rosado' },
  { value: 'ESPUMANTE',   label: 'Espumante' },
  { value: 'PISCO',       label: 'Pisco' },
];

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  templateUrl: './productos.component.html',
  styleUrl: './productos.component.css',
})
export class ProductosComponent implements OnInit {
  readonly CATEGORIES    = CATEGORIES;
  private readonly api   = inject(ApiService);
  private readonly toast = inject(ToastService);

  list: Product[] = [];
  open   = false;
  saving = false;
  form = {
    name: '', description: '', price: 0, stock: 0,
    category: 'VINO_TINTO', volume: null as number | null,
    year: null as number | null, imageUrl: '',
  };

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async load(): Promise<void> {
    try {
      this.list = await this.api.get<Product[]>('/products');
    } catch {
      this.toast.error('Error al cargar productos');
    }
  }

  categoryLabel(value: string): string {
    return CATEGORIES.find((c) => c.value === value)?.label ?? value;
  }

  resetForm(): void {
    this.form = {
      name: '', description: '', price: 0, stock: 0,
      category: 'VINO_TINTO', volume: null, year: null, imageUrl: '',
    };
  }

  async submit(): Promise<void> {
    this.saving = true;
    try {
      await this.api.post('/products', this.form);
      this.toast.success('Producto creado');
      this.open = false;
      this.resetForm();
      await this.load();
    } catch {
      this.toast.error('Error al crear producto');
    } finally {
      this.saving = false;
    }
  }
}