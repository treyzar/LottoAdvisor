package http

import (
        "github.com/go-chi/chi/v5"
)

// RegisterRoutes регистрирует все HTTP маршруты приложения
func RegisterRoutes(r chi.Router, h *Handler) {
        // Health check
        r.Get("/health", h.HealthCheck)

        // API routes
        r.Route("/api", func(r chi.Router) {
                // Лотереи
                r.Route("/lotteries", func(r chi.Router) {
                        r.Get("/", h.GetAllLotteries)    // GET /api/lotteries - все лотереи
                        r.Get("/{id}", h.GetLotteryByID) // GET /api/lotteries/{id} - конкретная лотерея
                })

                // Рекомендации
                r.Route("/recommendations", func(r chi.Router) {
                        r.Post("/", h.GetRecommendations) // POST /api/recommendations - получить рекомендации
                })

                // Фильтрация
                r.Post("/filter", h.FilterLotteries) // POST /api/filter - фильтр лотерей
        })
}
