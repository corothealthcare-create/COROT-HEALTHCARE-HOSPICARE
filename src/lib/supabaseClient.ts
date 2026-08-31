/**
 * COROT HEALTHCARE HOSPICARE - Supabase Client & Connection Manager
 *
 * Provides typed Supabase client initialization, connection verification,
 * and seamless fallback handling for enterprise multi-tenant operations.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project.supabase.co' &&
  !supabaseUrl.includes('placeholder')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export interface SupabaseHealthCheckResult {
  connected: boolean;
  urlConfigured: boolean;
  keyConfigured: boolean;
  message: string;
  tablesVerified?: string[];
  latencyMs?: number;
}

/**
 * Checks live database connectivity to Supabase PostgreSQL.
 */
export async function checkSupabaseConnection(): Promise<SupabaseHealthCheckResult> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      connected: false,
      urlConfigured: Boolean(supabaseUrl),
      keyConfigured: Boolean(supabaseAnonKey),
      message: 'Supabase credentials (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are not configured in environment.',
    };
  }

  const startTime = Date.now();
  try {
    // Attempt a light ping against public metadata or hospitals table
    const { data, error } = await supabase
      .from('hospitals')
      .select('id, name, code')
      .limit(1);

    const latencyMs = Date.now() - startTime;

    if (error) {
      return {
        connected: false,
        urlConfigured: true,
        keyConfigured: true,
        latencyMs,
        message: `Supabase connection failed: ${error.message} (Code: ${error.code})`,
      };
    }

    return {
      connected: true,
      urlConfigured: true,
      keyConfigured: true,
      latencyMs,
      message: 'Successfully connected to live Supabase PostgreSQL instance.',
      tablesVerified: ['hospitals'],
    };
  } catch (err: any) {
    return {
      connected: false,
      urlConfigured: true,
      keyConfigured: true,
      latencyMs: Date.now() - startTime,
      message: `Supabase network/runtime error: ${err?.message || String(err)}`,
    };
  }
}
