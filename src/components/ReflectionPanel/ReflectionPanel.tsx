import { useState, useEffect } from 'react';
import { usePlannerStore } from '../../store/plannerStore';
import type { WeeklyReflection } from '../../types';
import styles from './ReflectionPanel.module.css';

// Helper to get sprint number
const getSprintNumber = (weekStart: string, allWeeks: string[], sprintResetWeeks: string[]): string => {
    const sortedWeeks = [...allWeeks, weekStart].sort();
    const weekIndex = sortedWeeks.indexOf(weekStart);

    // Find the last reset point before this week
    let resetIndex = -1;
    for (const reset of sprintResetWeeks) {
        const resetIdx = sortedWeeks.indexOf(reset);
        if (resetIdx <= weekIndex && resetIdx > resetIndex) {
            resetIndex = resetIdx;
        }
    }

    const sprintNum = weekIndex - resetIndex;
    return `1.${sprintNum + 1}`;
};

// Helper to format date range
const formatDateRange = (weekStart: string): { short: string; isCurrentWeek: boolean } => {
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    const formatDate = (d: Date) => `${d.getDate()} ${['янв.', 'фев.', 'мар.', 'апр.', 'мая', 'июн.', 'июл.', 'авг.', 'сен.', 'окт.', 'ноя.', 'дек.'][d.getMonth()]}`;

    // Check if current week
    const now = new Date();
    const isCurrentWeek = now >= start && now <= end;

    return {
        short: `${formatDate(start)} — ${formatDate(end)}`,
        isCurrentWeek
    };
};

export function ReflectionPanel() {
    const { currentWeek, weeks, sprintResetWeeks, saveReflection } = usePlannerStore();
    const [reflection, setReflection] = useState<WeeklyReflection>(currentWeek.reflection);
    const [isEditing, setIsEditing] = useState(!currentWeek.reflection.saved);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        setReflection(currentWeek.reflection);
        setIsEditing(!currentWeek.reflection.saved);
    }, [currentWeek.reflection, currentWeek.weekStart]);

    const handleSave = () => {
        const savedReflection = { ...reflection, saved: true };
        saveReflection(savedReflection);
        setReflection(savedReflection);
        setIsEditing(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const updateDone = (field: 'foundation' | 'drive' | 'joy', value: string) => {
        setReflection({
            ...reflection,
            done: { ...reflection.done, [field]: value },
        });
    };

    const updateNotDone = (field: 'foundation' | 'drive' | 'joy', value: string) => {
        setReflection({
            ...reflection,
            notDone: { ...reflection.notDone, [field]: value },
        });
    };

    const allWeekStarts = weeks.map(w => w.weekStart);
    const sprintNum = getSprintNumber(currentWeek.weekStart, allWeekStarts, sprintResetWeeks);
    const dateInfo = formatDateRange(currentWeek.weekStart);

    return (
        <div className={styles.reflectionPanel}>
            <div className={styles.header}>
                <h2>💭 Рефлексия по итогам недели</h2>
                <div className={styles.weekInfo}>
                    <span className={styles.sprintNumber}>Спринт {sprintNum}</span>
                    <span className={styles.dateRange}>{dateInfo.short}</span>
                    {dateInfo.isCurrentWeek && (
                        <span className={styles.currentBadge}>текущая неделя</span>
                    )}
                </div>
            </div>

            {!isEditing && reflection.saved ? (
                // VIEW MODE - Read-only report
                <div className={styles.reportView}>
                    <div className={styles.reportSection}>
                        <h3>✅ Что было сделано</h3>
                        <div className={styles.reportItems}>
                            {reflection.done.foundation && (
                                <div className={styles.reportItem}>
                                    <span className={`${styles.projectLabel} ${styles.foundation}`}>Фундамент</span>
                                    <p>{reflection.done.foundation}</p>
                                </div>
                            )}
                            {reflection.done.drive && (
                                <div className={styles.reportItem}>
                                    <span className={`${styles.projectLabel} ${styles.drive}`}>Драйв</span>
                                    <p>{reflection.done.drive}</p>
                                </div>
                            )}
                            {reflection.done.joy && (
                                <div className={styles.reportItem}>
                                    <span className={`${styles.projectLabel} ${styles.joy}`}>Кайф</span>
                                    <p>{reflection.done.joy}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={styles.reportSection}>
                        <h3>❌ Что НЕ было сделано</h3>
                        <div className={styles.reportItems}>
                            {reflection.notDone.foundation && (
                                <div className={styles.reportItem}>
                                    <span className={`${styles.projectLabel} ${styles.foundation}`}>Фундамент</span>
                                    <p>{reflection.notDone.foundation}</p>
                                </div>
                            )}
                            {reflection.notDone.drive && (
                                <div className={styles.reportItem}>
                                    <span className={`${styles.projectLabel} ${styles.drive}`}>Драйв</span>
                                    <p>{reflection.notDone.drive}</p>
                                </div>
                            )}
                            {reflection.notDone.joy && (
                                <div className={styles.reportItem}>
                                    <span className={`${styles.projectLabel} ${styles.joy}`}>Кайф</span>
                                    <p>{reflection.notDone.joy}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {reflection.adjustments && (
                        <div className={styles.reportSection}>
                            <h3>🔄 Корректировки на следующую неделю</h3>
                            <p className={styles.adjustmentsText}>{reflection.adjustments}</p>
                        </div>
                    )}

                    <div className={styles.actions}>
                        <button className="btn btn-secondary" onClick={() => setIsEditing(true)}>
                            ✏️ Изменить отчёт
                        </button>
                    </div>
                </div>
            ) : (
                // EDIT MODE - Form
                <div className={styles.sections}>
                    <p className={styles.subtitle}>Три важных вопроса для анализа прогресса и корректировки плана</p>

                    {/* Секция 1: Что было сделано */}
                    <div className={styles.section}>
                        <h3>
                            <span className={styles.sectionNumber}>1</span>
                            Что было сделано по каждому проекту?
                        </h3>
                        <div className={styles.projectInputs}>
                            <div className={styles.projectInput}>
                                <span className={`${styles.projectLabel} ${styles.foundation}`}>Фундамент</span>
                                <textarea
                                    value={reflection.done.foundation}
                                    onChange={(e) => updateDone('foundation', e.target.value)}
                                    placeholder="Что удалось сделать по проекту Фундамент?"
                                />
                            </div>
                            <div className={styles.projectInput}>
                                <span className={`${styles.projectLabel} ${styles.drive}`}>Драйв</span>
                                <textarea
                                    value={reflection.done.drive}
                                    onChange={(e) => updateDone('drive', e.target.value)}
                                    placeholder="Что удалось сделать по проекту Драйв?"
                                />
                            </div>
                            <div className={styles.projectInput}>
                                <span className={`${styles.projectLabel} ${styles.joy}`}>Кайф</span>
                                <textarea
                                    value={reflection.done.joy}
                                    onChange={(e) => updateDone('joy', e.target.value)}
                                    placeholder="Что удалось сделать по проекту Кайф?"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Секция 2: Что НЕ было сделано */}
                    <div className={styles.section}>
                        <h3>
                            <span className={styles.sectionNumber}>2</span>
                            Что НЕ было сделано? С чем возникли сложности?
                        </h3>
                        <div className={styles.projectInputs}>
                            <div className={styles.projectInput}>
                                <span className={`${styles.projectLabel} ${styles.foundation}`}>Фундамент</span>
                                <textarea
                                    value={reflection.notDone.foundation}
                                    onChange={(e) => updateNotDone('foundation', e.target.value)}
                                    placeholder="Что не получилось по проекту Фундамент?"
                                />
                            </div>
                            <div className={styles.projectInput}>
                                <span className={`${styles.projectLabel} ${styles.drive}`}>Драйв</span>
                                <textarea
                                    value={reflection.notDone.drive}
                                    onChange={(e) => updateNotDone('drive', e.target.value)}
                                    placeholder="Что не получилось по проекту Драйв?"
                                />
                            </div>
                            <div className={styles.projectInput}>
                                <span className={`${styles.projectLabel} ${styles.joy}`}>Кайф</span>
                                <textarea
                                    value={reflection.notDone.joy}
                                    onChange={(e) => updateNotDone('joy', e.target.value)}
                                    placeholder="Что не получилось по проекту Кайф?"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Секция 3: Корректировка */}
                    <div className={styles.section}>
                        <h3>
                            <span className={styles.sectionNumber}>3</span>
                            Как скорректировать подход на следующую неделю?
                        </h3>
                        <div className={styles.adjustmentsInput}>
                            <textarea
                                value={reflection.adjustments}
                                onChange={(e) => setReflection({ ...reflection, adjustments: e.target.value })}
                                placeholder="Какие уроки вы извлекли? Что нужно изменить в подходе?"
                            />
                        </div>
                    </div>

                    <div className={styles.actions}>
                        {reflection.saved && (
                            <button className="btn btn-secondary" onClick={() => setIsEditing(false)}>
                                Отмена
                            </button>
                        )}
                        <button className="btn btn-primary" onClick={handleSave}>
                            💾 Сохранить рефлексию
                        </button>
                    </div>
                </div>
            )}

            {saved && (
                <div className={styles.savedMessage}>
                    ✅ Рефлексия сохранена!
                </div>
            )}
        </div>
    );
}

