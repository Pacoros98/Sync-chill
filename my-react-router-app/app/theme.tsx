import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

export const THEME_IDS = ["default", "second", "third", "sunset"] as const;

export type ThemeId = (typeof THEME_IDS)[number];

export type ThemeOption = {
  id: ThemeId;
  name: string;
};

export const THEME_OPTIONS: ThemeOption[] = [
  { id: "default", name: "Default" },
  { id: "second", name: "Second Theme" },
  { id: "third", name: "Third Theme" },
  { id: "sunset", name: "Sunset" },
];

const STORAGE_KEY = "sync-n-chill.theme";

type ThemeContextValue = {
  themeId: ThemeId;
  setThemeId: (nextThemeId: ThemeId) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isThemeId(value: string | null | undefined): value is ThemeId {
  return !!value && THEME_IDS.includes(value as ThemeId);
}

function applyBodyTheme(themeId: ThemeId) {
  const themeClasses = THEME_IDS.map((id) => `theme-${id}`);
  document.body.classList.remove(...themeClasses, "second-theme");
  document.body.classList.add(`theme-${themeId}`);
}

function getStoredThemeId(): ThemeId | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = window.localStorage.getItem(STORAGE_KEY);
  return isThemeId(rawValue) ? rawValue : null;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeIdState] = useState<ThemeId>(() => getStoredThemeId() ?? "default");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, themeId);
    }

    applyBodyTheme(themeId);
  }, [themeId]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setCurrentUserId(null);
        return;
      }

      setCurrentUserId(user.uid);

      try {
        const userRef = doc(db, "users", user.uid);
        const profileSnapshot = await getDoc(userRef);
        const remoteThemeId = profileSnapshot.data()?.themeId;

        if (isThemeId(remoteThemeId)) {
          setThemeIdState(remoteThemeId);
          if (typeof window !== "undefined") {
            window.localStorage.setItem(STORAGE_KEY, remoteThemeId);
          }
          return;
        }

        const localThemeId = getStoredThemeId() ?? "default";
        await setDoc(
          userRef,
          {
            themeId: localThemeId,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (error) {
        console.error("Unable to load or sync user theme preference.", error);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!currentUserId) {
      return;
    }

    const persistThemePreference = async () => {
      try {
        await setDoc(
          doc(db, "users", currentUserId),
          {
            themeId,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (error) {
        console.error("Unable to persist user theme preference.", error);
      }
    };

    void persistThemePreference();
  }, [currentUserId, themeId]);

  const setThemeId = useCallback((nextThemeId: ThemeId) => {
    setThemeIdState(nextThemeId);
  }, []);

  const contextValue = useMemo(
    () => ({
      themeId,
      setThemeId,
    }),
    [setThemeId, themeId]
  );

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const contextValue = useContext(ThemeContext);

  if (!contextValue) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return contextValue;
}