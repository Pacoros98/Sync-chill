import { useMemo, useState } from "react";

type CalendarDay = {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
};

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function isSameDay(firstDate: Date, secondDate: Date) {
  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  );
}

function buildCalendarDays(visibleMonth: Date): CalendarDay[] {
  const firstDayOfMonth = new Date(
    visibleMonth.getFullYear(),
    visibleMonth.getMonth(),
    1
  );

  const firstVisibleDay = new Date(firstDayOfMonth);
  firstVisibleDay.setDate(firstDayOfMonth.getDate() - firstDayOfMonth.getDay());

  const today = new Date();
  const days: CalendarDay[] = [];

  for (let index = 0; index < 42; index += 1) {
    const date = new Date(firstVisibleDay);
    date.setDate(firstVisibleDay.getDate() + index);

    days.push({
      date,
      isCurrentMonth: date.getMonth() === visibleMonth.getMonth(),
      isToday: isSameDay(date, today),
    });
  }

  return days;
}

export default function MonthCalendar() {
  const today = new Date();

  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState(today);

  const calendarDays = useMemo(
    () => buildCalendarDays(visibleMonth),
    [visibleMonth]
  );

  const monthLabel = visibleMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const selectedDateLabel = selectedDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const goToPreviousMonth = () => {
    setVisibleMonth(
      (currentMonth) =>
        new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const goToNextMonth = () => {
    setVisibleMonth(
      (currentMonth) =>
        new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  const goToToday = () => {
    const currentDate = new Date();
    setVisibleMonth(
      new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    );
    setSelectedDate(currentDate);
  };

  return (
    <section className="calendar-panel">
      <div className="calendar-toolbar">
        <div>
          <p className="calendar-kicker">Shared calendar</p>
          <h2>{monthLabel}</h2>
        </div>

        <div className="calendar-actions">
          <button
            type="button"
            className="calendar-nav-button"
            onClick={goToPreviousMonth}
            aria-label="Show previous month"
          >
            ←
          </button>

          <button
            type="button"
            className="calendar-today-button"
            onClick={goToToday}
          >
            Today
          </button>

          <button
            type="button"
            className="calendar-nav-button"
            onClick={goToNextMonth}
            aria-label="Show next month"
          >
            →
          </button>
        </div>
      </div>

      <div className="calendar-weekdays">
        {weekdayLabels.map((weekday) => (
          <div key={weekday} className="calendar-weekday">
            {weekday}
          </div>
        ))}
      </div>

      <div className="calendar-grid">
        {calendarDays.map((day) => {
          const isSelected = isSameDay(day.date, selectedDate);

          return (
            <button
              key={day.date.toISOString()}
              type="button"
              className={[
                "calendar-day",
                day.isCurrentMonth ? "" : "calendar-day--outside",
                day.isToday ? "calendar-day--today" : "",
                isSelected ? "calendar-day--selected" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => setSelectedDate(day.date)}
            >
              <span className="calendar-day-number">{day.date.getDate()}</span>
            </button>
          );
        })}
      </div>

      <div className="calendar-footer">
        <div className="selected-date-card">
          <p className="selected-date-label">Selected date</p>
          <h3>{selectedDateLabel}</h3>
          <p>
            This panel can later show events, availability, or proposed plans
            for the selected day.
          </p>
        </div>

        <div className="calendar-legend">
          <div className="legend-item">
            <span className="legend-swatch legend-swatch--today" />
            <span>Today</span>
          </div>
          <div className="legend-item">
            <span className="legend-swatch legend-swatch--selected" />
            <span>Selected date</span>
          </div>
          <div className="legend-item">
            <span className="legend-swatch legend-swatch--muted" />
            <span>Outside current month</span>
          </div>
        </div>
      </div>
    </section>
  );
}