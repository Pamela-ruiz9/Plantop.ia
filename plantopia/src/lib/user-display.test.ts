import { describe, it, expect } from 'vitest';
import {
  getProvider,
  getDisplayName,
  getAvatarUrl,
  getInitial,
  getProviderLabel,
  formatMemberSince,
  formatLastSignIn,
  type SessionUser,
} from './user-display';

const NOW = new Date('2026-08-16T12:00:00');

describe('getProvider', () => {
  it('returns "google" when app_metadata.provider is "google"', () => {
    const user: SessionUser = { app_metadata: { provider: 'google' } };
    expect(getProvider(user)).toBe('google');
  });

  it('returns "email" when app_metadata.provider is "email"', () => {
    const user: SessionUser = { app_metadata: { provider: 'email' } };
    expect(getProvider(user)).toBe('email');
  });

  it('returns "email" when app_metadata is missing', () => {
    const user: SessionUser = {};
    expect(getProvider(user)).toBe('email');
  });
});

describe('getDisplayName', () => {
  it('returns full_name from user_metadata when present', () => {
    const user: SessionUser = { user_metadata: { full_name: 'Pame Ruiz' }, email: 'pame@example.com' };
    expect(getDisplayName(user)).toBe('Pame Ruiz');
  });

  it('falls back to the email local-part when full_name is whitespace-only', () => {
    const user: SessionUser = { user_metadata: { full_name: '   ' }, email: 'pame.ruiz98@gmail.com' };
    expect(getDisplayName(user)).toBe('pame.ruiz98');
  });

  it('falls back to the email local-part when full_name is missing', () => {
    const user: SessionUser = { email: 'pame.ruiz98@gmail.com' };
    expect(getDisplayName(user)).toBe('pame.ruiz98');
  });

  it('falls back to "Usuaria" when both full_name and email are missing', () => {
    const user: SessionUser = {};
    expect(getDisplayName(user)).toBe('Usuaria');
  });
});

describe('getAvatarUrl', () => {
  it('returns the avatar_url when present and https', () => {
    const user: SessionUser = { user_metadata: { avatar_url: 'https://example.com/a.jpg' } };
    expect(getAvatarUrl(user)).toBe('https://example.com/a.jpg');
  });

  it('returns null when avatar_url does not start with https://', () => {
    const user: SessionUser = { user_metadata: { avatar_url: 'http://example.com/a.jpg' } };
    expect(getAvatarUrl(user)).toBeNull();
  });

  it('returns null when avatar_url is missing', () => {
    const user: SessionUser = {};
    expect(getAvatarUrl(user)).toBeNull();
  });
});

describe('getInitial', () => {
  it('returns the uppercase first letter of the display name', () => {
    const user: SessionUser = { user_metadata: { full_name: 'pame ruiz' } };
    expect(getInitial(user)).toBe('P');
  });

  it('falls back through getDisplayName when there is no name or email', () => {
    const user: SessionUser = {};
    expect(getInitial(user)).toBe('U'); // "Usuaria"
  });
});

describe('getProviderLabel', () => {
  it('labels "google" as "Google"', () => {
    expect(getProviderLabel('google')).toBe('Google');
  });

  it('labels "email" as "Email y contraseña"', () => {
    expect(getProviderLabel('email')).toBe('Email y contraseña');
  });
});

describe('formatLastSignIn', () => {
  it('returns "Hoy" for the same day', () => {
    const user: SessionUser = { last_sign_in_at: '2026-08-16T09:00:00' };
    expect(formatLastSignIn(user, NOW)).toBe('Hoy');
  });

  it('returns "Ayer" for one day ago', () => {
    const user: SessionUser = { last_sign_in_at: '2026-08-15T09:00:00' };
    expect(formatLastSignIn(user, NOW)).toBe('Ayer');
  });

  it('returns "hace N días" up to 6 days ago', () => {
    const user: SessionUser = { last_sign_in_at: '2026-08-10T09:00:00' };
    expect(formatLastSignIn(user, NOW)).toBe('hace 6 días');
  });

  it('falls back to a formatted date beyond 6 days ago', () => {
    const user: SessionUser = { last_sign_in_at: '2026-08-09T09:00:00' };
    expect(formatLastSignIn(user, NOW)).toBe('09 ago 2026');
  });

  it('returns "—" when last_sign_in_at is missing', () => {
    const user: SessionUser = {};
    expect(formatLastSignIn(user, NOW)).toBe('—');
  });

  it('returns "—" when last_sign_in_at is not a parseable date', () => {
    const user: SessionUser = { last_sign_in_at: 'not-a-date' };
    expect(formatLastSignIn(user, NOW)).toBe('—');
  });
});

describe('formatMemberSince', () => {
  it('formats created_at the same way as last_sign_in_at', () => {
    const user: SessionUser = { created_at: '2026-08-09T09:00:00' };
    expect(formatMemberSince(user, NOW)).toBe('09 ago 2026');
  });

  it('returns "—" when created_at is missing', () => {
    const user: SessionUser = {};
    expect(formatMemberSince(user, NOW)).toBe('—');
  });
});
