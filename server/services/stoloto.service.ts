import type { Lottery, LotteryType, PlayFrequency, StolotoGame, StolotoDrawsResponse } from '@shared/schema';
import { stolotoDrawsResponseSchema } from '@shared/schema';

const MAX_RETRIES = 3;
const RETRY_DELAY = 500;

function kopecksToRoubles(kopecks: number): number {
  return kopecks / 100.0;
}

function determineLotteryType(name: string): LotteryType {
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('6x45') || lowerName.includes('5x36') || 
      lowerName.includes('4x20') || lowerName.includes('7x49')) {
    return 'числовая';
  }
  
  if (lowerName.includes('rapido') || lowerName.includes('12x24')) {
    return 'моментальная';
  }
  
  if (lowerName.includes('top3')) {
    return 'спортлото';
  }
  
  return 'тиражная';
}

function convertDrawFrequency(frequency: string): PlayFrequency {
  const lowerFreq = frequency.toLowerCase();
  
  if (lowerFreq.includes('daily') || lowerFreq.includes('ежедневно')) {
    return 'ежедневно';
  }
  
  if (lowerFreq.includes('weekly') || lowerFreq.includes('еженедельно')) {
    return 'еженедельно';
  }
  
  if (lowerFreq.includes('several') || lowerFreq.includes('несколько')) {
    return 'несколько раз в неделю';
  }
  
  if (lowerFreq.includes('monthly') || lowerFreq.includes('месяц')) {
    return 'раз в месяц';
  }
  
  return 'еженедельно';
}

function generateDescription(displayName: string, lotteryType: LotteryType): string {
  switch (lotteryType) {
    case 'числовая':
      return `${displayName} - популярная числовая лотерея. Выберите числа и выиграйте крупный приз!`;
    case 'моментальная':
      return `${displayName} - моментальная лотерея с частыми розыгрышами и быстрыми результатами!`;
    case 'тиражная':
      return `${displayName} - классическая тиражная лотерея с большими призами!`;
    case 'спортлото':
      return `${displayName} - спортивная лотерея для любителей динамичных игр!`;
    default:
      return `${displayName} - увлекательная лотерея с отличными призами!`;
  }
}

function generateRules(displayName: string): string {
  return `Купите билет ${displayName}, выберите числа согласно правилам игры. Розыгрыш проходит согласно расписанию. При совпадении всех чисел вы выигрываете главный приз!`;
}

function generatePrizeStructure(jackpot: number): Array<{ category: string; prize: string; probability: string }> {
  const jackpotMln = jackpot / 1000000.0;
  const secondCategory = jackpot * 0.1;
  
  return [
    {
      category: 'Джекпот',
      prize: `${jackpotMln.toFixed(1)} млн ₽`,
      probability: '1:1000000',
    },
    {
      category: '2 категория',
      prize: `${secondCategory.toFixed(0)} ₽`,
      probability: '1:100000',
    },
    {
      category: '3 категория',
      prize: '10000 ₽',
      probability: '1:10000',
    },
    {
      category: '4 категория',
      prize: '1000 ₽',
      probability: '1:1000',
    },
  ];
}

function estimateWinProbability(name: string): number {
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('6x45')) {
    return 0.00001;
  }
  
  if (lowerName.includes('5x36')) {
    return 0.0001;
  }
  
  if (lowerName.includes('4x20')) {
    return 0.001;
  }
  
  if (lowerName.includes('rapido') || lowerName.includes('12x24')) {
    return 0.01;
  }
  
  return 0.0001;
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function doRequestWithRetry(url: string): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      });
      
      if (response.ok) {
        if (attempt > 1) {
          console.log(`[StolotoService] Успех на попытке ${attempt}/${MAX_RETRIES}`);
        }
        return response;
      }
      
      const body = await response.text();
      lastError = new Error(`StolotoAPI вернул код ${response.status}: ${body}`);
      
      if (attempt < MAX_RETRIES) {
        const delay = RETRY_DELAY * Math.pow(2, attempt - 1);
        console.log(`[StolotoService] Попытка ${attempt}/${MAX_RETRIES} не удалась: статус ${response.status}. Повторная попытка через ${delay}ms...`);
        await sleep(delay);
      }
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < MAX_RETRIES) {
        const delay = RETRY_DELAY * Math.pow(2, attempt - 1);
        console.log(`[StolotoService] Попытка ${attempt}/${MAX_RETRIES} не удалась: ${error}. Повторная попытка через ${delay}ms...`);
        await sleep(delay);
      }
    }
  }
  
  console.log(`[StolotoService] Все ${MAX_RETRIES} попыток исчерпаны. Последняя ошибка: ${lastError}`);
  throw new Error(`Не удалось выполнить запрос после ${MAX_RETRIES} попыток: ${lastError?.message}`);
}

function convertGameToLottery(game: StolotoGame): Lottery {
  const ticketPrice = kopecksToRoubles(game.ticketPrice);
  const currentJackpot = kopecksToRoubles(game.jackpot);
  
  const lotteryType = determineLotteryType(game.name);
  const drawFrequency = convertDrawFrequency(game.drawFrequency);
  const description = generateDescription(game.displayName, lotteryType);
  const rules = generateRules(game.displayName);
  const prizeStructure = generatePrizeStructure(currentJackpot);
  const winProbability = estimateWinProbability(game.name);
  
  return {
    id: game.name,
    name: game.displayName,
    type: lotteryType,
    ticketPrice,
    maxJackpot: currentJackpot,
    currentJackpot,
    winProbability,
    drawFrequency,
    description,
    rules,
    prizeStructure,
    isActive: true,
  };
}

const MOCK_LOTTERIES: Lottery[] = [
  {
    id: '1',
    name: '6 из 45',
    type: 'числовая',
    ticketPrice: 100,
    maxJackpot: 400000000,
    currentJackpot: 320000000,
    winProbability: 0.00001,
    drawFrequency: 'ежедневно' as const,
    isActive: true,
    description: 'Самая популярная числовая лотерея России. Угадайте 6 чисел из 45, чтобы выиграть джекпот!',
    rules: 'Выберите 6 чисел от 1 до 45. Розыгрыш проходит ежедневно в 20:00 МСК. Совпадение всех 6 чисел - главный приз!',
    prizeStructure: [
      { category: '6 из 6', prize: 'Джекпот', probability: '1:8145060' },
      { category: '5 из 6', prize: '10000 ₽', probability: '1:34808' },
      { category: '4 из 6', prize: '1000 ₽', probability: '1:733' },
      { category: '3 из 6', prize: '100 ₽', probability: '1:45' },
    ],
  },
  {
    id: '2',
    name: 'Русское лото',
    type: 'тиражная',
    ticketPrice: 100,
    maxJackpot: 600000000,
    currentJackpot: 523000000,
    winProbability: 0.0001,
    drawFrequency: 'еженедельно' as const,
    isActive: true,
    description: 'Классическая русская лотерея с огромными призами. Каждое воскресенье разыгрываются миллионы!',
    rules: 'На билете 3 поля по 15 чисел. Ведущий вытягивает бочонки с числами. Закройте все числа в одном поле первым, чтобы выиграть джекпот.',
    prizeStructure: [
      { category: 'Джекпот', prize: '523 млн ₽', probability: '1:500000' },
      { category: '1 поле', prize: '100000 ₽', probability: '1:10000' },
      { category: '2 поля', prize: '50000 ₽', probability: '1:5000' },
      { category: 'Тираж', prize: '1000 ₽', probability: '1:100' },
    ],
  },
  {
    id: '3',
    name: 'Жилищная лотерея',
    type: 'тиражная',
    ticketPrice: 100,
    maxJackpot: 50000000,
    currentJackpot: 32000000,
    winProbability: 0.001,
    drawFrequency: 'еженедельно' as const,
    isActive: true,
    description: 'Выиграйте квартиру или загородный дом! Главные призы - недвижимость и автомобили.',
    rules: 'Каждое воскресенье разыгрываются квартиры, дома и автомобили. На билете 3 поля по 20 чисел.',
    prizeStructure: [
      { category: 'Квартира', prize: 'Квартира в Москве', probability: '1:200000' },
      { category: 'Автомобиль', prize: 'BMW X5', probability: '1:100000' },
      { category: '1 поле', prize: '500000 ₽', probability: '1:5000' },
      { category: 'Тираж', prize: '5000 ₽', probability: '1:50' },
    ],
  },
  {
    id: '4',
    name: '7 из 49',
    type: 'числовая',
    ticketPrice: 150,
    maxJackpot: 500000000,
    currentJackpot: 412000000,
    winProbability: 0.000007,
    drawFrequency: 'еженедельно' as const,
    isActive: true,
    description: 'Одна из крупнейших лотерей с джекпотом более 400 миллионов рублей!',
    rules: 'Выберите 7 чисел от 1 до 49. Розыгрыш каждую среду и субботу в 21:00 МСК.',
    prizeStructure: [
      { category: '7 из 7', prize: 'Джекпот', probability: '1:85900584' },
      { category: '6 из 7', prize: '50000 ₽', probability: '1:1235790' },
      { category: '5 из 7', prize: '5000 ₽', probability: '1:24696' },
      { category: '4 из 7', prize: '500 ₽', probability: '1:1032' },
    ],
  },
  {
    id: '5',
    name: 'Рапидо',
    type: 'моментальная',
    ticketPrice: 50,
    maxJackpot: 5000000,
    currentJackpot: 3200000,
    winProbability: 0.1,
    drawFrequency: 'ежедневно' as const,
    isActive: true,
    description: 'Моментальная лотерея с розыгрышами каждые 5 минут! Быстрые выигрыши и высокая вероятность.',
    rules: 'Выберите 8 чисел от 1 до 20. Компьютер вытягивает 8 чисел. Чем больше совпадений, тем больше приз!',
    prizeStructure: [
      { category: '8 из 8', prize: 'До 5 млн ₽', probability: '1:125970' },
      { category: '7 из 8', prize: '5000 ₽', probability: '1:2571' },
      { category: '6 из 8', prize: '500 ₽', probability: '1:175' },
      { category: '5 из 8', prize: '50 ₽', probability: '1:27' },
      { category: '4 из 8', prize: '10 ₽', probability: '1:7' },
    ],
  },
  {
    id: '6',
    name: '12/24',
    type: 'числовая',
    ticketPrice: 60,
    maxJackpot: 30000000,
    currentJackpot: 18500000,
    winProbability: 0.05,
    drawFrequency: 'ежедневно' as const,
    isActive: true,
    description: 'Угадайте 12 из 24 чисел и выиграйте до 30 миллионов! Розыгрыши дважды в день.',
    rules: 'Выберите 12 чисел от 1 до 24. Розыгрыши в 13:00 и 21:00 МСК ежедневно.',
    prizeStructure: [
      { category: '12 из 12', prize: 'До 30 млн ₽', probability: '1:2704156' },
      { category: '11 из 12', prize: '50000 ₽', probability: '1:18144' },
      { category: '10 из 12', prize: '2000 ₽', probability: '1:1512' },
      { category: '9 из 12', prize: '200 ₽', probability: '1:173' },
      { category: '8 из 12', prize: '60 ₽', probability: '1:30' },
    ],
  },
  {
    id: '7',
    name: 'ТОП-3',
    type: 'числовая',
    ticketPrice: 40,
    maxJackpot: 10000000,
    currentJackpot: 6300000,
    winProbability: 0.3,
    drawFrequency: 'ежедневно' as const,
    isActive: true,
    description: 'Простая и быстрая лотерея! Угадайте 3 числа в правильном порядке.',
    rules: 'Выберите 3 числа от 0 до 9. Розыгрыши каждый час с 9:00 до 23:00 МСК.',
    prizeStructure: [
      { category: '3 в порядке', prize: 'До 10 млн ₽', probability: '1:1000' },
      { category: '3 любые', prize: '1000 ₽', probability: '1:167' },
      { category: '2 в порядке', prize: '100 ₽', probability: '1:100' },
      { category: '1 число', prize: '40 ₽', probability: '1:10' },
    ],
  },
  {
    id: '8',
    name: '4 из 20',
    type: 'числовая',
    ticketPrice: 80,
    maxJackpot: 80000000,
    currentJackpot: 52000000,
    winProbability: 0.01,
    drawFrequency: 'ежедневно' as const,
    isActive: true,
    description: 'Компактная числовая лотерея с отличными шансами на выигрыш!',
    rules: 'Выберите 4 числа от 1 до 20. Розыгрыш ежедневно в 19:00 МСК.',
    prizeStructure: [
      { category: '4 из 4', prize: 'До 80 млн ₽', probability: '1:4845' },
      { category: '3 из 4', prize: '5000 ₽', probability: '1:145' },
      { category: '2 из 4', prize: '500 ₽', probability: '1:19' },
    ],
  },
  {
    id: '9',
    name: 'Кено-Спортлото',
    type: 'спортлото',
    ticketPrice: 120,
    maxJackpot: 200000000,
    currentJackpot: 156000000,
    winProbability: 0.002,
    drawFrequency: 'ежедневно' as const,
    isActive: true,
    description: 'Классическая лотерея Кено с большими джекпотами и гибкими правилами игры.',
    rules: 'Выберите от 1 до 10 чисел от 1 до 80. Компьютер вытягивает 20 чисел. Чем больше совпадений, тем больше приз!',
    prizeStructure: [
      { category: '10 из 10', prize: 'До 200 млн ₽', probability: '1:8911711' },
      { category: '9 из 10', prize: '100000 ₽', probability: '1:163381' },
      { category: '8 из 10', prize: '10000 ₽', probability: '1:7384' },
      { category: '7 из 10', prize: '1000 ₽', probability: '1:621' },
      { category: '6 из 10', prize: '120 ₽', probability: '1:88' },
    ],
  },
  {
    id: '10',
    name: 'Бинго-75',
    type: 'моментальная',
    ticketPrice: 90,
    maxJackpot: 100000000,
    currentJackpot: 73000000,
    winProbability: 0.05,
    drawFrequency: 'ежедневно' as const,
    isActive: true,
    description: 'Динамичная игра в стиле бинго с частыми розыгрышами и большими призами!',
    rules: 'На билете 15 чисел от 1 до 75. Компьютер вытягивает числа до тех пор, пока кто-то не соберет все 15.',
    prizeStructure: [
      { category: '15 из 15 (до 30 шаров)', prize: 'Джекпот', probability: '1:2000000' },
      { category: '15 из 15 (31-40 шаров)', prize: '1000000 ₽', probability: '1:50000' },
      { category: '14 из 15', prize: '10000 ₽', probability: '1:1000' },
      { category: '13 из 15', prize: '500 ₽', probability: '1:100' },
    ],
  },
];

export class StolotoService {
  private baseURL: string;
  private lotteries: Lottery[] = [];

  constructor() {
    this.baseURL = process.env.STOLOTO_API_URL || 'http://localhost:8080';
  }

  private async fetchFromStolotoAPI(): Promise<Lottery[]> {
    try {
      const url = `${this.baseURL}/api/draws/`;
      console.log(`[StolotoService] Fetching all draws from ${url}`);
      
      const response = await doRequestWithRetry(url);
      const rawData = await response.json();
      
      const parseResult = stolotoDrawsResponseSchema.safeParse(rawData);
      if (!parseResult.success) {
        console.log('[StolotoService] Ошибка валидации ответа StolotoAPI:', parseResult.error);
        console.log('[StolotoService] Используем fallback данные');
        return MOCK_LOTTERIES;
      }
      
      const data = parseResult.data;
      
      if (!data.games || data.games.length === 0) {
        console.log('[StolotoService] StolotoAPI вернул пустой список игр, используем fallback данные');
        return MOCK_LOTTERIES;
      }
      
      const lotteries = data.games.map(game => convertGameToLottery(game));
      console.log(`[StolotoService] Успешно загружено ${lotteries.length} лотерей из StolotoAPI`);
      
      return lotteries;
    } catch (error) {
      console.log(`[StolotoService] Ошибка при запросе к StolotoAPI: ${error}, используем fallback данные`);
      return MOCK_LOTTERIES;
    }
  }

  async getAllLotteries(): Promise<Lottery[]> {
    if (this.lotteries.length > 0) {
      return this.lotteries;
    }
    
    this.lotteries = await this.fetchFromStolotoAPI();
    return this.lotteries;
  }

  async getLotteryById(id: string): Promise<Lottery | null> {
    const lotteries = await this.getAllLotteries();
    const lottery = lotteries.find(l => l.id === id);
    return lottery || null;
  }

  async filterLotteries(criteria: {
    ticketPrice?: { min: number; max: number };
    lotteryType?: string;
    maxJackpot?: { min: number; max: number };
    winProbability?: { min: number; max: number };
  }): Promise<Lottery[]> {
    let filtered = await this.getAllLotteries();

    if (criteria.ticketPrice) {
      filtered = filtered.filter(
        l => l.ticketPrice >= criteria.ticketPrice!.min && 
             l.ticketPrice <= criteria.ticketPrice!.max
      );
    }

    if (criteria.lotteryType) {
      filtered = filtered.filter(l => l.type === criteria.lotteryType);
    }

    if (criteria.maxJackpot) {
      filtered = filtered.filter(
        l => l.currentJackpot >= criteria.maxJackpot!.min && 
             l.currentJackpot <= criteria.maxJackpot!.max
      );
    }

    if (criteria.winProbability) {
      filtered = filtered.filter(
        l => l.winProbability >= criteria.winProbability!.min && 
             l.winProbability <= criteria.winProbability!.max
      );
    }

    return filtered;
  }
}

export const stolotoService = new StolotoService();
