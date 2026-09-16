import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  addDocMock,
  updateDocMock,
  deleteDocMock,
  onSnapshotMock,
  collectionMock,
  docMock,
  queryMock,
  whereMock,
  orderByMock,
  timestampFromDateMock,
} = vi.hoisted(() => ({
  addDocMock: vi.fn(),
  updateDocMock: vi.fn(),
  deleteDocMock: vi.fn(),
  onSnapshotMock: vi.fn(),
  collectionMock: vi.fn(() => "events-collection"),
  docMock: vi.fn((_db, _collection, id) => ({ id })),
  queryMock: vi.fn((...args) => args),
  whereMock: vi.fn((field, op, value) => ({ field, op, value })),
  orderByMock: vi.fn((field, direction) => ({ field, direction })),
  timestampFromDateMock: vi.fn((date: Date) => ({ toDate: () => date, __date: date })),
}));

vi.mock("firebase/firestore", () => ({
  addDoc: addDocMock,
  collection: collectionMock,
  deleteDoc: deleteDocMock,
  doc: docMock,
  onSnapshot: onSnapshotMock,
  orderBy: orderByMock,
  query: queryMock,
  serverTimestamp: vi.fn(() => "server-timestamp"),
  updateDoc: updateDocMock,
  where: whereMock,
  Timestamp: { fromDate: timestampFromDateMock },
}));

vi.mock("../firebase", () => ({
  db: {},
}));

import { createEvent, deleteEvent, subscribeToUserEvents, updateEvent } from "./events";

describe("events lib", () => {
  beforeEach(() => {
    addDocMock.mockReset();
    addDocMock.mockResolvedValue({ id: "event-1" });
    updateDocMock.mockReset();
    deleteDocMock.mockReset();
    onSnapshotMock.mockReset();
  });

  it("creates an event with the owner as the sole participant", async () => {
    await createEvent("user-1", {
      title: "Standup",
      description: "Daily sync",
      startTime: new Date(2026, 0, 1, 9, 0),
      endTime: new Date(2026, 0, 1, 9, 30),
    });

    expect(addDocMock).toHaveBeenCalledWith(
      "events-collection",
      expect.objectContaining({
        ownerId: "user-1",
        title: "Standup",
        description: "Daily sync",
        groupId: null,
        participantIds: ["user-1"],
      })
    );
  });

  it("updates an event without touching participantIds", async () => {
    await updateEvent("event-1", {
      title: "Renamed",
      startTime: new Date(2026, 0, 1, 10, 0),
      endTime: new Date(2026, 0, 1, 11, 0),
    });

    expect(updateDocMock).toHaveBeenCalledWith(
      { id: "event-1" },
      expect.objectContaining({ title: "Renamed" })
    );
  });

  it("deletes an event by id", async () => {
    await deleteEvent("event-1");
    expect(deleteDocMock).toHaveBeenCalledWith({ id: "event-1" });
  });

  it("maps snapshot documents into CalendarEvent objects", () => {
    const onEvents = vi.fn();
    const start = new Date(2026, 0, 1, 9, 0);
    const end = new Date(2026, 0, 1, 9, 30);

    onSnapshotMock.mockImplementation((_query, onNext) => {
      onNext({
        docs: [
          {
            id: "event-1",
            data: () => ({
              ownerId: "user-1",
              title: "Standup",
              description: "Daily sync",
              startTime: { toDate: () => start },
              endTime: { toDate: () => end },
              groupId: null,
              participantIds: ["user-1"],
            }),
          },
        ],
      });
      return () => {};
    });

    subscribeToUserEvents("user-1", new Date(2026, 0, 1), new Date(2026, 0, 2), onEvents);

    expect(onEvents).toHaveBeenCalledWith([
      expect.objectContaining({
        id: "event-1",
        title: "Standup",
        startTime: start,
        endTime: end,
      }),
    ]);
  });
});
