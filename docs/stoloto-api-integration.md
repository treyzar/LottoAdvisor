# Документация по интеграции StolotoAPI

## Обзор

**StolotoAPI** - это прокси-сервер на Go, который предоставляет простой REST API для доступа к данным лотерей с сайта Столото (stoloto.ru). API оборачивает мобильное API Столото и предоставляет удобные endpoints для получения информации о играх и розыгрышах.

### Основные характеристики
- **Язык**: Go 1.25.2
- **Архитектура**: HTTP прокси-сервер
- **Формат данных**: JSON
- **Документация**: Swagger UI (встроенная)
- **Базовый URL источника**: `https://www.stoloto.ru/p/api/mobile/api/v35`
- **Порт по умолчанию**: 8080
- **Лицензия**: Apache-2.0

---

## Архитектура

### Принцип работы
StolotoAPI работает как простой HTTP прокси:
1. Принимает HTTP запросы от клиентов
2. Формирует запросы к мобильному API Столото с необходимыми заголовками
3. Обрабатывает ответы и пробрасывает их клиенту
4. Логирует операции

### Технический стек
- **HTTP сервер**: стандартный `net/http` (Go)
- **Swagger**: `swaggo/http-swagger` + `swaggo/swag`
- **Зависимости**: минимальные (см. go.mod)

### Константы
```go
baseURL      = "https://www.stoloto.ru/p/api/mobile/api/v35"
partnerToken = "bXMjXFRXZ3coWXh6R3s1NTdUX3dnWlBMLUxmdg"
userAgent    = "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15"
```

---

## Аутентификация

### Требования к аутентификации
**Для использования прокси-сервера StolotoAPI: НЕТ**
- API не требует аутентификации от клиентов
- Все запросы публичные

**Для обращения к оригинальному API Столото (встроено в прокси):**
- Используется предустановленный `partnerToken`: `bXMjXFRXZ3coWXh6R3s1NTdUX3dnWlBMLUxmdg`
- Заголовок `User-Agent` имитирует мобильное приложение iOS
- Токен уже встроен в код прокси-сервера

### Рекомендации
При интеграции с нашим Golang backend:
- **Не требуется** хранить API ключи на стороне backend
- **Не требуется** передавать аутентификационные данные
- Просто отправляйте HTTP GET запросы к StolotoAPI

---

## API Endpoints

### 1. GET /api/draws/
**Описание**: Получить список всех доступных игр

**Параметры**: Нет

**Пример запроса**:
```bash
curl http://localhost:8080/api/draws/
```

**Пример ответа** (успешный):
```json
{
  "requestStatus": "success",
  "games": [
    {
      "name": "6x45",
      "displayName": "Гослото 6 из 45",
      "draw": {
        "number": 5432,
        "drawDate": "2025-11-23T20:00:00Z",
        "status": "active"
      },
      "completedDraw": {
        "number": 5431,
        "drawDate": "2025-11-22T20:00:00Z",
        "status": "completed",
        "winningNumbers": [12, 23, 34, 45, 6, 17]
      },
      "ticketPrice": 100,
      "jackpot": 150000000,
      "drawFrequency": "daily"
    },
    {
      "name": "5x36",
      "displayName": "Гослото 5 из 36",
      "draw": {
        "number": 8765,
        "drawDate": "2025-11-23T14:00:00Z",
        "status": "active"
      },
      "ticketPrice": 50,
      "jackpot": 80000000,
      "drawFrequency": "daily"
    }
  ]
}
```

**Коды ответов**:
- `200 OK` - успешный запрос
- `500 Internal Server Error` - ошибка сервера

**Возвращаемые данные о лотереях**:
- `name` - системное имя игры (5x36, 6x45, 7x49, и т.д.)
- `displayName` - отображаемое название
- `draw` - информация об активном розыгрыше
- `completedDraw` - информация о последнем завершенном розыгрыше
- `ticketPrice` - цена билета (в копейках)
- `jackpot` - размер джекпота (в копейках)
- `drawFrequency` - частота розыгрышей
- `winningNumbers` - выигрышные номера (для завершенных розыгрышей)

---

### 2. GET /api/draw/
**Описание**: Получить информацию о конкретном розыгрыше по имени игры и номеру

**Параметры**:
| Параметр | Тип | Обязательный | Описание |
|----------|-----|--------------|----------|
| name | string | Да | Название игры (например: 5x36, 6x45, 7x49) |
| number | string | Да | Номер розыгрыша |

**Пример запроса**:
```bash
curl "http://localhost:8080/api/draw/?name=6x45&number=5431"
```

**Пример ответа** (успешный):
```json
{
  "requestStatus": "success",
  "draw": {
    "number": 5431,
    "gameName": "6x45",
    "drawDate": "2025-11-22T20:00:00Z",
    "status": "completed",
    "winningNumbers": [12, 23, 34, 45, 6, 17],
    "jackpot": 150000000,
    "winners": {
      "tier1": 0,
      "tier2": 3,
      "tier3": 145
    },
    "prizePool": 200000000
  }
}
```

**Коды ответов**:
- `200 OK` - успешный запрос
- `400 Bad Request` - неверные параметры (отсутствует name или number)
- `500 Internal Server Error` - ошибка сервера

---

### 3. GET /api/draw/latest
**Описание**: Получить последний розыгрыш для указанной игры

**Параметры**:
| Параметр | Тип | Обязательный | Описание |
|----------|-----|--------------|----------|
| name | string | Да | Название игры (например: 5x36, 6x45) |

**Пример запроса**:
```bash
curl "http://localhost:8080/api/draw/latest?name=6x45"
```

**Логика работы**:
1. Получает список всех игр через `/api/draws/`
2. Находит игру по имени
3. Извлекает номер последнего розыгрыша:
   - Сначала проверяет активный розыгрыш (`draw`)
   - Если нет, использует завершенный (`completedDraw`)
4. Получает полные данные розыгрыша через `/api/draw/`

**Пример ответа**: Аналогичен `/api/draw/`

**Коды ответов**:
- `200 OK` - успешный запрос
- `400 Bad Request` - не указан параметр name
- `404 Not Found` - игра не найдена
- `500 Internal Server Error` - ошибка сервера

---

### 4. GET /api/draw/prelatest
**Описание**: Получить предпоследний розыгрыш для указанной игры

**Параметры**:
| Параметр | Тип | Обязательный | Описание |
|----------|-----|--------------|----------|
| name | string | Да | Название игры (например: 5x36, 6x45) |

**Пример запроса**:
```bash
curl "http://localhost:8080/api/draw/prelatest?name=6x45"
```

**Логика работы**:
1. Получает список всех игр
2. Находит последний номер розыгрыша (аналогично `/latest`)
3. Возвращает данные розыгрыша с номером `latestNumber - 1`

**Коды ответов**:
- `200 OK` - успешный запрос
- `400 Bad Request` - не указан параметр name
- `404 Not Found` - игра не найдена
- `500 Internal Server Error` - ошибка сервера

---

### 5. GET /api/draw/momental
**Описание**: Получить список всех моментальных лотерей (лотереи со скретч-картами)

**Параметры**: Нет

**Пример запроса**:
```bash
curl http://localhost:8080/api/draw/momental
```

**Пример ответа**:
```json
{
  "requestStatus": "success",
  "momentalCards": [
    {
      "id": "12345",
      "name": "Золотая подкова",
      "ticketPrice": 50,
      "maxPrize": 1000000,
      "availableTickets": 5000000,
      "totalTickets": 10000000,
      "oddsOfWinning": 0.25
    }
  ]
}
```

**Коды ответов**:
- `200 OK` - успешный запрос
- `500 Internal Server Error` - ошибка сервера

---

### 6. GET /swagger/
**Описание**: Swagger UI для интерактивной документации API

**Использование**: Откройте в браузере `http://localhost:8080/swagger/index.html`

---

## Структуры данных (Go)

### ErrorResponse
```go
type ErrorResponse struct {
    Success bool   `json:"success"`
    Error   string `json:"error"`
}
```

**Пример использования**:
```json
{
  "success": false,
  "error": "Missing required parameter: \"name\""
}
```

---

### Game (инферированная структура)
```go
type Game struct {
    Name           string         `json:"name"`
    DisplayName    string         `json:"displayName,omitempty"`
    Draw           *Draw          `json:"draw,omitempty"`
    CompletedDraw  *Draw          `json:"completedDraw,omitempty"`
    TicketPrice    int            `json:"ticketPrice,omitempty"`    // в копейках
    Jackpot        int64          `json:"jackpot,omitempty"`        // в копейках
    DrawFrequency  string         `json:"drawFrequency,omitempty"`  // "daily", "weekly", etc.
}
```

---

### Draw (инферированная структура)
```go
type Draw struct {
    Number         int       `json:"number"`
    GameName       string    `json:"gameName,omitempty"`
    DrawDate       string    `json:"drawDate,omitempty"`        // ISO 8601 формат
    Status         string    `json:"status,omitempty"`          // "active", "completed"
    WinningNumbers []int     `json:"winningNumbers,omitempty"`
    Jackpot        int64     `json:"jackpot,omitempty"`
    Winners        *Winners  `json:"winners,omitempty"`
    PrizePool      int64     `json:"prizePool,omitempty"`
}
```

---

### Winners (инферированная структура)
```go
type Winners struct {
    Tier1 int `json:"tier1"` // Главный приз
    Tier2 int `json:"tier2"` // Второй уровень
    Tier3 int `json:"tier3"` // Третий уровень
    // и т.д., зависит от типа игры
}
```

---

### GamesResponse
```go
type GamesResponse struct {
    RequestStatus string  `json:"requestStatus"`
    Games         []Game  `json:"games"`
}
```

---

### DrawResponse
```go
type DrawResponse struct {
    RequestStatus string `json:"requestStatus"`
    Draw          Draw   `json:"draw"`
}
```

---

### MomentalCard (инферированная структура)
```go
type MomentalCard struct {
    ID               string  `json:"id"`
    Name             string  `json:"name"`
    TicketPrice      int     `json:"ticketPrice"`
    MaxPrize         int64   `json:"maxPrize"`
    AvailableTickets int64   `json:"availableTickets"`
    TotalTickets     int64   `json:"totalTickets"`
    OddsOfWinning    float64 `json:"oddsOfWinning"`
}
```

---

## Примеры использования

### Пример 1: Получить все доступные игры
```go
package main

import (
    "encoding/json"
    "fmt"
    "io"
    "net/http"
)

type GamesResponse struct {
    RequestStatus string                   `json:"requestStatus"`
    Games         []map[string]interface{} `json:"games"`
}

func getAllGames() (*GamesResponse, error) {
    resp, err := http.Get("http://localhost:8080/api/draws/")
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    body, err := io.ReadAll(resp.Body)
    if err != nil {
        return nil, err
    }

    var result GamesResponse
    if err := json.Unmarshal(body, &result); err != nil {
        return nil, err
    }

    return &result, nil
}

func main() {
    games, err := getAllGames()
    if err != nil {
        fmt.Printf("Error: %v\n", err)
        return
    }

    fmt.Printf("Status: %s\n", games.RequestStatus)
    fmt.Printf("Found %d games\n", len(games.Games))
    
    for _, game := range games.Games {
        fmt.Printf("Game: %v\n", game["name"])
    }
}
```

---

### Пример 2: Получить последний розыгрыш конкретной игры
```go
package main

import (
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "net/url"
)

func getLatestDraw(gameName string) (map[string]interface{}, error) {
    baseURL := "http://localhost:8080/api/draw/latest"
    params := url.Values{}
    params.Add("name", gameName)
    
    fullURL := fmt.Sprintf("%s?%s", baseURL, params.Encode())
    
    resp, err := http.Get(fullURL)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        body, _ := io.ReadAll(resp.Body)
        return nil, fmt.Errorf("API error: %s", string(body))
    }

    body, err := io.ReadAll(resp.Body)
    if err != nil {
        return nil, err
    }

    var result map[string]interface{}
    if err := json.Unmarshal(body, &result); err != nil {
        return nil, err
    }

    return result, nil
}

func main() {
    draw, err := getLatestDraw("6x45")
    if err != nil {
        fmt.Printf("Error: %v\n", err)
        return
    }

    fmt.Printf("Latest draw data: %+v\n", draw)
}
```

---

### Пример 3: Получить конкретный розыгрыш
```go
func getSpecificDraw(gameName string, drawNumber string) (map[string]interface{}, error) {
    baseURL := "http://localhost:8080/api/draw/"
    params := url.Values{}
    params.Add("name", gameName)
    params.Add("number", drawNumber)
    
    fullURL := fmt.Sprintf("%s?%s", baseURL, params.Encode())
    
    resp, err := http.Get(fullURL)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    body, err := io.ReadAll(resp.Body)
    if err != nil {
        return nil, err
    }

    var result map[string]interface{}
    if err := json.Unmarshal(body, &result); err != nil {
        return nil, err
    }

    return result, nil
}
```

---

## Рекомендации по интеграции с нашим Golang backend

### 1. Создать HTTP клиент с таймаутами
```go
var httpClient = &http.Client{
    Timeout: 10 * time.Second,
}
```

### 2. Обработка ошибок
```go
func handleStolotoError(resp *http.Response) error {
    if resp.StatusCode != http.StatusOK {
        body, _ := io.ReadAll(resp.Body)
        var errResp ErrorResponse
        if err := json.Unmarshal(body, &errResp); err == nil {
            return fmt.Errorf("API error: %s", errResp.Error)
        }
        return fmt.Errorf("HTTP %d: %s", resp.StatusCode, string(body))
    }
    return nil
}
```

### 3. Кэширование данных
Рекомендуется кэшировать:
- Список игр (/api/draws/) - обновлять раз в час
- Завершенные розыгрыши - кэшировать постоянно
- Активные розыгрыши - обновлять раз в 5-10 минут

```go
type CachedData struct {
    Data      interface{}
    ExpiresAt time.Time
}

var cache = make(map[string]*CachedData)

func getCached(key string) (interface{}, bool) {
    if data, exists := cache[key]; exists {
        if time.Now().Before(data.ExpiresAt) {
            return data.Data, true
        }
        delete(cache, key)
    }
    return nil, false
}

func setCache(key string, data interface{}, duration time.Duration) {
    cache[key] = &CachedData{
        Data:      data,
        ExpiresAt: time.Now().Add(duration),
    }
}
```

### 4. Retry логика
```go
func retryRequest(url string, maxRetries int) (*http.Response, error) {
    var resp *http.Response
    var err error
    
    for i := 0; i < maxRetries; i++ {
        resp, err = httpClient.Get(url)
        if err == nil && resp.StatusCode == http.StatusOK {
            return resp, nil
        }
        
        if i < maxRetries-1 {
            time.Sleep(time.Second * time.Duration(i+1))
        }
    }
    
    return resp, err
}
```

### 5. Создать сервис-обертку
```go
type StolotoService struct {
    baseURL string
    client  *http.Client
}

func NewStolotoService(baseURL string) *StolotoService {
    return &StolotoService{
        baseURL: baseURL,
        client: &http.Client{
            Timeout: 10 * time.Second,
        },
    }
}

func (s *StolotoService) GetAllGames() (*GamesResponse, error) {
    // Реализация с кэшированием и retry логикой
}

func (s *StolotoService) GetLatestDraw(gameName string) (*DrawResponse, error) {
    // Реализация
}

// и т.д.
```

### 6. Мониторинг и логирование
```go
import "log"

func (s *StolotoService) GetAllGames() (*GamesResponse, error) {
    start := time.Now()
    defer func() {
        log.Printf("GetAllGames completed in %v", time.Since(start))
    }()
    
    // Основная логика
}
```

---

## Ограничения и особенности API

### Ограничения:
1. **Rate Limiting**: Неизвестно, есть ли rate limits на стороне Stoloto API. Рекомендуется не делать более 60 запросов в минуту.

2. **Структура ответов**: API возвращает `map[string]interface{}` вместо строго типизированных структур. Необходимо проверять наличие полей перед использованием.

3. **Зависимость от внешнего API**: Прокси зависит от доступности https://www.stoloto.ru. Если сайт недоступен, API не будет работать.

4. **Отсутствие версионирования**: API не версионируется. Изменения в структуре ответов Stoloto могут сломать интеграцию.

### Особенности:

1. **Два источника данных о розыгрышах**:
   - `draw` - активный (текущий) розыгрыш
   - `completedDraw` - последний завершенный розыгрыш
   
   При получении "последнего" розыгрыша API сначала проверяет `draw`, затем `completedDraw`.

2. **Номера розыгрышей**: Инкрементные целые числа для каждой игры.

3. **Денежные значения**: Все суммы (цены билетов, джекпоты, призовые фонды) указаны в копейках, а не в рублях.

4. **Формат дат**: Используется ISO 8601 (например: "2025-11-23T20:00:00Z").

5. **Swagger документация**: Доступна по адресу `/swagger/index.html` после запуска сервера.

6. **Простота**: API намеренно простой - это тонкая обертка над Stoloto API, минимальная бизнес-логика.

---

## Доступные игры (примеры)

Список может меняться, но обычно включает:
- `6x45` - Гослото 6 из 45
- `5x36` - Гослото 5 из 36
- `7x49` - Гослото 7 из 49
- `4x20` - Гослото 4 из 20
- `rapido` - Рапидо
- `12x24` - Гослото 12 из 24
- Моментальные лотереи (доступны через `/api/draw/momental`)

**Рекомендация**: Не хардкодить список игр, получать динамически через `/api/draws/`

---

## Deployment рекомендации

### Запуск StolotoAPI:
```bash
# 1. Клонировать репозиторий
git clone https://github.com/D0UP1G/StolotoAPI.git
cd StolotoAPI

# 2. Инициализировать Swagger (обязательно!)
swag init

# 3. Скачать зависимости
go mod download

# 4. Запустить сервер
go run main.go
```

Сервер запустится на `http://localhost:8080`

### Production deployment:
```bash
# Собрать бинарник
go build -o stoloto-api main.go

# Запустить
./stoloto-api
```

### Docker (если создадите Dockerfile):
```dockerfile
FROM golang:1.25-alpine
WORKDIR /app
COPY . .
RUN go mod download
RUN swag init
RUN go build -o stoloto-api main.go
EXPOSE 8080
CMD ["./stoloto-api"]
```

---

## Следующие шаги для интеграции

1. **Развернуть StolotoAPI** на отдельном сервере или в контейнере
2. **Создать Go сервис** в нашем backend для работы с StolotoAPI
3. **Реализовать кэширование** для минимизации запросов к API
4. **Добавить типизированные структуры** на основе реальных ответов
5. **Настроить мониторинг** доступности StolotoAPI
6. **Обработать edge cases**: недоступность API, некорректные данные
7. **Протестировать** на реальных данных

---

## Контакты и поддержка

- **Репозиторий**: https://github.com/D0UP1G/StolotoAPI
- **Лицензия**: Apache-2.0
- **Issues**: Создавайте issue в репозитории GitHub

---

## Заключение

StolotoAPI - простой и эффективный прокси для доступа к данным лотерей Столото. API:
- ✅ Не требует аутентификации для клиентов
- ✅ Предоставляет все необходимые данные о лотереях
- ✅ Имеет встроенную Swagger документацию
- ✅ Легко интегрируется с любым Go backend
- ⚠️ Зависит от внешнего API (stoloto.ru)
- ⚠️ Требует обработки динамических структур данных

**Готов к интеграции**: Да, можно начинать разработку сервиса для работы с API.
