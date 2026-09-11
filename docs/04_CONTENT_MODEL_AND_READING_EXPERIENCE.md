# ReadToImprove: Content Model & Reading Experience Design

## 1. The Bilingual Reading Paradigm
The heart of **ReadToImprove** is an immersive, low-friction bilingual reading experience. Rather than presenting separate parallel columns that cause cognitive fatigue or forcing readers to switch tabs to consult a dictionary, sentences are rendered in cohesive pairs with contextual vocabulary enrichment.

```text
┌────────────────────────────────────────────────────────────────────────┐
│  Sentence 1:                                                           │
│  Global temperatures reached [unprecedented] levels during July 2024.  │
│  Nhiệt độ toàn cầu đã chạm mức [chưa từng có] trong tháng 7 năm 2024.  │
│                                                                        │
│  Sentence 2:                                                           │
│  Climatologists warned that urgent mitigation strategies are vital.    │
│  Các nhà khí hậu học cảnh báo rằng các chiến lược giảm thiểu là cấp... │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Sentence-Vocabulary Highlighting Algorithm

### 2.1 Storage & Coordinate Model
To avoid brittle runtime regular expression searching that fails when a common word appears multiple times in a sentence, we store explicit zero-based character index ranges in `SentenceVocabulary`:
- `startOffset`: Index of the first character of the highlighted word/phrase in `Sentence.textEn`.
- `endOffset`: Index of the character immediately following the word/phrase.
- `highlightedText`: The exact substring slice `Sentence.textEn.slice(startOffset, endOffset)`.

### 2.2 Text Tokenizer & Highlight Slicer
When rendering a sentence on the client, the sentence string is partitioned into ordered segments:
```typescript
interface TextSegment {
  text: string;
  isHighlight: boolean;
  vocab?: VocabularyDetail;
}

export function segmentSentenceText(
  text: string,
  highlights: Array<{ startOffset: number; endOffset: number; vocabulary: VocabularyDetail }>
): TextSegment[] {
  // Sort highlights by startOffset ascending
  const sorted = [...highlights].sort((a, b) => a.startOffset - b.startOffset);
  const segments: TextSegment[] = [];
  let currentIndex = 0;

  for (const h of sorted) {
    if (h.startOffset > currentIndex) {
      segments.push({
        text: text.slice(currentIndex, h.startOffset),
        isHighlight: false,
      });
    }
    segments.push({
      text: text.slice(h.startOffset, h.endOffset),
      isHighlight: true,
      vocab: h.vocabulary,
    });
    currentIndex = h.endOffset;
  }

  if (currentIndex < text.length) {
    segments.push({
      text: text.slice(currentIndex),
      isHighlight: false,
    });
  }

  return segments;
}
```

---

## 3. CEFR Classification & Visual Coding

Words are classified across CEFR levels with clear visual badges and subtle underlines:

| CEFR Level | Target Audience | Palette Indicator | Badge Style |
| :--- | :--- | :--- | :--- |
| **B1** | Intermediate | Emerald / Green | `bg-emerald-50 text-emerald-700 border-emerald-200` |
| **B2** | Upper Intermediate | Blue / Cyan | `bg-sky-50 text-sky-700 border-sky-200` |
| **C1** | Advanced | Violet / Purple | `bg-purple-50 text-purple-700 border-purple-200` |
| **C2** | Mastery / Proficiency | Rose / Crimson | `bg-rose-50 text-rose-700 border-rose-200` |

---

## 4. Reading Experience Features & Interactions

### 4.1 Translation Visibility Modes
Readers can customize how translations are shown to calibrate their cognitive effort:
1. **Always On** (Default): English sentence followed directly by Vietnamese translation in muted contrast.
2. **Hover / Tap to Reveal**: Vietnamese translation is hidden or blurred until the reader hovers or taps the sentence.
3. **English Only**: Vietnamese translation hidden completely for pure reading practice.

### 4.2 Interactive Vocabulary Popover
Clicking or hovering on any highlighted word immediately displays an accessible popover containing:
- English headword + Part of speech (`[adj]`, `[v]`, `[n]`)
- Phonetic transcription (IPA: `/ˌʌnˈpresɪdentɪd/`)
- Audio pronunciation button (Web Speech API or recorded audio URL)
- Vietnamese definition in clear typography
- Contextual example sentence with Vietnamese translation
- **"Save to Word Bank"** toggle button with bookmark state

### 4.3 Article Word Bank Drawer
A floating action button and header toggle open the **Article Word Bank Sheet**:
- Displays all vocabulary items referenced throughout the article.
- Filterable and grouped by CEFR level (e.g. 4 B2 words, 2 C1 words).
- Shows mastery status (Saved / Not Saved).
- Allows one-click "Save All New Words to My Bank".

### 4.4 Reader Customization Bar (Sticky Header)
- **Font Size Selector**: Small (16px), Medium (18px), Large (21px), Extra Large (24px).
- **Line Spacing**: Relaxed reading line-height (`leading-relaxed` / `leading-loose`).
- **Reading Progress Tracker**: Thin top bar showing percentage scrolled.
- **Estimated Reading Time**: Calculated dynamically from total English word count ($WPM \approx 180$).
- **Dark / Light / Sepia Mode**: High contrast and eye-comfort modes.

---

## 5. Responsive Design Layout Guidelines

| Viewport | Dimension | Reader Layout Behavior |
| :--- | :--- | :--- |
| **Desktop** | $\ge 1200\text{px}$ | Centered reading container (max-w-3xl) flanked by floating Word Bank summary on the right and reading progress outline on the left. |
| **Tablet** | $768\text{px} - 1199\text{px}$ | Streamlined single column; Word Bank accessible via sliding overlay sheet. |
| **Mobile** | $< 768\text{px}$ | Full-width comfortable padding (16px); tap to open bottom sheet for vocabulary details; bottom sticky reading navigation. |
