export const PROFESSION_LABELS: Record<string, string> = {
  frontend: "Frontend Developer",
  backend: "Backend Developer",
  fullstack: "Fullstack Developer",
  "data-scientist": "Data Scientist",
  "ml-engineer": "ML Engineer",
  devops: "DevOps Engineer",
  product: "Product Manager",
  designer: "UX/UI Designer",
  analyst: "Business Analyst",
  qa: "QA Engineer",
};

export const TIMELINE_LABELS: Record<string, string> = {
  "3months": "3 месяца",
  "6months": "6 месяцев",
  "1year": "1 год",
  "2years": "2 года",
  flexible: "Гибкий срок",
};

export const STATUS_LABELS: Record<string, string> = {
  student: "Студент",
  graduate: "Выпускник",
  employed: "Работаю",
  unemployed: "В поиске работы",
  "career-change": "Меняю карьеру",
};

export const STAGE_COLORS = [
  "text-primary border-primary/40 bg-primary/10",
  "text-blue-600 border-blue-400/40 bg-blue-500/10",
  "text-violet-600 border-violet-400/40 bg-violet-500/10",
  "text-amber-600 border-amber-400/40 bg-amber-500/10",
  "text-emerald-600 border-emerald-400/40 bg-emerald-500/10",
  "text-rose-600 border-rose-400/40 bg-rose-500/10",
];

const PLATFORM_URLS: Record<string, string> = {
  Stepik: "https://stepik.org/search",
  Coursera: "https://www.coursera.org/search",
  YouTube: "https://www.youtube.com/results",
  GitHub: "https://github.com/search",
  Хекслет: "https://ru.hexlet.io",
  freeCodeCamp: "https://www.freecodecamp.org",
  Udemy: "https://www.udemy.com/courses/search",
  "JavaScript.info": "https://javascript.info",
  MDN: "https://developer.mozilla.org/ru",
  LinkedIn: "https://www.linkedin.com",
  Kaggle: "https://www.kaggle.com",
  Codecademy: "https://www.codecademy.com",
};

export const getResourceUrl = (name: string): string => {
  for (const [key, url] of Object.entries(PLATFORM_URLS)) {
    if (name.toLowerCase().includes(key.toLowerCase())) return url;
  }
  return `https://www.google.com/search?q=${encodeURIComponent(name + " курс")}`;
};
