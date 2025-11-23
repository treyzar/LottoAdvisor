package main

import (
        "context"
        "fmt"
        "log"
        "net/http"
        "os"
        "os/signal"
        "syscall"
        "time"

        "github.com/go-chi/chi/v5"
        "github.com/go-chi/chi/v5/middleware"
        "github.com/go-chi/cors"
        "github.com/go-playground/validator/v10"

        apphttp "github.com/stoloto-recommendations/backend/internal/http"
        "github.com/stoloto-recommendations/backend/internal/repository"
        "github.com/stoloto-recommendations/backend/internal/service"
)

const (
        defaultPort          = "5001"
        defaultStolotoAPIURL = "http://localhost:8080"
        shutdownTimeout      = 10 * time.Second
)

func main() {
        // Инициализация валидатора
        validate := validator.New()

        // Получение URL StolotoAPI из переменных окружения или использование значения по умолчанию
        stolotoAPIBaseURL := os.Getenv("STOLOTO_API_URL")
        if stolotoAPIBaseURL == "" {
                stolotoAPIBaseURL = defaultStolotoAPIURL
        }
        log.Printf("Using Stoloto API URL: %s", stolotoAPIBaseURL)

        // Инициализация HTTP клиента для StolotoAPI
        stolotoClient := repository.NewStolotoClient(stolotoAPIBaseURL)

        // Инициализация сервисов
        stolotoService := service.NewStolotoService(stolotoClient)
        recommendationService := service.NewRecommendationService()

        // Инициализация HTTP handlers
        handler := apphttp.NewHandler(stolotoService, recommendationService, validate)

        // Создание роутера
        r := chi.NewRouter()

        // Middleware
        r.Use(middleware.RequestID)
        r.Use(middleware.RealIP)
        r.Use(middleware.Logger)
        r.Use(middleware.Recoverer)
        r.Use(middleware.Timeout(30 * time.Second)) // Таймаут 30 секунд на запрос

        // CORS конфигурация
        r.Use(cors.Handler(cors.Options{
                AllowedOrigins:   []string{"http://localhost:5000", "http://localhost:5001"},
                AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
                AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
                ExposedHeaders:   []string{"Link"},
                AllowCredentials: true,
                MaxAge:           300,
        }))

        // Регистрация маршрутов
        apphttp.RegisterRoutes(r, handler)

        // Получение порта из переменных окружения или использование значения по умолчанию
        port := os.Getenv("PORT")
        if port == "" {
                port = defaultPort
        }

        // Создание HTTP сервера
        srv := &http.Server{
                Addr:         fmt.Sprintf("0.0.0.0:%s", port),
                Handler:      r,
                ReadTimeout:  15 * time.Second,
                WriteTimeout: 15 * time.Second,
                IdleTimeout:  60 * time.Second,
        }

        // Запуск сервера в отдельной горутине
        go func() {
                log.Printf("🚀 Сервер запущен на порту %s", port)
                if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
                        log.Fatalf("Ошибка запуска сервера: %v", err)
                }
        }()

        // Graceful shutdown
        quit := make(chan os.Signal, 1)
        signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
        <-quit

        log.Println("🛑 Остановка сервера...")

        ctx, cancel := context.WithTimeout(context.Background(), shutdownTimeout)
        defer cancel()

        if err := srv.Shutdown(ctx); err != nil {
                log.Fatalf("Ошибка при остановке сервера: %v", err)
        }

        log.Println("✅ Сервер остановлен корректно")
}
