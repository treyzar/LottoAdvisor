import { z } from "zod";

// Типы лотерей
export const lotteryTypes = [
  "числовая",
  "моментальная",
  "тиражная",
  "спортлото",
] as const;

export type LotteryType = typeof lotteryTypes[number];

// Частота игры
export const playFrequencies = [
  "ежедневно",
  "несколько раз в неделю",
  "еженедельно",
  "раз в месяц",
] as const;

export type PlayFrequency = typeof playFrequencies[number];

// Схема лотереи
export const lotterySchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(lotteryTypes),
  ticketPrice: z.number(),
  maxJackpot: z.number(),
  currentJackpot: z.number(),
  winProbability: z.number(), // вероятность выигрыша в процентах
  drawFrequency: z.enum(playFrequencies),
  description: z.string(),
  rules: z.string(),
  prizeStructure: z.array(z.object({
    category: z.string(),
    prize: z.string(),
    probability: z.string(),
  })),
  imageUrl: z.string().optional(),
  isActive: z.boolean().default(true),
});

export type Lottery = z.infer<typeof lotterySchema>;

// Схема параметров пользователя
export const userPreferencesSchema = z.object({
  ticketPrice: z.object({
    min: z.number(),
    max: z.number(),
  }),
  playFrequency: z.enum(playFrequencies),
  lotteryType: z.enum(lotteryTypes).optional(),
  maxJackpot: z.object({
    min: z.number(),
    max: z.number(),
  }),
  winProbability: z.object({
    min: z.number(), // минимальная вероятность в процентах
    max: z.number(), // максимальная вероятность в процентах
  }),
});

export type UserPreferences = z.infer<typeof userPreferencesSchema>;

// Insert schema для валидации при создании предпочтений
export const insertUserPreferencesSchema = userPreferencesSchema;

// Схема рекомендации с персонализированным описанием
export const recommendationSchema = z.object({
  lottery: lotterySchema,
  matchScore: z.number(), // оценка соответствия 0-100
  personalizedReason: z.string(), // персонализированное описание причин выбора
  matchedCriteria: z.array(z.string()), // список совпавших критериев
  isNew: z.boolean().optional(), // для пометки новых рекомендаций
});

export type Recommendation = z.infer<typeof recommendationSchema>;

// Схема сохраненного набора параметров
export const savedParametersSchema = z.object({
  id: z.string(),
  name: z.string(), // название набора
  preferences: userPreferencesSchema,
  savedAt: z.string(), // ISO date string
  lotteryIds: z.array(z.string()), // ID рекомендованных лотерей при сохранении
});

export type SavedParameters = z.infer<typeof savedParametersSchema>;

// Схема запроса рекомендаций
export const recommendationRequestSchema = z.object({
  preferences: userPreferencesSchema,
  previousLotteryIds: z.array(z.string()).optional(), // для сравнения с предыдущими рекомендациями
});

export type RecommendationRequest = z.infer<typeof recommendationRequestSchema>;

// Схема ответа с рекомендациями
export const recommendationResponseSchema = z.object({
  recommendations: z.array(recommendationSchema),
  totalMatches: z.number(),
  averageMatchScore: z.number(),
});

export type RecommendationResponse = z.infer<typeof recommendationResponseSchema>;

// Схема шага обучения
export const tutorialStepSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  targetElement: z.string(), // CSS selector элемента для подсветки
  position: z.enum(["top", "bottom", "left", "right"]),
});

export type TutorialStep = z.infer<typeof tutorialStepSchema>;

// Схема сообщения чат-бота
export const chatMessageSchema = z.object({
  id: z.string(),
  type: z.enum(["system", "user"]),
  content: z.string(),
  timestamp: z.string(),
  options: z.array(z.object({
    label: z.string(),
    value: z.any(),
  })).optional(),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;
