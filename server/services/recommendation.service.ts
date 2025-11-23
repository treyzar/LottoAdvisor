import type { Lottery, UserPreferences, Recommendation } from '@shared/schema';

/**
 * Сервис для генерации персонализированных рекомендаций
 */
export class RecommendationService {
  /**
   * Вычисляет оценку совпадения лотереи с предпочтениями пользователя (0-100)
   */
  private calculateMatchScore(
    lottery: Lottery,
    preferences: UserPreferences
  ): number {
    let score = 0;
    let maxScore = 0;

    // Цена билета (вес: 25)
    maxScore += 25;
    if (
      lottery.ticketPrice >= preferences.ticketPrice.min &&
      lottery.ticketPrice <= preferences.ticketPrice.max
    ) {
      score += 25;
    } else {
      // Частичные баллы, если близко к диапазону
      const priceDiff = Math.min(
        Math.abs(lottery.ticketPrice - preferences.ticketPrice.min),
        Math.abs(lottery.ticketPrice - preferences.ticketPrice.max)
      );
      const maxDiff = preferences.ticketPrice.max - preferences.ticketPrice.min;
      score += Math.max(0, 25 - (priceDiff / maxDiff) * 25);
    }

    // Тип лотереи (вес: 20)
    if (preferences.lotteryType) {
      maxScore += 20;
      if (lottery.type === preferences.lotteryType) {
        score += 20;
      }
    }

    // Джекпот (вес: 30)
    maxScore += 30;
    if (
      lottery.currentJackpot >= preferences.maxJackpot.min &&
      lottery.currentJackpot <= preferences.maxJackpot.max
    ) {
      score += 30;
    } else {
      // Частичные баллы
      const jackpotDiff = Math.min(
        Math.abs(lottery.currentJackpot - preferences.maxJackpot.min),
        Math.abs(lottery.currentJackpot - preferences.maxJackpot.max)
      );
      const maxDiff = preferences.maxJackpot.max - preferences.maxJackpot.min;
      score += Math.max(0, 30 - (jackpotDiff / maxDiff) * 30);
    }

    // Вероятность выигрыша (вес: 25)
    maxScore += 25;
    if (
      lottery.winProbability >= preferences.winProbability.min &&
      lottery.winProbability <= preferences.winProbability.max
    ) {
      score += 25;
    } else {
      // Частичные баллы
      const probDiff = Math.min(
        Math.abs(lottery.winProbability - preferences.winProbability.min),
        Math.abs(lottery.winProbability - preferences.winProbability.max)
      );
      const maxDiff = preferences.winProbability.max - preferences.winProbability.min;
      score += Math.max(0, 25 - (probDiff / maxDiff) * 25);
    }

    return Math.round((score / maxScore) * 100);
  }

  /**
   * Генерирует персонализированное описание причины рекомендации
   */
  private generatePersonalizedReason(
    lottery: Lottery,
    preferences: UserPreferences,
    matchScore: number
  ): string {
    const reasons: string[] = [];

    // Цена билета
    if (
      lottery.ticketPrice >= preferences.ticketPrice.min &&
      lottery.ticketPrice <= preferences.ticketPrice.max
    ) {
      reasons.push(
        `Билет стоит ${lottery.ticketPrice} ₽, что соответствует вашему бюджету (${preferences.ticketPrice.min}-${preferences.ticketPrice.max} ₽)`
      );
    }

    // Тип лотереи
    if (preferences.lotteryType && lottery.type === preferences.lotteryType) {
      const typeDescriptions: Record<string, string> = {
        числовая: 'Вы предпочитаете числовые лотереи, где вы сами выбираете числа',
        моментальная: 'Вы любите динамичные игры с частыми розыгрышами',
        тиражная: 'Вы предпочитаете традиционные тиражные лотереи',
        спортлото: 'Вы интересуетесь спортивными лотереями',
      };
      reasons.push(typeDescriptions[lottery.type] || `Это ${lottery.type} лотерея`);
    }

    // Джекпот
    const jackpotMln = (lottery.currentJackpot / 1000000).toFixed(1);
    if (
      lottery.currentJackpot >= preferences.maxJackpot.min &&
      lottery.currentJackpot <= preferences.maxJackpot.max
    ) {
      reasons.push(
        `Текущий джекпот ${jackpotMln} млн ₽ находится в интересующем вас диапазоне`
      );
    } else if (lottery.currentJackpot > preferences.maxJackpot.max) {
      reasons.push(
        `Огромный джекпот ${jackpotMln} млн ₽ - шанс выиграть больше, чем планировали!`
      );
    }

    // Вероятность выигрыша
    if (lottery.winProbability >= preferences.winProbability.min) {
      if (lottery.winProbability >= 0.05) {
        reasons.push(
          `Высокая вероятность выигрыша (${lottery.winProbability.toFixed(3)}%) - отличные шансы!`
        );
      } else if (lottery.winProbability >= 0.01) {
        reasons.push(
          `Хорошая вероятность выигрыша (${lottery.winProbability.toFixed(3)}%) при достойном призовом фонде`
        );
      }
    }

    // Частота розыгрышей
    const frequencyDescriptions: Record<string, string> = {
      ежедневно: 'Ежедневные розыгрыши - не придется долго ждать результата',
      еженедельно: 'Еженедельные розыгрыши подходят для вашей частоты игры',
    };
    if (
      (preferences.playFrequency === 'ежедневно' &&
        lottery.drawFrequency.includes('ежедневно')) ||
      (preferences.playFrequency === 'еженедельно' &&
        lottery.drawFrequency.includes('еженедельно'))
    ) {
      const desc = frequencyDescriptions[lottery.drawFrequency] ||
        frequencyDescriptions[lottery.drawFrequency.split(' ')[0]];
      if (desc) reasons.push(desc);
    }

    // Общая оценка
    if (matchScore >= 90) {
      return `Идеальный выбор! ${reasons.join('. ')}.`;
    } else if (matchScore >= 70) {
      return `Отличный вариант! ${reasons.join('. ')}.`;
    } else {
      return reasons.length > 0
        ? reasons.join('. ') + '.'
        : 'Эта лотерея может вам понравиться!';
    }
  }

  /**
   * Определяет совпавшие критерии
   */
  private getMatchedCriteria(
    lottery: Lottery,
    preferences: UserPreferences
  ): string[] {
    const criteria: string[] = [];

    if (
      lottery.ticketPrice >= preferences.ticketPrice.min &&
      lottery.ticketPrice <= preferences.ticketPrice.max
    ) {
      criteria.push('Цена билета');
    }

    if (preferences.lotteryType && lottery.type === preferences.lotteryType) {
      criteria.push('Тип лотереи');
    }

    if (
      lottery.currentJackpot >= preferences.maxJackpot.min &&
      lottery.currentJackpot <= preferences.maxJackpot.max
    ) {
      criteria.push('Размер джекпота');
    }

    if (
      lottery.winProbability >= preferences.winProbability.min &&
      lottery.winProbability <= preferences.winProbability.max
    ) {
      criteria.push('Вероятность выигрыша');
    }

    if (
      (preferences.playFrequency === 'ежедневно' &&
        lottery.drawFrequency.includes('ежедневно')) ||
      (preferences.playFrequency === 'еженедельно' &&
        lottery.drawFrequency.includes('еженедельно'))
    ) {
      criteria.push('Частота розыгрышей');
    }

    return criteria;
  }

  /**
   * Генерирует рекомендации на основе предпочтений пользователя
   */
  async generateRecommendations(
    lotteries: Lottery[],
    preferences: UserPreferences,
    previousLotteryIds?: string[]
  ): Promise<Recommendation[]> {
    // Вычисляем оценки для всех лотерей
    const scored = lotteries.map(lottery => {
      const matchScore = this.calculateMatchScore(lottery, preferences);
      const personalizedReason = this.generatePersonalizedReason(
        lottery,
        preferences,
        matchScore
      );
      const matchedCriteria = this.getMatchedCriteria(lottery, preferences);
      const isNew = previousLotteryIds
        ? !previousLotteryIds.includes(lottery.id)
        : true; // Все рекомендации новые при первом просмотре

      return {
        lottery,
        matchScore,
        personalizedReason,
        matchedCriteria,
        isNew,
      };
    });

    // Сортируем по оценке (от большей к меньшей)
    scored.sort((a, b) => b.matchScore - a.matchScore);

    // Возвращаем топ рекомендаций (минимум 50% совпадения)
    return scored.filter(r => r.matchScore >= 50);
  }
}

export const recommendationService = new RecommendationService();
