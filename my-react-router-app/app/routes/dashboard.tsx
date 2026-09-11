import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useNavigate } from "react-router";
import MonthCalendar from "../components/dashboard/month-calendar";
import { auth } from "../firebase";
import { THEME_OPTIONS, useTheme } from "../theme";
import "../styles/main.scss";

export default function Dashboard() {
  const [userName, setUserName] = useState("User");
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const themeSelectorRef = useRef<HTMLDivElement | null>(null);
  const { themeId, setThemeId } = useTheme();
  const navigate = useNavigate();

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
    });

    return unsubscribe;
  }, []);

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
            <button type="button" className="sidebar-item sidebar-item--active">
              Calendar overview
            </button>
            <button type="button" className="sidebar-item" disabled>
              My availability
            </button>
            <button type="button" className="sidebar-item" disabled>
              Shared events
            </button>
            <button type="button" className="sidebar-item" disabled>
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
          <MonthCalendar />
        </section>
      </div>
    </div>
  );
}