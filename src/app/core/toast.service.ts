import { Injectable, signal } from '@angular/core';

export type ToastKind = 'success' | 'error';

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly message = signal<{ text: string; kind: ToastKind } | null>(null);

  success(text: string): void {
    this.message.set({ text, kind: 'success' });
    this.clearSoon();
  }

  error(text: string): void {
    this.message.set({ text, kind: 'error' });
    this.clearSoon();
  }

  private clearSoon(): void {
    setTimeout(() => this.message.set(null), 4000);
  }
}
