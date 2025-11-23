import type { Lottery } from '@shared/schema';

/**
 * In-memory хранилище для кэширования данных лотерей
 * Используется для оптимизации запросов к Stoloto API
 */
export interface IStorage {
  // Кэш лотерей
  getLotteries(): Lottery[];
  setLotteries(lotteries: Lottery[]): void;
  getLotteryById(id: string): Lottery | undefined;
  
  // Очистка кэша
  clearCache(): void;
}

export class MemStorage implements IStorage {
  private lotteriesCache: Lottery[] = [];
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 минут

  constructor() {
    console.log('MemStorage initialized');
  }

  /**
   * Проверяет актуальность кэша
   */
  private isCacheValid(): boolean {
    return Date.now() - this.cacheTimestamp < this.CACHE_TTL;
  }

  /**
   * Получить все лотереи из кэша
   */
  getLotteries(): Lottery[] {
    if (!this.isCacheValid()) {
      return [];
    }
    return this.lotteriesCache;
  }

  /**
   * Сохранить лотереи в кэш
   */
  setLotteries(lotteries: Lottery[]): void {
    this.lotteriesCache = lotteries;
    this.cacheTimestamp = Date.now();
  }

  /**
   * Получить лотерею по ID
   */
  getLotteryById(id: string): Lottery | undefined {
    if (!this.isCacheValid()) {
      return undefined;
    }
    return this.lotteriesCache.find(l => l.id === id);
  }

  /**
   * Очистить кэш
   */
  clearCache(): void {
    this.lotteriesCache = [];
    this.cacheTimestamp = 0;
  }
}

export const storage = new MemStorage();
