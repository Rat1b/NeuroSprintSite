import { usePlannerStore } from '../../store/plannerStore';
import styles from './Header.module.css';

interface HeaderProps {
    onImportClick: () => void;
    onAIInstructionsClick: () => void;
}

export function Header({ onImportClick, onAIInstructionsClick }: HeaderProps) {
    const {
        currentWeek,
        activeView,
        setActiveView,
        exportToJSON,
        goToWeek
    } = usePlannerStore();

    const formatWeekDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + 6);

        const formatDate = (d: Date) => {
            return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
        };

        return `${formatDate(date)} – ${formatDate(endDate)}`;
    };

    const handlePrevWeek = () => {
        const currentDate = new Date(currentWeek.weekStart);
        currentDate.setDate(currentDate.getDate() - 7);
        goToWeek(currentDate.toISOString().split('T')[0]);
    };

    const handleNextWeek = () => {
        const currentDate = new Date(currentWeek.weekStart);
        currentDate.setDate(currentDate.getDate() + 7);
        goToWeek(currentDate.toISOString().split('T')[0]);
    };

    const handleExport = () => {
        const json = exportToJSON();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `neurosprint-${currentWeek.weekStart}.json`;
        a.click();
        URL.revokeObjectURL(url);
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
    const isCurrentWeek = currentWeek.weekStart === actualWeekStart;

    const handleGoToCurrentWeek = () => {
        goToWeek(actualWeekStart);
    };

    return (
        <header className={styles.header}>
            <div className={styles.headerLeft}>
                <span className={styles.logo}>🧠 НейроСпринт</span>

                <div className={styles.weekNav}>
                    <button
                        onClick={handleGoToCurrentWeek}
                        className={!isCurrentWeek ? styles.active : ''}
                        disabled={isCurrentWeek}
                        title="Вернуться к текущей неделе"
                        style={{
                            opacity: isCurrentWeek ? 0.3 : 1,
                            cursor: isCurrentWeek ? 'default' : 'pointer',
                            marginRight: '10px',
                            background: 'none',
                            border: 'none',
                            fontSize: '1.2rem'
                        }}
                    >
                        🎯
                    </button>
                    <button onClick={handlePrevWeek} title="Предыдущая неделя">
                        ←
                    </button>
                    <span className={styles.weekDate}>
                        {formatWeekDate(currentWeek.weekStart)}
                    </span>
                    <button onClick={handleNextWeek} title="Следующая неделя">
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

                <button className="btn btn-secondary" onClick={onAIInstructionsClick}>
                    🤖 Инструкции для ИИ
                </button>
                <button className="btn btn-secondary" onClick={onImportClick}>
                    📥 Импорт JSON
                </button>
                <button className="btn btn-secondary" onClick={handleExport}>
                    📤 Экспорт
                </button>
            </div>
        </header>
    );
}
