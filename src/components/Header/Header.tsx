import { useRef } from 'react';
import { usePlannerStore } from '../../store/plannerStore';
import styles from './Header.module.css';

interface HeaderProps {
    onImportClick: () => void;
    onAIInstructionsClick: () => void;
}

const MONTH_NAMES = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

export function Header({ onImportClick, onAIInstructionsClick }: HeaderProps) {
    const {
        currentWeek,
        activeView,
        setActiveView,
        goToWeek,
        exportAllData,
        importAllData
    } = usePlannerStore();

    const fileInputRef = useRef<HTMLInputElement>(null);

    const formatWeekDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + 6);

        const formatDate = (d: Date) => {
            return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
        };

        return `${formatDate(date)} – ${formatDate(endDate)}`;
    };

    const formatMonthYear = (dateStr: string) => {
        const date = new Date(dateStr);
        return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
    };

    const handlePrevWeek = () => {
        const currentDate = new Date(currentWeek.weekStart);
        currentDate.setDate(currentDate.getDate() - 7);
        // Не позволяем перейти раньше 2026 года
        if (currentDate.getFullYear() < 2026) return;
        goToWeek(currentDate.toISOString().split('T')[0]);
    };

    const handleNextWeek = () => {
        const currentDate = new Date(currentWeek.weekStart);
        currentDate.setDate(currentDate.getDate() + 7);
        goToWeek(currentDate.toISOString().split('T')[0]);
    };

    const handlePrevMonth = () => {
        const currentDate = new Date(currentWeek.weekStart);
        currentDate.setMonth(currentDate.getMonth() - 1);
        // Не позволяем перейти раньше 2026 года
        if (currentDate.getFullYear() < 2026) return;
        // Перейти на первый понедельник нового месяца
        const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const dayOfWeek = firstDay.getDay();
        const daysToMonday = dayOfWeek === 0 ? 1 : (dayOfWeek === 1 ? 0 : 8 - dayOfWeek);
        firstDay.setDate(firstDay.getDate() + daysToMonday);
        goToWeek(firstDay.toISOString().split('T')[0]);
    };

    const handleNextMonth = () => {
        const currentDate = new Date(currentWeek.weekStart);
        currentDate.setMonth(currentDate.getMonth() + 1);
        // Перейти на первый понедельник нового месяца
        const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const dayOfWeek = firstDay.getDay();
        const daysToMonday = dayOfWeek === 0 ? 1 : (dayOfWeek === 1 ? 0 : 8 - dayOfWeek);
        firstDay.setDate(firstDay.getDate() + daysToMonday);
        goToWeek(firstDay.toISOString().split('T')[0]);
    };

    const handleExportAllData = () => {
        const json = exportAllData();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `neurosprint-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImportAllData = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            const success = importAllData(content);
            if (success) {
                alert('Данные успешно импортированы!');
            } else {
                alert('Ошибка при импорте данных. Проверьте формат файла.');
            }
        };
        reader.readAsText(file);
        // Очистить input для возможности повторного выбора того же файла
        event.target.value = '';
    };

    const getActualCurrentWeekStart = (): string => {
        const now = new Date();
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(now.setDate(diff));

        const year = monday.getFullYear();
        const month = String(monday.getMonth() + 1).padStart(2, '0');
        const d = String(monday.getDate()).padStart(2, '0');

        return `${year}-${month}-${d}`;
    };

    const actualWeekStart = getActualCurrentWeekStart();
    const currentDate = new Date(currentWeek.weekStart);
    const actualDate = new Date(actualWeekStart);

    const isCurrentWeek = currentWeek.weekStart === actualWeekStart;
    const isCurrentMonth = currentDate.getMonth() === actualDate.getMonth() &&
        currentDate.getFullYear() === actualDate.getFullYear();

    const handleGoToCurrentWeek = () => {
        goToWeek(actualWeekStart);
    };

    const handleGoToCurrentMonth = () => {
        goToWeek(actualWeekStart);
    };

    // Выбор обработчиков в зависимости от view
    const isMonthView = activeView === 'month';
    const handlePrev = isMonthView ? handlePrevMonth : handlePrevWeek;
    const handleNext = isMonthView ? handleNextMonth : handleNextWeek;
    const handleGoToCurrent = isMonthView ? handleGoToCurrentMonth : handleGoToCurrentWeek;
    const isCurrent = isMonthView ? isCurrentMonth : isCurrentWeek;
    const navTitle = isMonthView
        ? (isCurrent ? "Текущий месяц" : "Вернуться к текущему месяцу")
        : (isCurrent ? "Текущая неделя" : "Вернуться к текущей неделе");
    const prevTitle = isMonthView ? "Предыдущий месяц" : "Предыдущая неделя";
    const nextTitle = isMonthView ? "Следующий месяц" : "Следующая неделя";

    return (
        <header className={styles.header}>
            <div className={styles.headerLeft}>
                <span className={styles.logo}>🧠 НейроСпринт</span>

                <div className={styles.weekNav}>
                    <button
                        onClick={handleGoToCurrent}
                        className={!isCurrent ? styles.active : ''}
                        disabled={isCurrent}
                        title={navTitle}
                        style={{
                            opacity: isCurrent ? 0.3 : 1,
                            cursor: isCurrent ? 'default' : 'pointer',
                            marginRight: '10px',
                            background: 'none',
                            border: 'none',
                            fontSize: '1.2rem'
                        }}
                    >
                        🎯
                    </button>
                    <button onClick={handlePrev} title={prevTitle}>
                        ←
                    </button>
                    <span className={styles.weekDate}>
                        {isMonthView
                            ? formatMonthYear(currentWeek.weekStart)
                            : formatWeekDate(currentWeek.weekStart)
                        }
                    </span>
                    <button onClick={handleNext} title={nextTitle}>
                        →
                    </button>
                </div>
            </div>

            <div className={styles.headerRight}>
                <div className={styles.viewTabs}>
                    <button
                        className={`${styles.viewTab} ${activeView === 'planner' ? styles.active : ''}`}
                        onClick={() => setActiveView('planner')}
                    >
                        📅 Планер
                    </button>
                    <button
                        className={`${styles.viewTab} ${activeView === 'month' ? styles.active : ''}`}
                        onClick={() => setActiveView('month')}
                    >
                        📊 Месяц
                    </button>
                    <button
                        className={`${styles.viewTab} ${activeView === 'reflection' ? styles.active : ''}`}
                        onClick={() => setActiveView('reflection')}
                    >
                        💭 Рефлексия
                    </button>
                </div>

                <div className={styles.buttonGroup}>
                    <span className={styles.groupLabel}>🧠 ИИ</span>
                    <button className="btn btn-secondary" onClick={onAIInstructionsClick}>
                        🤖 Инструкции
                    </button>
                    <button className="btn btn-secondary" onClick={onImportClick}>
                        📥 Импорт JSON
                    </button>
                </div>

                <div className={styles.buttonGroup}>
                    <span className={styles.groupLabel}>💾 Данные</span>
                    <button className="btn btn-secondary" onClick={handleExportAllData}>
                        📤 Экспорт
                    </button>
                    <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                        📥 Импорт
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleImportAllData}
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                        />
                    </label>
                </div>
            </div>
        </header>
    );
}
