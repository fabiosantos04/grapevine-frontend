import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { PageHeaderComponent } from '../../layout/page-header.component';
import { ToastService } from '../../core/toast.service';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';

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
  imports: [CommonModule, FormsModule, PageHeaderComponent, LoadingSpinnerComponent],
  templateUrl: './productos.component.html',
  styleUrl: './productos.component.css',
})
export class ProductosComponent implements OnInit {
  readonly CATEGORIES    = CATEGORIES;
  private readonly api   = inject(ApiService);
  private readonly toast = inject(ToastService);
  loading = true;

  list: Product[] = [];
  open      = false;
  saving    = false;
  editingId: number | null = null;

  search = '';
  filterCategory = '';
  filterEstado: 'todos' | 'activos' | 'inactivos' = 'todos';

  form = {
    name: '', description: '', price: 0, stock: 0,
    category: 'VINO_TINTO', volume: null as number | null,
    year: null as number | null, imageUrl: '',
  };

  async ngOnInit(): Promise<void> {
    await this.load();
    this.loading = false;
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

  get filtered(): Product[] {
    const term = this.search.trim().toLowerCase();
    return this.list.filter(p => {
      const matchSearch = !term
        || p.name.toLowerCase().includes(term)
        || (p.description ?? '').toLowerCase().includes(term);
      const matchCategory = !this.filterCategory || p.category === this.filterCategory;
      const matchEstado = this.filterEstado === 'todos'
        || (this.filterEstado === 'activos' && p.active)
        || (this.filterEstado === 'inactivos' && !p.active);
      return matchSearch && matchCategory && matchEstado;
    });
  }

  resetForm(): void {
    this.form = {
      name: '', description: '', price: 0, stock: 0,
      category: 'VINO_TINTO', volume: null, year: null, imageUrl: '',
    };
    this.editingId = null;
  }

  openCreate(): void {
    this.resetForm();
    this.open = true;
  }

  openEdit(p: Product): void {
    this.editingId = p.id;
    this.form = {
      name: p.name,
      description: p.description ?? '',
      price: p.price,
      stock: p.stock,
      category: p.category,
      volume: p.volume,
      year: p.year,
      imageUrl: p.imageUrl ?? '',
    };
    this.open = true;
  }

  async submit(): Promise<void> {
    this.saving = true;
    try {
      if (this.editingId) {
        await this.api.put(`/products/${this.editingId}`, {
          name: this.form.name,
          description: this.form.description,
          price: this.form.price,
          category: this.form.category,
          volume: this.form.volume,
          year: this.form.year,
          imageUrl: this.form.imageUrl,
        });
        this.toast.success('Producto actualizado');
      } else {
        await this.api.post('/products', this.form);
        this.toast.success('Producto creado');
      }
      this.open = false;
      this.resetForm();
      await this.load();
    } catch {
      this.toast.error(this.editingId ? 'Error al actualizar producto' : 'Error al crear producto');
    } finally {
      this.saving = false;
    }
  }

  async toggleActive(p: Product): Promise<void> {
    try {
      const updated = await this.api.patch<Product>(`/products/${p.id}/toggle-active`);
      this.list = this.list.map(x => x.id === updated.id ? updated : x);
      this.toast.success(updated.active ? 'Producto habilitado' : 'Producto inhabilitado');
    } catch {
      this.toast.error('Error al cambiar estado del producto');
    }
  }
}