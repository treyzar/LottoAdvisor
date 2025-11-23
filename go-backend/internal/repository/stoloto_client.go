package repository

import (
        "context"
        "encoding/json"
        "fmt"
        "io"
        "log"
        "math"
        "net/http"
        "strings"
        "time"

        "github.com/stoloto-recommendations/backend/internal/domain"
)

const (
        // Максимальное количество попыток при ошибке
        maxRetries = 3
        // Задержка между попытками
        retryDelay = 500 * time.Millisecond
)

// StolotoClient предоставляет HTTP клиент для работы с StolotoAPI
type StolotoClient struct {
        baseURL    string
        httpClient *http.Client
}

// NewStolotoClient создает новый экземпляр StolotoClient
func NewStolotoClient(baseURL string) *StolotoClient {
        return &StolotoClient{
                baseURL: baseURL,
                httpClient: &http.Client{
                        Timeout: 10 * time.Second,
                },
        }
}

// kopecksToRoubles конвертирует копейки в рубли с правильной точностью
// StolotoAPI возвращает цены в копейках (1 рубль = 100 копеек)
// Наши domain модели хранят цены в рублях (float64)
// Используем float64 для промежуточных вычислений чтобы избежать потери точности:
// - 150 копеек / 100 = 1.5 рубля (правильно)
// - НЕ: 150 / 100 = 1 рубль (потеря 50 копеек!)
func kopecksToRoubles(kopecks int) float64 {
        return math.Round(float64(kopecks) / 100.0)
}

// kopecksToRoubles64 конвертирует копейки (int64) в рубли с правильной точностью
func kopecksToRoubles64(kopecks int64) float64 {
        return math.Round(float64(kopecks) / 100.0)
}

// ConvertGameToLottery конвертирует данные из StolotoAPI в domain.Lottery
func (c *StolotoClient) ConvertGameToLottery(game Game) domain.Lottery {
        // Конвертируем цены из копеек в рубли
        ticketPrice := kopecksToRoubles(game.TicketPrice)
        currentJackpot := kopecksToRoubles64(game.Jackpot)
        
        // Определяем тип лотереи по имени игры
        lotteryType := determineLotteryType(game.Name)
        
        // Конвертируем частоту розыгрышей
        drawFrequency := convertDrawFrequency(game.DrawFrequency)
        
        // Генерируем описание
        description := generateDescription(game.DisplayName, lotteryType)
        
        // Генерируем правила
        rules := generateRules(game.DisplayName, lotteryType)
        
        // Создаем структуру призов (упрощенная версия)
        prizeStructure := generatePrizeStructure(game.DisplayName, currentJackpot)
        
        // Определяем вероятность выигрыша (примерные значения)
        winProbability := estimateWinProbability(game.Name)
        
        return domain.Lottery{
                ID:             game.Name,
                Name:           game.DisplayName,
                Type:           lotteryType,
                TicketPrice:    ticketPrice,
                MaxJackpot:     currentJackpot, // Используем текущий джекпот как максимальный
                CurrentJackpot: currentJackpot,
                WinProbability: winProbability,
                DrawFrequency:  drawFrequency,
                Description:    description,
                Rules:          rules,
                PrizeStructure: prizeStructure,
                ImageURL:       nil,
                IsActive:       true,
        }
}

// determineLotteryType определяет тип лотереи по имени
func determineLotteryType(name string) domain.LotteryType {
        name = strings.ToLower(name)
        
        if strings.Contains(name, "6x45") || strings.Contains(name, "5x36") || 
           strings.Contains(name, "4x20") || strings.Contains(name, "7x49") {
                return domain.LotteryTypeNumbered
        }
        
        if strings.Contains(name, "rapido") || strings.Contains(name, "12x24") {
                return domain.LotteryTypeInstant
        }
        
        if strings.Contains(name, "top3") {
                return domain.LotteryTypeSportloto
        }
        
        // По умолчанию - тиражная
        return domain.LotteryTypeDrawBased
}

// convertDrawFrequency конвертирует частоту розыгрышей
func convertDrawFrequency(frequency string) domain.DrawFrequency {
        frequency = strings.ToLower(frequency)
        
        if strings.Contains(frequency, "daily") || strings.Contains(frequency, "ежедневно") {
                return domain.DrawFrequencyDaily
        }
        
        if strings.Contains(frequency, "weekly") || strings.Contains(frequency, "еженедельно") {
                return domain.DrawFrequencyWeekly
        }
        
        if strings.Contains(frequency, "several") || strings.Contains(frequency, "несколько") {
                return domain.DrawFrequencySeveralPerWeek
        }
        
        // По умолчанию
        return domain.DrawFrequencyWeekly
}

// generateDescription генерирует описание лотереи
func generateDescription(displayName string, lotteryType domain.LotteryType) string {
        switch lotteryType {
        case domain.LotteryTypeNumbered:
                return fmt.Sprintf("%s - популярная числовая лотерея. Выберите числа и выиграйте крупный приз!", displayName)
        case domain.LotteryTypeInstant:
                return fmt.Sprintf("%s - моментальная лотерея с частыми розыгрышами и быстрыми результатами!", displayName)
        case domain.LotteryTypeDrawBased:
                return fmt.Sprintf("%s - классическая тиражная лотерея с большими призами!", displayName)
        case domain.LotteryTypeSportloto:
                return fmt.Sprintf("%s - спортивная лотерея для любителей динамичных игр!", displayName)
        default:
                return fmt.Sprintf("%s - увлекательная лотерея с отличными призами!", displayName)
        }
}

// generateRules генерирует правила игры
func generateRules(displayName string, lotteryType domain.LotteryType) string {
        return fmt.Sprintf("Купите билет %s, выберите числа согласно правилам игры. Розыгрыш проходит согласно расписанию. При совпадении всех чисел вы выигрываете главный приз!", displayName)
}

// generatePrizeStructure генерирует структуру призов
func generatePrizeStructure(displayName string, jackpot float64) []domain.PrizeCategory {
        jackpotMln := jackpot / 1000000.0
        
        return []domain.PrizeCategory{
                {
                        Category:    "Джекпот",
                        Prize:       fmt.Sprintf("%.1f млн ₽", jackpotMln),
                        Probability: "1:1000000",
                },
                {
                        Category:    "2 категория",
                        Prize:       fmt.Sprintf("%.0f ₽", jackpot*0.1),
                        Probability: "1:100000",
                },
                {
                        Category:    "3 категория",
                        Prize:       "10000 ₽",
                        Probability: "1:10000",
                },
                {
                        Category:    "4 категория",
                        Prize:       "1000 ₽",
                        Probability: "1:1000",
                },
        }
}

// estimateWinProbability оценивает вероятность выигрыша
func estimateWinProbability(name string) float64 {
        name = strings.ToLower(name)
        
        // Примерные вероятности для разных типов лотерей
        if strings.Contains(name, "6x45") {
                return 0.00001 // 0.001%
        }
        
        if strings.Contains(name, "5x36") {
                return 0.0001 // 0.01%
        }
        
        if strings.Contains(name, "4x20") {
                return 0.001 // 0.1%
        }
        
        if strings.Contains(name, "rapido") || strings.Contains(name, "12x24") {
                return 0.01 // 1%
        }
        
        // По умолчанию
        return 0.0001
}

// doRequestWithRetry выполняет HTTP запрос с повторными попытками (до 3 раз)
// После 3 неудачных попыток возвращает ошибку, которая триггерит fallback на моковые данные
func (c *StolotoClient) doRequestWithRetry(ctx context.Context, url string) (*http.Response, error) {
        var lastErr error
        
        for attempt := 1; attempt <= maxRetries; attempt++ {
                req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
                if err != nil {
                        return nil, fmt.Errorf("ошибка создания запроса: %w", err)
                }
                
                resp, err := c.httpClient.Do(req)
                if err != nil {
                        lastErr = err
                        if attempt < maxRetries {
                                log.Printf("Попытка %d/%d не удалась: %v. Повторная попытка через %v...", 
                                        attempt, maxRetries, err, retryDelay * time.Duration(math.Pow(2, float64(attempt-1))))
                                time.Sleep(retryDelay * time.Duration(math.Pow(2, float64(attempt-1))))
                                continue
                        }
                        log.Printf("Все %d попыток исчерпаны. Последняя ошибка: %v", maxRetries, err)
                        return nil, fmt.Errorf("ошибка выполнения запроса после %d попыток: %w", maxRetries, err)
                }
                
                if resp.StatusCode == http.StatusOK {
                        if attempt > 1 {
                                log.Printf("Успех на попытке %d/%d", attempt, maxRetries)
                        }
                        return resp, nil
                }
                
                body, _ := io.ReadAll(resp.Body)
                resp.Body.Close()
                lastErr = fmt.Errorf("StolotoAPI вернул код %d: %s", resp.StatusCode, string(body))
                
                if attempt < maxRetries {
                        log.Printf("Попытка %d/%d не удалась: статус %d. Повторная попытка через %v...", 
                                attempt, maxRetries, resp.StatusCode, retryDelay * time.Duration(math.Pow(2, float64(attempt-1))))
                        time.Sleep(retryDelay * time.Duration(math.Pow(2, float64(attempt-1))))
                        continue
                }
        }
        
        log.Printf("Все %d попыток исчерпаны. Последняя ошибка: %v", maxRetries, lastErr)
        return nil, fmt.Errorf("не удалось выполнить запрос после %d попыток: %w", maxRetries, lastErr)
}

// DrawsResponse представляет ответ от /api/draws/
type DrawsResponse struct {
        RequestStatus string `json:"requestStatus"`
        Games         []Game `json:"games"`
}

// Game представляет информацию об игре из StolotoAPI
type Game struct {
        Name          string `json:"name"`
        DisplayName   string `json:"displayName"`
        TicketPrice   int    `json:"ticketPrice"` // в копейках
        Jackpot       int64  `json:"jackpot"`     // в копейках
        DrawFrequency string `json:"drawFrequency"`
        Draw          *Draw  `json:"draw,omitempty"`
        CompletedDraw *Draw  `json:"completedDraw,omitempty"`
}

// Draw представляет информацию о розыгрыше
type Draw struct {
        Number         int    `json:"number"`
        DrawDate       string `json:"drawDate"`
        Status         string `json:"status"`
        WinningNumbers []int  `json:"winningNumbers,omitempty"`
}

// GetAllDraws получает список всех доступных игр из StolotoAPI
// Использует retry логику для повышения надежности
func (c *StolotoClient) GetAllDraws(ctx context.Context) (*DrawsResponse, error) {
        url := fmt.Sprintf("%s/api/draws/", c.baseURL)

        log.Printf("[StolotoClient] Fetching all draws from %s", url)
        resp, err := c.doRequestWithRetry(ctx, url)
        if err != nil {
                log.Printf("[StolotoClient] Request failed after retries: %v - will trigger mock fallback", err)
                return nil, err
        }
        defer resp.Body.Close()

        var result DrawsResponse
        if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
                log.Printf("[StolotoClient] JSON unmarshal failed: %v - will trigger mock fallback", err)
                return nil, fmt.Errorf("ошибка декодирования ответа: %w", err)
        }

        log.Printf("[StolotoClient] Successfully fetched %d games from API", len(result.Games))
        return &result, nil
}

// GetDraw получает информацию о конкретном розыгрыше
func (c *StolotoClient) GetDraw(ctx context.Context, gameName string, drawNumber string) (*Draw, error) {
        url := fmt.Sprintf("%s/api/draw/?name=%s&number=%s", c.baseURL, gameName, drawNumber)

        req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
        if err != nil {
                return nil, fmt.Errorf("ошибка создания запроса: %w", err)
        }

        resp, err := c.httpClient.Do(req)
        if err != nil {
                return nil, fmt.Errorf("ошибка выполнения запроса: %w", err)
        }
        defer resp.Body.Close()

        if resp.StatusCode != http.StatusOK {
                body, _ := io.ReadAll(resp.Body)
                return nil, fmt.Errorf("StolotoAPI вернул код %d: %s", resp.StatusCode, string(body))
        }

        var result struct {
                RequestStatus string `json:"requestStatus"`
                Draw          *Draw  `json:"draw"`
        }
        if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
                return nil, fmt.Errorf("ошибка декодирования ответа: %w", err)
        }

        return result.Draw, nil
}

// GetLatestDraw получает последний розыгрыш для указанной игры
func (c *StolotoClient) GetLatestDraw(ctx context.Context, gameName string) (*Draw, error) {
        url := fmt.Sprintf("%s/api/draw/latest?name=%s", c.baseURL, gameName)

        req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
        if err != nil {
                return nil, fmt.Errorf("ошибка создания запроса: %w", err)
        }

        resp, err := c.httpClient.Do(req)
        if err != nil {
                return nil, fmt.Errorf("ошибка выполнения запроса: %w", err)
        }
        defer resp.Body.Close()

        if resp.StatusCode != http.StatusOK {
                body, _ := io.ReadAll(resp.Body)
                return nil, fmt.Errorf("StolotoAPI вернул код %d: %s", resp.StatusCode, string(body))
        }

        var result struct {
                RequestStatus string `json:"requestStatus"`
                Draw          *Draw  `json:"draw"`
        }
        if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
                return nil, fmt.Errorf("ошибка декодирования ответа: %w", err)
        }

        return result.Draw, nil
}
