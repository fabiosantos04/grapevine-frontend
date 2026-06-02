import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { PageHeaderComponent } from '../../layout/page-header.component';
import { ToastService } from '../../core/toast.service';

type Warehouse = {
  id: number;
  name: string;
  address: string;
  active: boolean;
  ubigeoCode: string;
  department: string;
  province: string;
  district: string;
};

type UbigeoDistrict  = { id: string; name: string };
type UbigeoProvince  = { name: string; districts: UbigeoDistrict[] };
type UbigeoDepartment = { name: string; provinces: UbigeoProvince[] };

@Component({
  selector: 'app-almacenes',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  templateUrl: './almacenes.component.html',
  styleUrl: './almacenes.component.css',
})
export class AlmacenesComponent implements OnInit {
  private readonly api    = inject(ApiService);
  private readonly toast  = inject(ToastService);
  private readonly router = inject(Router);

  list: Warehouse[] = [];
  open      = false;
  editingId: number | null = null;
  saving    = false;

  // Ubigeo
  ubigeoData: UbigeoDepartment[] = [];
  filteredProvinces: UbigeoProvince[]  = [];
  filteredDistricts: UbigeoDistrict[]  = [];

  form = {
    name: '', address: '',
    department: '', province: '', district: '', ubigeoCode: '',
  };

  async ngOnInit(): Promise<void> {
    await Promise.all([this.load(), this.loadUbigeo()]);
  }

  async load(): Promise<void> {
    try {
      this.list = await this.api.get<Warehouse[]>('/warehouses');
    } catch {
      this.toast.error('Error al cargar almacenes');
    }
  }

  async loadUbigeo(): Promise<void> {
    try {
      const res = await fetch('assets/ubigeo.json');
      this.ubigeoData = await res.json();
    } catch {
      console.warn('No se pudo cargar ubigeo.json');
    }
  }

  onDepartmentChange(): void {
    const dep = this.ubigeoData.find(d => d.name === this.form.department);
    this.filteredProvinces = dep?.provinces ?? [];
    this.filteredDistricts = [];
    this.form.province   = '';
    this.form.district   = '';
    this.form.ubigeoCode = '';
  }

  onProvinceChange(): void {
    const prov = this.filteredProvinces.find(p => p.name === this.form.province);
    this.filteredDistricts = prov?.districts ?? [];
    this.form.district   = '';
    this.form.ubigeoCode = '';
  }

  onDistrictChange(): void {
    const dist = this.filteredDistricts.find(d => d.name === this.form.district);
    this.form.ubigeoCode = dist?.id ?? '';
  }

  resetForm(): void {
    this.form = { name: '', address: '', department: '', province: '', district: '', ubigeoCode: '' };
    this.filteredProvinces = [];
    this.filteredDistricts = [];
    this.editingId = null;
  }

  openCreate(): void {
    this.resetForm();
    this.open = true;
  }

  openEdit(w: Warehouse): void {
    this.editingId = w.id;
    this.form = {
      name: w.name, address: w.address,
      department: w.department ?? '', province: w.province ?? '',
      district: w.district ?? '', ubigeoCode: w.ubigeoCode ?? '',
    };
    // Reconstruir cascada de ubigeo
    const dep = this.ubigeoData.find(d => d.name === w.department);
    this.filteredProvinces = dep?.provinces ?? [];
    const prov = this.filteredProvinces.find(p => p.name === w.province);
    this.filteredDistricts = prov?.districts ?? [];
    this.open = true;
  }

  async submit(): Promise<void> {
    this.saving = true;
    try {
      if (this.editingId) {
        await this.api.put(`/warehouses/${this.editingId}`, this.form);
        this.toast.success('Almacén actualizado');
      } else {
        await this.api.post('/warehouses', this.form);
        this.toast.success('Almacén creado');
      }
      this.open = false;
      this.resetForm();
      await this.load();
    } catch {
      this.toast.error('Error al guardar almacén');
    } finally {
      this.saving = false;
    }
  }

  async toggleActive(w: Warehouse): Promise<void> {
    try {
      await this.api.patch(`/warehouses/${w.id}/toggle-active`);
      this.toast.success(w.active ? 'Almacén inhabilitado' : 'Almacén habilitado');
      await this.load();
    } catch {
      this.toast.error('Error al cambiar estado');
    }
  }

  verStock(w: Warehouse): void {
    this.router.navigate(['/app/inventario'], { queryParams: { almacen: w.id } });
  }
}