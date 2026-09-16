import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import GroupsPanel from "./groups-panel";

const { createGroupMock, subscribeToUserGroupsMock, subscribeToMyInvitesMock } = vi.hoisted(() => ({
  createGroupMock: vi.fn().mockResolvedValue(undefined),
  subscribeToUserGroupsMock: vi.fn((_userId, onGroups: (groups: unknown[]) => void) => {
    onGroups([]);
    return () => {};
  }),
  subscribeToMyInvitesMock: vi.fn((_userId, onInvites: (invites: unknown[]) => void) => {
    onInvites([]);
    return () => {};
  }),
}));

vi.mock("../../lib/groups", () => ({
  createGroup: createGroupMock,
  deleteGroup: vi.fn(),
  removeMember: vi.fn(),
  renameGroup: vi.fn(),
  respondToInvite: vi.fn(),
  sendInvite: vi.fn(),
  subscribeToMyInvites: subscribeToMyInvitesMock,
  subscribeToUserGroups: subscribeToUserGroupsMock,
}));

vi.mock("../../lib/usernames", () => ({
  findUserByUsername: vi.fn(),
}));

describe("GroupsPanel", () => {
  it("shows an empty state and creates a new group", async () => {
    const user = userEvent.setup();
    render(<GroupsPanel userId="user-1" userName="Alice" />);

    expect(screen.getByText("No groups yet.")).toBeInTheDocument();

    await user.type(screen.getByLabelText("New group"), "Book club");
    await user.click(screen.getByRole("button", { name: "Create group" }));

    expect(createGroupMock).toHaveBeenCalledWith("user-1", "Alice", "Book club");
  });

  it("requires a group name before creating", async () => {
    const user = userEvent.setup();
    render(<GroupsPanel userId="user-1" userName="Alice" />);

    await user.click(screen.getByRole("button", { name: "Create group" }));

    expect(await screen.findByText("Group name is required.")).toBeInTheDocument();
    expect(createGroupMock).not.toHaveBeenCalled();
  });
});
