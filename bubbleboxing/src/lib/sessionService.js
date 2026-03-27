/**
 * sessionService — Firestore read/write for session data.
 */

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase.js';

/**
 * Save a completed session to Firestore.
 * @param {string} userId
 * @param {object} sessionData
 * @returns {Promise<string>} - the new document ID
 */
export async function saveSession(userId, sessionData) {
  const docRef = await addDoc(collection(db, 'sessions'), {
    userId,
    startedAt: serverTimestamp(),
    endedAt: serverTimestamp(),
    duration: sessionData.duration ?? 180,
    totalPops: sessionData.totalPops ?? 0,
    punchEvents: sessionData.punchEvents ?? [],
    averageSpeed: sessionData.averageSpeed ?? 0,
    videoUrl: sessionData.videoUrl ?? null,
    photos: sessionData.photos ?? [],
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Fetch all sessions for a given user, newest first.
 * @param {string} userId
 * @param {number} maxResults
 */
export async function getUserSessions(userId, maxResults = 20) {
  const q = query(
    collection(db, 'sessions'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(maxResults)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Fetch the global leaderboard (top sessions by totalPops).
 * @param {number} maxResults
 */
export async function getLeaderboard(maxResults = 10) {
  const q = query(
    collection(db, 'sessions'),
    orderBy('totalPops', 'desc'),
    limit(maxResults)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Upload a recording Blob to Firebase Storage and return its download URL.
 * @param {string} userId
 * @param {Blob} blob
 * @param {string} sessionId
 */
export async function uploadRecording(userId, blob, sessionId) {
  const ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
  const path = `recordings/${userId}/${sessionId}.${ext}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, blob);
  return getDownloadURL(storageRef);
}

/**
 * Upload a photo Blob to Firebase Storage and return its download URL.
 * @param {string} userId
 * @param {Blob} blob
 * @param {string} sessionId
 * @param {number} index
 */
export async function uploadPhoto(userId, blob, sessionId, index) {
  const path = `photos/${userId}/${sessionId}_${index}.jpg`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, blob);
  return getDownloadURL(storageRef);
}
