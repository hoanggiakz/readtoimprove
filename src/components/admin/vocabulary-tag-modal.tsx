"use client";

import * as React from "react";
import { CefrLevel } from "@prisma/client";
import { findWordOffsets, validateHighlightOffsets, WordOffsetMatch } from "@/lib/offsets";
import {
  tagSentenceVocabularyAction,
  createVocabularyAction,
} from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { CefrBadge } from "@/components/ui/cefr-badge";
import { X, Tag, Plus, Check, AlertCircle } from "lucide-react";

interface VocabularyItem {
  id: string;
  word: string;
  cefrLevel: CefrLevel;
  ipa: string | null;
  meaningVi: string;
}

interface VocabularyTagModalProps {
  sentence: {
    id: string;
    textEn: string;
    textVi: string;
  };
  vocabularies: VocabularyItem[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function VocabularyTagModal({
  sentence,
  vocabularies,
  isOpen,
  onClose,
  onSuccess,
}: VocabularyTagModalProps) {
  const [selectedVocabId, setSelectedVocabId] = React.useState<string>("");
  const [isCreatingNewVocab, setIsCreatingNewVocab] = React.useState(false);

  // New vocabulary form state
  const [newWord, setNewWord] = React.useState("");
  const [newLemma, setNewLemma] = React.useState("");
  const [newIpa, setNewIpa] = React.useState("");
  const [newMeaningVi, setNewMeaningVi] = React.useState("");
  const [newCefr, setNewCefr] = React.useState<CefrLevel>(CefrLevel.B2);

  // Offset selection state
  const [targetWord, setTargetWord] = React.useState("");
  const [candidateMatches, setCandidateMatches] = React.useState<WordOffsetMatch[]>([]);
  const [selectedStartOffset, setSelectedStartOffset] = React.useState<number | null>(null);
  const [selectedEndOffset, setSelectedEndOffset] = React.useState<number | null>(null);

  const [isPending, startTransition] = React.useTransition();
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // When target word changes, find matches in sentence
  React.useEffect(() => {
    if (targetWord.trim()) {
      const matches = findWordOffsets(sentence.textEn, targetWord);
      setCandidateMatches(matches);
      if (matches.length > 0) {
        setSelectedStartOffset(matches[0].startOffset);
        setSelectedEndOffset(matches[0].endOffset);
      } else {
        setSelectedStartOffset(null);
        setSelectedEndOffset(null);
      }
    } else {
      setCandidateMatches([]);
      setSelectedStartOffset(null);
      setSelectedEndOffset(null);
    }
  }, [targetWord, sentence.textEn]);

  // When choosing an existing vocabulary, pre-fill search target
  const handleSelectExistingVocab = (vocabId: string) => {
    setSelectedVocabId(vocabId);
    const vocab = vocabularies.find((v) => v.id === vocabId);
    if (vocab) {
      setTargetWord(vocab.word);
    }
  };

  const handleSelectCandidate = (m: WordOffsetMatch) => {
    setSelectedStartOffset(m.startOffset);
    setSelectedEndOffset(m.endOffset);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (selectedStartOffset === null || selectedEndOffset === null) {
      setErrorMessage("Vui lòng chọn hoặc nhập vị trí từ cần gắn thẻ trong câu.");
      return;
    }

    const validation = validateHighlightOffsets(
      sentence.textEn,
      selectedStartOffset,
      selectedEndOffset
    );

    if (!validation.valid) {
      setErrorMessage(validation.error || "Vị trí ký tự không hợp lệ.");
      return;
    }

    startTransition(async () => {
      let finalVocabId = selectedVocabId;

      // 1. If creating new vocabulary, create it first
      if (isCreatingNewVocab) {
        const createResult = await createVocabularyAction({
          word: newWord.trim(),
          normalizedLemma: (newLemma || newWord).trim().toLowerCase(),
          ipa: newIpa.trim() || null,
          meaningVi: newMeaningVi.trim(),
          cefrLevel: newCefr,
        });

        if (!createResult.success || !createResult.data) {
          setErrorMessage(createResult.error || "Không thể tạo từ vựng mới.");
          return;
        }

        finalVocabId = createResult.data.id;
      }

      if (!finalVocabId) {
        setErrorMessage("Vui lòng chọn từ vựng.");
        return;
      }

      // 2. Tag sentence with vocabulary
      const tagResult = await tagSentenceVocabularyAction({
        sentenceId: sentence.id,
        vocabularyId: finalVocabId,
        startOffset: selectedStartOffset,
        endOffset: selectedEndOffset,
        highlightedText: validation.extractedText,
      });

      if (tagResult.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMessage(tagResult.error || "Lỗi gắn thẻ từ vựng.");
      }
    });
  };

  if (!isOpen) return null;

  const currentSlice =
    selectedStartOffset !== null && selectedEndOffset !== null && selectedEndOffset <= sentence.textEn.length
      ? sentence.textEn.slice(selectedStartOffset, selectedEndOffset)
      : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-slate-100">Gắn Thẻ Từ Vựng Cho Câu</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Error Feedback */}
        {errorMessage && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Sentence Text Context */}
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-1 text-xs">
          <p className="text-slate-200 font-serif leading-relaxed">
            <span className="font-sans font-semibold text-slate-400">EN: </span>
            {sentence.textEn}
          </p>
          <p className="text-slate-400 italic">
            <span className="font-sans font-semibold text-slate-500">VI: </span>
            {sentence.textVi}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Toggle Create New vs Choose Existing */}
          <div className="flex items-center justify-between">
            <label className="font-medium text-slate-300">Chọn Từ Vựng (Vocabulary)</label>
            <button
              type="button"
              onClick={() => setIsCreatingNewVocab(!isCreatingNewVocab)}
              className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
            >
              {isCreatingNewVocab ? (
                <>Chọn từ có sẵn trong kho</>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" /> Tạo từ vựng mới vào kho
                </>
              )}
            </button>
          </div>

          {!isCreatingNewVocab ? (
            <div>
              <select
                value={selectedVocabId}
                onChange={(e) => handleSelectExistingVocab(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
              >
                <option value="">-- Chọn từ vựng trong kho toàn cầu --</option>
                {vocabularies.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.word} [{v.cefrLevel}] — {v.meaningVi}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/10 p-3.5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">Từ vựng (Word) *</label>
                  <input
                    type="text"
                    required
                    value={newWord}
                    onChange={(e) => {
                      setNewWord(e.target.value);
                      setTargetWord(e.target.value);
                    }}
                    placeholder="e.g. sustainable"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">Từ gốc (Lemma)</label>
                  <input
                    type="text"
                    value={newLemma}
                    onChange={(e) => setNewLemma(e.target.value)}
                    placeholder="e.g. sustain"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">Phiên âm IPA</label>
                  <input
                    type="text"
                    value={newIpa}
                    onChange={(e) => setNewIpa(e.target.value)}
                    placeholder="/səˈsteɪnəbl/"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">Cấp độ CEFR</label>
                  <select
                    value={newCefr}
                    onChange={(e) => setNewCefr(e.target.value as CefrLevel)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value={CefrLevel.A1}>A1</option>
                    <option value={CefrLevel.A2}>A2</option>
                    <option value={CefrLevel.B1}>B1</option>
                    <option value={CefrLevel.B2}>B2</option>
                    <option value={CefrLevel.C1}>C1</option>
                    <option value={CefrLevel.C2}>C2</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-300 mb-1">Định nghĩa tiếng Việt *</label>
                <input
                  type="text"
                  required
                  value={newMeaningVi}
                  onChange={(e) => setNewMeaningVi(e.target.value)}
                  placeholder="bền vững, có thể duy trì lâu dài"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Word Offset Locator & Selector */}
          <div className="space-y-2 pt-1">
            <label className="block font-medium text-slate-300">
              Vị trí từ trong câu tiếng Anh (Search & Highlight Offsets)
            </label>
            <input
              type="text"
              value={targetWord}
              onChange={(e) => setTargetWord(e.target.value)}
              placeholder="Nhập từ hoặc cụm từ xuất hiện trong câu để tự động tìm tọa độ..."
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />

            {candidateMatches.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-400">Tìm thấy {candidateMatches.length} vị trí phù hợp:</span>
                <div className="flex flex-wrap gap-2">
                  {candidateMatches.map((m, idx) => {
                    const isChosen =
                      selectedStartOffset === m.startOffset && selectedEndOffset === m.endOffset;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectCandidate(m)}
                        className={`px-2.5 py-1 rounded-md text-xs font-mono border transition-colors flex items-center gap-1.5 ${
                          isChosen
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                            : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                        }`}
                      >
                        {isChosen && <Check className="h-3 w-3 text-emerald-400" />}
                        <span>&quot;{m.slice}&quot; ({m.startOffset} - {m.endOffset})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Manual Offsets & Live Slice Preview */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 space-y-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">startOffset (Chỉ mục bắt đầu)</label>
                <input
                  type="number"
                  min={0}
                  max={sentence.textEn.length}
                  value={selectedStartOffset ?? ""}
                  onChange={(e) => setSelectedStartOffset(e.target.value ? Number(e.target.value) : null)}
                  className="w-full rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs font-mono text-slate-200"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">endOffset (Chỉ mục kết thúc)</label>
                <input
                  type="number"
                  min={0}
                  max={sentence.textEn.length}
                  value={selectedEndOffset ?? ""}
                  onChange={(e) => setSelectedEndOffset(e.target.value ? Number(e.target.value) : null)}
                  className="w-full rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs font-mono text-slate-200"
                />
              </div>
            </div>

            {/* Live Highlight Slice */}
            <div className="flex items-center justify-between pt-1 text-[11px]">
              <span className="text-slate-400">Từ được highlight thực tế:</span>
              {currentSlice ? (
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-emerald-300 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800">
                    &quot;{currentSlice}&quot;
                  </span>
                  <CefrBadge level={isCreatingNewVocab ? newCefr : CefrLevel.B2} />
                </div>
              ) : (
                <span className="text-slate-500 italic">Chưa chọn vị trí hợp lệ</span>
              )}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="border-slate-700 text-slate-300"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isPending || !currentSlice}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
            >
              {isPending ? "Đang gắn thẻ..." : "Gắn thẻ từ vựng vào câu"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
