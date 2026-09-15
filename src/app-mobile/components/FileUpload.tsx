import { useState, useRef } from "react";
import { Camera, X, Loader2, CheckCircle } from "lucide-react";
import { supabaseClient } from "@/lib/supabaseClient";

interface FileUploadProps {
  userId: string;
  fileType: string;
  label: string;
  onUploadComplete?: (path: string) => void;
  existingPath?: string;
}

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];

export default function FileUpload({ userId, fileType, label, onUploadComplete, existingPath }: FileUploadProps) {
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">(
    existingPath ? "done" : "idle"
  );
  const [preview, setPreview] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setErrorMsg("Format non supporté. Utilisez JPG, PNG ou WebP.");
      setStatus("error");
      return;
    }

    if (file.size > MAX_SIZE) {
      setErrorMsg("Fichier trop volumineux (max 5 Mo).");
      setStatus("error");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    uploadFile(file);
  }

  async function uploadFile(file: File) {
    setStatus("uploading");
    setErrorMsg("");

    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${userId}/${fileType}_${Date.now()}.${ext}`;

      const { error: uploadError } = await supabaseClient.storage
        .from("user-files")
        .upload(path, file, { contentType: file.type, upsert: true });

      if (uploadError) throw uploadError;

      setStatus("done");
      onUploadComplete?.(path);
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Erreur lors de l'upload");
      setStatus("error");
    }
  }

  function remove() {
    setPreview(null);
    setStatus("idle");
    setErrorMsg("");
    if (inputRef.current) inputRef.current.value = "";
  }

  if (status === "done" && (preview || existingPath)) {
    return (
      <div className="relative">
        <div className="w-full h-40 bg-green-50 border-2 border-green-200 rounded-2xl flex items-center justify-center overflow-hidden">
          {preview ? (
            <img src={preview} alt={label} className="w-full h-full object-cover" />
          ) : (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle size={20} />
              <span className="text-sm font-bold">Document enregistré</span>
            </div>
          )}
        </div>
        <button
          onClick={remove}
          className="absolute top-2 right-2 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center"
        >
          <X size={14} className="text-white" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleSelect}
        className="hidden"
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={status === "uploading"}
        className="w-full h-40 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-orange-400 hover:bg-orange-50/50 transition-all active:scale-[0.98] disabled:opacity-50"
      >
        {status === "uploading" ? (
          <Loader2 size={24} className="text-orange-500 animate-spin" />
        ) : (
          <Camera size={24} className="text-gray-400" />
        )}
        <span className="text-sm font-bold text-gray-500">
          {status === "uploading" ? "Envoi en cours..." : label}
        </span>
        <span className="text-[10px] text-gray-400">JPG, PNG • Max 5 Mo</span>
      </button>
      {status === "error" && errorMsg && (
        <p className="text-xs text-red-500 mt-2 font-semibold">{errorMsg}</p>
      )}
    </div>
  );
}
