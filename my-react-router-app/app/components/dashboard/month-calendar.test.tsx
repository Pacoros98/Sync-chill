import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import MonthCalendar from "./month-calendar";

function ControlledMonthCalendar() {
  const today = new Date();
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState(today);

  return (
    <MonthCalendar
      visibleMonth={visibleMonth}
      selectedDate={selectedDate}
      onVisibleMonthChange={setVisibleMonth}
      onSelectDate={setSelectedDate}
    />
  );
}

describe("MonthCalendar", () => {
  it("renders the current month and today's date as selected by default", () => {
    render(<ControlledMonthCalendar />);

    const today = new Date();
    const monthLabel = today.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    expect(screen.getByRole("heading", { name: monthLabel })).toBeInTheDocument();
    expect(document.querySelector(".calendar-day--today")).not.toBeNull();
  });

  it("selects a clicked day and marks it visually selected", async () => {
    const user = userEvent.setup();
    render(<ControlledMonthCalendar />);

    const dayButtons = screen.getAllByRole("button", { name: /^\d+$/ });
    await user.click(dayButtons[10]);

    expect(dayButtons[10]).toHaveClass("calendar-day--selected");
  });

  it("navigates to the next month when the next button is clicked", async () => {
    const user = userEvent.setup();
    render(<ControlledMonthCalendar />);

    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const nextMonthLabel = nextMonth.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    await user.click(screen.getByRole("button", { name: "Show next month" }));

    expect(screen.getByRole("heading", { name: nextMonthLabel })).toBeInTheDocument();
  });
});
