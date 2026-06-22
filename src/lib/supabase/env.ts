/** Client-safe Supabase config. NEXT_PUBLIC_* vars are inlined at build time. */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * Whether Supabase auth is wired. When false the app runs in open "demo mode"
 * (no login wall, mock data) so it's usable before credentials are added.
 */
export function supabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}
