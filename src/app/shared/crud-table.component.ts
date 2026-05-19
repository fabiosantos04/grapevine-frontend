import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../core/supabase.service';
import { ToastService } from '../core/toast.service';

export type CrudField = {
  name: string;
  label: string;
  type?: 'text' | 'number' | 'email' | 'tel' | 'textarea' | 'select' | 'date';
  required?: boolean;
  options?: { value: string; label: string }[];
  default?: unknown;
};

export type CrudColumn = {
  key: string;
  label: string;
  format?: 'date' | 'money' | 'badge';
  valueFromRow?: (row: Record<string, unknown>) => string;
  badgeMap?: Record<string, string>;
  moneyCurrencyKey?: string;
};

@Component({
  selector: 'app-crud-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './crud-table.component.html',
})
export class CrudTableComponent implements OnInit {
  private readonly supa = inject(SupabaseService);
  private readonly toast = inject(ToastService);

  @Input({ required: true }) table!: string;
  @Input({ required: true }) title!: string;
  @Input({ required: true }) fields!: CrudField[];
  @Input({ required: true }) columns!: CrudColumn[];
  @Input() orderBy = 'created_at';
  @Input() emptyHint?: string;
  @Input() beforeInsert?: (data: Record<string, unknown>) => Record<string, unknown> | Promise<Record<string, unknown>>;
  @Input() filter?: (rows: Record<string, unknown>[]) => Record<string, unknown>[];

  rows: Record<string, unknown>[] = [];
  loading = true;
  open = false;
  form: Record<string, unknown> = {};
  saving = false;

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading = true;
    const { data, error } = await this.supa.supabase.from(this.table).select('*').order(this.orderBy, { ascending: false });
    if (error) this.toast.error(error.message);
    const raw = (data ?? []) as Record<string, unknown>[];
    this.rows = this.filter ? this.filter(raw) : raw;
    this.loading = false;
  }

  openNew(): void {
    const init: Record<string, unknown> = {};
    for (const f of this.fields) {
      init[f.name] = f.default ?? (f.type === 'number' ? 0 : '');
    }
    this.form = init;
    this.open = true;
  }

  close(): void {
    this.open = false;
  }

  async submit(): Promise<void> {
    this.saving = true;
    let payload: Record<string, unknown> = { ...this.form };
    for (const f of this.fields) {
      if (f.type === 'number') payload[f.name] = Number(payload[f.name] ?? 0);
    }
    if (this.beforeInsert) payload = await this.beforeInsert(payload);
    const { error } = await this.supa.supabase.from(this.table).insert(payload as never);
    this.saving = false;
    if (error) {
      this.toast.error(error.message);
      return;
    }
    this.toast.success('Registro creado');
    this.open = false;
    void this.load();
  }

  displayText(col: CrudColumn, row: Record<string, unknown>): string {
    if (col.valueFromRow) return col.valueFromRow(row);
    const v = row[col.key];
    if (col.format === 'date' && v) return new Date(String(v)).toLocaleDateString();
    if (col.format === 'money') {
      const cur = col.moneyCurrencyKey ? String(row[col.moneyCurrencyKey] ?? '') : '';
      return `${cur ? `${cur} ` : 'S/ '}${Number(v).toFixed(2)}`;
    }
    if (v === null || v === undefined || v === '') return '—';
    return String(v);
  }

  badgeClass(col: CrudColumn, row: Record<string, unknown>): string {
    const val = String(row[col.key] ?? '');
    const base = 'rounded-full px-2 py-0.5 text-xs';
    if (col.badgeMap?.[val]) return `${base} ${col.badgeMap[val]}`;
    return `${base} bg-accent/15 text-accent`;
  }
}
