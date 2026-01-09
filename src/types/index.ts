// Типы проектов нейроспринта
export type ProjectType = 'Ф' | 'Д' | 'К' | 'Р';

// Дни недели
export type DayOfWeek = 'ПН' | 'ВТ' | 'СР' | 'ЧТ' | 'ПТ' | 'СБ' | 'ВС';

// Задача
export interface Task {
  id: string;
  project: ProjectType;
  title: string;
  duration: number;      // в минутах
  startTime?: string;    // "HH:MM" формат 24ч (опционально)
  day: DayOfWeek;
  completed: boolean;
  order: number;         // порядок в дне для сортировки
}

// Еженедельная рефлексия
export interface WeeklyReflection {
  done: {
    foundation: string;
    drive: string;
    joy: string;
  };
  notDone: {
    foundation: string;
    drive: string;
    joy: string;
  };
  adjustments: string;
}

// План на неделю
export interface WeekPlan {
  id: string;
  weekStart: string;     // "YYYY-MM-DD"
  structureOption: 1 | 2 | 3 | 4 | 5;
  tasks: Task[];
  reflection: WeeklyReflection;
}

// Структура опции недели (минуты по дням)
export interface DayStructure {
  foundation: number;
  drive: number;
  joy: number;
  reflection: number;
}

export interface WeekStructure {
  ПН: DayStructure;
  ВТ: DayStructure;
  СР: DayStructure;
  ЧТ: DayStructure;
  ПТ: DayStructure;
  СБ: DayStructure;
  ВС: DayStructure;
}

// 5 опций структуры недели
export const STRUCTURE_OPTIONS: Record<1 | 2 | 3 | 4 | 5, WeekStructure> = {
  1: {
    // 90 мин/день: Ф:25 Д:50 К:15 будни, СБ: К:90, ВС: Ф:60 Р:30
    ПН: { foundation: 25, drive: 50, joy: 15, reflection: 0 },
    ВТ: { foundation: 25, drive: 50, joy: 15, reflection: 0 },
    СР: { foundation: 25, drive: 50, joy: 15, reflection: 0 },
    ЧТ: { foundation: 25, drive: 50, joy: 15, reflection: 0 },
    ПТ: { foundation: 25, drive: 50, joy: 15, reflection: 0 },
    СБ: { foundation: 0, drive: 0, joy: 90, reflection: 0 },
    ВС: { foundation: 60, drive: 0, joy: 0, reflection: 30 },
  },
  2: {
    // 45 мин будни + 3ч выходные: Ф:10 Д:30 К:5, СБ: К:180, ВС: Ф:150 Р:30
    ПН: { foundation: 10, drive: 30, joy: 5, reflection: 0 },
    ВТ: { foundation: 10, drive: 30, joy: 5, reflection: 0 },
    СР: { foundation: 10, drive: 30, joy: 5, reflection: 0 },
    ЧТ: { foundation: 10, drive: 30, joy: 5, reflection: 0 },
    ПТ: { foundation: 10, drive: 30, joy: 5, reflection: 0 },
    СБ: { foundation: 0, drive: 0, joy: 180, reflection: 0 },
    ВС: { foundation: 150, drive: 0, joy: 0, reflection: 30 },
  },
  3: {
    // 60 мин будни + 2.5ч выходные: Ф:10 Д:45 К:5, СБ: К:150, ВС: Ф:120 Р:30
    ПН: { foundation: 10, drive: 45, joy: 5, reflection: 0 },
    ВТ: { foundation: 10, drive: 45, joy: 5, reflection: 0 },
    СР: { foundation: 10, drive: 45, joy: 5, reflection: 0 },
    ЧТ: { foundation: 10, drive: 45, joy: 5, reflection: 0 },
    ПТ: { foundation: 10, drive: 45, joy: 5, reflection: 0 },
    СБ: { foundation: 0, drive: 0, joy: 150, reflection: 0 },
    ВС: { foundation: 120, drive: 0, joy: 0, reflection: 30 },
  },
  4: {
    // 2.5ч × 4 дня: Ф:60 Д:75 К:15, ВС: Ф:120 Р:30
    ПН: { foundation: 60, drive: 75, joy: 15, reflection: 0 },
    ВТ: { foundation: 0, drive: 0, joy: 0, reflection: 0 },
    СР: { foundation: 60, drive: 75, joy: 15, reflection: 0 },
    ЧТ: { foundation: 0, drive: 0, joy: 0, reflection: 0 },
    ПТ: { foundation: 60, drive: 75, joy: 15, reflection: 0 },
    СБ: { foundation: 0, drive: 0, joy: 0, reflection: 0 },
    ВС: { foundation: 120, drive: 0, joy: 0, reflection: 30 },
  },
  5: {
    // 3ч × 3 дня: Ф:60 Д:90 К:30
    ПН: { foundation: 60, drive: 90, joy: 30, reflection: 0 },
    ВТ: { foundation: 0, drive: 0, joy: 0, reflection: 0 },
    СР: { foundation: 60, drive: 90, joy: 30, reflection: 0 },
    ЧТ: { foundation: 0, drive: 0, joy: 0, reflection: 0 },
    ПТ: { foundation: 0, drive: 0, joy: 0, reflection: 0 },
    СБ: { foundation: 0, drive: 0, joy: 0, reflection: 0 },
    ВС: { foundation: 60, drive: 0, joy: 90, reflection: 30 },
  },
};

// Цвета проектов
export const PROJECT_COLORS: Record<ProjectType, string> = {
  'Ф': '#4ADE80', // Зелёный - Фундамент
  'Д': '#A78BFA', // Фиолетовый - Драйв
  'К': '#FACC15', // Жёлтый - Кайф
  'Р': '#FB923C', // Оранжевый - Рефлексия
};

// Названия проектов
export const PROJECT_NAMES: Record<ProjectType, string> = {
  'Ф': 'Фундамент',
  'Д': 'Драйв',
  'К': 'Кайф',
  'Р': 'Рефлексия',
};

// Все дни недели по порядку
export const DAYS_OF_WEEK: DayOfWeek[] = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];

// JSON формат для импорта от ИИ
export interface AIJsonImport {
  weekStart: string;
  option?: 1 | 2 | 3 | 4 | 5;
  tasks: Array<{
    day: DayOfWeek;
    project: ProjectType;
    title: string;
    duration: number;
    startTime?: string;
  }>;
}
