import { useState, useRef, useEffect } from 'react';
import { usePlannerStore } from '../../store/plannerStore';
import styles from './MonthView.module.css';

interface MonthViewProps {
    onOpenWeek: (weekStart: string) => void;
}

// Получить ключ месяца из даты недели (YYYY-MM)
function getMonthKey(weekStart: string): string {
    const date = new Date(weekStart);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}

// Получить название месяца и год
function getMonthTitle(weekStart: string): string {
    const date = new Date(weekStart);
    const monthNames = [
        'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];
    return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
}

// Получить диапазон дат месяца (от первого понедельника до конца)
function getMonthDateRange(weekStart: string): string {
    const startDate = new Date(weekStart);

    // Начало: первый понедельник месяца или текущая неделя
    const firstDayOfMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const dayOfWeek = firstDayOfMonth.getDay();
    const daysToMonday = dayOfWeek === 0 ? 1 : (dayOfWeek === 1 ? 0 : 8 - dayOfWeek);
    const firstMonday = new Date(firstDayOfMonth);
    firstMonday.setDate(firstDayOfMonth.getDate() + daysToMonday);

    // Конец: последний день месяца или первые дни следующего
    const lastDayOfMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
    const endDayOfWeek = lastDayOfMonth.getDay();
    const daysToSunday = endDayOfWeek === 0 ? 0 : 7 - endDayOfWeek;
    const endDate = new Date(lastDayOfMonth);
    endDate.setDate(lastDayOfMonth.getDate() + daysToSunday);

    const formatDate = (d: Date) => {
        return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    };

    return `${formatDate(firstMonday)} — ${formatDate(endDate)}`;
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
    const { currentWeek, weeks, getMonthSettings, setMonthSettings } = usePlannerStore();
    const [showSettings, setShowSettings] = useState(false);
    const settingsRef = useRef<HTMLDivElement>(null);

    const monthKey = getMonthKey(currentWeek.weekStart);
    const settings = getMonthSettings(monthKey);

    const viewWeeks = generateWeeksForView(currentWeek.weekStart);

    // Закрытие dropdown при клике вне
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
                setShowSettings(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Получить номер спринта или -1 если интеграционная неделя
    // Формат: { cycle: номер_цикла, week: номер_недели_в_спринте } или null для интеграции
    function getSprintInfo(weekIndex: number): { cycle: number; week: number } | null {
        const sprintWeeks = settings.sprintWeeks;
        const integrationEvery = settings.integrationEvery;

        // Полный цикл = (sprintWeeks * integrationEvery) спринт-недель + 1 интеграционная
        const cycleLength = sprintWeeks * integrationEvery + 1;

        const positionInCycle = weekIndex % cycleLength;

        // Последняя неделя цикла - интеграционная
        if (positionInCycle === cycleLength - 1) {
            return null;
        }

        const sprintNumber = Math.floor(positionInCycle / sprintWeeks) + 1;
        const weekInSprint = (positionInCycle % sprintWeeks) + 1;
        const cycleNumber = Math.floor(weekIndex / cycleLength) + 1;

        return { cycle: (cycleNumber - 1) * integrationEvery + sprintNumber, week: weekInSprint };
    }

    function getWeekType(weekIndex: number): 'sprint' | 'integration' {
        return getSprintInfo(weekIndex) !== null ? 'sprint' : 'integration';
    }

    function getWeekLabel(weekIndex: number): string {
        const info = getSprintInfo(weekIndex);
        if (info === null) {
            return 'Интеграция';
        }
        return `Спринт ${info.cycle}.${info.week}`;
    }

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
                <div className={styles.headerLeft}>
                    <h2 className={styles.monthTitle}>
                        {getMonthTitle(currentWeek.weekStart)}
                    </h2>
                    <div className={styles.monthDateRange}>
                        {getMonthDateRange(currentWeek.weekStart)}
                    </div>
                </div>

                <div className={styles.headerRight}>
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

                    <div className={styles.settingsContainer} ref={settingsRef}>
                        <button
                            className={styles.settingsButton}
                            onClick={() => setShowSettings(!showSettings)}
                            title="Настройки спринтов"
                        >
                            ⚙️
                        </button>

                        {showSettings && (
                            <div className={styles.settingsDropdown}>
                                <h4>Настройки спринтов</h4>
                                <div className={styles.settingsField}>
                                    <label>Длина спринта (недель)</label>
                                    <select
                                        value={settings.sprintWeeks}
                                        onChange={(e) => setMonthSettings(monthKey, {
                                            sprintWeeks: Number(e.target.value)
                                        })}
                                    >
                                        <option value={1}>1 неделя</option>
                                        <option value={2}>2 недели</option>
                                        <option value={3}>3 недели</option>
                                        <option value={4}>4 недели</option>
                                    </select>
                                </div>
                                <div className={styles.settingsField}>
                                    <label>Интеграция каждые (спринтов)</label>
                                    <select
                                        value={settings.integrationEvery}
                                        onChange={(e) => setMonthSettings(monthKey, {
                                            integrationEvery: Number(e.target.value)
                                        })}
                                    >
                                        <option value={1}>1 спринт</option>
                                        <option value={2}>2 спринта</option>
                                        <option value={3}>3 спринта</option>
                                        <option value={4}>4 спринта</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className={styles.weeksContainer}>
                {viewWeeks.map((weekStart, index) => {
                    const weekType = getWeekType(index);
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
                                        {getWeekLabel(index)}
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
