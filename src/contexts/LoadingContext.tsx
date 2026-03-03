import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface LoadingContextValue {
  isLoading: boolean;
  loadingText: string;
  showLoader: (text?: string) => void;
  hideLoader: () => void;
}

const LoadingContext = createContext<LoadingContextValue>({
  isLoading: false,
  loadingText: "",
  showLoader: () => {},
  hideLoader: () => {},
});

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");

  const showLoader = useCallback((text = "Preparing your insights...") => {
    setLoadingText(text);
    setIsLoading(true);
  }, []);

  const hideLoader = useCallback(() => {
    setIsLoading(false);
  }, []);

  return (
    <LoadingContext.Provider value={{ isLoading, loadingText, showLoader, hideLoader }}>
      {children}
    </LoadingContext.Provider>
  );
}

export const useLoading = () => useContext(LoadingContext);
