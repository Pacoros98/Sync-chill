import type { CalendarEvent } from "../../types/event";

type DayEventsPanelProps = {
  selectedDate: Date;
  events: CalendarEvent[];
  onAddEvent: () => void;
  onEditEvent: (event: CalendarEvent) => void;
  onDeleteEvent: (event: CalendarEvent) => void;
};

function formatTimeRange(event: CalendarEvent) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${formatter.format(event.startTime)} – ${formatter.format(event.endTime)}`;
}

export default function DayEventsPanel({
  selectedDate,
  events,
  onAddEvent,
  onEditEvent,
  onDeleteEvent,
}: DayEventsPanelProps) {
  const selectedDateLabel = selectedDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <section className="day-events-panel">
      <div className="day-events-header">
        <div>
          <p className="selected-date-label">Selected date</p>
          <h3>{selectedDateLabel}</h3>
        </div>
        <button type="button" onClick={onAddEvent}>
          + Add event
        </button>
      </div>

      {events.length === 0 ? (
        <p className="day-events-empty">No events scheduled for this day.</p>
      ) : (
        <ul className="day-events-list">
          {events.map((event) => (
            <li key={event.id} className="day-event-item">
              <div className="day-event-info">
                <p className="day-event-time">{formatTimeRange(event)}</p>
                <p className="day-event-title">{event.title}</p>
                {event.description && (
                  <p className="day-event-description">{event.description}</p>
                )}
              </div>
              <div className="day-event-actions">
                <button
                  type="button"
                  className="calendar-today-button"
                  onClick={() => onEditEvent(event)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="day-event-delete"
                  onClick={() => onDeleteEvent(event)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
