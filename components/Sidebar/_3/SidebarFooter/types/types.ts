// REVIEW: Consider using an enum for UserStatus to ensure type safety
export type UserStatus = "online" | "idle" | "dnd" | "offline";

// Labels for each user status
export const statusLabels: Record<UserStatus, string> = {
  online: "Online",
  idle: "Absent",
  dnd: "Busy",
  offline: "Invisible",
};

export interface CustomSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
  triggerClassName?: string;
  contentClassName?: string;
  alignOffset?: number;
}
