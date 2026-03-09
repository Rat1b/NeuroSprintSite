import { useState, useRef, useEffect, useMemo } from 'react';
import { usePlannerStore } from '../../store/plannerStore';
import styles from './MonthView.module.css';

interface MonthViewProps {
    onOpenWeek: (weekStart: string) => void;
}


const toLocalYYYYMMDD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

// Получить название месяца и год
function getMonthTitle(weekStart: string): string {
    const date = new Date(weekStart + 'T12:00:00');
    // Месяц определяется по четвергу этой недели (ISO-8601 правило)
    date.setDate(date.getDate() + 3);
    const monthNames = [
        'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];
    return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
}

// Получить диапазон дат месяца
function getMonthDateRange(viewWeeks: string[]): string {
    if (!viewWeeks || viewWeeks.length === 0) return '';

    const firstWeek = new Date(viewWeeks[0] + 'T12:00:00');
    const lastWeek = new Date(viewWeeks[viewWeeks.length - 1] + 'T12:00:00');

    // Конец последней недели (воскресенье)
    lastWeek.setDate(lastWeek.getDate() + 6);

    const formatDate = (d: Date) => {
        return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    };

    return `${formatDate(firstWeek)} — ${formatDate(lastWeek)}`;
}

function formatWeekDates(weekStart: string): string {
    const start = new Date(weekStart + 'T12:00:00');
    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    return `${start.toLocaleDateString('ru-RU', options)} — ${end.toLocaleDateString('ru-RU', options)}`;
}

// Генерировать недели строго для месяца (по правилу четверга)
function generateWeeksForView(currentWeekStart: string): string[] {
    const current = new Date(currentWeekStart + 'T12:00:00');
    // Месяц определяется по четвергу (если кликнули в начало или конец месяца)
    current.setDate(current.getDate() + 3);

    const viewYear = current.getFullYear();
    const viewMonth = current.getMonth();

    const weeks: string[] = [];

    // Начинаем поиск с 6 недель назад от выбранной даты
    const iterDate = new Date(currentWeekStart + 'T12:00:00');
    iterDate.setDate(iterDate.getDate() - 7 * 6);

    // Проверяем 12 недель в обе стороны (гарантированно покроет весь месяц)
    for (let i = 0; i < 12; i++) {
        const thu = new Date(iterDate);
        thu.setDate(thu.getDate() + 3); // Четверг этой итерации

        if (thu.getFullYear() === viewYear && thu.getMonth() === viewMonth) {
            weeks.push(toLocalYYYYMMDD(new Date(iterDate)));
        }

        iterDate.setDate(iterDate.getDate() + 7);
    }

    return weeks;
}

export function MonthView({ onOpenWeek }: MonthViewProps) {
    const {
        currentWeek,
        weeks,
        getCycleSettings,
        setCycleSettings,
        sprintResetWeeks,
        toggleSprintReset
    } = usePlannerStore();
    const [showSettings, setShowSettings] = useState(false);
    const settingsRef = useRef<HTMLDivElement>(null);

    const settings = getCycleSettings();

    const viewWeeks = generateWeeksForView(currentWeek.weekStart);

    // Вычисляем реальную текущую неделю (по настоящему календарю)
    const realCurrentWeekStart = useMemo(() => {
        const today = new Date();
        today.setHours(12, 0, 0, 0);
        const dayOfWeek = today.getDay();
        const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - diffToMonday);
        return toLocalYYYYMMDD(startOfWeek);
    }, []);

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

    // Найти индекс недели относительно последней точки сброса
    function getWeekIndexFromReset(weekStart: string): number {
        // Сортируем точки сброса по дате
        const sortedResets = [...sprintResetWeeks].sort();

        // Находим последнюю точку сброса ДО или РАВНУЮ текущей неделе
        let lastResetDate: string | null = null;
        for (let i = sortedResets.length - 1; i >= 0; i--) {
            if (sortedResets[i] <= weekStart) {
                lastResetDate = sortedResets[i];
                break;
            }
        }

        // Функция для расчёта разницы в неделях
        const getWeeksDiff = (fromDate: string, toDate: string): number => {
            const from = new Date(fromDate + 'T12:00:00Z');
            const to = new Date(toDate + 'T12:00:00Z');
            const diffMs = to.getTime() - from.getTime();
            return Math.round(diffMs / (7 * 24 * 60 * 60 * 1000));
        };

        if (lastResetDate === null) {
            // Нет точек сброса до этой недели
            // Считаем от 12 января 2026 (начало спринтов)
            return getWeeksDiff('2026-01-12', weekStart);
        }

        // Считаем недели от точки сброса
        return getWeeksDiff(lastResetDate, weekStart);
    }

    // Получить номер спринта
    // Суперцикл: (bigIntegrationEvery - 1) малых циклов + 1 большой цикл
    // Малый цикл = integrationEvery спринтов + integrationWeeks инт. недель
    // Большой цикл = integrationEvery спринтов + bigIntegrationWeeks инт. недель
    function getSprintInfo(weekStart: string): { cycle: number; week: number } | null {
        const weekIndex = getWeekIndexFromReset(weekStart);
        const sw = settings.sprintWeeks;
        const ie = settings.integrationEvery;
        const iw = settings.integrationWeeks;
        const biw = settings.bigIntegrationWeeks;
        const bie = settings.bigIntegrationEvery;

        // Малый цикл: ie спринтов (каждый sw недель) + iw интеграционных недель
        const smallCycleLen = sw * ie + iw;
        // Большой цикл: ie спринтов (каждый sw недель) + biw интеграционных недель
        const bigCycleLen = sw * ie + biw;
        // Суперцикл = (bie - 1) малых + 1 большой
        const superCycleLen = (bie - 1) * smallCycleLen + bigCycleLen;

        // Нормализуем индекс (работает и для отрицательных — цикл продолжается назад)
        let posInSuper = weekIndex % superCycleLen;
        if (posInSuper < 0) posInSuper += superCycleLen;

        // Определяем, в каком подцикле мы находимся
        let remaining = posInSuper;

        for (let i = 0; i < bie; i++) {
            const isLastSubCycle = (i === bie - 1);
            const currentCycleLen = isLastSubCycle ? bigCycleLen : smallCycleLen;

            if (remaining < currentCycleLen) {
                const sprintPartLen = sw * ie;

                // Интеграционная неделя?
                if (remaining >= sprintPartLen) {
                    return null;
                }

                // Спринтовая неделя
                // cycle = номер группы (подцикла) глобально
                const superCycleNumber = Math.floor(weekIndex / superCycleLen);
                const groupNumber = superCycleNumber * bie + i + 1;
                // week = позиция внутри группы (1, 2, 3...)
                const weekInGroup = remaining + 1;

                return { cycle: groupNumber, week: weekInGroup };
            }

            remaining -= currentCycleLen;
        }

        return null;
    }

    function getWeekType(weekStart: string): 'sprint' | 'integration' {
        return getSprintInfo(weekStart) !== null ? 'sprint' : 'integration';
    }

    function getWeekLabel(weekStart: string): string {
        const info = getSprintInfo(weekStart);
        if (info === null) {
            return 'Интеграция';
        }
        return `Спринт ${info.cycle}.${info.week}`;
    }

    function isResetPoint(weekStart: string): boolean {
        return sprintResetWeeks.includes(weekStart);
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
                        {getMonthDateRange(viewWeeks)}
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
                        <div className={styles.legendItem}>
                            <span className={styles.resetIcon}>🚩</span>
                            <span>Точка сброса</span>
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
                                        onChange={(e) => setCycleSettings({
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
                                        onChange={(e) => setCycleSettings({
                                            integrationEvery: Number(e.target.value)
                                        })}
                                    >
                                        <option value={1}>1 спринт</option>
                                        <option value={2}>2 спринта</option>
                                        <option value={3}>3 спринта</option>
                                        <option value={4}>4 спринта</option>
                                    </select>
                                </div>
                                <div className={styles.settingsField}>
                                    <label>Расширенных инт. недель</label>
                                    <select
                                        value={settings.bigIntegrationWeeks}
                                        onChange={(e) => setCycleSettings({
                                            bigIntegrationWeeks: Number(e.target.value)
                                        })}
                                    >
                                        <option value={1}>1 неделя</option>
                                        <option value={2}>2 недели</option>
                                        <option value={3}>3 недели</option>
                                    </select>
                                </div>
                                <div className={styles.settingsField}>
                                    <label>Расш. интеграция каждые (циклов)</label>
                                    <select
                                        value={settings.bigIntegrationEvery}
                                        onChange={(e) => setCycleSettings({
                                            bigIntegrationEvery: Number(e.target.value)
                                        })}
                                    >
                                        <option value={2}>2 цикла</option>
                                        <option value={3}>3 цикла</option>
                                        <option value={4}>4 цикла</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className={styles.weeksContainer}>
                {viewWeeks.map((weekStart) => {
                    const weekType = getWeekType(weekStart);
                    const weekData = getWeekData(weekStart);
                    const isSelectedWeek = weekStart === currentWeek.weekStart;
                    const isRealCurrentWeek = weekStart === realCurrentWeekStart;
                    const hasResetPoint = isResetPoint(weekStart);

                    const totalTasks = weekData?.tasks.length || 0;
                    const completedTasks = weekData?.tasks.filter(t => t.completed).length || 0;
                    const totalMinutes = weekData?.tasks.reduce((sum, t) => sum + t.duration, 0) || 0;

                    return (
                        <div
                            key={weekStart}
                            className={`${styles.weekRow} ${isSelectedWeek ? styles.currentWeek : ''} ${hasResetPoint ? styles.resetWeek : ''}`}
                        >
                            <div className={`${styles.weekIndicator} ${styles[weekType]}`}></div>
                            <div className={styles.weekContent}>
                                <div className={styles.weekInfo}>
                                    <div
                                        className={`${styles.weekLabel} ${styles[weekType]} ${styles.clickable}`}
                                        onClick={() => toggleSprintReset(weekStart)}
                                        title={hasResetPoint ? "Убрать точку сброса" : "Установить как точку сброса (нумерация начнётся с 1.1)"}
                                    >
                                        {hasResetPoint && <span className={styles.resetMarker}>🚩</span>}
                                        {getWeekLabel(weekStart)}
                                    </div>
                                    <div className={styles.weekDates}>
                                        {formatWeekDates(weekStart)}
                                    </div>
                                </div>

                                <div className={styles.weekStats}>
                                    {weekData?.reflection?.saved && (
                                        <div className={styles.statItem} title="Рефлексия написана">
                                            <div className={styles.statValue}>📝</div>
                                            <div className={styles.statLabel}>отчёт</div>
                                        </div>
                                    )}
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
                                        {isRealCurrentWeek ? '← Текущая' : (isSelectedWeek ? '← Открыта' : 'Открыть →')}
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
