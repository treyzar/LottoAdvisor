package http

import (
	"log"
	"net/http"
	"runtime/debug"
	"time"
)

// LoggingMiddleware логирует информацию о каждом HTTP запросе
func LoggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		// Создаем ResponseWriter wrapper для захвата статус кода
		wrappedWriter := &responseWriter{
			ResponseWriter: w,
			statusCode:     http.StatusOK,
		}

		// Вызываем следующий обработчик
		next.ServeHTTP(wrappedWriter, r)

		// Логируем информацию о запросе
		log.Printf(
			"[%s] %s %s - %d - %v",
			r.Method,
			r.RequestURI,
			r.RemoteAddr,
			wrappedWriter.statusCode,
			time.Since(start),
		)
	})
}

// RecoveryMiddleware восстанавливает приложение после паники
func RecoveryMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				log.Printf("Паника: %v\n%s", err, debug.Stack())

				http.Error(w, "Внутренняя ошибка сервера", http.StatusInternalServerError)
			}
		}()

		next.ServeHTTP(w, r)
	})
}

// responseWriter оборачивает http.ResponseWriter для захвата статус кода
type responseWriter struct {
	http.ResponseWriter
	statusCode int
}

// WriteHeader перехватывает статус код
func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}
