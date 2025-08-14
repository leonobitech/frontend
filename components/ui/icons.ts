import {
  Shield,
  Activity,
  Mic,
  Server,
  UserCheck,
  FlaskConical,
} from "lucide-react";

export const ICONS = {
  Shield,
  Activity,
  Mic,
  Server,
  UserCheck,
  FlaskConical, // fallback
} as const;

export type IconKey = keyof typeof ICONS;
export const DefaultIcon = FlaskConical;
