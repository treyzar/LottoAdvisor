# Stoloto Recommendations - Go Backend

Backend сервис для системы рекомендаций лотерей Столото, написанный на Go.

## Архитектура

Проект следует принципам Clean Architecture и организован следующим образом:

```
go-backend/
├── cmd/
│   └── server/
│       └── main.go           # Точка входа приложения
├── internal/
│   ├── domain/
│   │   └── types.go          # Доменные типы и модели
│   ├── service/
│   │   ├── stoloto.go        # Бизнес-логика работы с лотереями
│   │   └── recommendation.go # Бизнес-логика генерации рекомендаций
│   ├── repository/
│   │   └── stoloto_client.go # HTTP клиент для StolotoAPI
│   └── http/
│       ├── handler.go        # HTTP обработчики
│       ├── middleware.go     # HTTP middleware
│       └── routes.go         # Определение маршрутов
├── go.mod
├── go.sum
└── README.md
```

## Технологический стек

- **Go** 1.21+
- **Chi Router** - быстрый и легковесный HTTP роутер
- **CORS** - middleware для обработки CORS запросов
- **Validator** - валидация структур данных

## Установка и запуск

### Предварительные требования

- Go 1.21 или выше
- StolotoAPI прокси-сервер (должен быть запущен на порту 8080)

### Установка зависимостей

```bash
cd go-backend
go mod download
```

### Запуск сервера

```bash
go run cmd/server/main.go
```

Сервер запустится на порту **5001** (можно изменить через переменную окружения `PORT`).

### Сборка

```bash
go build -o bin/server cmd/server/main.go
```

## API Endpoints

### Health Check
```http
GET /health
```

Проверка работоспособности сервера.

**Ответ:**
```json
{
  "status": "ok",
  "service": "stoloto-recommendations-backend"
}
```

### Получить все лотереи
```http
GET /api/lotteries
```

Возвращает список всех доступных лотерей.

**Ответ:**
```json
[
  {
    "id": "1",
    "name": "6 из 45",
    "type": "числовая",
    "ticketPrice": 100,
    "maxJackpot": 400000000,
    "currentJackpot": 320000000,
    "winProbability": 0.00001,
    "drawFrequency": "ежедневно",
    "description": "...",
    "rules": "...",
    "prizeStructure": [...],
    "isActive": true
  }
]
```

### Получить рекомендации
```http
POST /api/recommendations
```

Генерирует персонализированные рекомендации на основе предпочтений пользователя.

**Тело запроса:**
```json
{
  "preferences": {
    "ticketPrice": {
      "min": 50,
      "max": 200
    },
    "playFrequency": "ежедневно",
    "lotteryType": "числовая",
    "maxJackpot": {
      "min": 100000000,
      "max": 500000000
    },
    "winProbability": {
      "min": 0.00001,
      "max": 0.1
    }
  },
  "previousLotteryIds": ["1", "2"]
}
```

**Ответ:**
```json
{
  "recommendations": [
    {
      "lottery": {...},
      "matchScore": 95,
      "personalizedReason": "Идеальный выбор! Билет стоит 100 ₽...",
      "matchedCriteria": ["Цена билета", "Тип лотереи", "Размер джекпота"],
      "isNew": true
    }
  ],
  "totalMatches": 5,
  "averageMatchScore": 87.5
}
```

## Доменные типы

### LotteryType (enum)
- `"числовая"` - Числовая лотерея
- `"моментальная"` - Моментальная лотерея
- `"тиражная"` - Тиражная лотерея
- `"спортлото"` - Спортлото

### DrawFrequency (enum)
- `"ежедневно"` - Ежедневные розыгрыши
- `"несколько раз в неделю"` - Несколько раз в неделю
- `"еженедельно"` - Еженедельные розыгрыши
- `"раз в месяц"` - Ежемесячные розыгрыши

## Конфигурация

### Переменные окружения

- `PORT` - порт сервера (по умолчанию: 5001)

### CORS

По умолчанию разрешены запросы с:
- `http://localhost:5000` (frontend)
- `http://localhost:5001` (backend)

## Разработка

### Структура проекта

- **cmd/server/** - точка входа приложения
- **internal/domain/** - доменные типы и бизнес-модели
- **internal/service/** - бизнес-логика
- **internal/repository/** - работа с внешними API и хранилищами
- **internal/http/** - HTTP слой (handlers, middleware, routes)

### Принципы

1. **Разделение ответственности** - каждый слой отвечает за свою область
2. **Dependency Injection** - зависимости передаются через конструкторы
3. **Валидация** - все входные данные валидируются с помощью validator
4. **Обработка ошибок** - централизованная обработка ошибок в HTTP слое
5. **Graceful Shutdown** - корректное завершение работы сервера

## TODO

- [ ] Реализовать получение данных из StolotoAPI
- [ ] Портировать алгоритм рекомендаций из TypeScript
- [ ] Добавить кэширование данных о лотереях
- [ ] Реализовать сохранение параметров пользователя
- [ ] Добавить метрики и мониторинг
- [ ] Написать unit и integration тесты

## Лицензия

Apache-2.0
