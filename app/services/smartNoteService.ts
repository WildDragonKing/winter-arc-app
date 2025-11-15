// TODO: This service is deprecated and should be migrated to PostgreSQL
// Temporarily stubbed during Firestore → PostgreSQL migration
/*
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  where,
  type QueryConstraint,
} from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import type { Firestore } from 'firebase/firestore';
import type { FirebaseStorage } from 'firebase/storage';
*/

// Stub types during migration
type Firestore = any;
type FirebaseStorage = any;
import type { SmartNote, SmartNoteAttachment } from '../types/events';
type FetchOptions = {
  limit?: number;
  cursor?: number;
};

let cachedDb: Firestore | null | undefined;
let cachedStorage: FirebaseStorage | null | undefined;

async function getFirestoreInstance(): Promise<Firestore | null> {
  // TODO: Replace with PostgreSQL connection during migration
  if (cachedDb !== undefined) {
    return cachedDb;
  }

  if (typeof window === 'undefined') {
    cachedDb = null;
    return cachedDb;
  }

  try {
    cachedDb = null;
    return cachedDb;
  } catch (error) {
    console.warn('Firestore unavailable (removed during PostgreSQL migration), skipping smart note persistence.', error);
    cachedDb = null;
    return cachedDb;
  }
}

async function getStorageInstance(): Promise<FirebaseStorage | null> {
  // TODO: Replace with cloud storage solution during migration
  if (cachedStorage !== undefined) {
    return cachedStorage;
  }

  if (typeof window === 'undefined') {
    cachedStorage = null;
    return cachedStorage;
  }

  try {
    cachedStorage = null;
    return cachedStorage;
  } catch (error) {
    console.warn('Firebase storage unavailable (removed during PostgreSQL migration), skipping attachment upload.', error);
    cachedStorage = null;
    return cachedStorage;
  }
}

async function ensureAttachmentUploaded(
  _storage: FirebaseStorage,
  _userId: string,
  _noteId: string,
  attachment: SmartNoteAttachment
): Promise<SmartNoteAttachment> {
  // Stubbed during Firebase → PostgreSQL migration
  return attachment;
  /*
  if (!isDataUrl(attachment.url) && attachment.storagePath) {
    return attachment;
  }

  if (!isDataUrl(attachment.url) && !attachment.storagePath) {
    // Attachment is already remote but missing storage metadata
    return attachment;
  }

  const response = await fetch(attachment.url);
  const blob = await response.blob();
  const mime = blob.type || 'image/jpeg';
  const extension = mime.split('/')[1] || 'jpg';
  const storagePath = `smart-notes/${userId}/${noteId}/${attachment.id}.${extension}`;
  const storageRef = ref(storage, storagePath);

  await uploadBytes(storageRef, blob, {
    contentType: mime,
    cacheControl: 'public,max-age=31536000',
  });

  const downloadURL = await getDownloadURL(storageRef);

  return {
    ...attachment,
    url: downloadURL,
    storagePath,
  };
  */
}

export async function upsertSmartNote(userId: string, note: SmartNote): Promise<SmartNote> {
  const firestore = await getFirestoreInstance();
  if (!firestore) {
    return note;
  }

  let attachments = note.attachments;

  if (attachments && attachments.some((attachment) => attachment.url.startsWith('data:') || !attachment.storagePath)) {
    const storage = await getStorageInstance();
    if (!storage) {
      console.warn('Skipping smart note upload because storage is unavailable.');
      return note;
    }

    attachments = await Promise.all(
      attachments.map((attachment) => ensureAttachmentUploaded(storage, userId, note.id, attachment))
    );
  }

  const payload: SmartNote = {
    ...note,
    attachments,
  };

  // Stubbed during Firebase → PostgreSQL migration
  // const docRef = doc(firestore, 'users', userId, COLLECTION_KEY, note.id);
  // await setDoc(docRef, payload, { merge: true });

  return payload;
}

export async function deleteSmartNote(userId: string, note: SmartNote): Promise<void> {
  const firestore = await getFirestoreInstance();
  if (!firestore) {
    return;
  }

  // Stubbed during Firebase → PostgreSQL migration
  // const docRef = doc(firestore, 'users', userId, COLLECTION_KEY, note.id);
  // await deleteDoc(docRef);

  if (note.attachments && note.attachments.length > 0) {
    const storage = await getStorageInstance();
    if (!storage) {
      return;
    }

    // await Promise.allSettled(
    //   note.attachments
    //     .filter((attachment) => Boolean(attachment.storagePath))
    //     .map((attachment) => deleteObject(ref(storage, attachment.storagePath)))
    // );
  }
}

export async function fetchSmartNotes(_userId: string, _options: FetchOptions = {}): Promise<SmartNote[]> {
  const firestore = await getFirestoreInstance();
  if (!firestore) {
    return [];
  }

  // Stubbed during Firebase → PostgreSQL migration
  // const collectionRef = collection(firestore, 'users', userId, COLLECTION_KEY);
  // const constraints = [orderBy('ts', 'desc')];

  // if (typeof cursor === 'number') {
  //   constraints.push(where('ts', '<', cursor));
  // }

  // if (typeof limitValue === 'number' && limitValue > 0) {
  //   constraints.push(limit(limitValue));
  // }

  // const snapshot = await getDocs(query(collectionRef, ...constraints));
  // Temporarily disabled during Firebase → PostgreSQL migration
  const snapshot = { docs: [] };

  return snapshot.docs.map((docSnapshot: any) => {
    const data = docSnapshot.data() as SmartNote;
    return {
      ...data,
      id: docSnapshot.id,
    };
  });
}

export async function fetchAllSmartNotes(_userId: string): Promise<SmartNote[]> {
  const firestore = await getFirestoreInstance();
  if (!firestore) {
    return [];
  }

  // const collectionRef = collection(firestore, 'users', userId, COLLECTION_KEY);
  // const snapshot = await getDocs(query(collectionRef, orderBy('ts', 'desc')));
  // Temporarily disabled during Firebase → PostgreSQL migration
  const snapshot = { docs: [] };

  return snapshot.docs.map((docSnapshot: any) => {
    const data = docSnapshot.data() as SmartNote;
    return {
      ...data,
      id: docSnapshot.id,
    };
  });
}

