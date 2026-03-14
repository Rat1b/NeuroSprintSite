import { useState, useEffect } from 'react';
import { usePlannerStore } from '../../store/plannerStore';
import styles from './ReportModal.module.css';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReportModal({ isOpen, onClose }: ReportModalProps) {
  const { currentWeek } = usePlannerStore();
  const [reportText, setReportText] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const foundationTasks = currentWeek.tasks.filter(t => t.project === 'Ф');
      const driveTasks = currentWeek.tasks.filter(t => t.project === 'Д');
      const joyTasks = currentWeek.tasks.filter(t => t.project === 'К');

      let text = 'Ф.\n';
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
  }, [isOpen, currentWeek.tasks]);

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
          <p className={styles.description}>
            Ниже сгенерирован отчет по вашим задачам на текущую неделю. 
            Вы можете скопировать его для отправки в чат.
          </p>
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
