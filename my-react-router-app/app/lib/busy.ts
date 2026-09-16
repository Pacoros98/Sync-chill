import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  setDoc,
  Timestamp,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "../firebase";

export type BusyBlock = {
  id: string;
  uid: string;
  startTime: Date;
  endTime: Date;
};

function busyDocRef(groupId: string, eventId: string) {
  return doc(db, "groups", groupId, "busy", eventId);
}

// Writes a title-free busy marker into every group (other than the event's own)
// so co-members can see the time is taken without exposing personal event details.
export async function syncBusyBlocks(
  userId: string,
  targetGroupIds: string[],
  eventId: string,
  startTime: Date,
  endTime: Date
): Promise<void> {
  await Promise.all(
    targetGroupIds.map((groupId) =>
      setDoc(busyDocRef(groupId, eventId), {
        uid: userId,
        startTime: Timestamp.fromDate(startTime),
        endTime: Timestamp.fromDate(endTime),
      })
    )
  );
}

export async function removeBusyBlocks(targetGroupIds: string[], eventId: string): Promise<void> {
  await Promise.all(
    targetGroupIds.map((groupId) => deleteDoc(busyDocRef(groupId, eventId)).catch(() => undefined))
  );
}

export function subscribeToGroupBusyBlocks(
  groupId: string,
  rangeStart: Date,
  rangeEnd: Date,
  onBlocks: (blocks: BusyBlock[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const busyQuery = query(
    collection(db, "groups", groupId, "busy"),
    where("startTime", ">=", Timestamp.fromDate(rangeStart)),
    where("startTime", "<", Timestamp.fromDate(rangeEnd))
  );

  return onSnapshot(
    busyQuery,
    (snapshot) => {
      onBlocks(
        snapshot.docs.map((docSnapshot) => {
          const data = docSnapshot.data();
          return {
            id: docSnapshot.id,
            uid: data.uid as string,
            startTime: (data.startTime as Timestamp).toDate(),
            endTime: (data.endTime as Timestamp).toDate(),
          };
        })
      );
    },
    (error) => onError?.(error)
  );
}
