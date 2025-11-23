import type { Express } from 'express';
import { createServer, type Server } from 'http';
import { z } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { stolotoService } from './services/stoloto.service';
import { recommendationService } from './services/recommendation.service';
import { insertUserPreferencesSchema } from '@shared/schema';
import type { RecommendationResponse } from '@shared/schema';

/**
 * Регистрация всех API маршрутов
 */
export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  /**
   * GET /api/lotteries
   * Получить список всех доступных лотерей
   */
  app.get('/api/lotteries', async (req, res) => {
    try {
      const lotteries = await stolotoService.getAllLotteries();
      res.json(lotteries);
    } catch (error) {
      console.error('Error fetching lotteries:', error);
      res.status(500).json({
        error: 'Не удалось получить список лотерей',
      });
    }
  });

  /**
   * GET /api/lotteries/:id
   * Получить детальную информацию о лотерее
   */
  app.get('/api/lotteries/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const lottery = await stolotoService.getLotteryById(id);

      if (!lottery) {
        return res.status(404).json({
          error: 'Лотерея не найдена',
        });
      }

      res.json(lottery);
    } catch (error) {
      console.error('Error fetching lottery:', error);
      res.status(500).json({
        error: 'Не удалось получить информацию о лотерее',
      });
    }
  });

  /**
   * POST /api/recommendations
   * Получить персонализированные рекомендации
   * Body: { preferences: UserPreferences, previousLotteryIds?: string[] }
   */
  app.post('/api/recommendations', async (req, res) => {
    try {
      // Валидация тела запроса
      const bodySchema = z.object({
        preferences: insertUserPreferencesSchema,
        previousLotteryIds: z.array(z.string()).optional(),
      });

      const parseResult = bodySchema.safeParse(req.body);
      if (!parseResult.success) {
        const validationError = fromZodError(parseResult.error);
        return res.status(400).json({
          error: 'Некорректные данные',
          details: validationError.message,
        });
      }

      const { preferences, previousLotteryIds } = parseResult.data;

      // Получаем все лотереи
      const allLotteries = await stolotoService.getAllLotteries();

      // Генерируем рекомендации
      const recommendations = await recommendationService.generateRecommendations(
        allLotteries,
        preferences,
        previousLotteryIds
      );

      // Формируем ответ
      const response: RecommendationResponse = {
        recommendations,
        totalMatches: recommendations.length,
        averageMatchScore:
          recommendations.length > 0
            ? recommendations.reduce((sum, r) => sum + r.matchScore, 0) /
              recommendations.length
            : 0,
      };

      res.json(response);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      res.status(500).json({
        error: 'Не удалось сгенерировать рекомендации',
      });
    }
  });

  /**
   * POST /api/filter
   * Фильтр лотерей по критериям
   * Body: { ticketPrice?, lotteryType?, maxJackpot?, winProbability? }
   */
  app.post('/api/filter', async (req, res) => {
    try {
      const filterSchema = z.object({
        ticketPrice: z
          .object({
            min: z.number(),
            max: z.number(),
          })
          .optional(),
        lotteryType: z.string().optional(),
        maxJackpot: z
          .object({
            min: z.number(),
            max: z.number(),
          })
          .optional(),
        winProbability: z
          .object({
            min: z.number(),
            max: z.number(),
          })
          .optional(),
      });

      const parseResult = filterSchema.safeParse(req.body);
      if (!parseResult.success) {
        const validationError = fromZodError(parseResult.error);
        return res.status(400).json({
          error: 'Некорректные параметры фильтрации',
          details: validationError.message,
        });
      }

      const lotteries = await stolotoService.filterLotteries(parseResult.data);
      res.json(lotteries);
    } catch (error) {
      console.error('Error filtering lotteries:', error);
      res.status(500).json({
        error: 'Не удалось отфильтровать лотереи',
      });
    }
  });

  return httpServer;
}
