import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "../firebase";
import type { CalendarEvent, CalendarEventInput } from "../types/event";

const EVENTS_COLLECTION = "events";

function toCalendarEvent(id: string, data: Record<string, unknown>): CalendarEvent {
  return {
    id,
    ownerId: data.ownerId as string,
    title: data.title as string,
    description: (data.description as string | undefined) ?? "",
    startTime: (data.startTime as Timestamp).toDate(),
    endTime: (data.endTime as Timestamp).toDate(),
    groupId: (data.groupId as string | null | undefined) ?? null,
    participantIds: (data.participantIds as string[] | undefined) ?? [],
    createdAt: (data.createdAt as Timestamp | undefined)?.toDate(),
    updatedAt: (data.updatedAt as Timestamp | undefined)?.toDate(),
  };
}

// Subscribes to events where the user participates, within [rangeStart, rangeEnd).
export function subscribeToUserEvents(
  userId: string,
  rangeStart: Date,
  rangeEnd: Date,
  onEvents: (events: CalendarEvent[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const eventsQuery = query(
    collection(db, EVENTS_COLLECTION),
    where("participantIds", "array-contains", userId),
    where("startTime", ">=", Timestamp.fromDate(rangeStart)),
    where("startTime", "<", Timestamp.fromDate(rangeEnd)),
    orderBy("startTime", "asc")
  );

  return onSnapshot(
    eventsQuery,
    (snapshot) => {
      onEvents(
        snapshot.docs.map((docSnapshot) => toCalendarEvent(docSnapshot.id, docSnapshot.data()))
      );
    },
    (error) => onError?.(error)
  );
}

export async function createEvent(userId: string, input: CalendarEventInput): Promise<string> {
  const docRef = await addDoc(collection(db, EVENTS_COLLECTION), {
    ownerId: userId,
    title: input.title,
    description: input.description ?? "",
    startTime: Timestamp.fromDate(input.startTime),
    endTime: Timestamp.fromDate(input.endTime),
    groupId: input.groupId ?? null,
    participantIds: input.participantIds?.length ? input.participantIds : [userId],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

// Events shared with a specific group, used for the group availability overlay.
export function subscribeToGroupEvents(
  groupId: string,
  rangeStart: Date,
  rangeEnd: Date,
  onEvents: (events: CalendarEvent[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const eventsQuery = query(
    collection(db, EVENTS_COLLECTION),
    where("groupId", "==", groupId),
    where("startTime", ">=", Timestamp.fromDate(rangeStart)),
    where("startTime", "<", Timestamp.fromDate(rangeEnd)),
    orderBy("startTime", "asc")
  );

  return onSnapshot(
    eventsQuery,
    (snapshot) => {
      onEvents(
        snapshot.docs.map((docSnapshot) => toCalendarEvent(docSnapshot.id, docSnapshot.data()))
      );
    },
    (error) => onError?.(error)
  );
}

export async function updateEvent(eventId: string, input: CalendarEventInput): Promise<void> {
  await updateDoc(doc(db, EVENTS_COLLECTION, eventId), {
    title: input.title,
    description: input.description ?? "",
    startTime: Timestamp.fromDate(input.startTime),
    endTime: Timestamp.fromDate(input.endTime),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteEvent(eventId: string): Promise<void> {
  await deleteDoc(doc(db, EVENTS_COLLECTION, eventId));
}
