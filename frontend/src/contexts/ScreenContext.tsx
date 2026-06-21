import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { ScreenId } from "../types";

interface ScreenContextValue {
  currentScreen: ScreenId;
  loadingText: string;
  errorMessage: string;
  showScreen: (id: ScreenId) => void;
  showLoading: (text: string) => void;
  showError: (msg: string) => void;
}

const ScreenContext = createContext<ScreenContextValue>(null!);

export function ScreenProvider({ children }: { children: ReactNode }) {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>("connect");
  const [loadingText, setLoadingText] = useState("Loading…");
  const [errorMessage, setErrorMessage] = useState("");

  const showScreen = useCallback((id: ScreenId) => setCurrentScreen(id), []);
  const showLoading = useCallback((text: string) => {
    setLoadingText(text);
    setCurrentScreen("loading");
  }, []);
  const showError = useCallback((msg: string) => {
    setErrorMessage(msg);
    setCurrentScreen("error");
  }, []);

  return (
    <ScreenContext.Provider value={{ currentScreen, loadingText, errorMessage, showScreen, showLoading, showError }}>
      {children}
    </ScreenContext.Provider>
  );
}

export function useScreen() {
  return useContext(ScreenContext);
}
