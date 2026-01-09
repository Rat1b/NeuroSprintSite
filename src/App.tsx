import { useState } from 'react';
import { usePlannerStore } from './store/plannerStore';
import { Header } from './components/Header/Header';
import { WeekView } from './components/WeekView/WeekView';
import { MonthView } from './components/MonthView/MonthView';
import { ReflectionPanel } from './components/ReflectionPanel/ReflectionPanel';
import { TaskModal } from './components/TaskModal/TaskModal';
import { JsonImportModal } from './components/JsonImportModal/JsonImportModal';
import { AIInstructionsModal } from './components/AIInstructionsModal/AIInstructionsModal';
import type { Task, DayOfWeek } from './types';
import './index.css';

function App() {
  const { activeView, goToWeek, setActiveView } = usePlannerStore();

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultDay, setDefaultDay] = useState<DayOfWeek>('ПН');

  const handleAddTask = (day: DayOfWeek) => {
    setEditingTask(null);
    setDefaultDay(day);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleCloseTaskModal = () => {
    setIsTaskModalOpen(false);
    setEditingTask(null);
  };

  const handleOpenWeek = (weekStart: string) => {
    goToWeek(weekStart);
    setActiveView('planner');
  };

  const renderView = () => {
    switch (activeView) {
      case 'planner':
        return (
          <WeekView
            onAddTask={handleAddTask}
            onEditTask={handleEditTask}
          />
        );
      case 'month':
        return <MonthView onOpenWeek={handleOpenWeek} />;
      case 'reflection':
        return <ReflectionPanel />;
      default:
        return null;
    }
  };

  return (
    <>
      <Header
        onImportClick={() => setIsImportModalOpen(true)}
        onAIInstructionsClick={() => setIsAIModalOpen(true)}
      />

      {renderView()}

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={handleCloseTaskModal}
        task={editingTask}
        defaultDay={defaultDay}
      />

      <JsonImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />

      <AIInstructionsModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
      />
    </>
  );
}

export default App;


