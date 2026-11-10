export interface JournalEntryData {
  id?: number;
  entryDate: string; // YYYY-MM-DD
  gratitude?: string | null;
  wentWell?: string | null;
  challenge?: string | null;
  freeText?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface DailyCheckinData {
  id?: number;
  entryDate: string; // YYYY-MM-DD
  sleepHours: number; // 0 - 24
  sleepQuality: number; // 1 - 5
  energy: number; // 1 - 5
  mood: number; // 1 - 5
  focus: number; // 1 - 5
  workload: number; // 1 - 5
  studyMinutes: number; // >= 0
  createdAt?: string;
  updatedAt?: string;
}

export interface DailyIntentionData {
  id?: number;
  targetDate: string; // YYYY-MM-DD
  learningPriority: string;
  recoveryAction: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DayRecord {
  date: string;
  journal?: JournalEntryData | null;
  checkin?: DailyCheckinData | null;
  intention?: DailyIntentionData | null;
}

export interface MetricSummary {
  average: number;
  min: number;
  max: number;
  count: number;
}

export interface WeeklyAnalytics {
  startDate: string;
  endDate: string;
  totalDaysRecorded: number;
  totalStudyHours: number;
  averages: {
    sleepHours: number;
    sleepQuality: number;
    energy: number;
    mood: number;
    focus: number;
    workload: number;
    studyMinutes: number;
  };
  dailyMetrics: Array<{
    date: string;
    dayOfWeek: string;
    sleepHours: number | null;
    sleepQuality: number | null;
    energy: number | null;
    mood: number | null;
    focus: number | null;
    workload: number | null;
    studyMinutes: number | null;
    hasJournal: boolean;
  }>;
}

export interface ContextualInsight {
  id: string;
  type: "correlation_observation" | "trend_observation" | "journal_context";
  title: string;
  observation: string;
  journalContext?: string | null;
  journalDate?: string | null;
  triggerMetric?: string;
}

export interface Recommendation {
  id: string;
  category: "workload" | "sleep" | "focus" | "recovery" | "energy";
  title: string;
  description: string;
  triggerExplanation: string;
}

export interface WeeklyReviewResult {
  hasSufficientData: boolean;
  startDate: string;
  endDate: string;
  analytics: WeeklyAnalytics | null;
  insights: ContextualInsight[];
  recommendations: Recommendation[];
  journalExcerpts: Array<{
    date: string;
    type: "gratitude" | "wentWell" | "challenge" | "freeText";
    content: string;
  }>;
  savedReflection?: string | null;
}
