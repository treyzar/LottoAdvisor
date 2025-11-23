import { useQuery } from '@tanstack/react-query';
import { useRoute, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Trophy, Ticket, TrendingUp, Calendar, Info, Award, History } from 'lucide-react';
import type { Lottery } from '@shared/schema';

export default function LotteryDetail() {
  const [, params] = useRoute('/lottery/:id');
  const [, setLocation] = useLocation();
  const lotteryId = params?.id;

  const { data: lottery, isLoading } = useQuery<Lottery>({
    queryKey: ['/api/lotteries', lotteryId],
    enabled: !!lotteryId,
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatJackpot = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)} млн ₽`;
    }
    return formatPrice(amount);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 md:px-6">
          <Skeleton className="h-12 w-32 mb-8" />
          <Skeleton className="h-64 w-full mb-8" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!lottery) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 md:px-6">
          <Card className="p-12 text-center">
            <h2 className="font-serif text-2xl font-bold text-foreground mb-4">
              Лотерея не найдена
            </h2>
            <Button onClick={() => setLocation('/')} variant="outline">
              Вернуться на главную
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const getLotteryTypeColor = (type: string) => {
    switch (type) {
      case 'числовая':
        return 'bg-chart-1/20 text-chart-1 border-chart-1/30';
      case 'моментальная':
        return 'bg-chart-2/20 text-chart-2 border-chart-2/30';
      case 'тиражная':
        return 'bg-chart-3/20 text-chart-3 border-chart-3/30';
      case 'спортлото':
        return 'bg-chart-4/20 text-chart-4 border-chart-4/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 md:px-6 max-w-5xl">
        {/* Навигация */}
        <Button
          variant="ghost"
          onClick={() => setLocation('/')}
          className="gap-2 mb-8"
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
          Назад к лотереям
        </Button>

        {/* Заголовок */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
            <div className="flex-1">
              <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-3">
                {lottery.name}
              </h1>
              <Badge 
                variant="outline" 
                className={`${getLotteryTypeColor(lottery.type)} border text-base px-3 py-1`}
              >
                {lottery.type}
              </Badge>
            </div>
          </div>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {lottery.description}
          </p>
        </div>

        {/* Ключевые показатели */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                <Trophy className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">Текущий джекпот</p>
            </div>
            <p className="font-serif text-3xl font-bold text-foreground">
              {formatJackpot(lottery.currentJackpot)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              до {formatJackpot(lottery.maxJackpot)}
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-2/20">
                <Ticket className="h-5 w-5 text-chart-2" />
              </div>
              <p className="text-sm text-muted-foreground">Цена билета</p>
            </div>
            <p className="font-serif text-3xl font-bold text-foreground">
              {formatPrice(lottery.ticketPrice)}
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-3/20">
                <TrendingUp className="h-5 w-5 text-chart-3" />
              </div>
              <p className="text-sm text-muted-foreground">Вероятность</p>
            </div>
            <p className="font-serif text-3xl font-bold text-foreground">
              {lottery.winProbability.toFixed(3)}%
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-4/20">
                <Calendar className="h-5 w-5 text-chart-4" />
              </div>
              <p className="text-sm text-muted-foreground">Розыгрыш</p>
            </div>
            <p className="font-semibold text-foreground capitalize text-lg">
              {lottery.drawFrequency}
            </p>
          </Card>
        </div>

        {/* Вкладки с информацией */}
        <Tabs defaultValue="description" className="w-full">
          <TabsList className="w-full justify-start mb-6 flex-wrap h-auto gap-2">
            <TabsTrigger value="description" className="gap-2" data-testid="tab-description">
              <Info className="h-4 w-4" />
              Описание
            </TabsTrigger>
            <TabsTrigger value="rules" className="gap-2" data-testid="tab-rules">
              <Award className="h-4 w-4" />
              Правила
            </TabsTrigger>
            <TabsTrigger value="prizes" className="gap-2" data-testid="tab-prizes">
              <Trophy className="h-4 w-4" />
              Призы
            </TabsTrigger>
          </TabsList>

          <TabsContent value="description">
            <Card className="p-6 md:p-8">
              <h2 className="font-serif text-2xl font-bold text-foreground mb-4">
                Описание лотереи
              </h2>
              <div className="prose prose-lg max-w-none">
                <p className="text-foreground/90 leading-relaxed">
                  {lottery.description}
                </p>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="rules">
            <Card className="p-6 md:p-8">
              <h2 className="font-serif text-2xl font-bold text-foreground mb-4">
                Правила игры
              </h2>
              <div className="prose prose-lg max-w-none">
                <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">
                  {lottery.rules}
                </p>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="prizes">
            <Card className="p-6 md:p-8">
              <h2 className="font-serif text-2xl font-bold text-foreground mb-6">
                Структура призов
              </h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Категория</TableHead>
                    <TableHead>Приз</TableHead>
                    <TableHead className="text-right">Вероятность</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lottery.prizeStructure.map((prize, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{prize.category}</TableCell>
                      <TableCell className="font-semibold text-primary">
                        {prize.prize}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {prize.probability}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>

        {/* CTA */}
        <div className="mt-8 flex gap-4 flex-wrap">
          <Button size="lg" className="gap-2 flex-1 min-w-[200px]">
            <Ticket className="h-5 w-5" />
            Купить билет
          </Button>
          <Button size="lg" variant="outline" className="flex-1 min-w-[200px]">
            Сохранить в избранное
          </Button>
        </div>
      </div>
    </div>
  );
}
