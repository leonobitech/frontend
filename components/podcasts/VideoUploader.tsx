"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, Film, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useSession } from "@/app/context/SessionContext";

interface VideoUploaderProps {
  onUploadComplete?: (data: PodcastUploadResponse) => void;
  onCancel?: () => void;
}

export interface PodcastFormData {
  title: string;
  artist: string;
  description: string;
  duration: string;
}

export interface PodcastUploadResponse {
  success: boolean;
  userId: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number;
  title: string;
  artist: string;
  description: string;
}

type UploadStatus = "idle" | "validating" | "uploading" | "processing" | "complete" | "error";

const ALLOWED_VIDEO_TYPES = ["video/mp4"];
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const REQUIRED_ASPECT_RATIO = 9 / 16; // Vertical format
const ASPECT_RATIO_TOLERANCE = 0.05; // 5% tolerance

export function VideoUploader({ onUploadComplete, onCancel }: VideoUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [videoDuration, setVideoDuration] = useState<string>("");

  const [formData, setFormData] = useState<PodcastFormData>({
    title: "",
    artist: "",
    description: "",
    duration: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const { user } = useSession();

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
      return "Formato no soportado. Solo se permite MP4.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return `El archivo es muy grande. Máximo ${MAX_FILE_SIZE / 1024 / 1024}MB.`;
    }
    return null;
  };

  const validateAspectRatio = (width: number, height: number): boolean => {
    const aspectRatio = width / height;
    return Math.abs(aspectRatio - REQUIRED_ASPECT_RATIO) <= ASPECT_RATIO_TOLERANCE;
  };

  const handleFileSelect = useCallback((selectedFile: File) => {
    setError(null);
    setUploadStatus("validating");

    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      setUploadStatus("error");
      return;
    }

    const url = URL.createObjectURL(selectedFile);

    // Validate aspect ratio and extract duration when metadata loads
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      // Check aspect ratio (9:16 vertical)
      if (!validateAspectRatio(video.videoWidth, video.videoHeight)) {
        setError("El video debe ser vertical (9:16). Ejemplo: 1080x1920.");
        setUploadStatus("error");
        URL.revokeObjectURL(url);
        return;
      }

      // Video is valid - set file and preview
      setFile(selectedFile);
      setPreview(url);
      setUploadStatus("idle");

      const duration = formatDuration(video.duration);
      setVideoDuration(duration);
      setFormData((prev) => ({ ...prev, duration }));
    };
    video.onerror = () => {
      setError("Error al cargar el video. Verifica que sea un MP4 válido.");
      setUploadStatus("error");
      URL.revokeObjectURL(url);
    };
    video.src = url;
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        handleFileSelect(droppedFile);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const clearFile = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setFile(null);
    setPreview(null);
    setUploadStatus("idle");
    setUploadProgress(0);
    setError(null);
    setVideoDuration("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = async () => {
    if (!file || !user) return;

    // Validate form
    if (!formData.title.trim()) {
      setError("El título es requerido");
      return;
    }
    if (!formData.artist.trim()) {
      setError("El artista es requerido");
      return;
    }

    setError(null);
    setUploadStatus("uploading");
    setUploadProgress(0);

    try {
      // Convert file to base64 (same pattern as avatar upload)
      const toBase64 = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
        });

      // Simulate initial progress while converting
      setUploadProgress(10);
      const base64 = await toBase64(file);
      const base64Data = base64.split(",")[1]; // Remove data:video/...;base64, prefix
      setUploadProgress(20);

      // Simulate progress during upload
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 85) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 5;
        });
      }, 800);

      // Send to Next.js API route (proxy to n8n)
      const response = await fetch("/api/admin/upload-podcast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          userId: user.id,
          title: formData.title,
          artist: formData.artist,
          description: formData.description,
          filename: file.name,
          mimeType: file.type,
          fileData: base64Data,
        }),
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al subir el video");
      }

      const result = await response.json();

      setUploadProgress(100);
      setUploadStatus("complete");

      // Call completion callback with full response
      if (onUploadComplete) {
        onUploadComplete({
          success: true,
          userId: user.id,
          videoUrl: result.videoUrl,
          thumbnailUrl: result.thumbnailUrl,
          duration: result.duration,
          title: formData.title,
          artist: formData.artist,
          description: formData.description,
        });
      }
    } catch (err) {
      setUploadStatus("error");
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  const isFormValid = file && formData.title.trim() && formData.artist.trim();

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      {!file ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300",
            isDragging
              ? "border-blue-400 bg-blue-500/10 scale-[1.02]"
              : "border-white/20 hover:border-white/40 hover:bg-white/5",
            uploadStatus === "error" && "border-red-400 bg-red-500/10"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4"
            onChange={handleInputChange}
            className="hidden"
          />

          <div className="flex flex-col items-center gap-4">
            {uploadStatus === "validating" ? (
              <Loader2 className="h-12 w-12 text-blue-400 animate-spin" />
            ) : (
              <div className={cn(
                "p-4 rounded-full transition-colors",
                isDragging ? "bg-blue-500/20" : "bg-white/10"
              )}>
                <Upload className={cn(
                  "h-8 w-8",
                  isDragging ? "text-blue-400" : "text-white/60"
                )} />
              </div>
            )}

            <div>
              <p className="text-lg font-medium text-white">
                {isDragging ? "Suelta el video aquí" : "Arrastra un video o haz clic"}
              </p>
              <p className="text-sm text-white/50 mt-1">
                Solo MP4 • Formato vertical 9:16 • Máximo 500MB
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Video Preview */
        <div className="relative rounded-xl overflow-hidden bg-black/40 border border-white/10">
          <div className="aspect-video relative">
            <video
              ref={videoPreviewRef}
              src={preview || undefined}
              className="w-full h-full object-contain"
              controls
            />

            {/* Clear button */}
            <Button
              size="icon"
              variant="ghost"
              onClick={clearFile}
              className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/60 hover:bg-black/80 text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* File info */}
          <div className="p-3 bg-white/5 border-t border-white/10 flex items-center gap-3">
            <Film className="h-5 w-5 text-blue-400" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{file.name}</p>
              <p className="text-xs text-white/50">
                {(file.size / 1024 / 1024).toFixed(2)} MB
                {videoDuration && ` • ${videoDuration}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Upload Progress */}
      {uploadStatus === "uploading" && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-white/70">Subiendo video...</span>
            <span className="text-blue-400">{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

      {/* Success Message */}
      {uploadStatus === "complete" && (
        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Video subido exitosamente
        </div>
      )}

      {/* Form Fields */}
      {file && uploadStatus !== "complete" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-white/80">
              Título <span className="text-red-400">*</span>
            </Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleFormChange}
              placeholder="Nombre del episodio"
              className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="artist" className="text-white/80">
              Artista / Autor <span className="text-red-400">*</span>
            </Label>
            <Input
              id="artist"
              name="artist"
              value={formData.artist}
              onChange={handleFormChange}
              placeholder="Nombre del creador"
              className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-white/80">
              Descripción
            </Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleFormChange}
              placeholder="Breve descripción del episodio"
              rows={3}
              className="bg-white/5 border-white/20 text-white placeholder:text-white/40 resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration" className="text-white/80">
              Duración
            </Label>
            <Input
              id="duration"
              name="duration"
              value={formData.duration || videoDuration}
              onChange={handleFormChange}
              placeholder="00:00"
              className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
              readOnly={!!videoDuration}
            />
            {videoDuration && (
              <p className="text-xs text-white/40">Detectada automáticamente del video</p>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-2">
        {onCancel && (
          <Button
            variant="ghost"
            onClick={onCancel}
            disabled={uploadStatus === "uploading"}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            Cancelar
          </Button>
        )}

        {file && uploadStatus !== "complete" && (
          <Button
            onClick={handleUpload}
            disabled={!isFormValid || uploadStatus === "uploading"}
            className="bg-blue-600 hover:bg-blue-500 text-white"
          >
            {uploadStatus === "uploading" ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Subiendo...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Subir Podcast
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
