// IoT Device types

export type DeviceStatus = "online" | "offline" | "provisioning";

export interface IotDevice {
  id: string;
  deviceId: string;
  name: string;
  type: string;
  firmwareVersion: string | null;
  status: DeviceStatus;
  lastSeen: string | null;
  metadata: Record<string, unknown> | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface IotDeviceWithTelemetry extends IotDevice {
  telemetry: IotTelemetry[];
  pendingCommands: IotCommand[];
}

export interface IotTelemetry {
  id: string;
  deviceId?: string;
  timestamp: string;
  freeHeap: number;
  wifiRssi: number;
  uptimeSecs: number;
  sensors: Record<string, number | string | boolean> | null;
  createdAt: string;
}

export interface IotCommand {
  id: string;
  deviceId: string;
  command: string;
  payload: Record<string, unknown> | null;
  status: "pending" | "sent" | "acknowledged" | "failed";
  sentAt: string | null;
  acknowledgedAt: string | null;
  createdAt: string;
}

// API Request/Response types

export interface RegisterDeviceRequest {
  name: string;
  type: string;
  firmwareVersion?: string;
  metadata?: Record<string, unknown>;
}

export interface RegisterDeviceResponse {
  device: IotDevice;
  credentials: {
    deviceId: string;
    apiKey: string; // Only returned once at registration!
  };
}

export interface SendCommandRequest {
  command: string;
  payload?: Record<string, unknown>;
}

export interface DeviceListResponse {
  devices: IotDevice[];
  total: number;
}

export interface TelemetryResponse {
  telemetry: IotTelemetry[];
  device: IotDevice;
}

// Device type options for registration
export const DEVICE_TYPES = [
  { value: "sensor", label: "Sensor" },
  { value: "actuator", label: "Actuator" },
  { value: "gateway", label: "Gateway" },
  { value: "controller", label: "Controller" },
  { value: "camera", label: "Camera" },
  { value: "other", label: "Other" },
] as const;

export type DeviceType = (typeof DEVICE_TYPES)[number]["value"];
