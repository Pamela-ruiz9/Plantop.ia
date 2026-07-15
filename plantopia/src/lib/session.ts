// Helpers de sesión para páginas client-rendered (Astro output: static).
import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';

/**
 * Requiere que haya una sesión activa. Si no hay, redirige a /login.
 * Devuelve el usuario autenticado (o null si redirigió).
 */
export async function requireAuth(): Promise<User | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) {
    window.location.href = '/login';
    return null;
  }
  return data.session.user;
}

/** Si ya hay sesión activa, redirige a la home. Útil en /login. */
export async function redirectIfAuthed(target = '/'): Promise<void> {
  const { data } = await supabase.auth.getSession();
  if (data.session) {
    window.location.href = target;
  }
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
  window.location.href = '/login';
}
