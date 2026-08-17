// Mutaciones de perfil: nombre para mostrar y foto de avatar.
// updateDisplayName escribe en user_metadata.full_name (auth.updateUser).
// uploadAvatarPhoto solo sube y devuelve la URL — igual que uploadPlantPhoto en
// lib/plants.ts, quien llama persiste la URL por separado (ver settings.astro).
import { supabase } from './supabase';

export async function updateDisplayName(name: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ data: { full_name: name } });
  if (error) throw error;
}

export async function uploadAvatarPhoto(file: File, userId: string): Promise<string> {
  const parts = file.name.split('.');
  const ext = parts.length > 1 ? parts.pop() : '';
  const path = ext ? `${userId}/avatar.${ext}` : `${userId}/avatar`;
  const { error } = await supabase.storage
    .from('avatar-photos')
    .upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from('avatar-photos').getPublicUrl(path);
  return data.publicUrl;
}
