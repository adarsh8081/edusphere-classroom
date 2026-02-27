import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/AuthPage";
import Dashboard from "@/pages/Dashboard";
import ClassView from "@/pages/ClassView";
import ParentDashboard from "@/pages/ParentDashboard";
import Messaging from "@/pages/Messaging";
import NotificationSettings from "@/pages/NotificationSettings";
import ParentInvitationPage from "@/pages/ParentInvitationPage";
import AdminDashboard from "@/pages/AdminDashboard";
import { useAuth } from "@/hooks/use-auth";

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
    </div>;
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return <Component {...rest} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={AuthPage} />
      <Route path="/">
        {() => (
          <ProtectedRoute
            component={() => {
              const { user } = useAuth();
              if (user?.role === "super_admin") {
                return <Redirect to="/admin" />;
              }
              if (user?.role === "parent") {
                return <ParentDashboard />;
              }
              return <Dashboard />;
            }}
          />
        )}
      </Route>
      <Route path="/admin">
        {() => <ProtectedRoute component={AdminDashboard} />}
      </Route>
      <Route path="/class/:classId">
        {() => <ProtectedRoute component={ClassView} />}
      </Route>
      <Route path="/messages">
        {() => <ProtectedRoute component={Messaging} />}
      </Route>
      <Route path="/settings/notifications">
        {() => <ProtectedRoute component={NotificationSettings} />}
      </Route>
      <Route path="/parent/register" component={ParentInvitationPage} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
