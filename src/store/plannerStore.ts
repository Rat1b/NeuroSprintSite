import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Task, WeekPlan, WeeklyReflection, DayOfWeek, AIJsonImport } from '../types';

// Создать пустую рефлексию
const createEmptyReflection = (): WeeklyReflection => ({
    done: { foundation: '', drive: '', joy: '' },
    notDone: { foundation: '', drive: '', joy: '' },
    adjustments: '',
});

// Получить дату начала текущей недели (понедельник)
// Получить дату начала текущей недели (понедельник)
const getCurrentWeekStart = (): string => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));

    // Форматируем как YYYY-MM-DD в локальном времени
    const year = monday.getFullYear();
    const month = String(monday.getMonth() + 1).padStart(2, '0');
    const d = String(monday.getDate()).padStart(2, '0');

    return `${year}-${month}-${d}`;
};

// Создать новый план недели
const createEmptyWeekPlan = (): WeekPlan => ({
    id: uuidv4(),
    weekStart: getCurrentWeekStart(),
    structureOption: 1,
    tasks: [],
    reflection: createEmptyReflection(),
});

interface PlannerStore {
    // Состояние
    currentWeek: WeekPlan;
    weeks: WeekPlan[];
    activeView: 'planner' | 'reflection' | 'month';

    // Действия с задачами
    addTask: (task: Omit<Task, 'id' | 'order'>) => void;
    updateTask: (taskId: string, updates: Partial<Task>) => void;
    deleteTask: (taskId: string) => void;
    moveTask: (taskId: string, newDay: DayOfWeek, newOrder: number) => void;
    toggleTaskComplete: (taskId: string) => void;
    reorderTasksInDay: (day: DayOfWeek, orderedIds: string[]) => void;

    // Действия с планом
    setStructureOption: (option: 1 | 2 | 3 | 4 | 5) => void;
    saveReflection: (reflection: WeeklyReflection) => void;
    setActiveView: (view: 'planner' | 'reflection' | 'month') => void;

    // Импорт/экспорт
    importFromJSON: (json: AIJsonImport) => void;
    exportToJSON: () => string;
    clearCurrentWeek: () => void;

    // Навигация по неделям
    goToWeek: (weekStart: string) => void;
    createNewWeek: () => void;
}

export const usePlannerStore = create<PlannerStore>()(
    persist(
        (set, get) => ({
            currentWeek: createEmptyWeekPlan(),
            weeks: [],
            activeView: 'planner',

            addTask: (taskData) => {
                const tasksInDay = get().currentWeek.tasks.filter(t => t.day === taskData.day);
                const newTask: Task = {
                    ...taskData,
                    id: uuidv4(),
                    order: tasksInDay.length,
                };

                set((state) => ({
                    currentWeek: {
                        ...state.currentWeek,
                        tasks: [...state.currentWeek.tasks, newTask],
                    },
                }));
            },

            updateTask: (taskId, updates) => {
                set((state) => ({
                    currentWeek: {
                        ...state.currentWeek,
                        tasks: state.currentWeek.tasks.map((task) =>
                            task.id === taskId ? { ...task, ...updates } : task
                        ),
                    },
                }));
            },

            deleteTask: (taskId) => {
                set((state) => ({
                    currentWeek: {
                        ...state.currentWeek,
                        tasks: state.currentWeek.tasks.filter((task) => task.id !== taskId),
                    },
                }));
            },

            moveTask: (taskId, newDay, newOrder) => {
                set((state) => {
                    const task = state.currentWeek.tasks.find((t) => t.id === taskId);
                    if (!task) return state;

                    const otherTasks = state.currentWeek.tasks.filter((t) => t.id !== taskId);
                    const tasksInNewDay = otherTasks.filter((t) => t.day === newDay);

                    // Обновить порядок задач в новом дне
                    tasksInNewDay.forEach((t) => {
                        if (t.order >= newOrder) t.order += 1;
                    });

                    const updatedTask = { ...task, day: newDay, order: newOrder };

                    return {
                        currentWeek: {
                            ...state.currentWeek,
                            tasks: [...otherTasks, updatedTask],
                        },
                    };
                });
            },

            toggleTaskComplete: (taskId) => {
                set((state) => ({
                    currentWeek: {
                        ...state.currentWeek,
                        tasks: state.currentWeek.tasks.map((task) =>
                            task.id === taskId ? { ...task, completed: !task.completed } : task
                        ),
                    },
                }));
            },

            reorderTasksInDay: (day, orderedIds) => {
                set((state) => ({
                    currentWeek: {
                        ...state.currentWeek,
                        tasks: state.currentWeek.tasks.map((task) => {
                            if (task.day !== day) return task;
                            const newOrder = orderedIds.indexOf(task.id);
                            return newOrder >= 0 ? { ...task, order: newOrder } : task;
                        }),
                    },
                }));
            },

            setStructureOption: (option) => {
                set((state) => ({
                    currentWeek: {
                        ...state.currentWeek,
                        structureOption: option,
                    },
                }));
            },

            saveReflection: (reflection) => {
                set((state) => ({
                    currentWeek: {
                        ...state.currentWeek,
                        reflection,
                    },
                }));
            },

            setActiveView: (view) => {
                set({ activeView: view });
            },

            importFromJSON: (json) => {
                const tasks: Task[] = json.tasks.map((t, index) => ({
                    id: uuidv4(),
                    project: t.project,
                    title: t.title,
                    duration: t.duration,
                    startTime: t.startTime,
                    day: t.day,
                    completed: false,
                    order: index,
                }));

                // Группировать и переназначить порядок по дням
                const dayGroups: Record<string, Task[]> = {};
                tasks.forEach((task) => {
                    if (!dayGroups[task.day]) dayGroups[task.day] = [];
                    dayGroups[task.day].push(task);
                });

                Object.values(dayGroups).forEach((group) => {
                    group.forEach((task, idx) => {
                        task.order = idx;
                    });
                });

                set((state) => ({
                    currentWeek: {
                        ...state.currentWeek,
                        weekStart: json.weekStart || state.currentWeek.weekStart,
                        structureOption: json.option || state.currentWeek.structureOption,
                        tasks: [...state.currentWeek.tasks, ...tasks],
                    },
                }));
            },

            exportToJSON: () => {
                const { currentWeek } = get();
                const exportData: AIJsonImport = {
                    weekStart: currentWeek.weekStart,
                    option: currentWeek.structureOption,
                    tasks: currentWeek.tasks.map((t) => ({
                        day: t.day,
                        project: t.project,
                        title: t.title,
                        duration: t.duration,
                        startTime: t.startTime,
                    })),
                };
                return JSON.stringify(exportData, null, 2);
            },

            clearCurrentWeek: () => {
                set((state) => ({
                    currentWeek: {
                        ...state.currentWeek,
                        tasks: [],
                        reflection: createEmptyReflection(),
                    },
                }));
            },

            goToWeek: (weekStart) => {
                const { weeks, currentWeek } = get();

                // Сохранить текущую неделю
                const existingIndex = weeks.findIndex((w) => w.weekStart === currentWeek.weekStart);
                let updatedWeeks = [...weeks];
                if (existingIndex >= 0) {
                    updatedWeeks[existingIndex] = currentWeek;
                } else {
                    updatedWeeks.push(currentWeek);
                }

                // Найти или создать целевую неделю
                let targetWeek = updatedWeeks.find((w) => w.weekStart === weekStart);
                if (!targetWeek) {
                    targetWeek = {
                        ...createEmptyWeekPlan(),
                        weekStart,
                    };
                    updatedWeeks.push(targetWeek);
                }

                set({
                    currentWeek: targetWeek,
                    weeks: updatedWeeks,
                });
            },

            createNewWeek: () => {
                const { currentWeek, weeks } = get();

                // Сохранить текущую неделю
                const existingIndex = weeks.findIndex((w) => w.weekStart === currentWeek.weekStart);
                let updatedWeeks = [...weeks];
                if (existingIndex >= 0) {
                    updatedWeeks[existingIndex] = currentWeek;
                } else {
                    updatedWeeks.push(currentWeek);
                }

                // Создать следующую неделю
                const currentDate = new Date(currentWeek.weekStart);
                currentDate.setDate(currentDate.getDate() + 7);

                const year = currentDate.getFullYear();
                const month = String(currentDate.getMonth() + 1).padStart(2, '0');
                const d = String(currentDate.getDate()).padStart(2, '0');
                const newWeekStart = `${year}-${month}-${d}`;

                const newWeek: WeekPlan = {
                    ...createEmptyWeekPlan(),
                    weekStart: newWeekStart,
                    structureOption: currentWeek.structureOption,
                };

                set({
                    currentWeek: newWeek,
                    weeks: updatedWeeks,
                });
            },
        }),
        {
            name: 'neurosprint-planner',
        }
    )
);
