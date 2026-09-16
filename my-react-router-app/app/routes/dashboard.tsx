import { useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useNavigate } from "react-router";
import MonthCalendar, {
  dateKey,
  isSameDay,
} from "../components/dashboard/month-calendar";
import AvailabilityPanel from "../components/dashboard/availability-panel";
import DayEventsPanel from "../components/dashboard/day-events-panel";
import EventForm from "../components/dashboard/event-form";
import GroupsPanel from "../components/dashboard/groups-panel";
import { auth } from "../firebase";
import { removeBusyBlocks, syncBusyBlocks } from "../lib/busy";
import { createEvent, deleteEvent, subscribeToUserEvents, updateEvent } from "../lib/events";
import { subscribeToUserGroups } from "../lib/groups";
import { THEME_OPTIONS, useTheme } from "../theme";
import type { CalendarEvent, CalendarEventInput } from "../types/event";
import type { Group } from "../types/group";
import "../styles/main.scss";

export default function Dashboard() {
  const [userName, setUserName] = useState("User");
  const [userId, setUserId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"calendar" | "groups" | "availability">(
    "calendar"
  );
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const themeSelectorRef = useRef<HTMLDivElement | null>(null);
  const { themeId, setThemeId } = useTheme();
  const navigate = useNavigate();

  const today = useMemo(() => new Date(), []);
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState(today);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [eventFormState, setEventFormState] = useState<
    { mode: "create" } | { mode: "edit"; event: CalendarEvent } | null
  >(null);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Unable to sign out.", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const fallbackName = user?.email?.split("@")[0] ?? "User";
      setUserName(user?.displayName?.trim() || fallbackName);
      setUserId(user?.uid ?? null);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!userId) {
      setEvents([]);
      return;
    }

    const rangeStart = new Date(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth() - 1,
      1
    );
    const rangeEnd = new Date(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth() + 2,
      1
    );

    const unsubscribe = subscribeToUserEvents(
      userId,
      rangeStart,
      rangeEnd,
      setEvents,
      (error) => console.error("Unable to load events.", error)
    );

    return unsubscribe;
  }, [userId, visibleMonth]);

  useEffect(() => {
    if (!userId) {
      setGroups([]);
      return;
    }

    const unsubscribe = subscribeToUserGroups(userId, setGroups, (error) =>
      console.error("Unable to load groups.", error)
    );

    return unsubscribe;
  }, [userId]);

  const eventCountByDate = useMemo(() => {
    const counts = new Map<string, number>();
    for (const event of events) {
      const key = dateKey(event.startTime);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  }, [events]);

  const selectedDateEvents = useMemo(
    () => events.filter((event) => isSameDay(event.startTime, selectedDate)),
    [events, selectedDate]
  );

  const handleSaveEvent = async (input: CalendarEventInput) => {
    if (!userId) {
      return;
    }

    // Groups other than the event's own already see it in full via participantIds.
    const otherGroupIds = groups
      .filter((group) => group.id !== input.groupId)
      .map((group) => group.id);

    if (eventFormState?.mode === "edit") {
      const eventId = eventFormState.event.id;
      await updateEvent(eventId, input);
      await syncBusyBlocks(userId, otherGroupIds, eventId, input.startTime, input.endTime);
    } else {
      const eventId = await createEvent(userId, input);
      await syncBusyBlocks(userId, otherGroupIds, eventId, input.startTime, input.endTime);
    }
    setEventFormState(null);
  };

  const handleDeleteEvent = async (event: CalendarEvent) => {
    const confirmed = window.confirm(`Delete "${event.title}"?`);
    if (!confirmed) {
      return;
    }
    const otherGroupIds = groups
      .filter((group) => group.id !== event.groupId)
      .map((group) => group.id);
    await deleteEvent(event.id);
    await removeBusyBlocks(otherGroupIds, event.id);
  };

  useEffect(() => {
    if (!isThemeMenuOpen) {
      return;
    }

    const handleMouseDown = (event: MouseEvent) => {
      if (
        themeSelectorRef.current &&
        !themeSelectorRef.current.contains(event.target as Node)
      ) {
        setIsThemeMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsThemeMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isThemeMenuOpen]);

  return (
    <div className="dashboard-page">
      <div className="dashboard-layout">
        <aside className="dashboard-sidebar">
          <div className="sidebar-brand">
            <p className="sidebar-eyebrow">Sync n Chill</p>
            <h1>{userName}</h1>
            <p className="sidebar-copy">
              Coordinate schedules, compare open days, and plan events in one place.
            </p>
          </div>

          <div className="theme-selector" ref={themeSelectorRef}>
            <button
              type="button"
              className="theme-selector-button"
              onClick={() => setIsThemeMenuOpen((value) => !value)}
              aria-haspopup="menu"
              aria-expanded={isThemeMenuOpen}
              aria-controls="theme-menu"
            >
              Select theme
            </button>

            {isThemeMenuOpen && (
              <div id="theme-menu" className="theme-menu" role="menu" aria-label="Theme options">
                {THEME_OPTIONS.map((theme) => (
                  <button
                    key={theme.id}
                    type="button"
                    className="theme-option"
                    role="menuitemradio"
                    aria-checked={themeId === theme.id}
                    onClick={() => {
                      setThemeId(theme.id);
                      setIsThemeMenuOpen(false);
                    }}
                  >
                    <span
                      className={`theme-option-swatch theme-option-swatch--${theme.id}`}
                      aria-hidden="true"
                    />
                    <span>{theme.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <nav className="sidebar-nav" aria-label="Dashboard sections">
            <button
              type="button"
              className={[
                "sidebar-item",
                activeView === "calendar" ? "sidebar-item--active" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => setActiveView("calendar")}
            >
              Calendar overview
            </button>
            <button type="button" className="sidebar-item" disabled>
              My availability
            </button>
            <button
              type="button"
              className={[
                "sidebar-item",
                activeView === "availability" ? "sidebar-item--active" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => setActiveView("availability")}
            >
              Group availability
            </button>
            <button
              type="button"
              className={[
                "sidebar-item",
                activeView === "groups" ? "sidebar-item--active" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => setActiveView("groups")}
            >
              Groups
            </button>
            <button type="button" className="sidebar-item" disabled>
              Settings
            </button>
          </nav>

          <div className="sidebar-bottom">
            <button type="button" className="sidebar-signout" onClick={handleSignOut}>
              Sign out
            </button>

            <div className="sidebar-footnote">
              <span className="status-dot" aria-hidden="true" />
              More dashboard views can be added here later.
            </div>
          </div>
        </aside>

        <section className="dashboard-content">
          {activeView === "groups" && userId ? (
            <GroupsPanel userId={userId} userName={userName} />
          ) : activeView === "availability" ? (
            <AvailabilityPanel groups={groups} />
          ) : (
            <div className="dashboard-panels">
              <MonthCalendar
                visibleMonth={visibleMonth}
                selectedDate={selectedDate}
                onVisibleMonthChange={setVisibleMonth}
                onSelectDate={setSelectedDate}
                eventCountByDate={eventCountByDate}
              />
              <DayEventsPanel
                selectedDate={selectedDate}
                events={selectedDateEvents}
                onAddEvent={() => setEventFormState({ mode: "create" })}
                onEditEvent={(event) => setEventFormState({ mode: "edit", event })}
                onDeleteEvent={handleDeleteEvent}
              />
            </div>
          )}
        </section>
      </div>

      {eventFormState && (
        <EventForm
          defaultDate={selectedDate}
          initialEvent={eventFormState.mode === "edit" ? eventFormState.event : undefined}
          groups={groups}
          onSubmit={handleSaveEvent}
          onCancel={() => setEventFormState(null)}
        />
      )}
    </div>
  );
}