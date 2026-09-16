import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import EventForm from "./event-form";

describe("EventForm", () => {
  it("rejects submission when end time is before start time", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    const defaultDate = new Date(2026, 0, 15);

    render(<EventForm defaultDate={defaultDate} groups={[]} onSubmit={onSubmit} onCancel={() => {}} />);

    await user.type(screen.getByLabelText("Title"), "Team sync");
    await user.clear(screen.getByLabelText("Ends"));
    await user.type(screen.getByLabelText("Ends"), "2026-01-15T08:00");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("End time must be after start time.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits trimmed title, description, and parsed dates", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    const defaultDate = new Date(2026, 0, 15);

    render(<EventForm defaultDate={defaultDate} groups={[]} onSubmit={onSubmit} onCancel={() => {}} />);

    await user.type(screen.getByLabelText("Title"), "  Team sync  ");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Team sync",
        description: "",
      })
    );
  });

  it("requires a non-empty title", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    const defaultDate = new Date(2026, 0, 15);

    render(<EventForm defaultDate={defaultDate} groups={[]} onSubmit={onSubmit} onCancel={() => {}} />);

    await user.type(screen.getByLabelText("Title"), "   ");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Title is required.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("includes the selected group's member list as participants", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    const defaultDate = new Date(2026, 0, 15);
    const groups = [
      {
        id: "group-1",
        name: "Book club",
        ownerId: "user-1",
        memberIds: ["user-1", "user-2"],
        memberNames: { "user-1": "Alice", "user-2": "Bob" },
      },
    ];

    render(<EventForm defaultDate={defaultDate} groups={groups} onSubmit={onSubmit} onCancel={() => {}} />);

    await user.type(screen.getByLabelText("Title"), "Book meetup");
    await user.selectOptions(screen.getByLabelText("Group"), "group-1");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        groupId: "group-1",
        participantIds: ["user-1", "user-2"],
      })
    );
  });

  it("disables the group selector when editing an existing event", () => {
    const defaultDate = new Date(2026, 0, 15);
    const initialEvent = {
      id: "event-1",
      ownerId: "user-1",
      title: "Standup",
      description: "",
      startTime: new Date(2026, 0, 15, 9, 0),
      endTime: new Date(2026, 0, 15, 9, 30),
      groupId: null,
      participantIds: ["user-1"],
    };

    render(
      <EventForm
        defaultDate={defaultDate}
        initialEvent={initialEvent}
        groups={[]}
        onSubmit={vi.fn()}
        onCancel={() => {}}
      />
    );

    expect(screen.getByLabelText("Group")).toBeDisabled();
  });
});
