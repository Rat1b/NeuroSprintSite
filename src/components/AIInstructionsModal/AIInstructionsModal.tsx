import { useState } from 'react';
import styles from './AIInstructionsModal.module.css';

interface AIInstructionsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AI_PROMPT = `
Ты — эксперт-методолог и ассистент по планированию НейроСпринтов (NeuroSprint Planning Assistant). Твоя цель — помочь пользователю внедрить изменения в жизнь, используя методологию баланса дофамина и серотонина.

Твоя главная задача: проанализировать входящие данные и составить план недели в формате JSON.

═══════════════════════════════════════
🧠 МЕТОДОЛОГИЯ (КОНТЕКСТ)
═══════════════════════════════════════
1. Баланс: Мы не можем одновременно жать на газ (Драйв/Дофамин) и тормоз (Кайф/Серотонин).
2. Структура: День — это "слоеный пирог" из разных типов активности.
3. Объем: ~10 часов в неделю (10% времени бодрствования).

🏛 ТИПЫ ПРОЕКТОВ (Категории):
• "Ф" — ФУНДАМЕНТ (Зеленый). Здоровье, сон, спорт, питание. База для энергии.
• "Д" — ДРАЙВ (Синий). Развитие, карьера, сложные задачи. Дофамин.
• "К" — КАЙФ (Желтый). Отдых, хобби, наслаждение моментом. Серотонин.
• "Р" — РЕФЛЕКСИЯ (Красный). Анализ и планирование.

═══════════════════════════════════════
📅 ОПЦИИ РАСПИСАНИЯ
═══════════════════════════════════════
Определи подходящую опцию по контексту пользователя:
• Опция 1: 90 мин/день (Пн-Вс).
• Опция 2: 45 мин будни + 3ч выходные.
• Опция 3: 60 мин (Пн, Ср, Пт) + выходные.
• Опция 4: 150 мин (4 раза в неделю).
• Опция 5: 180 мин (3 раза в неделю).

═══════════════════════════════════════
🛠 ИНСТРУКЦИЯ ПО ГЕНЕРАЦИИ
═══════════════════════════════════════
1. Проанализируй задачи пользователя. Если не хватает категорий "Кайф" или "Фундамент", предложи их добавить.
2. Не используй markdown-форматирование (без \`\`\`json). Возвращай только валидный JSON.

ФОРМАТ JSON для импорта:
{
  "tasks": [
    {
      "project": "Ф",
      "title": "Прогулка в парке",
      "duration": 25,
      "day": "ПН"
    },
    {
      "project": "Д",
      "title": "Урок английского",
      "duration": 50,
      "day": "ПН",
      "startTime": "19:00"
    }
  ]
}

ПРАВИЛА ПОЛЕЙ:
1. "project": Только "Ф", "Д", "К" или "Р".
2. "duration": Число (минуты).
3. "startTime": ДОБАВЛЯТЬ ТОЛЬКО ЕСЛИ ПОЛЬЗОВАТЕЛЬ УКАЗАЛ ВРЕМЯ. Если времени нет в запросе — не создавай это поле.
`;

const AI_ANALYSIS_PROMPT = `
Привет, ChatGPT/Claude! Я прикрепляю JSON-файл с моим расписанием, статистикой и еженедельными рефлексиями по системе "Нейроспринт". 

В системе есть проекты:
• "Фундамент" (база, здоровье, спорт)
• "Драйв" (карьера, сложные бизнес-задачи)
• "Кайф" (отдых, хобби, удовольствия)

Проанализируй мои спринты и ответь на следующие вопросы:
1. Найди закономерности: какие задачи из каких проектов я чаще всего не выполняю до конца?
2. Есть ли перекос между проектами (например, слишком много "Драйва" и мало "Фундамента" или "Кайфа")?
3. Проанализируй тексты моих рефлексий: какие ошибки я повторяю из недели в неделю?
4. На основе моего темпа выполнения и ошибок — предложи, как улучшить фокус в проекте "Фундамент" и какие 2-3 практические корректировки мне стоит внести в планирование на следующую неделю.
`;

export function AIInstructionsModal({ isOpen, onClose }: AIInstructionsModalProps) {
    const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const currentPrompt = activeTab === 'import' ? AI_PROMPT : AI_ANALYSIS_PROMPT;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(currentPrompt);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>🤖 Инструкции для ИИ</h2>
                    <button className={styles.closeBtn} onClick={onClose}>×</button>
                </div>

                <div className={styles.tabs}>
                    <button
                        className={`${styles.tabBtn} ${activeTab === 'import' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('import')}
                    >
                        📝 Создание плана (Импорт)
                    </button>
                    <button
                        className={`${styles.tabBtn} ${activeTab === 'export' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('export')}
                    >
                        📊 Анализ итогов (Экспорт)
                    </button>
                </div>

                <div className={styles.tabContent}>
                    {activeTab === 'import' ? (
                        <p className={styles.description}>
                            Скопируй этот промпт и отправь его в ChatGPT или Claude. Опиши свои задачи словами. Нейросеть составит план недели и выдаст JSON для <b>Импорта</b>.
                        </p>
                    ) : (
                        <div className={styles.description}>
                            <p><b>Как проанализировать свои спринты:</b></p>
                            <ol>
                                <li>Нажми кнопку <b>"🤖 Экспорт для ИИ"</b> в шапке приложения.</li>
                                <li>Скопируй промпт ниже.</li>
                                <li>Открой ChatGPT или Claude, прикрепи скачанный <b>.json</b> файл и вставь скопированный промпт. Нейросеть найдет неочевидные закономерности в твоей статистике.</li>
                            </ol>
                        </div>
                    )}

                    <div className={styles.promptContainer}>
                        <div className={styles.promptText}>
                            {currentPrompt}
                        </div>
                    </div>
                </div>

                <div className={styles.actions}>
                    <button className={styles.cancelBtn} onClick={onClose}>
                        Закрыть
                    </button>
                    <button
                        className={`${styles.copyBtn} ${copied ? styles.copied : ''}`}
                        onClick={handleCopy}
                    >
                        {copied ? '✓ Скопировано!' : '📋 Скопировать промпт'}
                    </button>
                </div>
            </div>
        </div>
    );
}
