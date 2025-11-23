package domain

// LotteryType представляет тип лотереи
type LotteryType string

const (
        LotteryTypeNumbered  LotteryType = "числовая"     // Числовая лотерея
        LotteryTypeInstant   LotteryType = "моментальная" // Моментальная лотерея
        LotteryTypeDrawBased LotteryType = "тиражная"     // Тиражная лотерея
        LotteryTypeSportloto LotteryType = "спортлото"    // Спортлото
)

// DrawFrequency представляет частоту розыгрышей
type DrawFrequency string

const (
        DrawFrequencyDaily          DrawFrequency = "ежедневно"              // Ежедневно
        DrawFrequencySeveralPerWeek DrawFrequency = "несколько раз в неделю" // Несколько раз в неделю
        DrawFrequencyWeekly         DrawFrequency = "еженедельно"            // Еженедельно
        DrawFrequencyMonthly        DrawFrequency = "раз в месяц"            // Раз в месяц
)

// PrizeCategory представляет категорию приза в структуре призов
type PrizeCategory struct {
        Category    string `json:"category" validate:"required"`    // Категория приза
        Prize       string `json:"prize" validate:"required"`       // Размер приза
        Probability string `json:"probability" validate:"required"` // Вероятность выигрыша
}

// Lottery представляет лотерею
// Синхронизировано с shared/schema.ts - используем float64 для цен и джекпотов
type Lottery struct {
        ID             string          `json:"id" validate:"required"`                   // Уникальный идентификатор
        Name           string          `json:"name" validate:"required"`                 // Название лотереи
        Type           LotteryType     `json:"type" validate:"required"`                 // Тип лотереи
        TicketPrice    float64         `json:"ticketPrice" validate:"required,min=0"`    // Цена билета в рублях (float64 для точности при конверсии из копеек)
        MaxJackpot     float64         `json:"maxJackpot" validate:"required,min=0"`     // Максимальный джекпот в рублях
        CurrentJackpot float64         `json:"currentJackpot" validate:"required,min=0"` // Текущий джекпот в рублях
        WinProbability float64         `json:"winProbability" validate:"required,min=0"` // Вероятность выигрыша (в процентах)
        DrawFrequency  DrawFrequency   `json:"drawFrequency" validate:"required"`        // Частота розыгрышей
        Description    string          `json:"description" validate:"required"`          // Описание лотереи
        Rules          string          `json:"rules" validate:"required"`                // Правила игры
        PrizeStructure []PrizeCategory `json:"prizeStructure" validate:"required,dive"`  // Структура призов
        ImageURL       *string         `json:"imageUrl,omitempty"`                       // URL изображения (опционально)
        IsActive       bool            `json:"isActive"`                                 // Активна ли лотерея
}

// PriceRange представляет диапазон цен
// Синхронизировано с shared/schema.ts - используем float64 для точности
type PriceRange struct {
        Min float64 `json:"min" validate:"required,min=0"`              // Минимальная цена
        Max float64 `json:"max" validate:"required,min=0,gtefield=Min"` // Максимальная цена
}

// JackpotRange представляет диапазон джекпота
// Синхронизировано с shared/schema.ts - используем float64 для точности
type JackpotRange struct {
        Min float64 `json:"min" validate:"required,min=0"`              // Минимальный джекпот
        Max float64 `json:"max" validate:"required,min=0,gtefield=Min"` // Максимальный джекпот
}

// ProbabilityRange представляет диапазон вероятности
type ProbabilityRange struct {
        Min float64 `json:"min" validate:"required,min=0"`              // Минимальная вероятность
        Max float64 `json:"max" validate:"required,min=0,gtefield=Min"` // Максимальная вероятность
}

// UserPreferences представляет параметры пользователя для подбора лотереи
type UserPreferences struct {
        TicketPrice    PriceRange       `json:"ticketPrice" validate:"required"`    // Диапазон цены билета
        PlayFrequency  DrawFrequency    `json:"playFrequency" validate:"required"`  // Желаемая частота игры
        LotteryType    *LotteryType     `json:"lotteryType,omitempty"`              // Предпочитаемый тип лотереи (опционально)
        MaxJackpot     JackpotRange     `json:"maxJackpot" validate:"required"`     // Диапазон джекпота
        WinProbability ProbabilityRange `json:"winProbability" validate:"required"` // Диапазон вероятности выигрыша
}

// Recommendation представляет рекомендацию лотереи
type Recommendation struct {
        Lottery            Lottery  `json:"lottery" validate:"required"`                  // Рекомендуемая лотерея
        MatchScore         int      `json:"matchScore" validate:"required,min=0,max=100"` // Оценка соответствия (0-100)
        PersonalizedReason string   `json:"personalizedReason" validate:"required"`       // Персонализированное описание причин выбора
        MatchedCriteria    []string `json:"matchedCriteria" validate:"required"`          // Список совпавших критериев
        IsNew              *bool    `json:"isNew,omitempty"`                              // Новая ли рекомендация (опционально)
}

// RecommendationRequest представляет запрос на получение рекомендаций
type RecommendationRequest struct {
        Preferences        UserPreferences `json:"preferences" validate:"required"` // Предпочтения пользователя
        PreviousLotteryIDs []string        `json:"previousLotteryIds,omitempty"`    // ID ранее рекомендованных лотерей (опционально)
}

// RecommendationResponse представляет ответ с рекомендациями
type RecommendationResponse struct {
        Recommendations   []Recommendation `json:"recommendations" validate:"required,dive"`   // Список рекомендаций
        TotalMatches      int              `json:"totalMatches" validate:"min=0"`              // Общее количество совпадений
        AverageMatchScore float64          `json:"averageMatchScore" validate:"min=0,max=100"` // Средняя оценка совпадения
}

// FilterCriteria представляет критерии фильтрации лотерей
type FilterCriteria struct {
        TicketPrice    *PriceRange       `json:"ticketPrice,omitempty"`    // Диапазон цены билета (опционально)
        LotteryType    *string           `json:"lotteryType,omitempty"`    // Тип лотереи (опционально)
        MaxJackpot     *JackpotRange     `json:"maxJackpot,omitempty"`     // Диапазон джекпота (опционально)
        WinProbability *ProbabilityRange `json:"winProbability,omitempty"` // Диапазон вероятности выигрыша (опционально)
}

// SavedParameters представляет сохраненный набор параметров
type SavedParameters struct {
        ID          string          `json:"id" validate:"required"`          // Уникальный идентификатор
        Name        string          `json:"name" validate:"required"`        // Название набора параметров
        Preferences UserPreferences `json:"preferences" validate:"required"` // Сохраненные предпочтения
        SavedAt     string          `json:"savedAt" validate:"required"`     // Время сохранения (ISO 8601)
        LotteryIDs  []string        `json:"lotteryIds" validate:"required"`  // ID рекомендованных лотерей при сохранении
}
