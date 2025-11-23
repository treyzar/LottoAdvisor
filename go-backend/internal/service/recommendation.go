package service

import (
        "context"
        "fmt"
        "math"
        "sort"
        "strings"

        "github.com/stoloto-recommendations/backend/internal/domain"
)

// RecommendationService предоставляет бизнес-логику для генерации рекомендаций
type RecommendationService struct {
        // В будущем здесь могут быть зависимости от других сервисов или хранилищ
}

// NewRecommendationService создает новый экземпляр RecommendationService
func NewRecommendationService() *RecommendationService {
        return &RecommendationService{}
}

// GenerateRecommendations генерирует персонализированные рекомендации лотерей
// на основе предпочтений пользователя
// Портировано из recommendation.service.ts
func (s *RecommendationService) GenerateRecommendations(
        ctx context.Context,
        request domain.RecommendationRequest,
        allLotteries []domain.Lottery,
) (*domain.RecommendationResponse, error) {
        preferences := request.Preferences
        previousLotteryIDs := request.PreviousLotteryIDs

        // Вычисляем оценки для всех лотерей
        type scoredLottery struct {
                lottery            domain.Lottery
                matchScore         int
                personalizedReason string
                matchedCriteria    []string
                isNew              bool
        }

        scored := make([]scoredLottery, 0, len(allLotteries))
        for _, lottery := range allLotteries {
                matchScore := s.calculateMatchScore(lottery, preferences)
                personalizedReason := s.generatePersonalizedReason(lottery, preferences, matchScore)
                matchedCriteria := s.getMatchedCriteria(lottery, preferences)
                
                // Определяем, новая ли это рекомендация
                isNew := true
                if len(previousLotteryIDs) > 0 {
                        isNew = !contains(previousLotteryIDs, lottery.ID)
                }

                scored = append(scored, scoredLottery{
                        lottery:            lottery,
                        matchScore:         matchScore,
                        personalizedReason: personalizedReason,
                        matchedCriteria:    matchedCriteria,
                        isNew:              isNew,
                })
        }

        // Сортируем по оценке (от большей к меньшей)
        sort.Slice(scored, func(i, j int) bool {
                return scored[i].matchScore > scored[j].matchScore
        })

        // Фильтруем рекомендации (минимум 50% совпадения)
        recommendations := make([]domain.Recommendation, 0)
        var totalScore int64 = 0
        
        for _, s := range scored {
                if s.matchScore >= 50 {
                        isNewPtr := &s.isNew
                        recommendations = append(recommendations, domain.Recommendation{
                                Lottery:            s.lottery,
                                MatchScore:         s.matchScore,
                                PersonalizedReason: s.personalizedReason,
                                MatchedCriteria:    s.matchedCriteria,
                                IsNew:              isNewPtr,
                        })
                        totalScore += int64(s.matchScore)
                }
        }

        // Вычисляем среднюю оценку
        averageScore := 0.0
        if len(recommendations) > 0 {
                averageScore = float64(totalScore) / float64(len(recommendations))
        }

        return &domain.RecommendationResponse{
                Recommendations:   recommendations,
                TotalMatches:      len(recommendations),
                AverageMatchScore: averageScore,
        }, nil
}

// calculateMatchScore вычисляет оценку совпадения лотереи с предпочтениями (0-100)
// Портировано из recommendation.service.ts
func (s *RecommendationService) calculateMatchScore(
        lottery domain.Lottery,
        preferences domain.UserPreferences,
) int {
        var score float64 = 0
        var maxScore float64 = 0

        // Цена билета (вес: 25)
        maxScore += 25
        if lottery.TicketPrice >= preferences.TicketPrice.Min &&
                lottery.TicketPrice <= preferences.TicketPrice.Max {
                score += 25
        } else {
                // Частичные баллы, если близко к диапазону
                priceDiff := math.Min(
                        math.Abs(lottery.TicketPrice-preferences.TicketPrice.Min),
                        math.Abs(lottery.TicketPrice-preferences.TicketPrice.Max),
                )
                maxDiff := preferences.TicketPrice.Max - preferences.TicketPrice.Min
                // Защита от деления на 0: если min == max, то либо точное совпадение (25 баллов), либо 0
                if maxDiff == 0 {
                        if lottery.TicketPrice == preferences.TicketPrice.Min {
                                score += 25
                        }
                        // иначе 0 баллов (не совпало)
                } else {
                        score += math.Max(0, 25-(priceDiff/maxDiff)*25)
                }
        }

        // Тип лотереи (вес: 20)
        if preferences.LotteryType != nil {
                maxScore += 20
                if lottery.Type == *preferences.LotteryType {
                        score += 20
                }
        }

        // Джекпот (вес: 30)
        maxScore += 30
        if lottery.CurrentJackpot >= preferences.MaxJackpot.Min &&
                lottery.CurrentJackpot <= preferences.MaxJackpot.Max {
                score += 30
        } else {
                // Частичные баллы
                jackpotDiff := math.Min(
                        math.Abs(lottery.CurrentJackpot-preferences.MaxJackpot.Min),
                        math.Abs(lottery.CurrentJackpot-preferences.MaxJackpot.Max),
                )
                maxDiff := preferences.MaxJackpot.Max - preferences.MaxJackpot.Min
                // Защита от деления на 0: если min == max, то либо точное совпадение (30 баллов), либо 0
                if maxDiff == 0 {
                        if lottery.CurrentJackpot == preferences.MaxJackpot.Min {
                                score += 30
                        }
                        // иначе 0 баллов (не совпало)
                } else {
                        score += math.Max(0, 30-(jackpotDiff/maxDiff)*30)
                }
        }

        // Вероятность выигрыша (вес: 25)
        maxScore += 25
        if lottery.WinProbability >= preferences.WinProbability.Min &&
                lottery.WinProbability <= preferences.WinProbability.Max {
                score += 25
        } else {
                // Частичные баллы
                probDiff := math.Min(
                        math.Abs(lottery.WinProbability-preferences.WinProbability.Min),
                        math.Abs(lottery.WinProbability-preferences.WinProbability.Max),
                )
                maxDiff := preferences.WinProbability.Max - preferences.WinProbability.Min
                // Защита от деления на 0: если min == max, то либо точное совпадение (25 баллов), либо 0
                if maxDiff == 0 {
                        if lottery.WinProbability == preferences.WinProbability.Min {
                                score += 25
                        }
                        // иначе 0 баллов (не совпало)
                } else {
                        score += math.Max(0, 25-(probDiff/maxDiff)*25)
                }
        }

        // Защита от деления на 0 и от некорректных значений
        if maxScore == 0 {
                return 0
        }

        // Вычисляем финальный score и применяем clamp(0, 100) для гарантии корректного диапазона
        finalScore := (score / maxScore) * 100
        finalScore = math.Max(0, math.Min(100, finalScore))
        
        return int(math.Round(finalScore))
}

// generatePersonalizedReason генерирует персонализированное описание причины рекомендации
// Портировано из recommendation.service.ts
func (s *RecommendationService) generatePersonalizedReason(
        lottery domain.Lottery,
        preferences domain.UserPreferences,
        matchScore int,
) string {
        reasons := make([]string, 0)

        // Цена билета
        if lottery.TicketPrice >= preferences.TicketPrice.Min &&
                lottery.TicketPrice <= preferences.TicketPrice.Max {
                reasons = append(reasons, fmt.Sprintf(
                        "Билет стоит %.0f ₽, что соответствует вашему бюджету (%.0f-%.0f ₽)",
                        lottery.TicketPrice,
                        preferences.TicketPrice.Min,
                        preferences.TicketPrice.Max,
                ))
        }

        // Тип лотереи
        if preferences.LotteryType != nil && lottery.Type == *preferences.LotteryType {
                typeDescriptions := map[domain.LotteryType]string{
                        domain.LotteryTypeNumbered:   "Вы предпочитаете числовые лотереи, где вы сами выбираете числа",
                        domain.LotteryTypeInstant:    "Вы любите динамичные игры с частыми розыгрышами",
                        domain.LotteryTypeDrawBased:  "Вы предпочитаете традиционные тиражные лотереи",
                        domain.LotteryTypeSportloto:  "Вы интересуетесь спортивными лотереями",
                }
                if desc, ok := typeDescriptions[lottery.Type]; ok {
                        reasons = append(reasons, desc)
                } else {
                        reasons = append(reasons, fmt.Sprintf("Это %s лотерея", lottery.Type))
                }
        }

        // Джекпот
        jackpotMln := float64(lottery.CurrentJackpot) / 1000000.0
        if lottery.CurrentJackpot >= preferences.MaxJackpot.Min &&
                lottery.CurrentJackpot <= preferences.MaxJackpot.Max {
                reasons = append(reasons, fmt.Sprintf(
                        "Текущий джекпот %.1f млн ₽ находится в интересующем вас диапазоне",
                        jackpotMln,
                ))
        } else if lottery.CurrentJackpot > preferences.MaxJackpot.Max {
                reasons = append(reasons, fmt.Sprintf(
                        "Огромный джекпот %.1f млн ₽ - шанс выиграть больше, чем планировали!",
                        jackpotMln,
                ))
        }

        // Вероятность выигрыша
        if lottery.WinProbability >= preferences.WinProbability.Min {
                if lottery.WinProbability >= 0.05 {
                        reasons = append(reasons, fmt.Sprintf(
                                "Высокая вероятность выигрыша (%.3f%%) - отличные шансы!",
                                lottery.WinProbability,
                        ))
                } else if lottery.WinProbability >= 0.01 {
                        reasons = append(reasons, fmt.Sprintf(
                                "Хорошая вероятность выигрыша (%.3f%%) при достойном призовом фонде",
                                lottery.WinProbability,
                        ))
                }
        }

        // Частота розыгрышей
        frequencyDescriptions := map[domain.DrawFrequency]string{
                domain.DrawFrequencyDaily:   "Ежедневные розыгрыши - не придется долго ждать результата",
                domain.DrawFrequencyWeekly:  "Еженедельные розыгрыши подходят для вашей частоты игры",
        }

        lotteryFreqLower := strings.ToLower(string(lottery.DrawFrequency))
        prefFreqLower := strings.ToLower(string(preferences.PlayFrequency))

        if (prefFreqLower == "ежедневно" && strings.Contains(lotteryFreqLower, "ежедневно")) ||
                (prefFreqLower == "еженедельно" && strings.Contains(lotteryFreqLower, "еженедельно")) {
                if desc, ok := frequencyDescriptions[lottery.DrawFrequency]; ok {
                        reasons = append(reasons, desc)
                }
        }

        // Формируем итоговое сообщение в зависимости от оценки
        reasonsText := strings.Join(reasons, ". ")
        if len(reasons) > 0 {
                reasonsText += "."
        }

        if matchScore >= 90 {
                return fmt.Sprintf("Идеальный выбор! %s", reasonsText)
        } else if matchScore >= 70 {
                return fmt.Sprintf("Отличный вариант! %s", reasonsText)
        } else {
                if len(reasonsText) > 0 {
                        return reasonsText
                }
                return "Эта лотерея может вам понравиться!"
        }
}

// getMatchedCriteria определяет совпавшие критерии между лотереей и предпочтениями
// Портировано из recommendation.service.ts
func (s *RecommendationService) getMatchedCriteria(
        lottery domain.Lottery,
        preferences domain.UserPreferences,
) []string {
        criteria := make([]string, 0)

        // Цена билета
        if lottery.TicketPrice >= preferences.TicketPrice.Min &&
                lottery.TicketPrice <= preferences.TicketPrice.Max {
                criteria = append(criteria, "Цена билета")
        }

        // Тип лотереи
        if preferences.LotteryType != nil && lottery.Type == *preferences.LotteryType {
                criteria = append(criteria, "Тип лотереи")
        }

        // Размер джекпота
        if lottery.CurrentJackpot >= preferences.MaxJackpot.Min &&
                lottery.CurrentJackpot <= preferences.MaxJackpot.Max {
                criteria = append(criteria, "Размер джекпота")
        }

        // Вероятность выигрыша
        if lottery.WinProbability >= preferences.WinProbability.Min &&
                lottery.WinProbability <= preferences.WinProbability.Max {
                criteria = append(criteria, "Вероятность выигрыша")
        }

        // Частота розыгрышей
        lotteryFreqLower := strings.ToLower(string(lottery.DrawFrequency))
        prefFreqLower := strings.ToLower(string(preferences.PlayFrequency))

        if (prefFreqLower == "ежедневно" && strings.Contains(lotteryFreqLower, "ежедневно")) ||
                (prefFreqLower == "еженедельно" && strings.Contains(lotteryFreqLower, "еженедельно")) {
                criteria = append(criteria, "Частота розыгрышей")
        }

        return criteria
}

// contains проверяет, содержит ли массив строк заданную строку
func contains(slice []string, item string) bool {
        for _, s := range slice {
                if s == item {
                        return true
                }
        }
        return false
}
