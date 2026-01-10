import { useState, useEffect } from 'react';
import type { Task, DayOfWeek, ProjectType } from '../../types';
import { DAYS_OF_WEEK, PROJECT_NAMES } from '../../types';
import { usePlannerStore } from '../../store/plannerStore';
import styles from './TaskModal.module.css';

interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    task?: Task | null;
    defaultDay?: DayOfWeek;
}

export function TaskModal({ isOpen, onClose, task, defaultDay }: TaskModalProps) {
    const { addTask, updateTask, currentWeek } = usePlannerStore();
    const [project, setProject] = useState<ProjectType>('Д');
    const [title, setTitle] = useState('');
    const [duration, setDuration] = useState(30);
    const [day, setDay] = useState<DayOfWeek>(defaultDay || 'ПН');
    const [startTime, setStartTime] = useState('');

    useEffect(() => {
        if (task) {
            setProject(task.project);
            setTitle(task.title);
            setDuration(task.duration);
            setDay(task.day);
            setStartTime(task.startTime || '');
        } else {
            // Умная логика выбора проекта по умолчанию
            const targetDay = defaultDay || 'ПН';
            const tasksInDay = currentWeek.tasks.filter(t => t.day === targetDay);
            const hasF = tasksInDay.some(t => t.project === 'Ф');
            const hasD = tasksInDay.some(t => t.project === 'Д');
            const hasK = tasksInDay.some(t => t.project === 'К');

            let defaultProject: ProjectType = 'Ф';

            // Логика: Ф -> Д -> К -> Ф
            if (hasF) defaultProject = 'Д';
            if (hasD) defaultProject = 'К'; // Если есть Д, то следующий К (перекрывает Ф->Д)
            if (hasK) defaultProject = 'Ф'; // Если есть К, то следующий снова Ф (перекрывает Д->К)

            setProject(defaultProject);
            setTitle('');
            setDuration(30);
            setDay(targetDay);
            setStartTime('');
        }
    }, [task, defaultDay, isOpen, currentWeek]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim()) return;

        if (task) {
            updateTask(task.id, {
                project,
                title: title.trim(),
                duration,
                day,
                startTime: startTime || undefined,
            });
        } else {
            addTask({
                project,
                title: title.trim(),
                duration,
                day,
                startTime: startTime || undefined,
                completed: false,
            });
        }

        onClose();
    };

    const projectClass = (p: ProjectType) => {
        const map: Record<ProjectType, string> = {
            'Ф': styles.foundation,
            'Д': styles.drive,
            'К': styles.joy,
            'Р': styles.reflection,
        };
        return map[p];
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2>{task ? '✏️ Редактировать задачу' : '➕ Новая задача'}</h2>
                    <button className={styles.closeBtn} onClick={onClose}>×</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label>Проект</label>
                        <div className={styles.projectSelect}>
                            {(['Ф', 'Д', 'К', 'Р'] as ProjectType[]).map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    className={`${styles.projectOption} ${project === p ? `${styles.active} ${projectClass(p)}` : ''}`}
                                    onClick={() => setProject(p)}
                                >
                                    {p} — {PROJECT_NAMES[p]}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Название задачи</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Например: Прогулка в парке"
                            autoFocus
                        />
                    </div>

                    <div className={styles.row}>
                        <div className={styles.formGroup}>
                            <label>День</label>
                            <select value={day} onChange={(e) => setDay(e.target.value as DayOfWeek)}>
                                {DAYS_OF_WEEK.map((d) => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Длительность (мин)</label>
                            <input
                                type="number"
                                value={duration}
                                onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value) || 0))}
                                min={1}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Время начала</label>
                            <input
                                type="time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className={styles.modalActions}>
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Отмена
                        </button>
                        <button type="submit" className="btn btn-primary">
                            {task ? 'Сохранить' : 'Добавить'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
