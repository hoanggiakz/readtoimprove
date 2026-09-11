"use client";

import * as React from "react";
import { CefrLevel } from "@prisma/client";
import {
  createSentenceAction,
  updateSentenceAction,
  deleteSentenceAction,
  reorderSentencesAction,
  untagSentenceVocabularyAction,
} from "@/lib/actions/admin";
import { VocabularyTagModal } from "@/components/admin/vocabulary-tag-modal";
import { CefrBadge } from "@/components/ui/cefr-badge";
import { Button } from "@/components/ui/button";
import {
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  Edit2,
  Check,
  X,
  Tag,
  AlertCircle,
  Sparkles,
} from "lucide-react";

interface SentenceVocabularyItem {
  id: string;
  vocabularyId: string;
  startOffset: number;
  endOffset: number;
  highlightedText: string;
  vocabulary: {
    id: string;
    word: string;
    cefrLevel: CefrLevel;
    meaningVi: string;
  };
}

interface SentenceItem {
  id: string;
  orderIndex: number;
  textEn: string;
  textVi: string;
  vocabularies: SentenceVocabularyItem[];
}

interface VocabularyOption {
  id: string;
  word: string;
  cefrLevel: CefrLevel;
  ipa: string | null;
  meaningVi: string;
}

interface SentenceEditorProps {
  article: {
    id: string;
    titleEn: string;
    titleVi: string;
    slug: string;
  };
  initialSentences: SentenceItem[];
  vocabularies: VocabularyOption[];
}

export function SentenceEditor({
  article,
  initialSentences,
  vocabularies,
}: SentenceEditorProps) {
  const [sentences, setSentences] = React.useState<SentenceItem[]>(initialSentences);

  // New sentence state
  const [newTextEn, setNewTextEn] = React.useState("");
  const [newTextVi, setNewTextVi] = React.useState("");

  // Inline editing state
  const [editingSentenceId, setEditingSentenceId] = React.useState<string | null>(null);
  const [editTextEn, setEditTextEn] = React.useState("");
  const [editTextVi, setEditTextVi] = React.useState("");

  // Tagging modal state
  const [taggingSentence, setTaggingSentence] = React.useState<SentenceItem | null>(null);

  const [isPending, startTransition] = React.useTransition();
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Sync state when props change
  React.useEffect(() => {
    setSentences(initialSentences);
  }, [initialSentences]);

  const handleCreateSentence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTextEn.trim() || !newTextVi.trim()) return;

    setErrorMessage(null);
    startTransition(async () => {
      const result = await createSentenceAction({
        articleId: article.id,
        orderIndex: sentences.length,
        textEn: newTextEn.trim(),
        textVi: newTextVi.trim(),
      });

      if (result.success && result.data) {
        setSentences((prev) => [
          ...prev,
          {
            id: result.data!.id,
            orderIndex: prev.length,
            textEn: newTextEn.trim(),
            textVi: newTextVi.trim(),
            vocabularies: [],
          },
        ]);
        setNewTextEn("");
        setNewTextVi("");
      } else {
        setErrorMessage(result.error || "Không thể thêm câu mới.");
      }
    });
  };

  const handleStartEdit = (sentence: SentenceItem) => {
    setEditingSentenceId(sentence.id);
    setEditTextEn(sentence.textEn);
    setEditTextVi(sentence.textVi);
  };

  const handleSaveEdit = (sentenceId: string) => {
    setErrorMessage(null);
    startTransition(async () => {
      const result = await updateSentenceAction({
        id: sentenceId,
        textEn: editTextEn.trim(),
        textVi: editTextVi.trim(),
      });

      if (result.success) {
        setSentences((prev) =>
          prev.map((s) =>
            s.id === sentenceId ? { ...s, textEn: editTextEn.trim(), textVi: editTextVi.trim() } : s
          )
        );
        setEditingSentenceId(null);
      } else {
        setErrorMessage(result.error || "Lỗi cập nhật câu.");
      }
    });
  };

  const handleDeleteSentence = (sentenceId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa câu này? Các highlight trong câu sẽ được xóa kèm (từ vựng gốc vẫn được bảo toàn).")) {
      return;
    }

    setErrorMessage(null);
    startTransition(async () => {
      const result = await deleteSentenceAction(sentenceId);
      if (result.success) {
        setSentences((prev) => {
          const filtered = prev.filter((s) => s.id !== sentenceId);
          return filtered.map((s, idx) => ({ ...s, orderIndex: idx }));
        });
      } else {
        setErrorMessage(result.error || "Lỗi xóa câu.");
      }
    });
  };

  const handleMoveSentence = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sentences.length) return;

    const newSentences = [...sentences];
    const [moved] = newSentences.splice(index, 1);
    newSentences.splice(targetIndex, 0, moved);

    // Update local state first for instant UI response
    const reindexed = newSentences.map((s, idx) => ({ ...s, orderIndex: idx }));
    setSentences(reindexed);

    // Persist reorder to database in atomic transaction
    startTransition(async () => {
      const sentenceIds = reindexed.map((s) => s.id);
      const result = await reorderSentencesAction({
        articleId: article.id,
        sentenceIds,
      });

      if (!result.success) {
        setErrorMessage(result.error || "Lỗi sắp xếp câu.");
      }
    });
  };

  const handleUntag = (sentenceId: string, tagId: string) => {
    setErrorMessage(null);
    startTransition(async () => {
      const result = await untagSentenceVocabularyAction(tagId);
      if (result.success) {
        setSentences((prev) =>
          prev.map((s) =>
            s.id === sentenceId
              ? { ...s, vocabularies: s.vocabularies.filter((v) => v.id !== tagId) }
              : s
          )
        );
      } else {
        setErrorMessage(result.error || "Lỗi gỡ thẻ từ vựng.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 space-y-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
          Biên Tập Song Ngữ Đối Chiếu & Căn Chỉnh Từ Vựng
        </span>
        <h1 className="text-xl font-bold text-slate-100">{article.titleEn}</h1>
        <p className="text-xs text-slate-400">{article.titleVi}</p>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Sentences List */}
      <div className="space-y-4">
        {sentences.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-8 text-center text-xs text-slate-500">
            Chưa có câu song ngữ nào trong bài viết. Vui lòng thêm câu đầu tiên bên dưới.
          </div>
        ) : (
          sentences.map((sentence, index) => {
            const isEditing = editingSentenceId === sentence.id;

            return (
              <div
                key={sentence.id}
                className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-3 transition-colors hover:border-slate-700"
              >
                {/* Sentence Header & Action Controls */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-800 text-[11px] font-mono font-bold text-emerald-400">
                      #{sentence.orderIndex + 1}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {sentence.vocabularies.length} từ vựng được gắn thẻ
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Reorder Buttons */}
                    <button
                      type="button"
                      disabled={index === 0 || isPending}
                      onClick={() => handleMoveSentence(index, "up")}
                      className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-30"
                      title="Di chuyển lên"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === sentences.length - 1 || isPending}
                      onClick={() => handleMoveSentence(index, "down")}
                      className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-30"
                      title="Di chuyển xuống"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>

                    {/* Edit Button */}
                    {!isEditing && (
                      <button
                        type="button"
                        onClick={() => handleStartEdit(sentence)}
                        className="p-1 rounded text-slate-400 hover:text-sky-400 hover:bg-slate-800"
                        title="Sửa nội dung câu"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    )}

                    {/* Tag Vocab Button */}
                    <button
                      type="button"
                      onClick={() => setTaggingSentence(sentence)}
                      className="px-2 py-1 rounded text-[11px] font-medium bg-emerald-950 text-emerald-300 border border-emerald-800/60 hover:bg-emerald-900 flex items-center gap-1 ml-1"
                    >
                      <Tag className="h-3 w-3" />
                      <span>Gắn từ vựng</span>
                    </button>

                    {/* Delete Sentence Button */}
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleDeleteSentence(sentence.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 ml-1"
                      title="Xóa câu"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Sentence Bilingual Content (View or Edit mode) */}
                {isEditing ? (
                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Tiếng Anh (EN)</label>
                      <textarea
                        rows={2}
                        value={editTextEn}
                        onChange={(e) => setEditTextEn(e.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-slate-100 font-serif focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Tiếng Việt (VI)</label>
                      <textarea
                        rows={2}
                        value={editTextVi}
                        onChange={(e) => setEditTextVi(e.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingSentenceId(null)}
                        className="h-7 text-xs border-slate-700 text-slate-300"
                      >
                        <X className="h-3.5 w-3.5 mr-1" />
                        Hủy
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleSaveEdit(sentence.id)}
                        className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                      >
                        <Check className="h-3.5 w-3.5 mr-1" />
                        Lưu câu
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5 text-xs">
                    <p className="text-slate-100 font-serif leading-relaxed text-sm">
                      {sentence.textEn}
                    </p>
                    <p className="text-slate-400 italic leading-relaxed">
                      {sentence.textVi}
                    </p>
                  </div>
                )}

                {/* Lexical Highlights Chips */}
                {sentence.vocabularies.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/80 flex flex-wrap gap-2 items-center">
                    <span className="text-[10px] text-slate-500 font-mono">Highlights:</span>
                    {sentence.vocabularies.map((v) => (
                      <div
                        key={v.id}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-[11px]"
                      >
                        <CefrBadge level={v.vocabulary.cefrLevel} />
                        <span className="font-semibold text-emerald-400">{v.highlightedText}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          ({v.startOffset}:{v.endOffset})
                        </span>
                        <span className="text-slate-400 border-l border-slate-800 pl-1.5 ml-0.5">
                          {v.vocabulary.meaningVi}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUntag(sentence.id, v.id)}
                          className="text-slate-500 hover:text-rose-400 ml-1"
                          title="Gỡ thẻ từ vựng này"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add New Bilingual Sentence Form */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-slate-200">Thêm Câu Song Ngữ Mới Vào Bài Viết</h3>
        </div>

        <form onSubmit={handleCreateSentence} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Câu tiếng Anh (English Sentence) *
            </label>
            <textarea
              rows={2}
              required
              value={newTextEn}
              onChange={(e) => setNewTextEn(e.target.value)}
              placeholder="e.g. In recent years, artificial intelligence has reshaped global economies."
              className="w-full rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none font-serif"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Bản dịch tiếng Việt (Vietnamese Translation) *
            </label>
            <textarea
              rows={2}
              required
              value={newTextVi}
              onChange={(e) => setNewTextVi(e.target.value)}
              placeholder="e.g. Trong những năm gần đây, trí tuệ nhân tạo đã định hình lại các nền kinh tế toàn cầu."
              className="w-full rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isPending || !newTextEn.trim() || !newTextVi.trim()}
              size="sm"
              className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
            >
              <Plus className="h-4 w-4" />
              <span>{isPending ? "Đang thêm câu..." : "Thêm câu song ngữ"}</span>
            </Button>
          </div>
        </form>
      </div>

      {/* Vocabulary Tagging Modal */}
      {taggingSentence && (
        <VocabularyTagModal
          sentence={taggingSentence}
          vocabularies={vocabularies}
          isOpen={Boolean(taggingSentence)}
          onClose={() => setTaggingSentence(null)}
          onSuccess={() => {
            // Re-fetch or refresh current page
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
