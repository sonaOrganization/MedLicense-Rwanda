"use client";
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { FlagIcon } from "@/components/ui/FlagIcon";

type Lang = "EN" | "FR";

interface Subquestion {
  id: string;
  prompt_en: string;
  prompt_fr?: string | null;
  model_answer_en: string;
  model_answer_fr?: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  groupId: string;
  subquestion?: Subquestion;
  onSaved: () => void;
}

export function PracticalSubquestionFormModal({ open, onClose, groupId, subquestion, onSaved }: Props) {
  const isEdit = !!subquestion;

  const [lang,           setLang]           = useState<Lang>("EN");
  const [promptEn,       setPromptEn]       = useState("");
  const [promptFr,       setPromptFr]       = useState("");
  const [modelAnswerEn,  setModelAnswerEn]  = useState("");
  const [modelAnswerFr,  setModelAnswerFr]  = useState("");
  const [saving,         setSaving]         = useState(false);

  useEffect(() => {
    if (!open) return;
    if (subquestion) {
      setPromptEn(subquestion.prompt_en);
      setPromptFr(subquestion.prompt_fr ?? "");
      setModelAnswerEn(subquestion.model_answer_en);
      setModelAnswerFr(subquestion.model_answer_fr ?? "");
    } else {
      setPromptEn(""); setPromptFr("");
      setModelAnswerEn(""); setModelAnswerFr("");
    }
    setLang("EN");
  }, [open, subquestion]);

  async function handleSave() {
    if (!promptEn.trim()) return toast.error("English prompt is required");
    if (!modelAnswerEn.trim()) return toast.error("English model answer is required");

    setSaving(true);
    try {
      const url    = isEdit ? `/api/admin/practical-subquestions/${subquestion!.id}` : `/api/admin/practical-groups/${groupId}/subquestions`;
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt_en: promptEn.trim(),
          prompt_fr: promptFr.trim() || null,
          model_answer_en: modelAnswerEn.trim(),
          model_answer_fr: modelAnswerFr.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(isEdit ? "Question updated" : "Question added");
      onSaved();
      onClose();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;
  const isFr = lang === "FR";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg max-h-[90vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
          <h2 className="font-bold text-gray-900 dark:text-white">
            {isEdit ? "Edit Sub-question" : "Add Sub-question"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Language tabs */}
        <div className="flex gap-0 border-b border-gray-200 dark:border-gray-800 flex-shrink-0 px-6">
          {(["EN", "FR"] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px",
                lang === l
                  ? "border-amber-600 text-amber-600 dark:text-amber-400"
                  : "border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              )}
            >
              <FlagIcon lang={l} size={14} />
              {l === "EN" ? "English" : "Français"}
              {l === "EN" && <span className="text-[10px] text-red-500 font-bold">*</span>}
            </button>
          ))}
          <span className="ml-auto self-center text-[11px] text-gray-400 italic">
            {lang === "FR" ? "Optional — shown as fallback" : ""}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
              {isFr ? "Prompt (French)" : "Prompt (English)"}
              {!isFr && <span className="text-red-500 ml-1">*</span>}
            </label>
            <textarea
              value={isFr ? promptFr : promptEn}
              onChange={(e) => isFr ? setPromptFr(e.target.value) : setPromptEn(e.target.value)}
              rows={3}
              placeholder={isFr ? "Quel est le diagnostic le plus probable ?" : "What is the most likely diagnosis?"}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
              {isFr ? "Model Answer (French)" : "Model Answer (English)"}
              {!isFr && <span className="text-red-500 ml-1">*</span>}
              <span className="font-normal ml-1 text-gray-400">(revealed after the student clicks &quot;Review Answer&quot;)</span>
            </label>
            <textarea
              value={isFr ? modelAnswerFr : modelAnswerEn}
              onChange={(e) => isFr ? setModelAnswerFr(e.target.value) : setModelAnswerEn(e.target.value)}
              rows={4}
              placeholder={isFr ? "La réponse modèle attendue..." : "The expected model answer..."}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex-shrink-0 bg-gray-50 dark:bg-gray-900">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 text-sm font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-colors disabled:opacity-60"
          >
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Question"}
          </button>
        </div>
      </div>
    </div>
  );
}
