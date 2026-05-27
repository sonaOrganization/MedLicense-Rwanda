"use client";
import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { X, Upload, Film, CheckCircle, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

interface Category { id: string; name_en: string; }

interface Props {
  open: boolean;
  onClose: () => void;
  categories: Category[];
}

type Step = "form" | "uploading" | "done" | "error";

const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5 GB
const ACCEPTED = ["video/mp4", "video/quicktime", "video/x-msvideo", "video/webm", "video/mpeg"];

export function VideoUploadModal({ open, onClose, categories }: Props) {
  const router  = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const xhrRef  = useRef<XMLHttpRequest | null>(null);

  const [step,        setStep]       = useState<Step>("form");
  const [titleEn,     setTitleEn]    = useState("");
  const [description, setDescription] = useState("");
  const [categoryId,  setCategoryId] = useState(categories[0]?.id ?? "");
  const [isFree,      setIsFree]     = useState(false);
  const [file,        setFile]       = useState<File | null>(null);
  const [progress,    setProgress]   = useState(0);
  const [dragOver,    setDragOver]   = useState(false);
  const [errMsg,      setErrMsg]     = useState("");

  function reset() {
    setStep("form");
    setTitleEn("");
    setDescription("");
    setCategoryId(categories[0]?.id ?? "");
    setIsFree(false);
    setFile(null);
    setProgress(0);
    setErrMsg("");
  }

  function handleClose() {
    if (step === "uploading") {
      if (!confirm("Cancel the upload in progress?")) return;
      xhrRef.current?.abort();
    }
    reset();
    onClose();
  }

  function validateFile(f: File): string | null {
    if (!ACCEPTED.includes(f.type) && !f.name.match(/\.(mp4|mov|avi|webm|mpg|mpeg)$/i))
      return "Unsupported file type. Use MP4, MOV, AVI, or WebM.";
    if (f.size > MAX_FILE_SIZE)
      return "File exceeds 5 GB limit.";
    return null;
  }

  function pickFile(f: File) {
    const err = validateFile(f);
    if (err) { toast.error(err); return; }
    setFile(f);
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) pickFile(f);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleUpload() {
    if (!titleEn.trim()) return toast.error("Title is required");
    if (!categoryId)     return toast.error("Select a category");
    if (!file)           return toast.error("Select a video file");

    setStep("uploading");
    setProgress(0);

    try {
      // Step 1: get Mux upload URL + create DB record
      const metaRes = await fetch("/api/admin/videos/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title_en: titleEn.trim(),
          description: description.trim() || null,
          category_id: categoryId,
          is_free: isFree,
        }),
      });
      const metaData = await metaRes.json();
      if (!metaRes.ok) throw new Error(metaData.error ?? "Failed to initialize upload");

      const { uploadUrl } = metaData;

      // Step 2: PUT file directly to Mux
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed (${xhr.status})`));
        };

        xhr.onerror  = () => reject(new Error("Network error during upload"));
        xhr.onabort  = () => reject(new Error("Upload cancelled"));

        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type || "video/mp4");
        xhr.send(file);
      });

      setStep("done");
      toast.success("Video uploaded — Mux is processing it now");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      if (msg !== "Upload cancelled") {
        setErrMsg(msg);
        setStep("error");
      } else {
        reset();
      }
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative w-full max-w-xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white">Upload Video</h2>
            <p className="text-xs text-gray-400 mt-0.5">Videos are hosted on Mux and stream globally</p>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* ── FORM STEP ── */}
          {(step === "form" || step === "uploading") && (
            <>
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Video Title *</label>
                <input
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  disabled={step === "uploading"}
                  placeholder="e.g. Introduction to Internal Medicine"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                />
              </div>

              {/* Category + Free */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Category *</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    disabled={step === "uploading"}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                  >
                    <option value="">Select category</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name_en}</option>)}
                  </select>
                </div>
                <div className="flex flex-col justify-end">
                  <button
                    type="button"
                    disabled={step === "uploading"}
                    onClick={() => setIsFree((v) => !v)}
                    className={cn(
                      "px-3 py-2.5 rounded-xl border-2 text-sm font-medium text-left transition-colors disabled:opacity-60",
                      isFree
                        ? "border-blue-400 bg-blue-50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-300"
                        : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400"
                    )}
                  >
                    {isFree ? "Free for all students" : "Premium only"}
                  </button>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Description <span className="font-normal">(optional)</span></label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={step === "uploading"}
                  rows={2}
                  placeholder="What will students learn from this video?"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:opacity-60"
                />
              </div>

              {/* Drop zone */}
              {step === "form" && (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                  className={cn(
                    "flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed rounded-xl cursor-pointer transition-colors",
                    dragOver
                      ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/10"
                      : "border-gray-300 dark:border-gray-700 hover:border-blue-400 hover:bg-blue-50/30 dark:hover:bg-blue-900/10"
                  )}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept="video/mp4,video/quicktime,video/x-msvideo,video/webm,.mp4,.mov,.avi,.webm"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) pickFile(f); }}
                  />
                  <Film className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                  {file ? (
                    <div className="text-center">
                      <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">{file.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-500">Drag & drop your video here</p>
                      <p className="text-xs text-gray-400 mt-0.5">MP4, MOV, AVI or WebM · up to 5 GB</p>
                    </div>
                  )}
                </div>
              )}

              {/* Upload progress */}
              {step === "uploading" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300 font-medium">Uploading to Mux…</span>
                    <span className="text-blue-600 font-semibold">{progress}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400">
                    {file && `${(file.size / 1024 / 1024).toFixed(1)} MB · `}
                    Do not close this window until the upload is complete.
                  </p>
                </div>
              )}
            </>
          )}

          {/* ── DONE STEP ── */}
          {step === "done" && (
            <div className="flex flex-col items-center py-8 gap-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-900 dark:text-white">Upload complete!</p>
                <p className="text-sm text-gray-500 mt-1 max-w-xs">
                  Mux is now processing your video. The playback ID and thumbnail will appear once processing finishes (usually under a minute).
                </p>
              </div>
              <div className="w-full p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 text-xs text-amber-700 dark:text-amber-400">
                The video will show as <strong>Processing</strong> until Mux confirms it's ready. Publish it from the Content Management page once it's ready.
              </div>
            </div>
          )}

          {/* ── ERROR STEP ── */}
          {step === "error" && (
            <div className="flex flex-col items-center py-8 gap-4">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-900 dark:text-white">Upload failed</p>
                <p className="text-sm text-red-500 mt-1">{errMsg}</p>
              </div>
              <button
                onClick={() => setStep("form")}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Try again
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex-shrink-0 bg-gray-50 dark:bg-gray-900">
          {step === "done" ? (
            <button
              onClick={handleClose}
              className="px-5 py-2 text-sm font-semibold rounded-lg bg-blue-700 hover:bg-blue-800 text-white transition-colors"
            >
              Done
            </button>
          ) : step === "error" ? (
            <button onClick={handleClose} className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              Close
            </button>
          ) : (
            <>
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={step === "uploading" || !file}
                className="flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg bg-blue-700 hover:bg-blue-800 text-white transition-colors disabled:opacity-60"
              >
                <Upload className="w-4 h-4" />
                {step === "uploading" ? `Uploading ${progress}%…` : "Upload to Mux"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
