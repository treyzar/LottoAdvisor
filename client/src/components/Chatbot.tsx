import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot, User, X, Send } from 'lucide-react';
import type { UserPreferences, ChatMessage } from '@shared/schema';
import { lotteryTypes, playFrequencies } from '@shared/schema';

interface ChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (preferences: UserPreferences) => void;
}

type ChatStep =
  | 'greeting'
  | 'ticketPrice'
  | 'playFrequency'
  | 'lotteryType'
  | 'maxJackpot'
  | 'winProbability'
  | 'summary';

export function Chatbot({ isOpen, onClose, onComplete }: ChatbotProps) {
  const [step, setStep] = useState<ChatStep>('greeting');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [preferences, setPreferences] = useState<Partial<UserPreferences>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Инициализация чата
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setTimeout(() => {
        addSystemMessage(
          'Здравствуйте! Я помогу вам подобрать идеальную лотерею. Давайте начнем! 🎰'
        );
        setTimeout(() => {
          setStep('ticketPrice');
        }, 500);
      }, 500);
    }
  }, [isOpen]);

  // Логика шагов
  useEffect(() => {
    if (step === 'ticketPrice' && messages.length > 0) {
      setTimeout(() => {
        addSystemMessage(
          'Какую сумму вы готовы тратить на билет? Укажите диапазон цен (в рублях).',
          [
            { label: '50-100 ₽', value: { min: 50, max: 100 } },
            { label: '100-300 ₽', value: { min: 100, max: 300 } },
            { label: '300-500 ₽', value: { min: 300, max: 500 } },
            { label: '500+ ₽', value: { min: 500, max: 10000 } },
          ]
        );
      }, 1000);
    } else if (step === 'playFrequency') {
      setTimeout(() => {
        addSystemMessage(
          'Как часто вы планируете играть в лотерею?',
          playFrequencies.map(freq => ({ label: freq, value: freq }))
        );
      }, 1000);
    } else if (step === 'lotteryType') {
      setTimeout(() => {
        addSystemMessage(
          'Какой тип лотереи вам интересен?',
          [
            ...lotteryTypes.map(type => ({ label: type, value: type })),
            { label: 'Любая', value: undefined },
          ]
        );
      }, 1000);
    } else if (step === 'maxJackpot') {
      setTimeout(() => {
        addSystemMessage(
          'Какой минимальный джекпот вас интересует?',
          [
            { label: '1-10 млн ₽', value: { min: 1000000, max: 10000000 } },
            { label: '10-50 млн ₽', value: { min: 10000000, max: 50000000 } },
            { label: '50-100 млн ₽', value: { min: 50000000, max: 100000000 } },
            { label: '100+ млн ₽', value: { min: 100000000, max: 1000000000 } },
          ]
        );
      }, 1000);
    } else if (step === 'winProbability') {
      setTimeout(() => {
        addSystemMessage(
          'Что для вас важнее: высокая вероятность выигрыша или большой джекпот?',
          [
            { label: 'Высокая вероятность (>1%)', value: { min: 1, max: 100 } },
            { label: 'Средняя вероятность (0.1-1%)', value: { min: 0.1, max: 1 } },
            { label: 'Низкая вероятность (<0.1%)', value: { min: 0.001, max: 0.1 } },
          ]
        );
      }, 1000);
    } else if (step === 'summary') {
      setTimeout(() => {
        addSystemMessage(
          `Отлично! Я подобрал для вас лотереи на основе ваших предпочтений:\n\n• Цена билета: ${preferences.ticketPrice?.min}-${preferences.ticketPrice?.max} ₽\n• Частота: ${preferences.playFrequency}\n• Тип: ${preferences.lotteryType || 'любой'}\n• Джекпот: от ${(preferences.maxJackpot?.min || 0) / 1000000} млн ₽\n• Вероятность: ${preferences.winProbability?.min}-${preferences.winProbability?.max}%\n\nНажмите "Показать рекомендации", чтобы увидеть результаты! 🎯`
        );
      }, 1000);
    }
  }, [step]);

  const addSystemMessage = (content: string, options?: any[]) => {
    const message: ChatMessage = {
      id: `msg_${Date.now()}`,
      type: 'system',
      content,
      timestamp: new Date().toISOString(),
      options,
    };
    setMessages(prev => [...prev, message]);
  };

  const addUserMessage = (content: string) => {
    const message: ChatMessage = {
      id: `msg_${Date.now()}`,
      type: 'user',
      content,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, message]);
  };

  const handleOptionClick = (option: any, label: string) => {
    addUserMessage(label);

    switch (step) {
      case 'ticketPrice':
        setPreferences(prev => ({ ...prev, ticketPrice: option }));
        setStep('playFrequency');
        break;
      case 'playFrequency':
        setPreferences(prev => ({ ...prev, playFrequency: option }));
        setStep('lotteryType');
        break;
      case 'lotteryType':
        setPreferences(prev => ({ ...prev, lotteryType: option }));
        setStep('maxJackpot');
        break;
      case 'maxJackpot':
        setPreferences(prev => ({ ...prev, maxJackpot: option }));
        setStep('winProbability');
        break;
      case 'winProbability':
        setPreferences(prev => ({ ...prev, winProbability: option }));
        setStep('summary');
        break;
    }
  };

  const handleComplete = () => {
    if (preferences.ticketPrice && preferences.playFrequency && preferences.maxJackpot && preferences.winProbability) {
      onComplete(preferences as UserPreferences);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl"
        >
          <Card className="flex h-[600px] flex-col overflow-hidden">
            {/* Заголовок */}
            <div className="flex items-center justify-between border-b p-4 bg-muted/30">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 bg-primary">
                  <AvatarFallback>
                    <Bot className="h-5 w-5 text-primary-foreground" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-serif text-lg font-bold">Подбор лотереи</h2>
                  <p className="text-xs text-muted-foreground">
                    Шаг {['greeting', 'ticketPrice', 'playFrequency', 'lotteryType', 'maxJackpot', 'winProbability', 'summary'].indexOf(step)} из 5
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                data-testid="button-close-chatbot"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Сообщения */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, x: message.type === 'system' ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex gap-3 ${message.type === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <Avatar className={`h-8 w-8 flex-shrink-0 ${message.type === 'system' ? 'bg-primary' : 'bg-secondary'}`}>
                    <AvatarFallback>
                      {message.type === 'system' ? (
                        <Bot className="h-4 w-4 text-primary-foreground" />
                      ) : (
                        <User className="h-4 w-4 text-secondary-foreground" />
                      )}
                    </AvatarFallback>
                  </Avatar>

                  <div className={`flex-1 ${message.type === 'user' ? 'flex justify-end' : ''}`}>
                    <div
                      className={`inline-block rounded-lg px-4 py-3 max-w-[80%] ${
                        message.type === 'system'
                          ? 'bg-muted text-foreground'
                          : 'bg-primary text-primary-foreground'
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                    </div>

                    {/* Кнопки опций */}
                    {message.options && index === messages.length - 1 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {message.options.map((option, optIndex) => (
                          <Button
                            key={optIndex}
                            variant="outline"
                            size="sm"
                            onClick={() => handleOptionClick(option.value, option.label)}
                            className="hover-elevate active-elevate-2"
                            data-testid={`button-option-${optIndex}`}
                          >
                            {option.label}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Кнопка завершения */}
            {step === 'summary' && (
              <div className="border-t p-4 bg-muted/30">
                <Button
                  onClick={handleComplete}
                  className="w-full gap-2"
                  size="lg"
                  data-testid="button-show-recommendations"
                >
                  Показать рекомендации
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            )}
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
