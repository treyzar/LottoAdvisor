import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Trash2, RefreshCw, Calendar, TrendingUp, ArrowRight } from 'lucide-react';
import { StorageService } from '@/services/storage.service';
import { apiRequest } from '@/lib/queryClient';
import type { SavedParameters, RecommendationResponse } from '@shared/schema';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale/ru';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

export default function SavedParametersPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [savedParams, setSavedParams] = useState<SavedParameters[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const params = StorageService.getSavedParameters();
    setSavedParams(params);
  }, []);

  const handleDelete = (id: string) => {
    StorageService.deleteSavedParameters(id);
    setSavedParams(StorageService.getSavedParameters());
    setDeleteId(null);
    toast({
      title: 'Набор удален',
      description: 'Сохраненный набор параметров успешно удален',
    });
  };

  const handleViewUpdated = async (params: SavedParameters) => {
    // Сохраняем текущие предпочтения
    StorageService.saveCurrentPreferences(params.preferences);
    
    // Переходим на страницу рекомендаций
    setLocation('/recommendations');
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 md:px-6">
        {/* Заголовок */}
        <div className="mb-12">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
            Мои сохраненные параметры
          </h1>
          <p className="text-lg text-muted-foreground">
            Вернитесь к своим любимым наборам параметров и посмотрите обновленные рекомендации
          </p>
        </div>

        {savedParams.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="mx-auto max-w-md">
              <div className="mb-6 flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                  <TrendingUp className="h-10 w-10 text-muted-foreground" />
                </div>
              </div>
              <h2 className="font-serif text-2xl font-bold text-foreground mb-3">
                Нет сохраненных параметров
              </h2>
              <p className="text-muted-foreground mb-6">
                Создайте свой первый набор параметров, используя чат-бот для подбора лотерей
              </p>
              <Button onClick={() => setLocation('/')} className="gap-2">
                Начать подбор
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedParams.map((params) => (
              <Card
                key={params.id}
                className="flex flex-col hover:shadow-lg transition-shadow"
                data-testid={`card-saved-${params.id}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h3 className="font-serif text-xl font-bold text-foreground mb-2">
                        {params.name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {format(new Date(params.savedAt), 'd MMMM yyyy', { locale: ru })}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(params.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      data-testid={`button-delete-${params.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Цена билета:</span>
                      <span className="font-medium text-foreground">
                        {params.preferences.ticketPrice.min}-{params.preferences.ticketPrice.max} ₽
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Частота:</span>
                      <span className="font-medium text-foreground capitalize">
                        {params.preferences.playFrequency}
                      </span>
                    </div>
                    {params.preferences.lotteryType && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Тип:</span>
                        <Badge variant="secondary" className="capitalize">
                          {params.preferences.lotteryType}
                        </Badge>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Джекпот:</span>
                      <span className="font-medium text-foreground">
                        {(params.preferences.maxJackpot.min / 1000000).toFixed(1)}-
                        {(params.preferences.maxJackpot.max / 1000000).toFixed(1)} млн ₽
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Вероятность:</span>
                      <span className="font-medium text-foreground">
                        {params.preferences.winProbability.min}-{params.preferences.winProbability.max}%
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t">
                    <p className="text-xs text-muted-foreground">
                      Сохранено лотерей: <span className="font-semibold">{params.lotteryIds.length}</span>
                    </p>
                  </div>
                </CardContent>

                <CardFooter>
                  <Button
                    onClick={() => handleViewUpdated(params)}
                    className="w-full gap-2"
                    data-testid={`button-view-${params.id}`}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Посмотреть обновления
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Диалог подтверждения удаления */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent data-testid="dialog-confirm-delete">
            <AlertDialogHeader>
              <AlertDialogTitle>Удалить набор параметров?</AlertDialogTitle>
              <AlertDialogDescription>
                Это действие нельзя отменить. Сохраненный набор параметров будет удален навсегда.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-delete">
                Отмена
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteId && handleDelete(deleteId)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-testid="button-confirm-delete"
              >
                Удалить
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
