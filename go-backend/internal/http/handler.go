package http

import (
        "encoding/json"
        "fmt"
        "net/http"

        "github.com/go-chi/chi/v5"
        "github.com/go-playground/validator/v10"

        "github.com/stoloto-recommendations/backend/internal/domain"
        "github.com/stoloto-recommendations/backend/internal/service"
)

// Handler содержит обработчики HTTP запросов
type Handler struct {
        stolotoService        *service.StolotoService
        recommendationService *service.RecommendationService
        validate              *validator.Validate
}

// NewHandler создает новый экземпляр Handler
func NewHandler(
        stolotoService *service.StolotoService,
        recommendationService *service.RecommendationService,
        validate *validator.Validate,
) *Handler {
        return &Handler{
                stolotoService:        stolotoService,
                recommendationService: recommendationService,
                validate:              validate,
        }
}

// ErrorResponse представляет ответ с ошибкой
type ErrorResponse struct {
        Error   string `json:"error"`
        Message string `json:"message,omitempty"`
}

// RespondWithJSON отправляет JSON ответ
func RespondWithJSON(w http.ResponseWriter, code int, payload interface{}) {
        w.Header().Set("Content-Type", "application/json")
        w.WriteHeader(code)
        if err := json.NewEncoder(w).Encode(payload); err != nil {
                http.Error(w, err.Error(), http.StatusInternalServerError)
        }
}

// RespondWithError отправляет ответ с ошибкой
func RespondWithError(w http.ResponseWriter, code int, message string) {
        RespondWithJSON(w, code, ErrorResponse{
                Error:   http.StatusText(code),
                Message: message,
        })
}

// HealthCheck проверяет статус сервера
func (h *Handler) HealthCheck(w http.ResponseWriter, r *http.Request) {
        RespondWithJSON(w, http.StatusOK, map[string]string{
                "status":  "ok",
                "service": "stoloto-recommendations-backend",
        })
}

// GetAllLotteries возвращает все доступные лотереи
func (h *Handler) GetAllLotteries(w http.ResponseWriter, r *http.Request) {
        ctx := r.Context()

        lotteries, err := h.stolotoService.GetAllLotteries(ctx)
        if err != nil {
                RespondWithError(w, http.StatusInternalServerError, "Ошибка получения списка лотерей")
                return
        }

        RespondWithJSON(w, http.StatusOK, lotteries)
}

// GetLotteryByID возвращает информацию о конкретной лотерее
func (h *Handler) GetLotteryByID(w http.ResponseWriter, r *http.Request) {
        ctx := r.Context()
        
        // Извлекаем ID из URL параметра
        id := chi.URLParam(r, "id")
        if id == "" {
                RespondWithError(w, http.StatusBadRequest, "ID лотереи не указан")
                return
        }

        lottery, err := h.stolotoService.GetLotteryByID(ctx, id)
        if err != nil {
                RespondWithError(w, http.StatusNotFound, fmt.Sprintf("Лотерея с ID %s не найдена", id))
                return
        }

        RespondWithJSON(w, http.StatusOK, lottery)
}

// GetRecommendations возвращает персонализированные рекомендации
func (h *Handler) GetRecommendations(w http.ResponseWriter, r *http.Request) {
        ctx := r.Context()

        var request domain.RecommendationRequest
        if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
                RespondWithError(w, http.StatusBadRequest, "Некорректный формат запроса")
                return
        }

        // Валидация запроса
        if err := h.validate.Struct(request); err != nil {
                RespondWithError(w, http.StatusBadRequest, "Ошибка валидации: "+err.Error())
                return
        }

        // Получаем все активные лотереи
        allLotteries, err := h.stolotoService.GetActiveLotteries(ctx)
        if err != nil {
                RespondWithError(w, http.StatusInternalServerError, "Ошибка получения данных о лотереях")
                return
        }

        // Генерируем рекомендации
        recommendations, err := h.recommendationService.GenerateRecommendations(ctx, request, allLotteries)
        if err != nil {
                RespondWithError(w, http.StatusInternalServerError, "Ошибка генерации рекомендаций")
                return
        }

        RespondWithJSON(w, http.StatusOK, recommendations)
}

// FilterLotteries фильтрует лотереи по заданным критериям
func (h *Handler) FilterLotteries(w http.ResponseWriter, r *http.Request) {
        ctx := r.Context()

        var criteria domain.FilterCriteria
        if err := json.NewDecoder(r.Body).Decode(&criteria); err != nil {
                RespondWithError(w, http.StatusBadRequest, "Некорректный формат запроса")
                return
        }

        // Валидация критериев
        if err := h.validate.Struct(criteria); err != nil {
                RespondWithError(w, http.StatusBadRequest, "Ошибка валидации: "+err.Error())
                return
        }

        // Фильтруем лотереи
        lotteries, err := h.stolotoService.FilterLotteries(ctx, criteria)
        if err != nil {
                RespondWithError(w, http.StatusInternalServerError, "Ошибка фильтрации лотерей")
                return
        }

        RespondWithJSON(w, http.StatusOK, lotteries)
}
