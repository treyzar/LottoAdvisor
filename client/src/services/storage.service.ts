import Cookies from 'js-cookie';
import type { UserPreferences, SavedParameters } from '@shared/schema';

const STORAGE_KEYS = {
  CURRENT_PREFERENCES: 'stoloto_current_preferences',
  SAVED_PARAMETERS: 'stoloto_saved_parameters',
  TUTORIAL_COMPLETED: 'stoloto_tutorial_completed',
  LAST_VISIT: 'stoloto_last_visit',
} as const;

const COOKIE_KEYS = {
  USER_ID: 'stoloto_user_id',
} as const;

/**
 * Сервис для работы с localStorage и cookies
 * Управляет сохранением параметров пользователя и избранных наборов
 */
export class StorageService {
  // Генерация уникального ID пользователя
  static getUserId(): string {
    let userId = Cookies.get(COOKIE_KEYS.USER_ID);
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      Cookies.set(COOKIE_KEYS.USER_ID, userId, { expires: 365 }); // 1 год
    }
    return userId;
  }

  // Текущие предпочтения пользователя
  static getCurrentPreferences(): UserPreferences | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_PREFERENCES);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Ошибка при чтении предпочтений:', error);
      return null;
    }
  }

  static saveCurrentPreferences(preferences: UserPreferences): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_PREFERENCES, JSON.stringify(preferences));
      this.updateLastVisit();
    } catch (error) {
      console.error('Ошибка при сохранении предпочтений:', error);
    }
  }

  static clearCurrentPreferences(): void {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_PREFERENCES);
  }

  // Сохраненные наборы параметров
  static getSavedParameters(): SavedParameters[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SAVED_PARAMETERS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Ошибка при чтении сохраненных параметров:', error);
      return [];
    }
  }

  static saveParameters(params: Omit<SavedParameters, 'id' | 'savedAt'>): SavedParameters {
    try {
      const savedParams = this.getSavedParameters();
      const newParams: SavedParameters = {
        ...params,
        id: `params_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        savedAt: new Date().toISOString(),
      };
      savedParams.unshift(newParams); // Добавляем в начало (новые сверху)
      localStorage.setItem(STORAGE_KEYS.SAVED_PARAMETERS, JSON.stringify(savedParams));
      return newParams;
    } catch (error) {
      console.error('Ошибка при сохранении параметров:', error);
      throw error;
    }
  }

  static updateSavedParameters(id: string, lotteryIds: string[]): void {
    try {
      const savedParams = this.getSavedParameters();
      const index = savedParams.findIndex(p => p.id === id);
      if (index !== -1) {
        savedParams[index].lotteryIds = lotteryIds;
        localStorage.setItem(STORAGE_KEYS.SAVED_PARAMETERS, JSON.stringify(savedParams));
      }
    } catch (error) {
      console.error('Ошибка при обновлении сохраненных параметров:', error);
    }
  }

  static deleteSavedParameters(id: string): void {
    try {
      const savedParams = this.getSavedParameters();
      const filtered = savedParams.filter(p => p.id !== id);
      localStorage.setItem(STORAGE_KEYS.SAVED_PARAMETERS, JSON.stringify(filtered));
    } catch (error) {
      console.error('Ошибка при удалении сохраненных параметров:', error);
    }
  }

  static getSavedParametersById(id: string): SavedParameters | null {
    const savedParams = this.getSavedParameters();
    return savedParams.find(p => p.id === id) || null;
  }

  // Статус обучения
  static isTutorialCompleted(): boolean {
    return localStorage.getItem(STORAGE_KEYS.TUTORIAL_COMPLETED) === 'true';
  }

  static setTutorialCompleted(completed: boolean): void {
    localStorage.setItem(STORAGE_KEYS.TUTORIAL_COMPLETED, completed.toString());
  }

  // Последний визит
  static getLastVisit(): string | null {
    return localStorage.getItem(STORAGE_KEYS.LAST_VISIT);
  }

  static updateLastVisit(): void {
    localStorage.setItem(STORAGE_KEYS.LAST_VISIT, new Date().toISOString());
  }

  // Проверка первого визита
  static isFirstVisit(): boolean {
    return !this.getLastVisit();
  }

  // Очистка всех данных
  static clearAll(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    Cookies.remove(COOKIE_KEYS.USER_ID);
  }
}
