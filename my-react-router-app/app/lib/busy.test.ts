import { beforeEach, describe, expect, it, vi } from "vitest";

const { setDocMock, deleteDocMock, onSnapshotMock } = vi.hoisted(() => ({
  setDocMock: vi.fn(),
  deleteDocMock: vi.fn(),
  onSnapshotMock: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(() => "busy-collection"),
  deleteDoc: deleteDocMock,
  doc: vi.fn((_db, ...segments: string[]) => ({ id: segments.join("/") })),
  onSnapshot: onSnapshotMock,
  query: vi.fn((...args) => args),
  setDoc: setDocMock,
  Timestamp: {
    fromDate: vi.fn((date: Date) => ({ toDate: () => date })),
  },
  where: vi.fn((field, op, value) => ({ field, op, value })),
}));

vi.mock("../firebase", () => ({
  db: {},
}));

import { removeBusyBlocks, subscribeToGroupBusyBlocks, syncBusyBlocks } from "./busy";

describe("busy lib", () => {
  beforeEach(() => {
    setDocMock.mockReset();
    deleteDocMock.mockReset();
    onSnapshotMock.mockReset();
  });

  it("writes a title-free busy marker into each target group", async () => {
    setDocMock.mockResolvedValue(undefined);

    await syncBusyBlocks(
      "user-1",
      ["group-1", "group-2"],
      "event-1",
      new Date(2026, 0, 1, 9, 0),
      new Date(2026, 0, 1, 9, 30)
    );

    expect(setDocMock).toHaveBeenCalledTimes(2);
    expect(setDocMock).toHaveBeenCalledWith(
      { id: "groups/group-1/busy/event-1" },
      expect.objectContaining({ uid: "user-1" })
    );
    expect(setDocMock).toHaveBeenCalledWith(
      { id: "groups/group-2/busy/event-1" },
      expect.objectContaining({ uid: "user-1" })
    );
  });

  it("removes busy markers from each target group, ignoring missing docs", async () => {
    deleteDocMock.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error("not-found"));

    await expect(removeBusyBlocks(["group-1", "group-2"], "event-1")).resolves.toBeUndefined();
    expect(deleteDocMock).toHaveBeenCalledTimes(2);
  });

  it("maps busy snapshot docs into BusyBlock objects", () => {
    const onBlocks = vi.fn();
    const start = new Date(2026, 0, 1, 9, 0);
    const end = new Date(2026, 0, 1, 9, 30);

    onSnapshotMock.mockImplementation((_query, onNext) => {
      onNext({
        docs: [
          {
            id: "event-1",
            data: () => ({
              uid: "user-1",
              startTime: { toDate: () => start },
              endTime: { toDate: () => end },
            }),
          },
        ],
      });
      return () => {};
    });

    subscribeToGroupBusyBlocks("group-1", new Date(2026, 0, 1), new Date(2026, 0, 2), onBlocks);

    expect(onBlocks).toHaveBeenCalledWith([
      { id: "event-1", uid: "user-1", startTime: start, endTime: end },
    ]);
  });
});
