import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminPlans from "./pages/admin/Plans";
import AdminNodes from "./pages/admin/Nodes";
import AdminUsers from "./pages/admin/Users";
import AdminContent from "./pages/admin/Content";
import AdminTickets from "./pages/admin/Tickets";
import AdminAirdrops from "./pages/admin/Airdrops";
import AdminReferrals from "./pages/admin/Referrals";
import AdminAnalytics from "./pages/admin/Analytics";
import AdminSubAdmins from "./pages/admin/SubAdmins";
import UserDashboard from "./pages/UserDashboard";
import PlansPage from "./pages/PlansPage";
import NodesPage from "./pages/NodesPage";
import ProfilePage from "./pages/ProfilePage";
import TicketsPage from "./pages/TicketsPage";
import ReferralsPage from "./pages/ReferralsPage";
import NoticesPage from "./pages/NoticesPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={UserDashboard} />
      <Route path="/plans" component={PlansPage} />
      <Route path="/nodes" component={NodesPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/tickets" component={TicketsPage} />
      <Route path="/referrals" component={ReferralsPage} />
      <Route path="/notices" component={NoticesPage} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/plans" component={AdminPlans} />
      <Route path="/admin/nodes" component={AdminNodes} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/content" component={AdminContent} />
      <Route path="/admin/tickets" component={AdminTickets} />
      <Route path="/admin/airdrops" component={AdminAirdrops} />
      <Route path="/admin/referrals" component={AdminReferrals} />
      <Route path="/admin/analytics" component={AdminAnalytics} />
      <Route path="/admin/sub-admins" component={AdminSubAdmins} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
