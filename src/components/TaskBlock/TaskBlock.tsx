import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task, ProjectType } from '../../types';
import { usePlannerStore } from '../../store/plannerStore';
import styles from './TaskBlock.module.css';

interface TaskBlockProps {
    task: Task;
    onEdit: (task: Task) => void;
}

const projectClassMap: Record<ProjectType, string> = {
    'Ф': styles.foundation,
    'Д': styles.drive,
    'К': styles.joy,
    'Р': styles.reflection,
};

export function TaskBlock({ task, onEdit }: TaskBlockProps) {
    const { toggleTaskComplete, deleteTask } = usePlannerStore();

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const projectClass = projectClassMap[task.project];

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`
        ${styles.taskBlock} 
        ${projectClass}
        ${isDragging ? styles.dragging : ''}
        ${task.completed ? styles.completed : ''}
      `}
            {...attributes}
            {...listeners}
        >
            {task.startTime && (
                <div className={styles.startTime}>
                    🕐 {task.startTime}
                </div>
            )}

            <div className={styles.taskHeader}>
                <span className={`${styles.projectBadge} ${projectClass}`}>
                    {task.project}
                </span>
                <span className={styles.duration}>{task.duration} мин</span>
            </div>

            <div className={styles.taskTitle}>{task.title}</div>

            <div className={styles.taskActions}>
                <button
                    className={`${styles.actionBtn} ${styles.checkBtn} ${task.completed ? styles.checked : ''}`}
                    onClick={(e) => { e.stopPropagation(); toggleTaskComplete(task.id); }}
                    title={task.completed ? 'Отметить как невыполненное' : 'Отметить как выполненное'}
                >
                    ✓
                </button>
                <button
                    className={styles.actionBtn}
                    onClick={(e) => { e.stopPropagation(); onEdit(task); }}
                    title="Редактировать"
                >
                    ✏️
                </button>
                <button
                    className={styles.actionBtn}
                    onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                    title="Удалить"
                >
                    🗑️
                </button>
            </div>
        </div>
    );
}
