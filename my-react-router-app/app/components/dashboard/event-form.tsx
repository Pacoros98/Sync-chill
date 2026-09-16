import { useState, type FormEvent } from "react";
import type { CalendarEvent, CalendarEventInput } from "../../types/event";
import type { Group } from "../../types/group";

type EventFormProps = {
  defaultDate: Date;
  initialEvent?: CalendarEvent;
  groups: Group[];
  onSubmit: (input: CalendarEventInput) => Promise<void>;
  onCancel: () => void;
};

function toLocalDateTimeInputValue(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

function defaultStartEnd(defaultDate: Date) {
  const start = new Date(defaultDate);
  start.setHours(9, 0, 0, 0);
  const end = new Date(start);
  end.setHours(start.getHours() + 1);
  return { start, end };
}

export default function EventForm({
  defaultDate,
  initialEvent,
  groups,
  onSubmit,
  onCancel,
}: EventFormProps) {
  const { start: defaultStart, end: defaultEnd } = defaultStartEnd(defaultDate);

  const [title, setTitle] = useState(initialEvent?.title ?? "");
  const [description, setDescription] = useState(initialEvent?.description ?? "");
  const [groupId, setGroupId] = useState(initialEvent?.groupId ?? "");
  const [startValue, setStartValue] = useState(
    toLocalDateTimeInputValue(initialEvent?.startTime ?? defaultStart)
  );
  const [endValue, setEndValue] = useState(
    toLocalDateTimeInputValue(initialEvent?.endTime ?? defaultEnd)
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const startTime = new Date(startValue);
    const endTime = new Date(endValue);

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    if (endTime <= startTime) {
      setError("End time must be after start time.");
      return;
    }

    const selectedGroup = groups.find((group) => group.id === groupId);

    setSaving(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        startTime,
        endTime,
        groupId: selectedGroup?.id ?? null,
        participantIds: selectedGroup?.memberIds,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save event.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="event-form-overlay" role="dialog" aria-modal="true" aria-label="Event form">
      <div className="event-form-card">
        <h3>{initialEvent ? "Edit event" : "New event"}</h3>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="event-title">Title</label>
            <input
              id="event-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="event-description">Description</label>
            <textarea
              id="event-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="event-group">Group</label>
            <select
              id="event-group"
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              disabled={Boolean(initialEvent)}
            >
              <option value="">Personal (only me)</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="event-start">Starts</label>
            <input
              id="event-start"
              type="datetime-local"
              value={startValue}
              onChange={(e) => setStartValue(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="event-end">Ends</label>
            <input
              id="event-end"
              type="datetime-local"
              value={endValue}
              onChange={(e) => setEndValue(e.target.value)}
              required
            />
          </div>

          <div className="event-form-actions">
            <button type="button" className="calendar-today-button" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
