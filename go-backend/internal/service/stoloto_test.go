package service

import (
        "context"
        "testing"

        "github.com/stoloto-recommendations/backend/internal/domain"
        "github.com/stoloto-recommendations/backend/internal/repository"
)

// TestGetAllLotteriesNeverFails проверяет что GetAllLotteries НИКОГДА не возвращает ошибку
// Даже если StolotoAPI недоступен, метод возвращает моковые данные
func TestGetAllLotteriesNeverFails(t *testing.T) {
        // Создаём клиент с несуществующим URL (чтобы гарантированно получить ошибку)
        client := repository.NewStolotoClient("http://non-existent-url-that-will-fail:99999")
        service := NewStolotoService(client)
        ctx := context.Background()

        // Вызываем GetAllLotteries
        lotteries, err := service.GetAllLotteries(ctx)

        // КРИТИЧЕСКОЕ ТРЕБОВАНИЕ: ошибки НЕТ
        if err != nil {
                t.Fatalf("GetAllLotteries не должна возвращать ошибку даже если API недоступен, получено: %v", err)
        }

        // КРИТИЧЕСКОЕ ТРЕБОВАНИЕ: данные ЕСТЬ (моки)
        if len(lotteries) == 0 {
                t.Fatal("GetAllLotteries должна вернуть моковые данные если API недоступен, получен пустой массив")
        }

        // Проверяем что это действительно моковые данные
        if lotteries[0].ID == "" {
                t.Error("Моковые данные должны иметь валидные ID")
        }

        t.Logf("✅ GetAllLotteries successfully returned %d mock lotteries when API unavailable", len(lotteries))
}

// TestGetActiveLotteriesWithFallback проверяет что GetActiveLotteries работает с fallback
func TestGetActiveLotteriesWithFallback(t *testing.T) {
        // Создаём клиент с несуществующим URL
        client := repository.NewStolotoClient("http://non-existent-url:99999")
        service := NewStolotoService(client)
        ctx := context.Background()

        // Вызываем GetActiveLotteries
        lotteries, err := service.GetActiveLotteries(ctx)

        // Не должно быть ошибки
        if err != nil {
                t.Fatalf("GetActiveLotteries не должна возвращать ошибку даже если API недоступен, получено: %v", err)
        }

        // Должны быть данные (моки)
        if len(lotteries) == 0 {
                t.Fatal("GetActiveLotteries должна вернуть моковые данные если API недоступен")
        }

        // Все лотереи должны быть активными
        for _, lottery := range lotteries {
                if !lottery.IsActive {
                        t.Errorf("GetActiveLotteries вернула неактивную лотерею: %s", lottery.Name)
                }
        }

        t.Logf("✅ GetActiveLotteries successfully returned %d active mock lotteries when API unavailable", len(lotteries))
}

// TestFilterLotteriesWithFallback проверяет что FilterLotteries работает с fallback
func TestFilterLotteriesWithFallback(t *testing.T) {
        // Создаём клиент с несуществующим URL
        client := repository.NewStolotoClient("http://non-existent-url:99999")
        service := NewStolotoService(client)
        ctx := context.Background()

        // Создаём критерии фильтрации
        minPrice := 50.0
        maxPrice := 150.0
        criteria := domain.FilterCriteria{
                TicketPrice: &domain.PriceRange{
                        Min: minPrice,
                        Max: maxPrice,
                },
        }

        // Вызываем FilterLotteries
        lotteries, err := service.FilterLotteries(ctx, criteria)

        // Не должно быть ошибки
        if err != nil {
                t.Fatalf("FilterLotteries не должна возвращать ошибку даже если API недоступен, получено: %v", err)
        }

        // Данные могут быть пустыми если ни одна моковая лотерея не подходит под критерии
        // но это НЕ ошибка - это валидный результат фильтрации

        // Если есть результаты, проверяем что они соответствуют критериям
        for _, lottery := range lotteries {
                if lottery.TicketPrice < minPrice || lottery.TicketPrice > maxPrice {
                        t.Errorf("FilterLotteries вернула лотерею вне критериев: %s (цена: %.0f, ожидается: %.0f-%.0f)",
                                lottery.Name, lottery.TicketPrice, minPrice, maxPrice)
                }
        }

        t.Logf("✅ FilterLotteries successfully returned %d filtered mock lotteries when API unavailable", len(lotteries))
}

// TestGetLotteryByIDWithFallback проверяет что GetLotteryByID работает с fallback
func TestGetLotteryByIDWithFallback(t *testing.T) {
        // Создаём клиент с несуществующим URL
        client := repository.NewStolotoClient("http://non-existent-url:99999")
        service := NewStolotoService(client)
        ctx := context.Background()

        // Получаем все моковые лотереи чтобы знать валидный ID
        allLotteries, _ := service.GetAllLotteries(ctx)
        if len(allLotteries) == 0 {
                t.Fatal("Не удалось получить моковые лотереи для теста")
        }

        validID := allLotteries[0].ID

        // Вызываем GetLotteryByID с валидным ID
        lottery, err := service.GetLotteryByID(ctx, validID)

        // Не должно быть ошибки для валидного ID
        if err != nil {
                t.Fatalf("GetLotteryByID не должна возвращать ошибку для валидного ID даже если API недоступен, получено: %v", err)
        }

        // Должны получить лотерею
        if lottery == nil {
                t.Fatal("GetLotteryByID должна вернуть лотерею для валидного ID")
        }

        if lottery.ID != validID {
                t.Errorf("GetLotteryByID вернула неправильную лотерею: ожидается %s, получено %s", validID, lottery.ID)
        }

        // Тестируем несуществующий ID
        nonExistentID := "non-existent-lottery-id-12345"
        lottery, err = service.GetLotteryByID(ctx, nonExistentID)

        // ДОЛЖНА быть ошибка для несуществующего ID (это правильное поведение!)
        if err == nil {
                t.Error("GetLotteryByID должна возвращать ошибку для несуществующего ID")
        }

        if lottery != nil {
                t.Error("GetLotteryByID не должна возвращать лотерею для несуществующего ID")
        }

        t.Logf("✅ GetLotteryByID correctly handles both valid and invalid IDs with fallback data")
}
