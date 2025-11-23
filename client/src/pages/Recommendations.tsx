import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RecommendationCard } from '@/components/RecommendationCard';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Save, Sparkles, Target } from 'lucide-react';
import { StorageService } from '@/services/storage.service';
import { apiRequest } from '@/lib/queryClient';
import type { Recommendation, RecommendationResponse, UserPreferences } from '@shared/schema';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function Recommendations() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState('');

  useEffect(() => {
    const savedPreferences = StorageService.getCurrentPreferences();
    if (!savedPreferences) {
      setLocation('/');
      return;
    }
    setPreferences(savedPreferences);
  }, [setLocation]);

  // Получаем рекомендации
  const { data: recommendationsData, isLoading } = useQuery<RecommendationResponse>({
    queryKey: ['/api/recommendations', preferences],
    enabled: !!preferences,
  });

  const handleSaveParameters = async () => {
    if (!preferences || !saveName.trim()) return;

    try {
      const savedParams = StorageService.saveParameters({
        name: saveName.trim(),
        preferences,
        lotteryIds: recommendationsData?.recommendations.map(r => r.lottery.id) || [],
      });

      toast({
        title: 'Параметры сохранены',
        description: `Набор "${saveName}" успешно сохранен`,
      });

      setIsSaveDialogOpen(false);
      setSaveName('');
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить параметры',
        variant: 'destructive',
      });
    }
  };

  if (!preferences) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 md:px-6">
        {/* Шапка */}
        <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
          <Button
            variant="ghost"
            onClick={() => setLocation('/')}
            className="gap-2"
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4" />
            Назад
          </Button>

          <Button
            onClick={() => setIsSaveDialogOpen(true)}
            className="gap-2"
            data-testid="button-save-params"
          >
            <Save className="h-4 w-4" />
            Сохранить параметры
          </Button>
        </div>

        {/* Сводка параметров */}
        <Card className="mb-12 p-6 md:p-8 bg-gradient-to-br from-primary/5 to-background">
          <div className="flex items-start gap-4 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-2">
                Ваши персональные рекомендации
              </h1>
              <p className="text-lg text-muted-foreground">
                На основе ваших предпочтений мы подобрали лучшие лотереи
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="rounded-lg bg-background/50 p-4 border">
              <p className="text-sm text-muted-foreground mb-1">Цена билета</p>
              <p className="font-semibold text-foreground">
                {preferences.ticketPrice.min}-{preferences.ticketPrice.max} ₽
              </p>
            </div>
            <div className="rounded-lg bg-background/50 p-4 border">
              <p className="text-sm text-muted-foreground mb-1">Частота игры</p>
              <p className="font-semibold text-foreground capitalize">
                {preferences.playFrequency}
              </p>
            </div>
            {preferences.lotteryType && (
              <div className="rounded-lg bg-background/50 p-4 border">
                <p className="text-sm text-muted-foreground mb-1">Тип лотереи</p>
                <p className="font-semibold text-foreground capitalize">
                  {preferences.lotteryType}
                </p>
              </div>
            )}
            <div className="rounded-lg bg-background/50 p-4 border">
              <p className="text-sm text-muted-foreground mb-1">Диапазон джекпота</p>
              <p className="font-semibold text-foreground">
                {(preferences.maxJackpot.min / 1000000).toFixed(1)}-
                {(preferences.maxJackpot.max / 1000000).toFixed(1)} млн ₽
              </p>
            </div>
            <div className="rounded-lg bg-background/50 p-4 border">
              <p className="text-sm text-muted-foreground mb-1">Вероятность выигрыша</p>
              <p className="font-semibold text-foreground">
                {preferences.winProbability.min}-{preferences.winProbability.max}%
              </p>
            </div>
            {recommendationsData && (
              <div className="rounded-lg bg-background/50 p-4 border">
                <p className="text-sm text-muted-foreground mb-1">Найдено совпадений</p>
                <p className="font-semibold text-foreground">
                  {recommendationsData.totalMatches} лотерей
                </p>
              </div>
            )}
          </div>

          {recommendationsData && (
            <div className="mt-6 flex items-center gap-2 text-sm">
              <Sparkles className="h-5 w-5 text-primary" />
              <p className="text-muted-foreground">
                Средняя оценка совпадения:{' '}
                <span className="font-semibold text-foreground">
                  {recommendationsData.averageMatchScore.toFixed(0)}%
                </span>
              </p>
            </div>
          )}
        </Card>

        {/* Список рекомендаций */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-[600px] w-full rounded-lg" />
            ))}
          </div>
        ) : recommendationsData && recommendationsData.recommendations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendationsData.recommendations.map((recommendation, index) => (
              <RecommendationCard
                key={recommendation.lottery.id}
                recommendation={recommendation}
                index={index}
              />
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <p className="text-lg text-muted-foreground mb-4">
              К сожалению, не найдено лотерей, соответствующих вашим критериям
            </p>
            <Button onClick={() => setLocation('/')} variant="outline">
              Изменить параметры
            </Button>
          </Card>
        )}

        {/* Диалог сохранения параметров */}
        <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
          <DialogContent data-testid="dialog-save-params">
            <DialogHeader>
              <DialogTitle>Сохранить набор параметров</DialogTitle>
              <DialogDescription>
                Дайте название этому набору параметров, чтобы вернуться к нему позже
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="save-name">Название набора</Label>
                <Input
                  id="save-name"
                  placeholder="Например: Еженедельная игра"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  data-testid="input-save-name"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsSaveDialogOpen(false)}
                data-testid="button-cancel-save"
              >
                Отмена
              </Button>
              <Button
                onClick={handleSaveParameters}
                disabled={!saveName.trim()}
                data-testid="button-confirm-save"
              >
                Сохранить
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
