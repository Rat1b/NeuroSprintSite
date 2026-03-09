import { useState } from 'react';
import type { AIJsonImport, ProjectType } from '../../types';
import { usePlannerStore } from '../../store/plannerStore';
import modalStyles from '../TaskModal/TaskModal.module.css';
import styles from './JsonImportModal.module.css';

interface JsonImportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function JsonImportModal({ isOpen, onClose }: JsonImportModalProps) {
    const { importFromJSON, clearCurrentWeek } = usePlannerStore();
    const [jsonText, setJsonText] = useState('');
    const [error, setError] = useState('');
    const [parsedData, setParsedData] = useState<AIJsonImport | null>(null);

    if (!isOpen) return null;

    const handleTextChange = (text: string) => {
        setJsonText(text);
        setError('');
        setParsedData(null);

        if (!text.trim()) return;

        try {
            const data = JSON.parse(text) as AIJsonImport;

            // Валидация
            if (!data.tasks || !Array.isArray(data.tasks)) {
                throw new Error('Поле "tasks" должно быть массивом');
            }

            for (const task of data.tasks) {
                if (!task.day || !task.project || !task.title || !task.duration) {
                    throw new Error('Каждая задача должна содержать: day, project, title, duration');
                }
            }

            setParsedData(data);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Неверный формат JSON');
        }
    };

    const handleImport = (replace: boolean) => {
        if (!parsedData) return;

        if (replace) {
            clearCurrentWeek();
        }

        importFromJSON(parsedData);
        setJsonText('');
        setParsedData(null);
        onClose();
    };

    const badgeClass = (p: ProjectType) => {
        const map: Record<ProjectType, string> = {
            'Ф': styles.foundation,
            'Д': styles.drive,
            'К': styles.joy,
            'Р': styles.reflection,
        };
        return map[p];
    };

    const exampleJson = `{
  "weekStart": "2026-01-12",
  "option": 1,
  "tasks": [
    {
      "day": "ПН",
      "project": "Ф",
      "title": "Прогулка в парке",
      "duration": 25,
      "startTime": "10:00"
    },
    {
      "day": "ПН",
      "project": "Д",
      "title": "Написать скрипт для видео",
      "duration": 50
    }
  ]
}`;

    return (
        <div className={modalStyles.modalOverlay} onClick={onClose}>
            <div className={modalStyles.modal} style={{ width: '600px' }} onClick={(e) => e.stopPropagation()}>
                <div className={modalStyles.modalHeader}>
                    <h2>📥 Импорт JSON от ИИ</h2>
                    <button className={modalStyles.closeBtn} onClick={onClose}>×</button>
                </div>

                <div className={modalStyles.formGroup}>
                    <label>Вставьте JSON план:</label>
                    <textarea
                        className={styles.jsonInput}
                        value={jsonText}
                        onChange={(e) => handleTextChange(e.target.value)}
                        placeholder={exampleJson}
                    />
                    <p className={styles.helpText}>
                        ИИ должен сгенерировать JSON с полями: day (ПН-ВС), project (Ф/Д/К/Р), title, duration (минуты)
                    </p>
                </div>

                {error && <div className={styles.error}>❌ {error}</div>}

                {parsedData && parsedData.tasks.length > 0 && (
                    <div className={styles.preview}>
                        <h4>Предпросмотр ({parsedData.tasks.length} задач):</h4>
                        {parsedData.tasks.map((task, idx) => (
                            <div key={idx} className={styles.previewItem}>
                                <span className={styles.previewDay}>{task.day}</span>
                                <span className={`${styles.previewBadge} ${badgeClass(task.project)}`}>
                                    {task.project}
                                </span>
                                <span className={styles.previewTitle}>{task.title}</span>
                                <span className={styles.previewDuration}>{task.duration} мин</span>
                            </div>
                        ))}
                    </div>
                )}

                <div className={modalStyles.modalActions}>
                    <button type="button" className="btn btn-secondary" onClick={onClose}>
                        Отмена
                    </button>
                    <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => handleImport(true)}
                        disabled={!parsedData}
                    >
                        Заменить всё
                    </button>
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => handleImport(false)}
                        disabled={!parsedData}
                    >
                        Добавить к текущим
                    </button>
                </div>
            </div>
        </div>
    );
}
