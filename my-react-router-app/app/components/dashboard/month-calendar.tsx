import { useMemo } from "react";

type CalendarDay = {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
};

type MonthCalendarProps = {
  visibleMonth: Date;
  selectedDate: Date;
  onVisibleMonthChange: (nextMonth: Date) => void;
  onSelectDate: (nextDate: Date) => void;
  eventCountByDate?: Map<string, number>;
};

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function isSameDay(firstDate: Date, secondDate: Date) {
  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  );
}

// Key used to look up event counts per day, independent of time-of-day.
export function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

export default function MonthCalendar({
  visibleMonth,
  selectedDate,
  onVisibleMonthChange,
  onSelectDate,
  eventCountByDate,
}: MonthCalendarProps) {
  const calendarDays = useMemo(
    () => buildCalendarDays(visibleMonth),
    [visibleMonth]
  );

  const monthLabel = visibleMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const goToPreviousMonth = () => {
    onVisibleMonthChange(
      new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1)
    );
  };

  const goToNextMonth = () => {
    onVisibleMonthChange(
      new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1)
    );
  };

  const goToToday = () => {
    const currentDate = new Date();
    onVisibleMonthChange(
      new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    );
    onSelectDate(currentDate);
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
          const eventCount = eventCountByDate?.get(dateKey(day.date)) ?? 0;

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
              onClick={() => onSelectDate(day.date)}
            >
              <span className="calendar-day-number">{day.date.getDate()}</span>
              {eventCount > 0 && (
                <span
                  className="calendar-day-indicator"
                  aria-label={`${eventCount} event${eventCount === 1 ? "" : "s"}`}
                >
                  {eventCount > 9 ? "9+" : eventCount}
                </span>
              )}
            </button>
          );
        })}
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
    </section>
  );
}