import { Link } from 'wouter';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Ticket, TrendingUp, Calendar } from 'lucide-react';
import type { Lottery } from '@shared/schema';

interface LotteryCardProps {
  lottery: Lottery;
  isNew?: boolean;
  className?: string;
}

export function LotteryCard({ lottery, isNew = false, className = '' }: LotteryCardProps) {
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
    <Card 
      className={`group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${className}`}
      data-testid={`card-lottery-${lottery.id}`}
    >
      {/* Новая рекомендация badge */}
      {isNew && (
        <div className="absolute top-4 right-4 z-10">
          <Badge 
            variant="destructive" 
            className="animate-pulse-scale shadow-lg"
            data-testid="badge-new"
          >
            Новая!
          </Badge>
        </div>
      )}

      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h3 className="font-serif text-xl font-bold text-foreground mb-2 line-clamp-2">
              {lottery.name}
            </h3>
            <Badge 
              variant="outline" 
              className={`${getLotteryTypeColor(lottery.type)} border`}
            >
              {lottery.type}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pb-4">
        {/* Джекпот */}
        <div className="flex items-center gap-3 rounded-lg bg-primary/10 p-4 border border-primary/20">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20">
            <Trophy className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-muted-foreground">Текущий джекпот</p>
            <p className="font-serif text-2xl font-bold text-foreground">
              {formatJackpot(lottery.currentJackpot)}
            </p>
          </div>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
            <Ticket className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Цена</p>
              <p className="font-semibold text-foreground">{formatPrice(lottery.ticketPrice)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
            <TrendingUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Вероятность</p>
              <p className="font-semibold text-foreground">{lottery.winProbability.toFixed(3)}%</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Розыгрыш {lottery.drawFrequency}</span>
        </div>

        {/* Описание */}
        <p className="text-sm text-muted-foreground line-clamp-2">
          {lottery.description}
        </p>
      </CardContent>

      <CardFooter>
        <Link href={`/lottery/${lottery.id}`}>
          <Button 
            className="w-full gap-2" 
            variant="outline"
            data-testid={`button-details-${lottery.id}`}
          >
            Подробнее
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
