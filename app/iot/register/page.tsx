"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  Cpu,
  Copy,
  Check,
  AlertTriangle,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";

import { useSessionGuard } from "@/hooks/useSessionGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

import { DEVICE_TYPES, type RegisterDeviceResponse } from "@/types/iot";

// Form schema
const registerSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .max(100, "Maximo 100 caracteres"),
  type: z.string().min(1, "Selecciona un tipo"),
  firmwareVersion: z.string().optional(),
});

type RegisterFormData = z.infer<typeof registerSchema>;

async function registerDevice(
  data: RegisterFormData
): Promise<RegisterDeviceResponse> {
  const res = await fetch("/api/iot/devices", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Error al registrar dispositivo");
  }
  return res.json();
}

export default function RegisterDevicePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useSessionGuard();
  const [credentials, setCredentials] = useState<{
    deviceId: string;
    apiKey: string;
  } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      type: "",
      firmwareVersion: "",
    },
  });

  const mutation = useMutation({
    mutationFn: registerDevice,
    onSuccess: (data) => {
      setCredentials(data.credentials);
      toast.success("Dispositivo registrado exitosamente");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success("Copiado al portapapeles");
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error("Error al copiar");
    }
  };

  const onSubmit = (data: RegisterFormData) => {
    mutation.mutate(data);
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 md:px-8 py-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Show credentials after successful registration
  if (credentials) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 md:px-8 py-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-full bg-green-500/10">
            <Check className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Dispositivo Registrado</h1>
            <p className="text-muted-foreground">
              Guarda las credenciales de forma segura
            </p>
          </div>
        </div>

        <Alert variant="destructive" className="border-yellow-500/50 bg-yellow-500/10">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <AlertTitle className="text-yellow-500">Importante</AlertTitle>
          <AlertDescription className="text-yellow-500/90">
            La API Key solo se muestra una vez. Guardala de forma segura, no
            podras volver a verla.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Credenciales del Dispositivo</CardTitle>
            <CardDescription>
              Usa estas credenciales para configurar tu ESP32
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Device ID */}
            <div className="space-y-2">
              <Label>Device ID</Label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={credentials.deviceId}
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    copyToClipboard(credentials.deviceId, "deviceId")
                  }
                >
                  {copiedField === "deviceId" ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* API Key */}
            <div className="space-y-2">
              <Label>API Key</Label>
              <div className="flex items-center gap-2">
                <div className="relative grow">
                  <Input
                    readOnly
                    type={showApiKey ? "text" : "password"}
                    value={credentials.apiKey}
                    className="font-mono text-sm pr-10"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(credentials.apiKey, "apiKey")}
                >
                  {copiedField === "apiKey" ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Code snippet for ESP32 */}
            <div className="space-y-2 pt-4">
              <Label>Configuracion para ESP32 (NVS)</Label>
              <div className="relative">
                <pre className="p-4 rounded-lg bg-muted text-sm font-mono overflow-x-auto">
                  {`// Credenciales para NVS
const char* DEVICE_ID = "${credentials.deviceId}";
const char* API_KEY = "${showApiKey ? credentials.apiKey : "••••••••••••••••"}";`}
                </pre>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() =>
                    copyToClipboard(
                      `const char* DEVICE_ID = "${credentials.deviceId}";\nconst char* API_KEY = "${credentials.apiKey}";`,
                      "code"
                    )
                  }
                >
                  {copiedField === "code" ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => router.push("/iot")}>
            Ir al Dashboard
          </Button>
          <Button
            onClick={() => {
              setCredentials(null);
              mutation.reset();
            }}
          >
            Registrar Otro
          </Button>
        </div>
      </div>
    );
  }

  // Registration form
  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 md:px-8 py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/iot">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Registrar Dispositivo</h1>
          <p className="text-muted-foreground">
            Agrega un nuevo dispositivo IoT a tu cuenta
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Cpu className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle>Informacion del Dispositivo</CardTitle>
              <CardDescription>
                Completa los datos para generar las credenciales
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Device Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Dispositivo *</Label>
              <Input
                id="name"
                placeholder="Ej: Sensor Temperatura Sala"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Device Type */}
            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Dispositivo *</Label>
              <Select
                value={watch("type")}
                onValueChange={(value) => setValue("type", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un tipo" />
                </SelectTrigger>
                <SelectContent>
                  {DEVICE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-destructive">{errors.type.message}</p>
              )}
            </div>

            {/* Firmware Version */}
            <div className="space-y-2">
              <Label htmlFor="firmwareVersion">
                Version de Firmware (opcional)
              </Label>
              <Input
                id="firmwareVersion"
                placeholder="Ej: 1.0.0"
                {...register("firmwareVersion")}
              />
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-4 pt-4">
              <Link href="/iot">
                <Button variant="outline" type="button">
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Registrar Dispositivo
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
