import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AvailabilityPanel from "./availability-panel";

const { subscribeToGroupEventsMock, subscribeToGroupBusyBlocksMock } = vi.hoisted(() => ({
  subscribeToGroupEventsMock: vi.fn((_groupId, _start, _end, onEvents: (events: unknown[]) => void) => {
    onEvents([]);
    return () => {};
  }),
  subscribeToGroupBusyBlocksMock: vi.fn(
    (_groupId, _start, _end, onBlocks: (blocks: unknown[]) => void) => {
      onBlocks([
        {
          id: "busy-1",
          uid: "user-2",
          startTime: new Date(2026, 0, 1, 13, 0),
          endTime: new Date(2026, 0, 1, 14, 0),
        },
      ]);
      return () => {};
    }
  ),
}));

vi.mock("../../lib/events", () => ({
  subscribeToGroupEvents: subscribeToGroupEventsMock,
}));

vi.mock("../../lib/busy", () => ({
  subscribeToGroupBusyBlocks: subscribeToGroupBusyBlocksMock,
}));

const groups = [
  {
    id: "group-1",
    name: "Book club",
    ownerId: "user-1",
    memberIds: ["user-1", "user-2"],
    memberNames: { "user-1": "Alice", "user-2": "Bob" },
  },
];

describe("AvailabilityPanel", () => {
  it("shows a prompt when the user has no groups", () => {
    render(<AvailabilityPanel groups={[]} />);
    expect(screen.getByText("Join or create a group to compare availability.")).toBeInTheDocument();
  });

  it("shows each member's busy blocks or a free indicator", () => {
    render(<AvailabilityPanel groups={groups} />);

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Free all day")).toBeInTheDocument();
    expect(screen.getByText(/Busy 1:00 PM – 2:00 PM/)).toBeInTheDocument();
  });
});
