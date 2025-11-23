import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Header } from "@/components/Header";
import { Tutorial } from "@/components/Tutorial";
import { useTutorial } from "@/hooks/useTutorial";
import Home from "@/pages/Home";
import Recommendations from "@/pages/Recommendations";
import SavedParametersPage from "@/pages/SavedParameters";
import LotteryDetail from "@/pages/LotteryDetail";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/recommendations" component={Recommendations} />
      <Route path="/saved" component={SavedParametersPage} />
      <Route path="/lottery/:id" component={LotteryDetail} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const tutorial = useTutorial();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          <Header onTutorialStart={tutorial.startTutorial} />
          <Router />
          <Tutorial
            isActive={tutorial.isActive}
            currentStep={tutorial.currentStep}
            steps={tutorial.steps}
            onNext={tutorial.nextStep}
            onPrevious={tutorial.previousStep}
            onClose={tutorial.skipTutorial}
          />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
