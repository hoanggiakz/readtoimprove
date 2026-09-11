"use client";

import * as React from "react";
import { CefrLevel } from "@prisma/client";
import {
  createVocabularyAction,
  updateVocabularyAction,
  deleteVocabularyAction,
} from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { CefrBadge } from "@/components/ui/cefr-badge";
import {
  BookA,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertCircle,
  X,
} from "lucide-react";

interface VocabularyItem {
  id: string;
  word: string;
  normalizedLemma: string;
  ipa: string | null;
  pos: string | null;
  meaningVi: string;
  exampleEn: string | null;
  exampleVi: string | null;
  cefrLevel: CefrLevel;
  audioUrl: string | null;
  _count: {
    sentenceInstances: number;
    userSaves: number;
  };
}

interface VocabularyManagerProps {
  initialVocabularies: VocabularyItem[];
}

export function VocabularyManager({ initialVocabularies }: VocabularyManagerProps) {
  const [vocabularies, setVocabularies] = React.useState<VocabularyItem[]>(initialVocabularies);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCefr, setSelectedCefr] = React.useState<string>("ALL");

  // Add / Edit Modal State
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [word, setWord] = React.useState("");
  const [normalizedLemma, setNormalizedLemma] = React.useState("");
  const [ipa, setIpa] = React.useState("");
  const [pos, setPos] = React.useState("");
  const [meaningVi, setMeaningVi] = React.useState("");
  const [exampleEn, setExampleEn] = React.useState("");
  const [exampleVi, setExampleVi] = React.useState("");
  const [cefrLevel, setCefrLevel] = React.useState<CefrLevel>(CefrLevel.B2);
  const [audioUrl, setAudioUrl] = React.useState("");

  const [isPending, startTransition] = React.useTransition();
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const filteredVocabs = vocabularies.filter((v) => {
    const matchesSearch =
      v.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.normalizedLemma.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.meaningVi.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCefr = selectedCefr === "ALL" || v.cefrLevel === selectedCefr;
    return matchesSearch && matchesCefr;
  });

  const handleOpenCreate = () => {
    setEditingId(null);
    setWord("");
    setNormalizedLemma("");
    setIpa("");
    setPos("");
    setMeaningVi("");
    setExampleEn("");
    setExampleVi("");
    setCefrLevel(CefrLevel.B2);
    setAudioUrl("");
    setModalOpen(true);
  };

  const handleOpenEdit = (v: VocabularyItem) => {
    setEditingId(v.id);
    setWord(v.word);
    setNormalizedLemma(v.normalizedLemma);
    setIpa(v.ipa || "");
    setPos(v.pos || "");
    setMeaningVi(v.meaningVi);
    setExampleEn(v.exampleEn || "");
    setExampleVi(v.exampleVi || "");
    setCefrLevel(v.cefrLevel);
    setAudioUrl(v.audioUrl || "");
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const payload = {
      word: word.trim(),
      normalizedLemma: (normalizedLemma || word).trim().toLowerCase(),
      ipa: ipa.trim() || null,
      pos: pos.trim() || null,
      meaningVi: meaningVi.trim(),
      exampleEn: exampleEn.trim() || null,
      exampleVi: exampleVi.trim() || null,
      cefrLevel,
      audioUrl: audioUrl.trim() || null,
    };

    startTransition(async () => {
      if (editingId) {
        const result = await updateVocabularyAction(editingId, payload);
        if (result.success) {
          setVocabularies((prev) =>
            prev.map((v) => (v.id === editingId ? { ...v, ...payload } : v))
          );
          setModalOpen(false);
        } else {
          setErrorMessage(result.error || "Lỗi cập nhật từ vựng.");
        }
      } else {
        const result = await createVocabularyAction(payload);
        if (result.success && result.data) {
          setVocabularies((prev) => [
            {
              id: result.data!.id,
              ...payload,
              _count: { sentenceInstances: 0, userSaves: 0 },
            },
            ...prev,
          ]);
          setModalOpen(false);
        } else {
          setErrorMessage(result.error || "Lỗi tạo từ vựng mới.");
        }
      }
    });
  };

  const handleDelete = (id: string, vocabWord: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa từ vựng '${vocabWord}' khỏi kho từ toàn cầu?`)) {
      return;
    }

    setErrorMessage(null);
    startTransition(async () => {
      const result = await deleteVocabularyAction(id);
      if (result.success) {
        setVocabularies((prev) => prev.filter((v) => v.id !== id));
      } else {
        setErrorMessage(result.error || "Lỗi xóa từ vựng.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <BookA className="h-4 w-4 text-purple-400" />
            <h1 className="text-xl font-bold text-slate-100">Kho Từ Vựng Toàn Cầu (Vocabulary Bank)</h1>
          </div>
          <p className="text-xs text-slate-400">
            Từ điển học thuật CEFR độc lập. Được tái sử dụng xuyên suốt toàn bộ các bài viết song ngữ.
          </p>
        </div>

        <Button
          size="sm"
          onClick={handleOpenCreate}
          className="gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
        >
          <Plus className="h-4 w-4" />
          <span>Thêm từ vựng mới</span>
        </Button>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Search & CEFR Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo từ vựng, từ gốc, nghĩa tiếng Việt..."
            className="w-full rounded-lg border border-slate-800 bg-slate-900/80 pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {["ALL", "A1", "A2", "B1", "B2", "C1", "C2"].map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setSelectedCefr(level)}
              className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium border transition-colors ${
                selectedCefr === level
                  ? "bg-slate-800 text-emerald-400 border-emerald-500/40"
                  : "bg-slate-900/50 text-slate-400 border-slate-800 hover:border-slate-700"
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Vocabulary Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-medium">
              <tr>
                <th className="px-4 py-3">Từ vựng (Headword)</th>
                <th className="px-4 py-3">CEFR</th>
                <th className="px-4 py-3">Từ gốc (Lemma)</th>
                <th className="px-4 py-3">Phiên âm IPA</th>
                <th className="px-4 py-3">Định nghĩa tiếng Việt</th>
                <th className="px-4 py-3">Sử dụng</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {filteredVocabs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500 text-xs">
                    Không tìm thấy từ vựng nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredVocabs.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-100 flex items-center gap-1.5">
                      <span>{v.word}</span>
                      {v.pos && <span className="text-[10px] text-slate-500 font-serif">[{v.pos}]</span>}
                    </td>
                    <td className="px-4 py-3">
                      <CefrBadge level={v.cefrLevel} />
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-400">{v.normalizedLemma}</td>
                    <td className="px-4 py-3 font-mono text-slate-300">{v.ipa || "—"}</td>
                    <td className="px-4 py-3 text-slate-200 max-w-xs truncate">{v.meaningVi}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-400">
                      <span title="Số câu đang sử dụng">{v._count.sentenceInstances} câu</span>
                      <span className="text-slate-600 mx-1">/</span>
                      <span title="Số học viên đã lưu">{v._count.userSaves} lưu</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(v)}
                          className="p-1 rounded text-slate-400 hover:text-sky-400 hover:bg-slate-800"
                          title="Chỉnh sửa từ vựng"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(v.id, v.word)}
                          className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                          title="Xóa từ vựng"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Vocabulary Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-semibold text-slate-100">
                {editingId ? "Cập Nhật Từ Vựng Toàn Cầu" : "Thêm Từ Vựng Mới Vào Kho"}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Từ vựng (Word) *</label>
                  <input
                    type="text"
                    required
                    value={word}
                    onChange={(e) => setWord(e.target.value)}
                    placeholder="e.g. unprecedented"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Từ gốc (Lemma) *</label>
                  <input
                    type="text"
                    required
                    value={normalizedLemma}
                    onChange={(e) => setNormalizedLemma(e.target.value)}
                    placeholder="e.g. precede"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Cấp độ CEFR *</label>
                  <select
                    value={cefrLevel}
                    onChange={(e) => setCefrLevel(e.target.value as CefrLevel)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value={CefrLevel.A1}>A1</option>
                    <option value={CefrLevel.A2}>A2</option>
                    <option value={CefrLevel.B1}>B1</option>
                    <option value={CefrLevel.B2}>B2</option>
                    <option value={CefrLevel.C1}>C1</option>
                    <option value={CefrLevel.C2}>C2</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Từ loại (POS)</label>
                  <input
                    type="text"
                    value={pos}
                    onChange={(e) => setPos(e.target.value)}
                    placeholder="adj, verb, noun..."
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Phiên âm IPA</label>
                  <input
                    type="text"
                    value={ipa}
                    onChange={(e) => setIpa(e.target.value)}
                    placeholder="/ˌʌnˈpresɪdentɪd/"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Định nghĩa tiếng Việt *</label>
                <input
                  type="text"
                  required
                  value={meaningVi}
                  onChange={(e) => setMeaningVi(e.target.value)}
                  placeholder="chưa từng có, vô tiền khoáng hậu"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Câu ví dụ tiếng Anh</label>
                <textarea
                  rows={2}
                  value={exampleEn}
                  onChange={(e) => setExampleEn(e.target.value)}
                  placeholder="e.g. The team achieved unprecedented success this year."
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2 text-slate-100 focus:border-emerald-500 focus:outline-none font-serif"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Bản dịch câu ví dụ tiếng Việt</label>
                <textarea
                  rows={2}
                  value={exampleVi}
                  onChange={(e) => setExampleVi(e.target.value)}
                  placeholder="e.g. Đội ngũ đã đạt được thành công chưa từng có trong năm nay."
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">URL file phát âm (Audio URL)</label>
                <input
                  type="url"
                  value={audioUrl}
                  onChange={(e) => setAudioUrl(e.target.value)}
                  placeholder="https://.../pronunciation.mp3"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setModalOpen(false)}
                  className="border-slate-700 text-slate-300"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
                >
                  {isPending ? "Đang lưu..." : editingId ? "Cập nhật từ vựng" : "Thêm vào kho"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
