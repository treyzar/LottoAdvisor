import { Link } from 'wouter';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Ticket, TrendingUp, Calendar, CheckCircle2, Sparkles } from 'lucide-react';
import type { Recommendation } from '@shared/schema';
import { motion } from 'framer-motion';

interface RecommendationCardProps {
  recommendation: Recommendation;
  index: number;
}

export function RecommendationCard({ recommendation, index }: RecommendationCardProps) {
  const { lottery, matchScore, personalizedReason, matchedCriteria, isNew } = recommendation;

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

  const getMatchColor = (score: number) => {
    if (score >= 90) return 'text-chart-2 bg-chart-2/10 border-chart-2/30';
    if (score >= 70) return 'text-chart-3 bg-chart-3/10 border-chart-3/30';
    return 'text-chart-1 bg-chart-1/10 border-chart-1/30';
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <Card 
        className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
        data-testid={`card-recommendation-${lottery.id}`}
      >
        {/* Новая рекомендация badge */}
        {isNew && (
          <div className="absolute top-4 right-4 z-10">
            <Badge 
              variant="destructive" 
              className="animate-pulse-scale shadow-lg gap-1"
              data-testid="badge-new-recommendation"
            >
              <Sparkles className="h-3 w-3" />
              Новая!
            </Badge>
          </div>
        )}

        {/* Оценка совпадения */}
        <div className="absolute top-4 left-4 z-10">
          <Badge 
            variant="outline" 
            className={`${getMatchColor(matchScore)} border font-bold shadow-md`}
            data-testid={`badge-match-${matchScore}`}
          >
            {matchScore}% совпадение
          </Badge>
        </div>

        <CardHeader className="pt-16 pb-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h3 className="font-serif text-2xl font-bold text-foreground mb-2">
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
          {/* Персонализированное описание причин выбора */}
          <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4">
            <h4 className="flex items-center gap-2 font-semibold text-foreground mb-3">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Почему эта лотерея вам подходит:
            </h4>
            <p className="text-sm leading-relaxed text-foreground/90 mb-3">
              {personalizedReason}
            </p>
            
            {/* Совпавшие критерии */}
            {matchedCriteria.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {matchedCriteria.map((criteria, idx) => (
                  <Badge 
                    key={idx} 
                    variant="secondary"
                    className="text-xs"
                  >
                    {criteria}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Джекпот */}
          <div className="flex items-center gap-3 rounded-lg bg-primary/10 p-4 border border-primary/20">
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/20">
              <Trophy className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-muted-foreground">Текущий джекпот</p>
              <p className="font-serif text-3xl font-bold text-foreground">
                {formatJackpot(lottery.currentJackpot)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                до {formatJackpot(lottery.maxJackpot)}
              </p>
            </div>
          </div>

          {/* Статистика */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
              <Ticket className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Цена билета</p>
                <p className="font-semibold text-foreground text-lg">{formatPrice(lottery.ticketPrice)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
              <TrendingUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Вероятность</p>
                <p className="font-semibold text-foreground text-lg">{lottery.winProbability.toFixed(3)}%</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Розыгрыш {lottery.drawFrequency}</span>
          </div>
        </CardContent>

        <CardFooter className="gap-2">
          <Link href={`/lottery/${lottery.id}`} className="flex-1">
            <Button 
              className="w-full gap-2" 
              variant="outline"
              data-testid={`button-details-${lottery.id}`}
            >
              Подробнее
            </Button>
          </Link>
          <Button 
            className="flex-1 gap-2"
            data-testid={`button-select-${lottery.id}`}
          >
            Выбрать
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
