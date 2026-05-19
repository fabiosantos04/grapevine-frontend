import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private client?: SupabaseClient;

  get supabase(): SupabaseClient {
    if (!this.client) {
      const url = environment.supabaseUrl;
      const key = environment.supabaseKey;
      if (!url || !key) {
        const msg =
          'Faltan supabaseUrl o supabaseKey en src/environments/environment.development.ts (equivalente a VITE_SUPABASE_* del proyecto React).';
        console.error('[Supabase]', msg);
        throw new Error(msg);
      }
      this.client = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    }
    return this.client;
  }
}
