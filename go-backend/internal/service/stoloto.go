package service

import (
        "context"
        "fmt"
        "log"

        "github.com/stoloto-recommendations/backend/internal/domain"
        "github.com/stoloto-recommendations/backend/internal/repository"
)

// StolotoService предоставляет бизнес-логику для работы с лотереями Stoloto
type StolotoService struct {
        client *repository.StolotoClient
}

// NewStolotoService создает новый экземпляр StolotoService
func NewStolotoService(client *repository.StolotoClient) *StolotoService {
        return &StolotoService{
                client: client,
        }
}

// GetAllLotteries возвращает список всех доступных лотерей
// Получает данные из StolotoAPI и конвертирует в domain.Lottery
// В случае ошибки API ВСЕГДА возвращает моковые данные (НИКОГДА не пустой массив)
func (s *StolotoService) GetAllLotteries(ctx context.Context) ([]domain.Lottery, error) {
        // Пытаемся получить данные из StolotoAPI
        drawsResp, err := s.client.GetAllDraws(ctx)
        if err != nil {
                log.Printf("StolotoAPI unavailable, using fallback data: %v", err)
                return s.getMockLotteries(), nil
        }

        // Конвертируем данные из API в наши domain модели
        lotteries := make([]domain.Lottery, 0, len(drawsResp.Games))
        for _, game := range drawsResp.Games {
                lottery := s.client.ConvertGameToLottery(game)
                lotteries = append(lotteries, lottery)
        }

        // Если API вернул пустой список, используем моковые данные
        // КРИТИЧЕСКОЕ ПРАВИЛО: GetAllLotteries НИКОГДА не возвращает пустой массив
        if len(lotteries) == 0 {
                log.Println("StolotoAPI unavailable, using fallback data: API returned empty list")
                return s.getMockLotteries(), nil
        }

        log.Printf("Successfully loaded %d lotteries from StolotoAPI", len(lotteries))
        return lotteries, nil
}

// GetLotteryByID возвращает информацию о конкретной лотерее по ID
// ВАЖНО: Использует GetAllLotteries which NEVER fails (always returns data)
func (s *StolotoService) GetLotteryByID(ctx context.Context, id string) (*domain.Lottery, error) {
        // Получаем все лотереи (ВСЕГДА возвращает данные, никогда не падает)
        lotteries, err := s.GetAllLotteries(ctx)
        // Defensive: GetAllLotteries не должна возвращать ошибку, но на случай катастрофы
        if err != nil {
                log.Printf("CRITICAL: GetAllLotteries returned unexpected error: %v - using fallback", err)
                lotteries = s.getMockLotteries()
        }

        // Ищем лотерею с нужным ID
        for i := range lotteries {
                if lotteries[i].ID == id {
                        return &lotteries[i], nil
                }
        }

        return nil, fmt.Errorf("лотерея с ID %s не найдена", id)
}

// GetActiveLotteries возвращает список активных лотерей
// ВАЖНО: НИКОГДА не возвращает ошибку - использует fallback при проблемах с API
func (s *StolotoService) GetActiveLotteries(ctx context.Context) ([]domain.Lottery, error) {
        // Получаем все лотереи (ВСЕГДА возвращает данные, никогда не падает)
        allLotteries, err := s.GetAllLotteries(ctx)
        // Defensive: GetAllLotteries не должна возвращать ошибку, но на случай катастрофы
        if err != nil {
                log.Printf("CRITICAL: GetAllLotteries returned unexpected error: %v - using fallback", err)
                allLotteries = s.getMockLotteries()
        }

        // Фильтруем только активные
        activeLotteries := make([]domain.Lottery, 0, len(allLotteries))
        for _, lottery := range allLotteries {
                if lottery.IsActive {
                        activeLotteries = append(activeLotteries, lottery)
                }
        }

        return activeLotteries, nil
}

// UpdateLotteryData обновляет данные о лотереях из StolotoAPI
func (s *StolotoService) UpdateLotteryData(ctx context.Context) error {
        _, err := s.client.GetAllDraws(ctx)
        if err != nil {
                return fmt.Errorf("ошибка обновления данных: %w", err)
        }
        return nil
}

// FilterLotteries фильтрует лотереи по заданным критериям
// ВАЖНО: НИКОГДА не возвращает ошибку - использует fallback при проблемах с API
func (s *StolotoService) FilterLotteries(ctx context.Context, criteria domain.FilterCriteria) ([]domain.Lottery, error) {
        // Получаем все лотереи (ВСЕГДА возвращает данные, никогда не падает)
        allLotteries, err := s.GetAllLotteries(ctx)
        // Defensive: GetAllLotteries не должна возвращать ошибку, но на случай катастрофы
        if err != nil {
                log.Printf("CRITICAL: GetAllLotteries returned unexpected error: %v - using fallback", err)
                allLotteries = s.getMockLotteries()
        }

        filtered := make([]domain.Lottery, 0)
        for _, lottery := range allLotteries {
                if matchesCriteria(lottery, criteria) {
                        filtered = append(filtered, lottery)
                }
        }

        return filtered, nil
}

// matchesCriteria проверяет соответствует ли лотерея критериям фильтрации
func matchesCriteria(lottery domain.Lottery, criteria domain.FilterCriteria) bool {
        // Фильтр по цене билета
        if criteria.TicketPrice != nil {
                if lottery.TicketPrice < criteria.TicketPrice.Min || lottery.TicketPrice > criteria.TicketPrice.Max {
                        return false
                }
        }

        // Фильтр по типу лотереи
        if criteria.LotteryType != nil && *criteria.LotteryType != "" {
                if string(lottery.Type) != *criteria.LotteryType {
                        return false
                }
        }

        // Фильтр по джекпоту
        if criteria.MaxJackpot != nil {
                if lottery.CurrentJackpot < criteria.MaxJackpot.Min || lottery.CurrentJackpot > criteria.MaxJackpot.Max {
                        return false
                }
        }

        // Фильтр по вероятности выигрыша
        if criteria.WinProbability != nil {
                if lottery.WinProbability < criteria.WinProbability.Min || lottery.WinProbability > criteria.WinProbability.Max {
                        return false
                }
        }

        return true
}

// getMockLotteries возвращает моковые данные о лотереях
// Используется как fallback, когда StolotoAPI недоступен
// Обновлено: используем float64 для цен и джекпотов (синхронизация с schema.ts)
func (s *StolotoService) getMockLotteries() []domain.Lottery {
        return []domain.Lottery{
                {
                        ID:             "6x45",
                        Name:           "Гослото 6 из 45",
                        Type:           domain.LotteryTypeNumbered,
                        TicketPrice:    100.0,
                        MaxJackpot:     400000000.0,
                        CurrentJackpot: 320000000.0,
                        WinProbability: 0.00001,
                        DrawFrequency:  domain.DrawFrequencyDaily,
                        Description:    "Самая популярная числовая лотерея России. Угадайте 6 чисел из 45, чтобы выиграть джекпот!",
                        Rules:          "Выберите 6 чисел от 1 до 45. Розыгрыш проходит ежедневно в 20:00 МСК. Совпадение всех 6 чисел - главный приз!",
                        PrizeStructure: []domain.PrizeCategory{
                                {Category: "6 из 6", Prize: "Джекпот", Probability: "1:8145060"},
                                {Category: "5 из 6", Prize: "10000 ₽", Probability: "1:34808"},
                                {Category: "4 из 6", Prize: "1000 ₽", Probability: "1:733"},
                                {Category: "3 из 6", Prize: "100 ₽", Probability: "1:45"},
                        },
                        ImageURL: nil,
                        IsActive: true,
                },
                {
                        ID:             "5x36",
                        Name:           "Гослото 5 из 36",
                        Type:           domain.LotteryTypeNumbered,
                        TicketPrice:    50.0,
                        MaxJackpot:     200000000.0,
                        CurrentJackpot: 156000000.0,
                        WinProbability: 0.0001,
                        DrawFrequency:  domain.DrawFrequencyDaily,
                        Description:    "Быстрая числовая лотерея с хорошими шансами на выигрыш!",
                        Rules:          "Выберите 5 чисел от 1 до 36. Розыгрыш проходит ежедневно в 14:00 МСК.",
                        PrizeStructure: []domain.PrizeCategory{
                                {Category: "5 из 5", Prize: "Джекпот", Probability: "1:376992"},
                                {Category: "4 из 5", Prize: "5000 ₽", Probability: "1:2432"},
                                {Category: "3 из 5", Prize: "500 ₽", Probability: "1:81"},
                                {Category: "2 из 5", Prize: "50 ₽", Probability: "1:8"},
                        },
                        ImageURL: nil,
                        IsActive: true,
                },
                {
                        ID:             "4x20",
                        Name:           "Гослото 4 из 20",
                        Type:           domain.LotteryTypeNumbered,
                        TicketPrice:    60.0,
                        MaxJackpot:     50000000.0,
                        CurrentJackpot: 32000000.0,
                        WinProbability: 0.001,
                        DrawFrequency:  domain.DrawFrequencySeveralPerWeek,
                        Description:    "Лотерея с высокой вероятностью выигрыша и частыми розыгрышами!",
                        Rules:          "Выберите 4 числа от 1 до 20. Розыгрыши несколько раз в неделю.",
                        PrizeStructure: []domain.PrizeCategory{
                                {Category: "4 из 4", Prize: "Джекпот", Probability: "1:4845"},
                                {Category: "3 из 4", Prize: "1000 ₽", Probability: "1:75"},
                                {Category: "2 из 4", Prize: "100 ₽", Probability: "1:6"},
                        },
                        ImageURL: nil,
                        IsActive: true,
                },
                {
                        ID:             "7x49",
                        Name:           "Гослото 7 из 49",
                        Type:           domain.LotteryTypeNumbered,
                        TicketPrice:    150.0,
                        MaxJackpot:     500000000.0,
                        CurrentJackpot: 412000000.0,
                        WinProbability: 0.000007,
                        DrawFrequency:  domain.DrawFrequencyWeekly,
                        Description:    "Одна из крупнейших лотерей с джекпотом более 400 миллионов рублей!",
                        Rules:          "Выберите 7 чисел от 1 до 49. Розыгрыш каждую среду и субботу в 21:00 МСК.",
                        PrizeStructure: []domain.PrizeCategory{
                                {Category: "7 из 7", Prize: "Джекпот", Probability: "1:85900584"},
                                {Category: "6 из 7", Prize: "50000 ₽", Probability: "1:1235008"},
                                {Category: "5 из 7", Prize: "5000 ₽", Probability: "1:24129"},
                                {Category: "4 из 7", Prize: "500 ₽", Probability: "1:710"},
                        },
                        ImageURL: nil,
                        IsActive: true,
                },
                {
                        ID:             "rapido",
                        Name:           "Рапидо",
                        Type:           domain.LotteryTypeInstant,
                        TicketPrice:    100.0,
                        MaxJackpot:     10000000.0,
                        CurrentJackpot: 7500000.0,
                        WinProbability: 0.01,
                        DrawFrequency:  domain.DrawFrequencyDaily,
                        Description:    "Моментальная лотерея с быстрыми результатами! Розыгрыши каждые 15 минут!",
                        Rules:          "Выберите числа и ждите результатов. Розыгрыш каждые 15 минут с 09:00 до 23:00 МСК.",
                        PrizeStructure: []domain.PrizeCategory{
                                {Category: "Суперприз", Prize: "7.5 млн ₽", Probability: "1:100000"},
                                {Category: "Главный приз", Prize: "100000 ₽", Probability: "1:10000"},
                                {Category: "Приз 3", Prize: "10000 ₽", Probability: "1:1000"},
                                {Category: "Приз 4", Prize: "1000 ₽", Probability: "1:100"},
                        },
                        ImageURL: nil,
                        IsActive: true,
                },
        }
}
