import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  deleteField,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
  type Timestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "../firebase";
import type { Group, GroupInvite } from "../types/group";
import type { UsernameRecord } from "./usernames";

const GROUPS_COLLECTION = "groups";
const INVITES_COLLECTION = "invites";

function toGroup(id: string, data: Record<string, unknown>): Group {
  return {
    id,
    name: data.name as string,
    ownerId: data.ownerId as string,
    memberIds: (data.memberIds as string[] | undefined) ?? [],
    memberNames: (data.memberNames as Record<string, string> | undefined) ?? {},
    createdAt: (data.createdAt as Timestamp | undefined)?.toDate(),
    updatedAt: (data.updatedAt as Timestamp | undefined)?.toDate(),
  };
}

function toInvite(id: string, data: Record<string, unknown>): GroupInvite {
  return {
    id,
    groupId: data.groupId as string,
    groupName: data.groupName as string,
    toUserId: data.toUserId as string,
    toUserNameLower: data.toUserNameLower as string,
    invitedBy: data.invitedBy as string,
    invitedByName: data.invitedByName as string,
    status: data.status as GroupInvite["status"],
    createdAt: (data.createdAt as Timestamp | undefined)?.toDate(),
  };
}

export function subscribeToUserGroups(
  userId: string,
  onGroups: (groups: Group[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const groupsQuery = query(
    collection(db, GROUPS_COLLECTION),
    where("memberIds", "array-contains", userId)
  );

  return onSnapshot(
    groupsQuery,
    (snapshot) => onGroups(snapshot.docs.map((docSnapshot) => toGroup(docSnapshot.id, docSnapshot.data()))),
    (error) => onError?.(error)
  );
}

export function subscribeToMyInvites(
  userId: string,
  onInvites: (invites: GroupInvite[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const invitesQuery = query(
    collection(db, INVITES_COLLECTION),
    where("toUserId", "==", userId),
    where("status", "==", "pending")
  );

  return onSnapshot(
    invitesQuery,
    (snapshot) => onInvites(snapshot.docs.map((docSnapshot) => toInvite(docSnapshot.id, docSnapshot.data()))),
    (error) => onError?.(error)
  );
}

export async function createGroup(userId: string, userName: string, name: string): Promise<void> {
  await addDoc(collection(db, GROUPS_COLLECTION), {
    name,
    ownerId: userId,
    memberIds: [userId],
    memberNames: { [userId]: userName },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function renameGroup(groupId: string, name: string): Promise<void> {
  await updateDoc(doc(db, GROUPS_COLLECTION, groupId), {
    name,
    updatedAt: serverTimestamp(),
  });
}

export async function removeMember(groupId: string, memberId: string): Promise<void> {
  await updateDoc(doc(db, GROUPS_COLLECTION, groupId), {
    memberIds: arrayRemove(memberId),
    [`memberNames.${memberId}`]: deleteField(),
    updatedAt: serverTimestamp(),
  });
}

export async function leaveGroup(groupId: string, userId: string): Promise<void> {
  await removeMember(groupId, userId);
}

export async function deleteGroup(groupId: string): Promise<void> {
  await deleteDoc(doc(db, GROUPS_COLLECTION, groupId));
}

export async function sendInvite(
  group: Pick<Group, "id" | "name">,
  toUser: UsernameRecord,
  invitedBy: string,
  invitedByName: string
): Promise<void> {
  await addDoc(collection(db, INVITES_COLLECTION), {
    groupId: group.id,
    groupName: group.name,
    toUserId: toUser.uid,
    toUserNameLower: toUser.userName.toLowerCase(),
    invitedBy,
    invitedByName,
    status: "pending",
    createdAt: serverTimestamp(),
  });
}

export async function respondToInvite(
  invite: GroupInvite,
  accept: boolean,
  userName: string
): Promise<void> {
  const batch = writeBatch(db);
  const inviteRef = doc(db, INVITES_COLLECTION, invite.id);
  batch.update(inviteRef, { status: accept ? "accepted" : "declined" });

  if (accept) {
    const groupRef = doc(db, GROUPS_COLLECTION, invite.groupId);
    batch.update(groupRef, {
      memberIds: arrayUnion(invite.toUserId),
      [`memberNames.${invite.toUserId}`]: userName,
      updatedAt: serverTimestamp(),
    });
  }

  await batch.commit();
}
