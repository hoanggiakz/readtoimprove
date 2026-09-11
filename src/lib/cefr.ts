export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export interface CefrInfo {
  level: CefrLevel;
  label: string;
  description: string;
  badgeClasses: string;
  highlightClasses: string;
}

export const CEFR_METADATA: Record<CefrLevel, CefrInfo> = {
  A1: {
    level: "A1",
    label: "Beginner",
    description: "Basic everyday expressions and phrases",
    badgeClasses: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    highlightClasses: "decoration-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/70",
  },
  A2: {
    level: "A2",
    label: "Elementary",
    description: "Frequently used expressions in routine tasks",
    badgeClasses: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-800",
    highlightClasses: "decoration-teal-400 hover:bg-teal-50/70 dark:hover:bg-teal-950/40",
  },
  B1: {
    level: "B1",
    label: "Intermediate",
    description: "Familiar matters in work, school, and leisure",
    badgeClasses: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
    highlightClasses: "decoration-emerald-500 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/40",
  },
  B2: {
    level: "B2",
    label: "Upper Intermediate",
    description: "Complex texts, technical discussions, and fluent conversation",
    badgeClasses: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800",
    highlightClasses: "decoration-sky-500 hover:bg-sky-50/70 dark:hover:bg-sky-950/40",
  },
  C1: {
    level: "C1",
    label: "Advanced",
    description: "Demanding longer texts and implicit nuance",
    badgeClasses: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800",
    highlightClasses: "decoration-purple-500 hover:bg-purple-50/70 dark:hover:bg-purple-950/40",
  },
  C2: {
    level: "C2",
    label: "Proficiency",
    description: "Near-native precision, subtle shades of meaning",
    badgeClasses: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800",
    highlightClasses: "decoration-rose-500 hover:bg-rose-50/70 dark:hover:bg-rose-950/40",
  },
};

export function getCefrInfo(level: string | null | undefined): CefrInfo {
  const normalized = (level?.toUpperCase() || "B2") as CefrLevel;
  return CEFR_METADATA[normalized] || CEFR_METADATA.B2;
}
