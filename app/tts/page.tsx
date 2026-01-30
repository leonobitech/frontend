"use client";

import { useState, useRef, useCallback } from "react";
import { useSessionGuard } from "@/hooks/useSessionGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AudioLines,
  Loader2,
  Download,
  Play,
  Pause,
  ChevronDown,
  Settings2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MAX_CHARS = 5000;

const FORMAT_OPTIONS = [
  { value: "mp3", label: "MP3", description: "Buena calidad, comprimido" },
  { value: "wav", label: "WAV", description: "Máxima calidad, sin compresión" },
  { value: "ogg", label: "OGG/Opus", description: "Óptimo para voz" },
];

export default function TTSPage() {
  const { user, loading: sessionLoading } = useSessionGuard({ redirectTo: "/login" });

  const [text, setText] = useState("");
  const [format, setFormat] = useState("mp3");
  const [lengthScale, setLengthScale] = useState(1.0);
  const [noiseScale, setNoiseScale] = useState(0.667);
  const [noiseW, setNoiseW] = useState(0.8);
  const [generating, setGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);

  const handleGenerate = useCallback(async () => {
    if (!text.trim()) {
      toast.error("Ingresa un texto para generar audio");
      return;
    }

    setGenerating(true);

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
      setAudioBlob(null);
      setIsPlaying(false);
    }

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim(),
          output_format: format,
          length_scale: lengthScale,
          noise_scale: noiseScale,
          noise_w: noiseW,
        }),
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res
          .json()
          .catch(() => ({ message: "Error generando audio" }));
        toast.error(err.message || "Error generando audio");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setAudioBlob(blob);
      setAudioUrl(url);
      toast.success("Audio generado");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error inesperado";
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  }, [text, format, lengthScale, noiseScale, noiseW, audioUrl]);

  const handleDownload = useCallback(() => {
    if (!audioBlob || !audioUrl) return;
    const ext = format === "ogg" || format === "opus" ? "ogg" : format;
    const a = document.createElement("a");
    a.href = audioUrl;
    a.download = `speech.${ext}`;
    a.click();
  }, [audioBlob, audioUrl, format]);

  const togglePlayback = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleClear = useCallback(() => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setAudioBlob(null);
    setIsPlaying(false);
    setText("");
  }, [audioUrl]);

  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-linear-to-br from-blue-600 to-indigo-600 dark:from-pink-600 dark:to-purple-600">
          <AudioLines className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Text to Speech</h1>
          <p className="text-sm text-muted-foreground">
            Piper TTS &middot; es_AR Daniela
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Text Input */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="tts-text">Texto</Label>
                <span
                  className={cn(
                    "text-xs tabular-nums",
                    text.length > MAX_CHARS
                      ? "text-red-500 font-semibold"
                      : "text-muted-foreground",
                  )}
                >
                  {text.length}/{MAX_CHARS}
                </span>
              </div>
              <Textarea
                id="tts-text"
                placeholder="Pegá o escribí el texto que querés convertir a audio..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={8}
                maxLength={MAX_CHARS}
                className="resize-y min-h-30"
              />
            </div>

            {/* Format selector */}
            <div className="flex items-center gap-4">
              <div className="space-y-1.5 flex-1">
                <Label>Formato</Label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FORMAT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{opt.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {opt.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Advanced controls */}
            <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-muted-foreground"
                >
                  <Settings2 className="h-4 w-4" />
                  Opciones avanzadas
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform",
                      showAdvanced && "rotate-180",
                    )}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Velocidad</Label>
                    <Badge variant="secondary" className="tabular-nums">
                      {lengthScale.toFixed(2)}x
                    </Badge>
                  </div>
                  <Slider
                    value={[lengthScale]}
                    onValueChange={([v]) => setLengthScale(v)}
                    min={0.5}
                    max={2.0}
                    step={0.05}
                  />
                  <p className="text-xs text-muted-foreground">
                    Menor = más rápido, Mayor = más lento
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Variación fonética</Label>
                    <Badge variant="secondary" className="tabular-nums">
                      {noiseScale.toFixed(3)}
                    </Badge>
                  </div>
                  <Slider
                    value={[noiseScale]}
                    onValueChange={([v]) => setNoiseScale(v)}
                    min={0}
                    max={1}
                    step={0.01}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Variación de duración</Label>
                    <Badge variant="secondary" className="tabular-nums">
                      {noiseW.toFixed(2)}
                    </Badge>
                  </div>
                  <Slider
                    value={[noiseW]}
                    onValueChange={([v]) => setNoiseW(v)}
                    min={0}
                    max={1}
                    step={0.01}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <Button
                onClick={handleGenerate}
                disabled={generating || !text.trim() || text.length > MAX_CHARS}
                className="gap-2"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <AudioLines className="h-4 w-4" />
                    Generar Audio
                  </>
                )}
              </Button>
              {text && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="gap-1 text-muted-foreground"
                >
                  <Trash2 className="h-4 w-4" />
                  Limpiar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Audio Result */}
        {audioUrl && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AudioLines className="h-5 w-5 text-green-500" />
                Audio generado
                <Badge variant="outline" className="uppercase text-[10px]">
                  {format}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <audio
                ref={audioRef}
                src={audioUrl}
                onEnded={() => setIsPlaying(false)}
                onPause={() => setIsPlaying(false)}
                onPlay={() => setIsPlaying(true)}
                className="w-full"
                controls
              />
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={togglePlayback}
                  className="gap-2"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="h-4 w-4" />
                      Pausar
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Reproducir
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Descargar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
