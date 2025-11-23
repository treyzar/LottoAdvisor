import { useState, useEffect } from 'react';
import { StorageService } from '@/services/storage.service';
import type { TutorialStep } from '@shared/schema';

/**
 * Хук для управления интерактивным обучением
 */
export function useTutorial() {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(
    StorageService.isTutorialCompleted()
  );

  // Шаги обучения
  const steps: TutorialStep[] = [
    {
      id: 'step-1',
      title: 'Добро пожаловать в СтоЛото!',
      description: 'Это система персонализированных рекомендаций лотерей. Мы поможем вам выбрать лотереи, которые подходят именно вам.',
      targetElement: '[data-tutorial="welcome"]',
      position: 'bottom',
    },
    {
      id: 'step-2',
      title: 'Каталог лотерей',
      description: 'Здесь вы найдете все доступные лотереи СтоЛото. Каждая карточка содержит информацию о призах, стоимости билета и вероятности выигрыша.',
      targetElement: '[data-tutorial="catalog"]',
      position: 'top',
    },
    {
      id: 'step-3',
      title: 'Персональный подбор',
      description: 'Нажмите эту кнопку, чтобы запустить чат-бот. Он задаст вам несколько вопросов и подберет лотереи, идеально подходящие вашим предпочтениям.',
      targetElement: '[data-tutorial="chat-button"]',
      position: 'left',
    },
    {
      id: 'step-4',
      title: 'Мои параметры',
      description: 'Здесь хранятся ваши сохраненные наборы параметров. Вы можете вернуться к ним в любое время и увидеть обновленные рекомендации.',
      targetElement: '[data-tutorial="saved-params"]',
      position: 'bottom',
    },
    {
      id: 'step-5',
      title: 'Готово!',
      description: 'Теперь вы готовы найти свою удачу! Вы всегда можете повторить обучение, нажав на иконку справки.',
      targetElement: '[data-tutorial="help-button"]',
      position: 'left',
    },
  ];

  // Запуск обучения для новых пользователей
  useEffect(() => {
    if (StorageService.isFirstVisit() && !isCompleted) {
      const timer = setTimeout(() => {
        setIsActive(true);
      }, 1000); // Задержка 1 секунда после загрузки
      return () => clearTimeout(timer);
    }
  }, [isCompleted]);

  const startTutorial = () => {
    setIsActive(true);
    setCurrentStep(0);
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      completeTutorial();
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const skipTutorial = () => {
    completeTutorial();
  };

  const completeTutorial = () => {
    setIsActive(false);
    setIsCompleted(true);
    setCurrentStep(0);
    StorageService.setTutorialCompleted(true);
  };

  const goToStep = (step: number) => {
    if (step >= 0 && step < steps.length) {
      setCurrentStep(step);
    }
  };

  return {
    isActive,
    isCompleted,
    currentStep,
    steps,
    totalSteps: steps.length,
    startTutorial,
    nextStep,
    previousStep,
    skipTutorial,
    goToStep,
    currentStepData: steps[currentStep],
  };
}
