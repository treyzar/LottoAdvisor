import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { HelpCircle, Home, Bookmark } from 'lucide-react';

interface HeaderProps {
  onTutorialStart: () => void;
}

export function Header({ onTutorialStart }: HeaderProps) {
  const [location] = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        {/* Логотип СтоЛото */}
        <Link href="/">
          <div className="flex items-center gap-2 hover-elevate active-elevate-2 rounded-lg px-3 py-2 transition-all cursor-pointer">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <span className="font-serif text-xl font-bold text-primary-foreground">СЛ</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="font-serif text-xl font-bold text-foreground">СтоЛото</h1>
              <p className="text-xs text-muted-foreground">Система рекомендаций</p>
            </div>
          </div>
        </Link>

        {/* Навигация */}
        <nav className="flex items-center gap-2">
          <Link href="/" data-tutorial="welcome">
            <Button
              variant={location === '/' ? 'default' : 'ghost'}
              size="sm"
              className="gap-2"
              data-testid="nav-home"
            >
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Главная</span>
            </Button>
          </Link>

          <Link href="/saved" data-tutorial="saved-params">
            <Button
              variant={location === '/saved' ? 'default' : 'ghost'}
              size="sm"
              className="gap-2"
              data-testid="nav-saved"
            >
              <Bookmark className="h-4 w-4" />
              <span className="hidden sm:inline">Мои параметры</span>
            </Button>
          </Link>

          <Button
            variant="ghost"
            size="icon"
            onClick={onTutorialStart}
            data-tutorial="help-button"
            data-testid="button-tutorial"
            className="ml-2"
          >
            <HelpCircle className="h-5 w-5" />
            <span className="sr-only">Помощь</span>
          </Button>
        </nav>
      </div>
    </header>
  );
}
