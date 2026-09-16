import { beforeEach, describe, expect, it, vi } from "vitest";

const { addDocMock, updateDocMock, deleteDocMock, onSnapshotMock, writeBatchMock, batchUpdateMock, batchCommitMock } =
  vi.hoisted(() => ({
    addDocMock: vi.fn(),
    updateDocMock: vi.fn(),
    deleteDocMock: vi.fn(),
    onSnapshotMock: vi.fn(),
    batchUpdateMock: vi.fn(),
    batchCommitMock: vi.fn(),
    writeBatchMock: vi.fn(),
  }));

writeBatchMock.mockImplementation(() => ({
  update: batchUpdateMock,
  commit: batchCommitMock,
}));

vi.mock("firebase/firestore", () => ({
  addDoc: addDocMock,
  arrayRemove: vi.fn((value) => ({ __op: "arrayRemove", value })),
  arrayUnion: vi.fn((value) => ({ __op: "arrayUnion", value })),
  collection: vi.fn(() => "collection-ref"),
  deleteDoc: deleteDocMock,
  deleteField: vi.fn(() => ({ __op: "deleteField" })),
  doc: vi.fn((_db, _collection, id) => ({ id })),
  onSnapshot: onSnapshotMock,
  query: vi.fn((...args) => args),
  serverTimestamp: vi.fn(() => "server-timestamp"),
  updateDoc: updateDocMock,
  where: vi.fn((field, op, value) => ({ field, op, value })),
  writeBatch: writeBatchMock,
}));

vi.mock("../firebase", () => ({
  db: {},
}));

import { createGroup, removeMember, respondToInvite, sendInvite } from "./groups";
import type { Group, GroupInvite } from "../types/group";

describe("groups lib", () => {
  beforeEach(() => {
    addDocMock.mockReset();
    updateDocMock.mockReset();
    deleteDocMock.mockReset();
    batchUpdateMock.mockReset();
    batchCommitMock.mockReset();
  });

  it("creates a group with the creator as sole member", async () => {
    await createGroup("user-1", "Alice", "Book club");

    expect(addDocMock).toHaveBeenCalledWith(
      "collection-ref",
      expect.objectContaining({
        name: "Book club",
        ownerId: "user-1",
        memberIds: ["user-1"],
        memberNames: { "user-1": "Alice" },
      })
    );
  });

  it("removes a member from the group", async () => {
    await removeMember("group-1", "user-2");

    expect(updateDocMock).toHaveBeenCalledWith(
      { id: "group-1" },
      expect.objectContaining({
        memberIds: { __op: "arrayRemove", value: "user-2" },
        "memberNames.user-2": { __op: "deleteField" },
      })
    );
  });

  it("sends an invite for a found user", async () => {
    const group: Pick<Group, "id" | "name"> = { id: "group-1", name: "Book club" };
    await sendInvite(group, { uid: "user-2", userName: "Bob" }, "user-1", "Alice");

    expect(addDocMock).toHaveBeenCalledWith(
      "collection-ref",
      expect.objectContaining({
        groupId: "group-1",
        toUserId: "user-2",
        invitedBy: "user-1",
        status: "pending",
      })
    );
  });

  it("accepting an invite updates invite status and adds the member to the group", async () => {
    const invite: GroupInvite = {
      id: "invite-1",
      groupId: "group-1",
      groupName: "Book club",
      toUserId: "user-2",
      toUserNameLower: "bob",
      invitedBy: "user-1",
      invitedByName: "Alice",
      status: "pending",
    };

    await respondToInvite(invite, true, "Bob");

    expect(batchUpdateMock).toHaveBeenCalledWith({ id: "invite-1" }, { status: "accepted" });
    expect(batchUpdateMock).toHaveBeenCalledWith(
      { id: "group-1" },
      expect.objectContaining({
        memberIds: { __op: "arrayUnion", value: "user-2" },
        "memberNames.user-2": "Bob",
      })
    );
    expect(batchCommitMock).toHaveBeenCalled();
  });

  it("declining an invite only updates the invite status", async () => {
    const invite: GroupInvite = {
      id: "invite-1",
      groupId: "group-1",
      groupName: "Book club",
      toUserId: "user-2",
      toUserNameLower: "bob",
      invitedBy: "user-1",
      invitedByName: "Alice",
      status: "pending",
    };

    await respondToInvite(invite, false, "Bob");

    expect(batchUpdateMock).toHaveBeenCalledTimes(1);
    expect(batchUpdateMock).toHaveBeenCalledWith({ id: "invite-1" }, { status: "declined" });
  });
});
