import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { LotteryCard } from '@/components/LotteryCard';
import { Chatbot } from '@/components/Chatbot';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare, Sparkles, TrendingUp, Trophy } from 'lucide-react';
import { useLocation, Link } from 'wouter';
import { StorageService } from '@/services/storage.service';
import type { Lottery, UserPreferences } from '@shared/schema';

export default function Home() {
  const [, setLocation] = useLocation();
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  // Получаем список лотерей
  const { data: lotteries, isLoading } = useQuery<Lottery[]>({
    queryKey: ['/api/lotteries'],
  });

  const handleChatbotComplete = (preferences: UserPreferences) => {
    // Сохраняем текущие предпочтения
    StorageService.saveCurrentPreferences(preferences);
    setIsChatbotOpen(false);
    // Переходим на страницу рекомендаций
    setLocation('/recommendations');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero секция */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background py-20 md:py-32">
        <div className="container mx-auto px-4 md:px-6" data-tutorial="welcome">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="font-serif text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Найдите свою удачу с{' '}
              <span className="text-primary">СтоЛото</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
              Персонализированная система подбора лотерей на основе ваших предпочтений. 
              Умные рекомендации помогут выбрать лотереи, которые подходят именно вам.
            </p>
            <Button
              size="lg"
              className="gap-2 text-lg h-14 px-8"
              onClick={() => setIsChatbotOpen(true)}
              data-tutorial="chat-button"
              data-testid="button-start-selection"
            >
              <MessageSquare className="h-5 w-5" />
              Начать подбор лотереи
            </Button>
          </div>

          {/* Статистика */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4 rounded-lg bg-card border p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {lotteries?.length || 0}
                </p>
                <p className="text-sm text-muted-foreground">Доступных лотерей</p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-lg bg-card border p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-chart-2/20">
                <Trophy className="h-6 w-6 text-chart-2" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">500+ млн ₽</p>
                <p className="text-sm text-muted-foreground">Текущие джекпоты</p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-lg bg-card border p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-chart-3/20">
                <TrendingUp className="h-6 w-6 text-chart-3" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">98%</p>
                <p className="text-sm text-muted-foreground">Довольных пользователей</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Каталог лотерей */}
      <section className="py-16 md:py-24" data-tutorial="catalog">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mb-12 text-center">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
              Популярные лотереи
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Выберите из широкого ассортимента лотерей или воспользуйтесь нашей системой персональных рекомендаций
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="h-[400px] w-full rounded-lg" />
                </div>
              ))}
            </div>
          ) : lotteries && lotteries.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lotteries.slice(0, 6).map((lottery) => (
                <LotteryCard key={lottery.id} lottery={lottery} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">
                Лотереи временно недоступны. Попробуйте позже.
              </p>
            </div>
          )}

          {lotteries && lotteries.length > 6 && (
            <div className="mt-12 text-center">
              <Link href="/all">
                <Button variant="outline" size="lg">
                  Показать все лотереи
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Chatbot */}
      <Chatbot
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
        onComplete={handleChatbotComplete}
      />
    </div>
  );
}
