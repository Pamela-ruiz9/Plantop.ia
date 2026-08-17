import { describe, it, expect, vi, beforeEach } from 'vitest';

// Declared via vi.hoisted so these are initialized before the hoisted vi.mock
// factory below runs (the factory assigns mockUpdateUser directly as a value,
// which needs it to exist ahead of time — unlike mockStorage's lazy closure
// access, which would tolerate plain top-level consts).
const { mockStorage, mockUpdateUser } = vi.hoisted(() => ({
  mockStorage: {
    upload: vi.fn().mockResolvedValue({ data: { path: 'user1/avatar.jpg' }, error: null }),
    getPublicUrl: vi.fn().mockReturnValue({
      data: { publicUrl: 'https://supabase.co/storage/v1/object/public/avatar-photos/user1/avatar.jpg' },
    }),
  },
  mockUpdateUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
}));

// Mock supabase BEFORE importing profile
vi.mock('./supabase', () => ({
  supabase: {
    auth: {
      updateUser: mockUpdateUser,
    },
    storage: {
      from: vi.fn(() => mockStorage),
    },
  },
}));

import { updateDisplayName, uploadAvatarPhoto } from './profile';

beforeEach(() => {
  vi.clearAllMocks();
  mockUpdateUser.mockResolvedValue({ data: { user: null }, error: null });
  mockStorage.upload.mockResolvedValue({ data: { path: 'user1/avatar.jpg' }, error: null });
  mockStorage.getPublicUrl.mockReturnValue({
    data: { publicUrl: 'https://supabase.co/storage/v1/object/public/avatar-photos/user1/avatar.jpg' },
  });
});

describe('updateDisplayName', () => {
  it('calls supabase.auth.updateUser with the given name as full_name', async () => {
    await updateDisplayName('Pame Ruiz');
    expect(mockUpdateUser).toHaveBeenCalledWith({ data: { full_name: 'Pame Ruiz' } });
  });

  it('throws when Supabase returns an error', async () => {
    mockUpdateUser.mockResolvedValueOnce({ data: null, error: new Error('Update failed') });
    await expect(updateDisplayName('Pame Ruiz')).rejects.toThrow('Update failed');
  });
});

describe('uploadAvatarPhoto', () => {
  it('returns a public URL string after upload', async () => {
    const file = new File(['photo'], 'avatar.jpg', { type: 'image/jpeg' });

    const url = await uploadAvatarPhoto(file, 'user1');

    expect(typeof url).toBe('string');
    expect(url).toContain('avatar-photos');
    expect(url).toContain('user1/avatar.jpg');
  });

  it('throws when upload fails', async () => {
    mockStorage.upload.mockResolvedValueOnce({ data: null, error: new Error('Upload failed') });
    const file = new File(['photo'], 'avatar.jpg', { type: 'image/jpeg' });

    await expect(uploadAvatarPhoto(file, 'user1')).rejects.toThrow('Upload failed');
  });
});
