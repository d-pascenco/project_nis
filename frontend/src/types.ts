export interface RoadmapResource {
  name: string;
  platform: string;
  type: "course" | "book" | "video" | "practice" | "tool" | "article";
  time?: string;
}

export interface WeekPlan {
  week: number;
  focus: string;
  tasks: string[];
}

export interface RoadmapProject {
  title: string;
  description: string;
  duration?: string;
}

export interface FinalGoal {
  title: string;
  requirements: string[];
  portfolio: string[];
}

export interface DailySchedule {
  morning: string;
  study_blocks: string[];
  evening: string;
  breaks: string;
  tip: string;
}

export interface WeeklyRhythm {
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
}

export interface LifestyleGuide {
  sleep: string;
  exercise: string;
  nutrition: string;
  no_burnout: string;
  deep_work: string;
}

export interface LifeSystem {
  time_management: string;
  daily_ritual: string;
  weekly_review: string;
  energy_management: string;
  tracking: string;
}

export interface RoadmapStage {
  id: number;
  title: string;
  duration: string;
  goal?: string;
  skills: string[];
  tools?: string[];
  resources: string[] | RoadmapResource[];
  weekly_plan?: WeekPlan[];
  projects?: RoadmapProject[];
  deliverables?: string[];
  checkpoint?: string;
  job_relevance?: string;
  daily_schedule?: DailySchedule;
  weekly_rhythm?: WeeklyRhythm;
  lifestyle?: LifestyleGuide;
  motivation_tips?: string[];
  common_mistakes?: string[];
}

export interface RoadmapData {
  stages: RoadmapStage[];
  total_duration: string;
  summary: string;
  final_goal?: FinalGoal;
  life_system?: LifeSystem;
}

export interface OnboardingFormData {
  fullName: string;
  age: string;
  location: string;
  currentStatus: string;
  education: string;
  university: string;
  specialization: string;
  yearsExperience: string;
  currentRole: string;
  cvSummary: string;
  targetProfession: string;
  targetIndustry: string;
  timeline: string;
  motivation: string;
  priorities: string[];
  technicalSkills: string[];
  softSkills: string[];
  languages: { name: string; level: number }[];
  learningStyle: string;
  hoursPerWeek: number;
  budget: string;
  healthConsiderations: string;
  preferOnline: boolean;
  preferRussian: boolean;
  needMentorship: boolean;
  additionalInfo: string;
}
