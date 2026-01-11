import { useState, useEffect } from 'react';
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
    const { toggleTaskComplete, deleteTask, addTask } = usePlannerStore();
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [showActions, setShowActions] = useState(false);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id });

    // Close actions menu when dragging starts to prevent height mismatch
    useEffect(() => {
        if (isDragging) {
            setShowActions(false);
        }
    }, [isDragging]);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const projectClass = projectClassMap[task.project];

    const handleDuplicate = (e: React.MouseEvent | React.TouchEvent) => {
        e.stopPropagation();
        addTask({
            project: task.project,
            title: task.title,
            duration: task.duration,
            startTime: task.startTime,
            day: task.day,
            completed: false,
        });
    };

    const handleDeleteClick = (e: React.MouseEvent | React.TouchEvent) => {
        e.stopPropagation();
        if (confirmDelete) {
            deleteTask(task.id);
            setConfirmDelete(false);
        } else {
            setConfirmDelete(true);
            // Auto-reset after 2 seconds
            setTimeout(() => setConfirmDelete(false), 2000);
        }
    };

    const handleBlockClick = () => {
        setShowActions(!showActions);
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`
                ${styles.taskBlock} 
                ${projectClass}
                ${isDragging ? styles.dragging : ''}
                ${task.completed ? styles.completed : ''}
                ${showActions ? styles.actionsVisible : ''}
            `}
            onClick={handleBlockClick}
        >
            {/* Task content */}
            <div className={styles.taskContent}>
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
                    {/* Left group: check, edit, duplicate */}
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
                        onClick={handleDuplicate}
                        title="Дублировать"
                    >
                        📋
                    </button>

                    {/* Center spacer */}
                    <div style={{ flex: 1 }} />

                    {/* Delete button in center-right area */}
                    <button
                        className={`${styles.actionBtn} ${styles.deleteBtn} ${confirmDelete ? styles.confirmDelete : ''}`}
                        onClick={handleDeleteClick}
                        title={confirmDelete ? 'Нажми ещё раз для удаления!' : 'Удалить'}
                    >
                        {confirmDelete ? '❌' : '🗑️'}
                    </button>

                    {/* Right spacer to push delete to center */}
                    <div style={{ flex: 1 }} />
                </div>
            </div>

            {/* Right side: only drag handle */}
            <div
                className={styles.dragHandle}
                {...attributes}
                {...listeners}
                title="Перетащить"
            >
                ⋮⋮
            </div>
        </div>
    );
}



