import { beforeEach, describe, expect, it, vi } from "vitest";

const { getDocMock, setDocMock } = vi.hoisted(() => ({
  getDocMock: vi.fn(),
  setDocMock: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn((_db, _collection, id) => ({ id })),
  getDoc: getDocMock,
  setDoc: setDocMock,
}));

vi.mock("../firebase", () => ({
  db: {},
}));

import { findUserByUsername, isUsernameTaken, reserveUsername } from "./usernames";

describe("usernames lib", () => {
  beforeEach(() => {
    getDocMock.mockReset();
    setDocMock.mockReset();
  });

  it("reports a username as taken when the doc exists", async () => {
    getDocMock.mockResolvedValue({ exists: () => true });
    await expect(isUsernameTaken("alice")).resolves.toBe(true);
  });

  it("reports a username as free when the doc does not exist", async () => {
    getDocMock.mockResolvedValue({ exists: () => false });
    await expect(isUsernameTaken("alice")).resolves.toBe(false);
  });

  it("returns the username record when found", async () => {
    getDocMock.mockResolvedValue({
      exists: () => true,
      data: () => ({ uid: "user-1", userName: "Alice" }),
    });

    await expect(findUserByUsername("alice")).resolves.toEqual({
      uid: "user-1",
      userName: "Alice",
    });
  });

  it("returns null when the username is not found", async () => {
    getDocMock.mockResolvedValue({ exists: () => false });
    await expect(findUserByUsername("nobody")).resolves.toBeNull();
  });

  it("reserves a username using its lowercase form as the doc id", async () => {
    setDocMock.mockResolvedValue(undefined);
    await reserveUsername("user-1", "Alice");

    expect(setDocMock).toHaveBeenCalledWith({ id: "alice" }, { uid: "user-1", userName: "Alice" });
  });
});
