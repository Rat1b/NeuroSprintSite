import { usePlannerStore } from '../../store/plannerStore';
import styles from './MonthView.module.css';

interface MonthViewProps {
    onOpenWeek: (weekStart: string) => void;
}

// Получить номер спринта (1-3) или 0 если интеграционная неделя
function getSprintNumber(weekStart: string): number {
    const date = new Date(weekStart);
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const weekOfYear = Math.ceil(((date.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);

    // Каждые 4 недели: 3 спринта + 1 интеграция
    const positionInCycle = ((weekOfYear - 1) % 4) + 1;
    return positionInCycle <= 3 ? positionInCycle : 0; // 0 = интеграционная неделя
}

function getWeekType(weekStart: string): 'sprint' | 'integration' {
    return getSprintNumber(weekStart) > 0 ? 'sprint' : 'integration';
}

function getWeekLabel(weekStart: string): string {
    const sprintNum = getSprintNumber(weekStart);
    return sprintNum > 0 ? `Спринт ${sprintNum}` : 'Интеграция';
}

function formatWeekDates(weekStart: string): string {
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    return `${start.toLocaleDateString('ru-RU', options)} — ${end.toLocaleDateString('ru-RU', options)}`;
}


// Генерировать недели для текущего месяца/квартала
function generateWeeksForView(currentWeekStart: string): string[] {
    const current = new Date(currentWeekStart);
    const weeks: string[] = [];

    // Показываем 8 недель (2 месяца примерно)
    const start = new Date(current);
    start.setDate(start.getDate() - 7 * 2); // 2 недели назад

    for (let i = 0; i < 8; i++) {
        const weekDate = new Date(start);
        weekDate.setDate(weekDate.getDate() + (i * 7));
        weeks.push(weekDate.toISOString().split('T')[0]);
    }

    return weeks;
}

export function MonthView({ onOpenWeek }: MonthViewProps) {
    const { currentWeek, weeks } = usePlannerStore();

    const viewWeeks = generateWeeksForView(currentWeek.weekStart);

    // Получить данные недели из сохранённых
    const getWeekData = (weekStart: string) => {
        if (weekStart === currentWeek.weekStart) {
            return currentWeek;
        }
        return weeks.find(w => w.weekStart === weekStart);
    };

    return (
        <div className={styles.monthView}>
            <div className={styles.header}>
                <h2 className={styles.monthTitle}>
                    📅 Обзор спринтов
                </h2>
                <div className={styles.legend}>
                    <div className={styles.legendItem}>
                        <div className={`${styles.legendBar} ${styles.sprint}`}></div>
                        <span>Спринт</span>
                    </div>
                    <div className={styles.legendItem}>
                        <div className={`${styles.legendBar} ${styles.integration}`}></div>
                        <span>Интеграция</span>
                    </div>
                </div>
            </div>

            <div className={styles.weeksContainer}>
                {viewWeeks.map((weekStart) => {
                    const weekType = getWeekType(weekStart);
                    const weekData = getWeekData(weekStart);
                    const isCurrentWeek = weekStart === currentWeek.weekStart;

                    const totalTasks = weekData?.tasks.length || 0;
                    const completedTasks = weekData?.tasks.filter(t => t.completed).length || 0;
                    const totalMinutes = weekData?.tasks.reduce((sum, t) => sum + t.duration, 0) || 0;

                    return (
                        <div
                            key={weekStart}
                            className={`${styles.weekRow} ${isCurrentWeek ? styles.currentWeek : ''}`}
                        >
                            <div className={`${styles.weekIndicator} ${styles[weekType]}`}></div>
                            <div className={styles.weekContent}>
                                <div className={styles.weekInfo}>
                                    <div className={`${styles.weekLabel} ${styles[weekType]}`}>
                                        {getWeekLabel(weekStart)}
                                    </div>
                                    <div className={styles.weekDates}>
                                        {formatWeekDates(weekStart)}
                                    </div>
                                </div>

                                <div className={styles.weekStats}>
                                    <div className={styles.statItem}>
                                        <div className={styles.statValue}>{totalTasks}</div>
                                        <div className={styles.statLabel}>задач</div>
                                    </div>
                                    <div className={styles.statItem}>
                                        <div className={styles.statValue}>
                                            {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
                                        </div>
                                        <div className={styles.statLabel}>выполнено</div>
                                    </div>
                                    <div className={styles.statItem}>
                                        <div className={styles.statValue}>
                                            {Math.floor(totalMinutes / 60)}ч
                                        </div>
                                        <div className={styles.statLabel}>время</div>
                                    </div>
                                </div>

                                <div className={styles.weekActions}>
                                    <button
                                        className={styles.openWeekBtn}
                                        onClick={() => onOpenWeek(weekStart)}
                                    >
                                        {isCurrentWeek ? '← Текущая' : 'Открыть →'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
