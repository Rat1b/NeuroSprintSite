import { useState, useEffect, useCallback } from 'react';
import styles from './SaveReminderPopup.module.css';

interface SaveReminderPopupProps {
    onSave: () => void;
}

const REMINDER_INTERVAL = 5 * 60 * 1000; // 5 минут в миллисекундах

export function SaveReminderPopup({ onSave }: SaveReminderPopupProps) {
    const [isVisible, setIsVisible] = useState(false);

    const showPopup = useCallback(() => {
        setIsVisible(true);
    }, []);

    const handleRemindLater = () => {
        setIsVisible(false);
        // Напомнить через 5 минут
        setTimeout(showPopup, REMINDER_INTERVAL);
    };

    const handleSave = () => {
        setIsVisible(false);
        onSave();
        // После сохранения снова запустить таймер
        setTimeout(showPopup, REMINDER_INTERVAL);
    };

    useEffect(() => {
        // Запустить первый таймер
        const timer = setTimeout(showPopup, REMINDER_INTERVAL);

        return () => clearTimeout(timer);
    }, [showPopup]);

    if (!isVisible) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.popup}>
                <div className={styles.icon}>💾</div>
                <h3 className={styles.title}>Время сохраниться!</h3>
                <p className={styles.message}>
                    Сохраните прогресс, чтобы он был в безопасности
                </p>
                <div className={styles.buttons}>
                    <button
                        className={styles.remindButton}
                        onClick={handleRemindLater}
                    >
                        ⏰ Напомнить через 5 минут
                    </button>
                    <button
                        className={styles.saveButton}
                        onClick={handleSave}
                    >
                        📤 Сохранить!
                    </button>
                </div>
            </div>
        </div>
    );
}
