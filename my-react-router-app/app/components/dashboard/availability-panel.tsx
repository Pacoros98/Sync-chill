import { useEffect, useMemo, useState } from "react";
import { subscribeToGroupBusyBlocks, type BusyBlock } from "../../lib/busy";
import { subscribeToGroupEvents } from "../../lib/events";
import type { CalendarEvent } from "../../types/event";
import type { Group } from "../../types/group";

type AvailabilityPanelProps = {
  groups: Group[];
};

function formatTimeRange(start: Date, end: Date) {
  const formatter = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });
  return `${formatter.format(start)} – ${formatter.format(end)}`;
}

function toDateInputValue(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export default function AvailabilityPanel({ groups }: AvailabilityPanelProps) {
  const [selectedGroupId, setSelectedGroupId] = useState(groups[0]?.id ?? "");
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [groupEvents, setGroupEvents] = useState<CalendarEvent[]>([]);
  const [busyBlocks, setBusyBlocks] = useState<BusyBlock[]>([]);

  useEffect(() => {
    if (!selectedGroupId) {
      setGroupEvents([]);
      setBusyBlocks([]);
      return;
    }

    const rangeStart = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate()
    );
    const rangeEnd = new Date(rangeStart);
    rangeEnd.setDate(rangeStart.getDate() + 1);

    const unsubscribeEvents = subscribeToGroupEvents(
      selectedGroupId,
      rangeStart,
      rangeEnd,
      setGroupEvents,
      (error) => console.error("Unable to load group events.", error)
    );

    const unsubscribeBusy = subscribeToGroupBusyBlocks(
      selectedGroupId,
      rangeStart,
      rangeEnd,
      setBusyBlocks,
      (error) => console.error("Unable to load member availability.", error)
    );

    return () => {
      unsubscribeEvents();
      unsubscribeBusy();
    };
  }, [selectedGroupId, selectedDate]);

  const selectedGroup = useMemo(
    () => groups.find((group) => group.id === selectedGroupId) ?? null,
    [groups, selectedGroupId]
  );

  const busyBlocksByMember = useMemo(() => {
    const map = new Map<string, BusyBlock[]>();
    for (const block of busyBlocks) {
      const existing = map.get(block.uid) ?? [];
      existing.push(block);
      map.set(block.uid, existing);
    }
    return map;
  }, [busyBlocks]);

  if (groups.length === 0) {
    return (
      <div className="availability-panel">
        <p className="day-events-empty">Join or create a group to compare availability.</p>
      </div>
    );
  }

  return (
    <div className="availability-panel">
      <div className="availability-controls">
        <div className="form-group">
          <label htmlFor="availability-group">Group</label>
          <select
            id="availability-group"
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
          >
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="availability-date">Day</label>
          <input
            id="availability-date"
            type="date"
            value={toDateInputValue(selectedDate)}
            onChange={(e) => {
              const [year, month, day] = e.target.value.split("-").map(Number);
              if (year && month && day) {
                setSelectedDate(new Date(year, month - 1, day));
              }
            }}
          />
        </div>
      </div>

      {selectedGroup && (
        <>
          <section className="availability-section">
            <h3>Group events</h3>
            {groupEvents.length === 0 ? (
              <p className="day-events-empty">No group events scheduled for this day.</p>
            ) : (
              <ul className="day-events-list">
                {groupEvents.map((event) => (
                  <li key={event.id} className="day-event-item">
                    <div className="day-event-info">
                      <p className="day-event-time">{formatTimeRange(event.startTime, event.endTime)}</p>
                      <p className="day-event-title">{event.title}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="availability-section">
            <h3>Member availability</h3>
            <p className="day-events-empty">
              Busy blocks reflect each member&apos;s other commitments, without revealing details.
            </p>
            <ul className="availability-member-list">
              {selectedGroup.memberIds.map((memberId) => {
                const memberBlocks = busyBlocksByMember.get(memberId) ?? [];
                return (
                  <li key={memberId} className="availability-member-row">
                    <p className="day-event-title">
                      {selectedGroup.memberNames[memberId] ?? memberId}
                    </p>
                    {memberBlocks.length === 0 ? (
                      <span className="availability-free">Free all day</span>
                    ) : (
                      <ul className="availability-busy-list">
                        {memberBlocks.map((block) => (
                          <li key={block.id} className="availability-busy-chip">
                            Busy {formatTimeRange(block.startTime, block.endTime)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
