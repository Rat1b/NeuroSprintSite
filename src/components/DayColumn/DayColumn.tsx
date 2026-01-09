import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Task, DayOfWeek } from '../../types';
import { TaskBlock } from '../TaskBlock/TaskBlock';
import styles from './DayColumn.module.css';

interface DayColumnProps {
    day: DayOfWeek;
    date: string;
    tasks: Task[];
    onAddTask: (day: DayOfWeek) => void;
    onEditTask: (task: Task) => void;
}

export function DayColumn({ day, date, tasks, onAddTask, onEditTask }: DayColumnProps) {
    const { setNodeRef, isOver } = useDroppable({ id: day });

    const isWeekend = day === 'СБ' || day === 'ВС';
    const sortedTasks = [...tasks].sort((a, b) => a.order - b.order);
    const taskIds = sortedTasks.map(t => t.id);

    const formatDate = (dateStr: string) => {
        const [year, month, day] = dateStr.split('-').map(Number);
        const d = new Date(year, month - 1, day);
        return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    };

    // Подсчёт фактического времени по проектам
    const actualTime = {
        foundation: tasks.filter(t => t.project === 'Ф').reduce((sum, t) => sum + t.duration, 0),
        drive: tasks.filter(t => t.project === 'Д').reduce((sum, t) => sum + t.duration, 0),
        joy: tasks.filter(t => t.project === 'К').reduce((sum, t) => sum + t.duration, 0),
        reflection: tasks.filter(t => t.project === 'Р').reduce((sum, t) => sum + t.duration, 0),
    };

    const hasAnyTime = actualTime.foundation + actualTime.drive + actualTime.joy + actualTime.reflection > 0;

    return (
        <div className={`${styles.dayColumn} ${isWeekend ? styles.weekend : ''}`}>
            <div className={styles.dayHeader}>
                <div className={styles.dayName}>{day}</div>
                <div className={styles.dayDate}>{formatDate(date)}</div>

                {hasAnyTime && (
                    <div className={styles.dayBudget}>
                        {actualTime.foundation > 0 && (
                            <span className={`${styles.budgetItem} ${styles.foundation}`}>
                                {actualTime.foundation}
                            </span>
                        )}
                        {actualTime.drive > 0 && (
                            <span className={`${styles.budgetItem} ${styles.drive}`}>
                                {actualTime.drive}
                            </span>
                        )}
                        {actualTime.joy > 0 && (
                            <span className={`${styles.budgetItem} ${styles.joy}`}>
                                {actualTime.joy}
                            </span>
                        )}
                        {actualTime.reflection > 0 && (
                            <span className={`${styles.budgetItem} ${styles.reflection}`}>
                                {actualTime.reflection}
                            </span>
                        )}
                    </div>
                )}
            </div>

            <div className={styles.dayContent}>
                <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
                    <div
                        ref={setNodeRef}
                        className={`${styles.dropZone} ${isOver ? styles.isOver : ''}`}
                    >
                        {sortedTasks.length > 0 ? (
                            sortedTasks.map((task) => (
                                <TaskBlock key={task.id} task={task} onEdit={onEditTask} />
                            ))
                        ) : (
                            <div className={styles.emptyState}>
                                Перетащите задачу сюда
                            </div>
                        )}
                    </div>
                </SortableContext>

                <button
                    className={styles.addTaskBtn}
                    onClick={() => onAddTask(day)}
                >
                    ➕ Добавить задачу
                </button>
            </div>
        </div>
    );
}
