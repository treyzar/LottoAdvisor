package service

import (
        "context"
        "testing"

        "github.com/stoloto-recommendations/backend/internal/domain"
)

// TestGenerateRecommendations проверяет основной алгоритм генерации рекомендаций
func TestGenerateRecommendations(t *testing.T) {
        service := NewRecommendationService()
        ctx := context.Background()

        // Тестовые данные - лотереи
        lotteries := []domain.Lottery{
                {
                        ID:             "test1",
                        Name:           "Тестовая лотерея 1",
                        Type:           domain.LotteryTypeNumbered,
                        TicketPrice:    100.0,
                        MaxJackpot:     1000000.0,
                        CurrentJackpot: 800000.0,
                        WinProbability: 0.01,
                        DrawFrequency:  domain.DrawFrequencyDaily,
                        Description:    "Тестовая лотерея",
                        Rules:          "Правила",
                        PrizeStructure: []domain.PrizeCategory{},
                        IsActive:       true,
                },
                {
                        ID:             "test2",
                        Name:           "Тестовая лотерея 2",
                        Type:           domain.LotteryTypeInstant,
                        TicketPrice:    200.0,
                        MaxJackpot:     2000000.0,
                        CurrentJackpot: 1500000.0,
                        WinProbability: 0.02,
                        DrawFrequency:  domain.DrawFrequencyWeekly,
                        Description:    "Тестовая лотерея 2",
                        Rules:          "Правила 2",
                        PrizeStructure: []domain.PrizeCategory{},
                        IsActive:       true,
                },
        }

        // Тестовый запрос
        request := domain.RecommendationRequest{
                Preferences: domain.UserPreferences{
                        TicketPrice: domain.PriceRange{
                                Min: 50.0,
                                Max: 150.0,
                        },
                        PlayFrequency: domain.DrawFrequencyDaily,
                        MaxJackpot: domain.JackpotRange{
                                Min: 500000.0,
                                Max: 1500000.0,
                        },
                        WinProbability: domain.ProbabilityRange{
                                Min: 0.005,
                                Max: 0.015,
                        },
                },
        }

        response, err := service.GenerateRecommendations(ctx, request, lotteries)
        if err != nil {
                t.Fatalf("GenerateRecommendations returned error: %v", err)
        }

        // Проверка основных требований
        if response.TotalMatches < 0 {
                t.Error("TotalMatches должен быть >= 0")
        }

        if response.AverageMatchScore < 0 || response.AverageMatchScore > 100 {
                t.Errorf("AverageMatchScore должен быть в диапазоне 0-100, получен: %f", response.AverageMatchScore)
        }

        // Проверка что все рекомендации имеют score в диапазоне 0-100
        for i, rec := range response.Recommendations {
                if rec.MatchScore < 0 || rec.MatchScore > 100 {
                        t.Errorf("Рекомендация %d имеет некорректный score %d (должен быть 0-100)", i, rec.MatchScore)
                }
        }
}

// TestCalculateScore проверяет расчет score с различными весами
func TestCalculateScore(t *testing.T) {
        service := NewRecommendationService()

        lottery := domain.Lottery{
                ID:             "test",
                Name:           "Тест",
                Type:           domain.LotteryTypeNumbered,
                TicketPrice:    100.0,
                MaxJackpot:     1000000.0,
                CurrentJackpot: 800000.0,
                WinProbability: 0.01,
                DrawFrequency:  domain.DrawFrequencyDaily,
                Description:    "Тест",
                Rules:          "Тест",
                PrizeStructure: []domain.PrizeCategory{},
                IsActive:       true,
        }

        preferences := domain.UserPreferences{
                TicketPrice: domain.PriceRange{
                        Min: 80.0,
                        Max: 120.0,
                },
                PlayFrequency: domain.DrawFrequencyDaily,
                MaxJackpot: domain.JackpotRange{
                        Min: 700000.0,
                        Max: 900000.0,
                },
                WinProbability: domain.ProbabilityRange{
                        Min: 0.008,
                        Max: 0.012,
                },
        }

        score := service.calculateMatchScore(lottery, preferences)

        // Score должен быть в диапазоне 0-100
        if score < 0 || score > 100 {
                t.Errorf("Score должен быть в диапазоне 0-100, получен: %d", score)
        }

        // Для идеально подходящей лотереи score должен быть высоким (>80)
        if score < 80 {
                t.Errorf("Для идеально подходящей лотереи score должен быть >80, получен: %d", score)
        }
}

// TestScoreClamping проверяет что score всегда ограничен диапазоном 0-100
func TestScoreClamping(t *testing.T) {
        service := NewRecommendationService()

        testCases := []struct {
                name        string
                lottery     domain.Lottery
                preferences domain.UserPreferences
        }{
                {
                        name: "Экстремально высокие значения",
                        lottery: domain.Lottery{
                                ID:             "extreme",
                                Name:           "Экстремальная",
                                Type:           domain.LotteryTypeNumbered,
                                TicketPrice:    10000.0,
                                MaxJackpot:     100000000.0,
                                CurrentJackpot: 100000000.0,
                                WinProbability: 1.0,
                                DrawFrequency:  domain.DrawFrequencyDaily,
                                Description:    "Тест",
                                Rules:          "Тест",
                                PrizeStructure: []domain.PrizeCategory{},
                                IsActive:       true,
                        },
                        preferences: domain.UserPreferences{
                                TicketPrice: domain.PriceRange{
                                        Min: 10.0,
                                        Max: 100.0,
                                },
                                PlayFrequency: domain.DrawFrequencyDaily,
                                MaxJackpot: domain.JackpotRange{
                                        Min: 100000.0,
                                        Max: 1000000.0,
                                },
                                WinProbability: domain.ProbabilityRange{
                                        Min: 0.001,
                                        Max: 0.01,
                                },
                        },
                },
                {
                        name: "Экстремально низкие значения",
                        lottery: domain.Lottery{
                                ID:             "minimal",
                                Name:           "Минимальная",
                                Type:           domain.LotteryTypeNumbered,
                                TicketPrice:    1.0,
                                MaxJackpot:     1000.0,
                                CurrentJackpot: 500.0,
                                WinProbability: 0.0001,
                                DrawFrequency:  domain.DrawFrequencyMonthly,
                                Description:    "Тест",
                                Rules:          "Тест",
                                PrizeStructure: []domain.PrizeCategory{},
                                IsActive:       true,
                        },
                        preferences: domain.UserPreferences{
                                TicketPrice: domain.PriceRange{
                                        Min: 100.0,
                                        Max: 1000.0,
                                },
                                PlayFrequency: domain.DrawFrequencyDaily,
                                MaxJackpot: domain.JackpotRange{
                                        Min: 10000000.0,
                                        Max: 100000000.0,
                                },
                                WinProbability: domain.ProbabilityRange{
                                        Min: 0.1,
                                        Max: 1.0,
                                },
                        },
                },
        }

        for _, tc := range testCases {
                t.Run(tc.name, func(t *testing.T) {
                        score := service.calculateMatchScore(tc.lottery, tc.preferences)

                        if score < 0 {
                                t.Errorf("Score не должен быть отрицательным, получен: %d", score)
                        }

                        if score > 100 {
                                t.Errorf("Score не должен превышать 100, получен: %d", score)
                        }
                })
        }
}

// TestDivisionByZeroProtection проверяет защиту от деления на ноль
func TestDivisionByZeroProtection(t *testing.T) {
        service := NewRecommendationService()

        testCases := []struct {
                name        string
                lottery     domain.Lottery
                preferences domain.UserPreferences
        }{
                {
                        name: "Нулевой диапазон цен",
                        lottery: domain.Lottery{
                                ID:             "test",
                                Name:           "Тест",
                                Type:           domain.LotteryTypeNumbered,
                                TicketPrice:    100.0,
                                MaxJackpot:     1000000.0,
                                CurrentJackpot: 800000.0,
                                WinProbability: 0.01,
                                DrawFrequency:  domain.DrawFrequencyDaily,
                                Description:    "Тест",
                                Rules:          "Тест",
                                PrizeStructure: []domain.PrizeCategory{},
                                IsActive:       true,
                        },
                        preferences: domain.UserPreferences{
                                TicketPrice: domain.PriceRange{
                                        Min: 100.0,
                                        Max: 100.0, // Нулевой диапазон
                                },
                                PlayFrequency: domain.DrawFrequencyDaily,
                                MaxJackpot: domain.JackpotRange{
                                        Min: 800000.0,
                                        Max: 800000.0, // Нулевой диапазон
                                },
                                WinProbability: domain.ProbabilityRange{
                                        Min: 0.01,
                                        Max: 0.01, // Нулевой диапазон
                                },
                        },
                },
        }

        for _, tc := range testCases {
                t.Run(tc.name, func(t *testing.T) {
                        // Функция не должна паниковать при делении на ноль
                        defer func() {
                                if r := recover(); r != nil {
                                        t.Errorf("Функция запаниковала при делении на ноль: %v", r)
                                }
                        }()

                        score := service.calculateMatchScore(tc.lottery, tc.preferences)

                        // Score должен быть валидным даже при нулевых диапазонах
                        if score < 0 || score > 100 {
                                t.Errorf("Score должен быть в диапазоне 0-100 даже при нулевых диапазонах, получен: %d", score)
                        }
                })
        }
}

// TestMatchThreshold проверяет фильтрацию по порогу 50%
func TestMatchThreshold(t *testing.T) {
        service := NewRecommendationService()
        ctx := context.Background()

        // Создаем лотереи с разной степенью соответствия
        lotteries := []domain.Lottery{
                {
                        ID:             "perfect",
                        Name:           "Идеальная",
                        Type:           domain.LotteryTypeNumbered,
                        TicketPrice:    100.0,
                        MaxJackpot:     1000000.0,
                        CurrentJackpot: 900000.0,
                        WinProbability: 0.01,
                        DrawFrequency:  domain.DrawFrequencyDaily,
                        Description:    "Идеальная",
                        Rules:          "Правила",
                        PrizeStructure: []domain.PrizeCategory{},
                        IsActive:       true,
                },
                {
                        ID:             "poor",
                        Name:           "Плохая",
                        Type:           domain.LotteryTypeNumbered,
                        TicketPrice:    10000.0, // Очень дорогая
                        MaxJackpot:     100000000.0,
                        CurrentJackpot: 100000000.0,
                        WinProbability: 0.0000001, // Очень низкая вероятность
                        DrawFrequency:  domain.DrawFrequencyMonthly,
                        Description:    "Плохая",
                        Rules:          "Правила",
                        PrizeStructure: []domain.PrizeCategory{},
                        IsActive:       true,
                },
        }

        request := domain.RecommendationRequest{
                Preferences: domain.UserPreferences{
                        TicketPrice: domain.PriceRange{
                                Min: 80.0,
                                Max: 120.0,
                        },
                        PlayFrequency: domain.DrawFrequencyDaily,
                        MaxJackpot: domain.JackpotRange{
                                Min: 800000.0,
                                Max: 1200000.0,
                        },
                        WinProbability: domain.ProbabilityRange{
                                Min: 0.008,
                                Max: 0.012,
                        },
                },
        }

        response, err := service.GenerateRecommendations(ctx, request, lotteries)
        if err != nil {
                t.Fatalf("GenerateRecommendations returned error: %v", err)
        }

        // Проверяем что все рекомендации имеют score >= 50
        for _, rec := range response.Recommendations {
                if rec.MatchScore < 50 {
                        t.Errorf("Рекомендация '%s' имеет score %d < 50 (не должна проходить фильтр)", rec.Lottery.Name, rec.MatchScore)
                }
        }

        // Идеальная лотерея должна быть в рекомендациях
        foundPerfect := false
        for _, rec := range response.Recommendations {
                if rec.Lottery.ID == "perfect" {
                        foundPerfect = true
                        break
                }
        }
        if !foundPerfect {
                t.Error("Идеально подходящая лотерея не попала в рекомендации")
        }
}

// TestPersonalizedReasons проверяет генерацию персонализированных причин
func TestPersonalizedReasons(t *testing.T) {
        service := NewRecommendationService()
        ctx := context.Background()

        lottery := domain.Lottery{
                ID:             "test",
                Name:           "Тестовая",
                Type:           domain.LotteryTypeNumbered,
                TicketPrice:    100.0,
                MaxJackpot:     1000000.0,
                CurrentJackpot: 900000.0,
                WinProbability: 0.01,
                DrawFrequency:  domain.DrawFrequencyDaily,
                Description:    "Тестовая",
                Rules:          "Правила",
                PrizeStructure: []domain.PrizeCategory{},
                IsActive:       true,
        }

        request := domain.RecommendationRequest{
                Preferences: domain.UserPreferences{
                        TicketPrice: domain.PriceRange{
                                Min: 80.0,
                                Max: 120.0,
                        },
                        PlayFrequency: domain.DrawFrequencyDaily,
                        MaxJackpot: domain.JackpotRange{
                                Min: 800000.0,
                                Max: 1200000.0,
                        },
                        WinProbability: domain.ProbabilityRange{
                                Min: 0.008,
                                Max: 0.012,
                        },
                },
        }

        response, err := service.GenerateRecommendations(ctx, request, []domain.Lottery{lottery})
        if err != nil {
                t.Fatalf("GenerateRecommendations returned error: %v", err)
        }

        if len(response.Recommendations) == 0 {
                t.Fatal("Нет рекомендаций")
        }

        rec := response.Recommendations[0]

        // Персонализированная причина не должна быть пустой
        if rec.PersonalizedReason == "" {
                t.Error("PersonalizedReason не должна быть пустой")
        }

        // Должен содержать критерии совпадения
        if len(rec.MatchedCriteria) == 0 {
                t.Error("MatchedCriteria не должен быть пустым для лотереи с высоким score")
        }
}

// TestEmptyLotteries проверяет поведение при пустом списке лотерей
func TestEmptyLotteries(t *testing.T) {
        service := NewRecommendationService()
        ctx := context.Background()

        request := domain.RecommendationRequest{
                Preferences: domain.UserPreferences{
                        TicketPrice: domain.PriceRange{
                                Min: 50.0,
                                Max: 150.0,
                        },
                        PlayFrequency: domain.DrawFrequencyDaily,
                        MaxJackpot: domain.JackpotRange{
                                Min: 500000.0,
                                Max: 1500000.0,
                        },
                        WinProbability: domain.ProbabilityRange{
                                Min: 0.005,
                                Max: 0.015,
                        },
                },
        }

        response, err := service.GenerateRecommendations(ctx, request, []domain.Lottery{})
        if err != nil {
                t.Fatalf("GenerateRecommendations не должна возвращать ошибку при пустом списке: %v", err)
        }

        if len(response.Recommendations) != 0 {
                t.Error("Recommendations должен быть пустым при пустом списке лотерей")
        }

        if response.TotalMatches != 0 {
                t.Error("TotalMatches должен быть 0 при пустом списке лотерей")
        }

        if response.AverageMatchScore != 0 {
                t.Error("AverageMatchScore должен быть 0 при пустом списке лотерей")
        }
}

// TestNewRecommendationFlag проверяет установку флага isNew
func TestNewRecommendationFlag(t *testing.T) {
        service := NewRecommendationService()
        ctx := context.Background()

        lottery := domain.Lottery{
                ID:             "test",
                Name:           "Тестовая",
                Type:           domain.LotteryTypeNumbered,
                TicketPrice:    100.0,
                MaxJackpot:     1000000.0,
                CurrentJackpot: 900000.0,
                WinProbability: 0.01,
                DrawFrequency:  domain.DrawFrequencyDaily,
                Description:    "Тестовая",
                Rules:          "Правила",
                PrizeStructure: []domain.PrizeCategory{},
                IsActive:       true,
        }

        request := domain.RecommendationRequest{
                Preferences: domain.UserPreferences{
                        TicketPrice: domain.PriceRange{
                                Min: 80.0,
                                Max: 120.0,
                        },
                        PlayFrequency: domain.DrawFrequencyDaily,
                        MaxJackpot: domain.JackpotRange{
                                Min: 800000.0,
                                Max: 1200000.0,
                        },
                        WinProbability: domain.ProbabilityRange{
                                Min: 0.008,
                                Max: 0.012,
                        },
                },
                PreviousLotteryIDs: []string{"other"}, // ID которого нет в результатах
        }

        response, err := service.GenerateRecommendations(ctx, request, []domain.Lottery{lottery})
        if err != nil {
                t.Fatalf("GenerateRecommendations returned error: %v", err)
        }

        if len(response.Recommendations) == 0 {
                t.Fatal("Нет рекомендаций")
        }

        rec := response.Recommendations[0]

        // Флаг isNew должен быть установлен для новой лотереи
        if rec.IsNew == nil {
                t.Error("IsNew должен быть установлен")
        } else if !*rec.IsNew {
                t.Error("IsNew должен быть true для новой лотереи")
        }
}
