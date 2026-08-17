// Helpers puros para mostrar información de sesión de usuario (Dashboard y Ajustes).
// SessionUser es una vista estructural mínima del User de @supabase/supabase-js —
// cualquier User real cumple esta forma, así que las páginas pasan el user de
// requireAuth() directamente, sin castear.

export type LoginProvider = 'google' | 'email';

export interface SessionUser {
  email?: string;
  app_metadata?: { provider?: string };
  user_metadata?: { full_name?: string; avatar_url?: string };
  created_at?: string;
  last_sign_in_at?: string;
}

const MONTHS_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export function getProvider(user: SessionUser): LoginProvider {
  return user.app_metadata?.provider === 'google' ? 'google' : 'email';
}

export function getDisplayName(user: SessionUser): string {
  const fullName = user.user_metadata?.full_name?.trim();
  if (fullName) return fullName;
  const localPart = (user.email ?? '').split('@')[0];
  return localPart || 'Usuaria';
}

export function getAvatarUrl(user: SessionUser): string | null {
  const url = user.user_metadata?.avatar_url;
  return url && url.startsWith('https://') ? url : null;
}

export function getInitial(user: SessionUser): string {
  return getDisplayName(user).charAt(0).toUpperCase();
}

export function getProviderLabel(provider: LoginProvider): string {
  return provider === 'google' ? 'Google' : 'Email y contraseña';
}

export function formatMemberSince(user: SessionUser, now: Date = new Date()): string {
  return formatRelativeDate(user.created_at, now);
}

export function formatLastSignIn(user: SessionUser, now: Date = new Date()): string {
  return formatRelativeDate(user.last_sign_in_at, now);
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function formatRelativeDate(isoString: string | undefined, now: Date): string {
  if (!isoString) return '—';
  const then = new Date(isoString);
  if (Number.isNaN(then.getTime())) return '—';

  const diffDays = Math.round(
    (startOfDay(now).getTime() - startOfDay(then).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  if (diffDays >= 2 && diffDays <= 6) return `hace ${diffDays} días`;

  const day = String(then.getDate()).padStart(2, '0');
  const month = MONTHS_ES[then.getMonth()];
  const year = then.getFullYear();
  return `${day} ${month} ${year}`;
}
