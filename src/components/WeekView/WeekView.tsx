import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useState, useEffect } from 'react';
import { usePlannerStore } from '../../store/plannerStore';
import { DayColumn } from '../DayColumn/DayColumn';
import { TaskBlock } from '../TaskBlock/TaskBlock';
import { DAYS_OF_WEEK, type DayOfWeek, type Task } from '../../types';
import styles from './WeekView.module.css';

interface WeekViewProps {
    onAddTask: (day: DayOfWeek) => void;
    onEditTask: (task: Task) => void;
}

export function WeekView({ onAddTask, onEditTask }: WeekViewProps) {
    const { currentWeek, moveTask, reorderTasksInDay, addTask, setBudgetHours } = usePlannerStore();
    const [activeTask, setActiveTask] = useState<Task | null>(null);
    const [isDuplicating, setIsDuplicating] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const weeklyBudgetHours = currentWeek.budgetHours ?? 10; // Fallback for old data

    const toLocalYYYYMMDD = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };

    // Отслеживание Ctrl/Cmd для дублирования при перетаскивании
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) {
                setIsDuplicating(true);
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (!e.ctrlKey && !e.metaKey) {
                setIsDuplicating(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    // Sensors for drag-and-drop (desktop + mobile touch)
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 150,
                tolerance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const getDateForDay = (day: DayOfWeek): string => {
        const weekStart = new Date(currentWeek.weekStart + 'T12:00:00');
        const dayIndex = DAYS_OF_WEEK.indexOf(day);
        const date = new Date(weekStart);
        date.setDate(date.getDate() + dayIndex);
        return toLocalYYYYMMDD(date);
    };

    const handleDragStart = (event: any) => {
        const task = currentWeek.tasks.find(t => t.id === event.active.id);
        setActiveTask(task || null);
    };

    const handleDragEnd = (event: any) => {
        const { active, over } = event;
        setActiveTask(null);

        if (!over) return;

        const taskId = active.id as string;
        const task = currentWeek.tasks.find(t => t.id === taskId);
        if (!task) return;

        // Если зажат Ctrl/Cmd - дублируем задачу
        if (isDuplicating) {
            let targetDay: DayOfWeek = task.day;

            // Определяем целевой день
            if (DAYS_OF_WEEK.includes(over.id as DayOfWeek)) {
                targetDay = over.id as DayOfWeek;
            } else {
                const overTask = currentWeek.tasks.find(t => t.id === over.id);
                if (overTask) {
                    targetDay = overTask.day;
                }
            }

            // Создаём копию задачи
            addTask({
                project: task.project,
                title: task.title,
                duration: task.duration,
                startTime: task.startTime,
                day: targetDay,
                completed: false,
            });
            return;
        }

        // Обычное перемещение (без Ctrl/Cmd)
        // Если перетащили на колонку дня
        if (DAYS_OF_WEEK.includes(over.id as DayOfWeek)) {
            const newDay = over.id as DayOfWeek;
            if (task.day !== newDay) {
                const tasksInNewDay = currentWeek.tasks.filter(t => t.day === newDay);
                moveTask(taskId, newDay, tasksInNewDay.length);
            }
            return;
        }

        // Если перетащили на другую задачу
        const overTask = currentWeek.tasks.find(t => t.id === over.id);
        if (overTask) {
            if (task.day === overTask.day) {
                // Реордер в том же дне
                const dayTasks = currentWeek.tasks
                    .filter(t => t.day === task.day)
                    .sort((a, b) => a.order - b.order);

                const oldIndex = dayTasks.findIndex(t => t.id === taskId);
                const newIndex = dayTasks.findIndex(t => t.id === over.id);

                const newOrderedIds = [...dayTasks.map(t => t.id)];
                newOrderedIds.splice(oldIndex, 1);
                newOrderedIds.splice(newIndex, 0, taskId);

                reorderTasksInDay(task.day, newOrderedIds);
            } else {
                // Перемещение в другой день на позицию overTask
                moveTask(taskId, overTask.day, overTask.order);
            }
        }
    };


    // Статистика
    const totalTasks = currentWeek.tasks.length;
    const completedTasks = currentWeek.tasks.filter(t => t.completed).length;
    const totalPlannedMinutes = currentWeek.tasks.reduce((sum, t) => sum + t.duration, 0);
    const completedMinutes = currentWeek.tasks
        .filter(t => t.completed)
        .reduce((sum, t) => sum + t.duration, 0);

    // Статистика по проектам
    const projectStats = {
        foundation: currentWeek.tasks.filter(t => t.project === 'Ф').reduce((sum, t) => sum + t.duration, 0),
        drive: currentWeek.tasks.filter(t => t.project === 'Д').reduce((sum, t) => sum + t.duration, 0),
        joy: currentWeek.tasks.filter(t => t.project === 'К').reduce((sum, t) => sum + t.duration, 0),
        reflection: currentWeek.tasks.filter(t => t.project === 'Р').reduce((sum, t) => sum + t.duration, 0),
    };


    return (
        <div className={styles.weekView}>
            {/* Mobile sidebar overlay */}
            <div
                className={`${styles.sidebarOverlay} ${isSidebarOpen ? styles.open : ''}`}
                onClick={() => setIsSidebarOpen(false)}
            />

            {/* Floating sidebar toggle button for mobile */}
            <button
                className={styles.sidebarToggle}
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                aria-label="Показать статистику"
            >
                📊
            </button>

            <div className={`${styles.sidebar} ${isSidebarOpen ? styles.open : ''}`}>
                {/* Бюджет времени на неделю */}
                <div className={styles.budgetCard}>
                    <h3>⏱️ Бюджет на неделю</h3>
                    <div className={styles.budgetInput}>
                        <input
                            type="number"
                            value={weeklyBudgetHours}
                            onChange={(e) => setBudgetHours(Math.max(1, parseInt(e.target.value) || 10))}
                            min={1}
                            max={40}
                        />
                        <span>часов</span>
                    </div>
                    <div className={styles.budgetProgress}>
                        <div className={styles.progressBar}>
                            <div
                                className={styles.progressFill}
                                style={{
                                    width: `${Math.min(100, (totalPlannedMinutes / (weeklyBudgetHours * 60)) * 100)}%`,
                                    background: totalPlannedMinutes > weeklyBudgetHours * 60 ? '#ef4444' : 'var(--accent-gradient)'
                                }}
                            />
                        </div>
                        <div className={styles.progressText}>
                            {Math.floor(totalPlannedMinutes / 60)}ч {totalPlannedMinutes % 60}м / {weeklyBudgetHours}ч
                        </div>
                    </div>
                </div>

                {/* Прогресс выполнения */}
                <div className={styles.statsCard}>
                    <h3>✅ Выполнение</h3>
                    <div className={styles.completionStats}>
                        <div className={styles.bigNumber}>
                            {totalTasks > 0 ? Math.round((completedMinutes / totalPlannedMinutes) * 100) : 0}%
                        </div>
                        <div className={styles.completionLabel}>
                            {Math.floor(completedMinutes / 60)}ч {completedMinutes % 60}м выполнено
                        </div>
                    </div>
                    <div className={styles.statRow}>
                        <span className={styles.statLabel}>Задач выполнено</span>
                        <span className={styles.statValue}>{completedTasks} / {totalTasks}</span>
                    </div>
                </div>

                {/* Разбивка по проектам */}
                <div className={styles.projectsCard}>
                    <h3>📊 По проектам</h3>

                    <div className={styles.projectStat}>
                        <div className={styles.projectHeader}>
                            <div className={`${styles.projectDot} ${styles.foundation}`}></div>
                            <span>Фундамент</span>
                            <span className={styles.projectTime}>
                                {Math.floor(projectStats.foundation / 60)}ч {projectStats.foundation % 60}м
                            </span>
                        </div>
                        <div className={styles.miniProgress}>
                            <div
                                className={styles.miniFill}
                                style={{
                                    width: `${totalPlannedMinutes > 0 ? (projectStats.foundation / totalPlannedMinutes) * 100 : 0}%`,
                                    background: 'var(--color-foundation)'
                                }}
                            />
                        </div>
                    </div>

                    <div className={styles.projectStat}>
                        <div className={styles.projectHeader}>
                            <div className={`${styles.projectDot} ${styles.drive}`}></div>
                            <span>Драйв</span>
                            <span className={styles.projectTime}>
                                {Math.floor(projectStats.drive / 60)}ч {projectStats.drive % 60}м
                            </span>
                        </div>
                        <div className={styles.miniProgress}>
                            <div
                                className={styles.miniFill}
                                style={{
                                    width: `${totalPlannedMinutes > 0 ? (projectStats.drive / totalPlannedMinutes) * 100 : 0}%`,
                                    background: 'var(--color-drive)'
                                }}
                            />
                        </div>
                    </div>

                    <div className={styles.projectStat}>
                        <div className={styles.projectHeader}>
                            <div className={`${styles.projectDot} ${styles.joy}`}></div>
                            <span>Кайф</span>
                            <span className={styles.projectTime}>
                                {Math.floor(projectStats.joy / 60)}ч {projectStats.joy % 60}м
                            </span>
                        </div>
                        <div className={styles.miniProgress}>
                            <div
                                className={styles.miniFill}
                                style={{
                                    width: `${totalPlannedMinutes > 0 ? (projectStats.joy / totalPlannedMinutes) * 100 : 0}%`,
                                    background: 'var(--color-joy)'
                                }}
                            />
                        </div>
                    </div>

                    <div className={styles.projectStat}>
                        <div className={styles.projectHeader}>
                            <div className={`${styles.projectDot} ${styles.reflection}`}></div>
                            <span>Рефлексия</span>
                            <span className={styles.projectTime}>
                                {Math.floor(projectStats.reflection / 60)}ч {projectStats.reflection % 60}м
                            </span>
                        </div>
                        <div className={styles.miniProgress}>
                            <div
                                className={styles.miniFill}
                                style={{
                                    width: `${totalPlannedMinutes > 0 ? (projectStats.reflection / totalPlannedMinutes) * 100 : 0}%`,
                                    background: 'var(--color-reflection)'
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className={styles.daysContainer}>
                    {DAYS_OF_WEEK.map((day) => (
                        <DayColumn
                            key={day}
                            day={day}
                            date={getDateForDay(day)}
                            tasks={currentWeek.tasks.filter(t => t.day === day)}
                            onAddTask={onAddTask}
                            onEditTask={onEditTask}
                        />
                    ))}
                </div>

                <DragOverlay>
                    {activeTask && (
                        <TaskBlock task={activeTask} onEdit={() => { }} />
                    )}
                </DragOverlay>
            </DndContext>
        </div>
    );
}
