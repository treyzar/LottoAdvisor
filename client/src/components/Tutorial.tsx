import { useEffect, useRef } from 'react';
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

  // Подсвечиваем целевой элемент
  useEffect(() => {
    if (!isActive || !currentStepData?.targetElement) return;

    const targetEl = document.querySelector(currentStepData.targetElement);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isActive, currentStep, currentStepData]);

  if (!isActive) return null;

  const dialogPosition = getDialogPosition();

  return (
    <AnimatePresence>
      {isActive && (
        <>
          {/* Блюр фона */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md"
            onClick={onClose}
            data-testid="tutorial-overlay"
          />

          {/* Подсветка целевого элемента */}
          {currentStepData?.targetElement && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="fixed z-[101] pointer-events-none"
              style={{
                ...((() => {
                  const targetEl = document.querySelector(currentStepData.targetElement);
                  if (!targetEl) return {};
                  const rect = targetEl.getBoundingClientRect();
                  return {
                    top: rect.top - 8,
                    left: rect.left - 8,
                    width: rect.width + 16,
                    height: rect.height + 16,
                  };
                })()),
              }}
            >
              <div className="h-full w-full rounded-lg ring-4 ring-primary ring-offset-2 ring-offset-background animate-pulse-scale" />
            </motion.div>
          )}

          {/* Диалоговое окно */}
          <motion.div
            ref={dialogRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="fixed z-[102]"
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
