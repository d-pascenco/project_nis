export interface RoadmapStage {
  id: number;
  title: string;
  duration: string;
  skills: string[];
  resources: string[];
}

export interface RoadmapData {
  stages: RoadmapStage[];
  total_duration: string;
  summary: string;
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
