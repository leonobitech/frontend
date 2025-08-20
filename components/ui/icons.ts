import {
  Shield,
  Activity,
  Mic,
  Server,
  UserCheck,
  FlaskConical,
  BotMessageSquare,
} from "lucide-react";

export const ICONS = {
  Shield,
  Activity,
  Mic,
  Server,
  UserCheck,
  FlaskConical,
  BotMessageSquare, // fallback
} as const;

export type IconKey = keyof typeof ICONS;
export const DefaultIcon = FlaskConical;
