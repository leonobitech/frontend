import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import { UserStatus } from "./types/types";

/**
 * Interface defining the shape of the SidebarFooter context.
 * This includes all the state and setter functions that will be shared across components.
 */
interface SidebarFooterContextType {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  userStatus: UserStatus;
  setUserStatus: (status: UserStatus) => void;
  language: string;
  setLanguage: (lang: string) => void;
}

// Create a context with undefined as initial value. The actual value will be provided by the Provider.
const SidebarFooterContext = createContext<
  SidebarFooterContextType | undefined
>(undefined);

/**
 * Custom hook to use the SidebarFooter context.
 * This hook ensures that we're using the context within a provider and provides better error messages if we're not.
 *
 * @returns The context value of type SidebarFooterContextType
 * @throws Error if used outside of a SidebarFooterProvider
 */
export const useSidebarFooter = () => {
  const context = useContext(SidebarFooterContext);
  if (!context) {
    throw new Error(
      "useSidebarFooter must be used within a SidebarFooterProvider"
    );
  }
  return context;
};

/**
 * Provider component for the SidebarFooter context.
 * This component manages the state and provides it to all child components via context.
 *
 * @param props.children - The child components that will have access to the context
 */
export const SidebarFooterProvider: React.FC<
  React.PropsWithChildren<unknown>
> = ({ children }) => {
  // State declarations using useState hook
  const [isOpen, setIsOpen] = useState(false);
  const [userStatus, setUserStatus] = useState<UserStatus>("online");
  const [language, setLanguage] = useState("en");

  // Memoized callback functions to prevent unnecessary re-renders
  const handleSetIsOpen = useCallback((value: boolean) => setIsOpen(value), []);
  const handleSetUserStatus = useCallback(
    (status: UserStatus) => setUserStatus(status),
    []
  );
  const handleSetLanguage = useCallback(
    (lang: string) => setLanguage(lang),
    []
  );

  // Memoized context value to prevent unnecessary re-renders of consuming components
  const contextValue = useMemo(
    () => ({
      isOpen,
      setIsOpen: handleSetIsOpen,
      userStatus,
      setUserStatus: handleSetUserStatus,
      language,
      setLanguage: handleSetLanguage,
    }),
    [
      isOpen,
      userStatus,
      language,
      handleSetIsOpen,
      handleSetUserStatus,
      handleSetLanguage,
    ]
  );

  // Provide the context value to children components
  return (
    <SidebarFooterContext.Provider value={contextValue}>
      {children}
    </SidebarFooterContext.Provider>
  );
};

// Note: We're using React.FC<React.PropsWithChildren<unknown>> instead of {} to satisfy TypeScript's strict type checking.
// 'unknown' is used here to indicate that this component doesn't expect any specific props beyond children.
