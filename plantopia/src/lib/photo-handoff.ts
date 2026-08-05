// Traspasa la foto identificada en /identify a /plants/new a través de una
// navegación completa de página. sessionStorage solo guarda strings, así que
// usamos IndexedDB (nativo del browser, sin dependencias) para guardar el
// File real entre las dos páginas.
//
// Nota: sin tests unitarios — happy-dom (el entorno de Vitest de este repo)
// no implementa IndexedDB, igual que fileToBase64/callVisionAI en ai.ts no
// se testean porque dependen de APIs de browser reales.

const DB_NAME = 'plantopia-photo-handoff';
const STORE_NAME = 'pending-photo';
const KEY = 'current';

interface StoredPhoto {
  blob: Blob;
  name: string;
  type: string;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('No se pudo abrir la base de datos local.'));
  });
}

export async function savePendingPhoto(file: File): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const record: StoredPhoto = { blob: file, name: file.name, type: file.type };
      tx.objectStore(STORE_NAME).put(record, KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('No se pudo guardar la foto.'));
    });
  } finally {
    db.close();
  }
}

export async function getPendingPhoto(): Promise<File | null> {
  const db = await openDb();
  let record: StoredPhoto | undefined;
  try {
    record = await new Promise<StoredPhoto | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(KEY);
      req.onsuccess = () => resolve(req.result as StoredPhoto | undefined);
      req.onerror = () => reject(req.error ?? new Error('No se pudo leer la foto guardada.'));
    });
  } finally {
    db.close();
  }
  if (!record) return null;
  return new File([record.blob], record.name, { type: record.type });
}

export async function clearPendingPhoto(): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('No se pudo borrar la foto guardada.'));
    });
  } finally {
    db.close();
  }
}
