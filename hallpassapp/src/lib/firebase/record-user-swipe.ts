import { addDoc, collection, serverTimestamp, type Firestore } from "firebase/firestore";

export async function recordUserSwipeFirebase(
  db: Firestore,
  swiperId: string,
  targetId: string,
  direction: "like" | "pass"
): Promise<void> {
  await addDoc(collection(db, "swipes"), {
    swiper_id: swiperId,
    target_id: targetId,
    direction,
    created_at: serverTimestamp(),
  });
}
