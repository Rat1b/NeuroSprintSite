import { useState, useEffect } from 'react';
import { usePlannerStore } from '../../store/plannerStore';
import { DayOfWeek, DAYS_OF_WEEK } from '../../types';
import styles from './ReportModal.module.css';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReportModal({ isOpen, onClose }: ReportModalProps) {
  const { currentWeek } = usePlannerStore();
  const [reportText, setReportText] = useState('');
  const [copied, setCopied] = useState(false);
  
  // Day selection setup
  const getCurrentDay = (): DayOfWeek => {
    const dayIndex = new Date().getDay();
    // JS getDay(): 0 is Sunday, 1 is Monday ... 6 is Saturday
    // DAYS_OF_WEEK: ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС']
    const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
    return DAYS_OF_WEEK[adjustedIndex];
  };

  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(getCurrentDay());
  const [userName, setUserName] = useState(() => {
    return localStorage.getItem('neurosprint-tg-report-name') || '';
  });

  // Save name to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('neurosprint-tg-report-name', userName);
  }, [userName]);

  useEffect(() => {
    if (isOpen) {
      // Имя месяца на русском для сверки
      const date = new Date();
      const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
      const dateStr = `${date.getDate()}${months[date.getMonth()]}`;
      const header = `#сверка_${dateStr}_${userName || '[Имя]'}\n\n`;

      const dayTasks = currentWeek.tasks.filter(t => t.day === selectedDay);
      const foundationTasks = dayTasks.filter(t => t.project === 'Ф');
      const driveTasks = dayTasks.filter(t => t.project === 'Д');
      const joyTasks = dayTasks.filter(t => t.project === 'К');

      let text = header + 'Ф.\n';
      if (foundationTasks.length > 0) {
        text += foundationTasks.map(t => `- ${t.completed ? '✅ ' : ''}${t.title}`).join('\n');
      } else {
        text += 'Нет задач';
      }

      text += '\n\nД.\n';
      if (driveTasks.length > 0) {
        text += driveTasks.map(t => `- ${t.completed ? '✅ ' : ''}${t.title}`).join('\n');
      } else {
        text += 'Нет задач';
      }

      text += '\n\nК.\n';
      if (joyTasks.length > 0) {
        text += joyTasks.map(t => `- ${t.completed ? '✅ ' : ''}${t.title}`).join('\n');
      } else {
        text += 'Нет задач';
      }

      setReportText(text);
      setCopied(false);
    }
  }, [isOpen, currentWeek.tasks, selectedDay, userName]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>📝 Отчет для Telegram</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        
        <div className={styles.content}>
          <div className={styles.controlsRow}>
            <div className={styles.daySelectorWrapper}>
              <span className={styles.controlLabel}>День:</span>
              <div className={styles.daySelector}>
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day}
                    className={`${styles.dayBtn} ${selectedDay === day ? styles.dayBtnActive : ''}`}
                    onClick={() => setSelectedDay(day)}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
            
            <div className={styles.nameInputWrapper}>
              <span className={styles.controlLabel}>Ваше имя (с эмодзи):</span>
              <input
                type="text"
                className={styles.nameInput}
                placeholder="Например: ТВ 🎸"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />
            </div>
          </div>

          <textarea
            className={styles.textarea}
            value={reportText}
            onChange={(e) => setReportText(e.target.value)}
            rows={15}
          />
        </div>

        <div className={styles.actions}>
          <button className="btn btn-secondary" onClick={onClose}>
            Закрыть
          </button>
          <button 
            className={`btn btn-success ${styles.copyBtn}`} 
            onClick={handleCopy}
            style={{ minWidth: '140px' }}
          >
            {copied ? '✅ Скопировано!' : '📋 Скопировать'}
          </button>
        </div>
      </div>
    </div>
  );
}
