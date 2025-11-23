import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, ArrowLeft, ArrowRight } from 'lucide-react';
import type { TutorialStep } from '@shared/schema';

interface TutorialProps {
  isActive: boolean;
  currentStep: number;
  steps: TutorialStep[];
  onNext: () => void;
  onPrevious: () => void;
  onClose: () => void;
}

export function Tutorial({
  isActive,
  currentStep,
  steps,
  onNext,
  onPrevious,
  onClose,
}: TutorialProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const currentStepData = steps[currentStep];
  const [targetBounds, setTargetBounds] = useState<DOMRect | null>(null);

  // Вычисляем позицию диалога относительно целевого элемента
  const getDialogPosition = () => {
    if (!currentStepData?.targetElement) return {};

    const targetEl = document.querySelector(currentStepData.targetElement);
    if (!targetEl) return {};

    const rect = targetEl.getBoundingClientRect();
    const dialogWidth = 400;
    const dialogHeight = 250;
    const gap = 24;

    switch (currentStepData.position) {
      case 'top':
        return {
          top: rect.top - dialogHeight - gap,
          left: rect.left + rect.width / 2 - dialogWidth / 2,
        };
      case 'bottom':
        return {
          top: rect.bottom + gap,
          left: rect.left + rect.width / 2 - dialogWidth / 2,
        };
      case 'left':
        return {
          top: rect.top + rect.height / 2 - dialogHeight / 2,
          left: rect.left - dialogWidth - gap,
        };
      case 'right':
        return {
          top: rect.top + rect.height / 2 - dialogHeight / 2,
          left: rect.right + gap,
        };
      default:
        return {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        };
    }
  };

  // Подсвечиваем целевой элемент и кэшируем его позицию
  useEffect(() => {
    if (!isActive || !currentStepData?.targetElement) {
      setTargetBounds(null);
      return;
    }

    const targetEl = document.querySelector(currentStepData.targetElement);
    if (!targetEl) return;

    // Прокрутить к элементу только при первой активации
    targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

    const updateBounds = () => {
      const el = document.querySelector(currentStepData.targetElement);
      if (el) {
        setTargetBounds(el.getBoundingClientRect());
      }
    };

    updateBounds();

    // Обновляем позицию при изменении размера окна или прокрутке
    window.addEventListener('resize', updateBounds);
    window.addEventListener('scroll', updateBounds, true);

    return () => {
      window.removeEventListener('resize', updateBounds);
      window.removeEventListener('scroll', updateBounds, true);
    };
  }, [isActive, currentStep, currentStepData]);

  if (!isActive) return null;

  const dialogPosition = getDialogPosition();

  return (
    <AnimatePresence>
      {isActive && (
        <>
          {/* Затемнение фона */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] bg-black/70"
            onClick={onClose}
            data-testid="tutorial-overlay"
          />

          {/* Подсветка целевого элемента */}
          {currentStepData?.targetElement && targetBounds && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="fixed z-[101] pointer-events-none"
              style={{
                top: targetBounds.top - 8,
                left: targetBounds.left - 8,
                width: targetBounds.width + 16,
                height: targetBounds.height + 16,
              }}
            >
              <div 
                className="h-full w-full rounded-lg border-3 border-primary shadow-[0_0_12px_rgba(237,183,73,0.4)]"
                style={{
                  animation: 'tutorial-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                }}
              />
            </motion.div>
          )}

          {/* Диалоговое окно */}
          <motion.div
            ref={dialogRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="fixed z-[103]"
            style={{
              ...dialogPosition,
              maxWidth: '90vw',
            }}
          >
            <Card className="w-full max-w-md p-8 shadow-2xl">
              {/* Заголовок и кнопка закрытия */}
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <div className="mb-1 text-sm font-medium text-muted-foreground">
                    Шаг {currentStep + 1} из {steps.length}
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-foreground">
                    {currentStepData?.title}
                  </h3>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-8 w-8 -mr-2 -mt-2"
                  data-testid="button-tutorial-close"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Описание */}
              <p className="mb-6 text-base leading-relaxed text-muted-foreground">
                {currentStepData?.description}
              </p>

              {/* Навигация */}
              <div className="flex items-center justify-between gap-4">
                <Button
                  variant="outline"
                  onClick={onPrevious}
                  disabled={currentStep === 0}
                  className="gap-2"
                  data-testid="button-tutorial-prev"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Назад
                </Button>

                <div className="flex gap-1">
                  {steps.map((_, index) => (
                    <div
                      key={index}
                      className={`h-2 w-2 rounded-full transition-all ${
                        index === currentStep
                          ? 'bg-primary w-6'
                          : 'bg-muted'
                      }`}
                    />
                  ))}
                </div>

                <Button
                  onClick={onNext}
                  className="gap-2"
                  data-testid="button-tutorial-next"
                >
                  {currentStep === steps.length - 1 ? 'Готово' : 'Далее'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
