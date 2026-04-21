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
import AdminNotifications from "./pages/admin/Notifications";
import AdminAuditLogs from "./pages/admin/AuditLogs";
import AdminTelegramSchedules from "./pages/admin/TelegramSchedules";
import AdminMediaAssets from "./pages/admin/MediaAssets";
import AdminTrendingAlerts from "./pages/admin/TrendingAlerts";
import CbagPage from "./pages/CbagPage";
import AirdropPage from "./pages/AirdropPage";
import PartnersPage from "./pages/PartnersPage";
import ListingPage from "./pages/ListingPage";
import AdminListingRequests from "./pages/admin/ListingRequests";
import AdminPartners from "./pages/admin/Partners";
import UserDashboard from "./pages/UserDashboard";
import PlansPage from "./pages/PlansPage";
import NodesPage from "./pages/NodesPage";
import ProfilePage from "./pages/ProfilePage";
import TicketsPage from "./pages/TicketsPage";
import ReferralsPage from "./pages/ReferralsPage";
import NoticesPage from "./pages/NoticesPage";
import AdminLogin from "./pages/admin/Login";
import AdminMyAccount from "./pages/admin/MyAccount";
import AdminSns from "./pages/admin/Sns";
import AdminAiPlanImport from "./pages/admin/AiPlanImport";
import SubmitPlan from "./pages/SubmitPlan";
import VotePage from "./pages/VotePage";
import MySubmissions from "./pages/MySubmissions";
import AdminSubmissions from "./pages/admin/Submissions";
import AdminRewards from "./pages/admin/Rewards";
import AdminCbag from "./pages/admin/Cbag";
import AdminApiKeys from "./pages/admin/ApiKeys";
import AdminSiteSettings from "./pages/admin/AdminSiteSettings";
import AdminLegal from "./pages/admin/AdminLegal";
import AdminNews from "./pages/admin/AdminNews";
import AdminLiveStreams from "./pages/admin/AdminLiveStreams";
import AdminEvents from "./pages/admin/AdminEvents";
import { WalletConnectModal } from "./components/WalletConnectModal";
import GoldenPage from "./pages/GoldenPage";
import SelfPage from "./pages/SelfPage";
import NodePage from "./pages/NodePage";
import LeaderPage from "./pages/LeaderPage";
import MemePage from "./pages/MemePage";
import InfluencerPage from "./pages/InfluencerPage";
import PlanDetailPage from "./pages/PlanDetailPage";
import FavoritesPage from "./pages/FavoritesPage";
import About from "./pages/About";
import Introduction from "./pages/Introduction";
import FaqQnaPage from "./pages/FaqQnaPage";
import CartPage from "./pages/CartPage";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";

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
      <Route path="/golden" component={GoldenPage} />
      <Route path="/self" component={SelfPage} />
      <Route path="/node" component={NodePage} />
      <Route path="/leader" component={LeaderPage} />
      <Route path="/meme" component={MemePage} />
      <Route path="/influencer" component={InfluencerPage} />
      <Route path="/plan/:id" component={PlanDetailPage} />
      <Route path="/favorites" component={FavoritesPage} />
      <Route path="/cbag" component={CbagPage} />
      <Route path="/airdrop" component={AirdropPage} />
      <Route path="/partners" component={PartnersPage} />
      <Route path="/listing" component={ListingPage} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/plans" component={AdminPlans} />
      <Route path="/admin/nodes" component={AdminNodes} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/content" component={AdminContent} />
      <Route path="/admin/tickets" component={AdminTickets} />
      <Route path="/admin/airdrops" component={AdminAirdrops} />
      <Route path="/admin/referrals" component={AdminReferrals} />
      <Route path="/admin/analytics" component={AdminAnalytics} />
      <Route path="/admin/sub-admins" component={AdminSubAdmins} />
      <Route path="/admin/notifications" component={AdminNotifications} />
      <Route path="/admin/audit-logs" component={AdminAuditLogs} />
      <Route path="/admin/telegram-schedules" component={AdminTelegramSchedules} />
      <Route path="/admin/media-assets" component={AdminMediaAssets} />
      <Route path="/admin/trending-alerts" component={AdminTrendingAlerts} />
      <Route path="/admin/listing-requests" component={AdminListingRequests} />
      <Route path="/admin/partners" component={AdminPartners} />
      <Route path="/admin/my-account" component={AdminMyAccount} />
      <Route path="/admin/sns" component={AdminSns} />
      <Route path="/admin/ai-plan-import" component={AdminAiPlanImport} />
      <Route path="/admin/submissions" component={AdminSubmissions} />
      <Route path="/admin/rewards" component={AdminRewards} />
      <Route path="/admin/cbag" component={AdminCbag} />
      <Route path="/admin/api-keys" component={AdminApiKeys} />
      <Route path="/admin/site-settings" component={AdminSiteSettings} />
      <Route path="/admin/legal" component={AdminLegal} />
      <Route path="/admin/news" component={AdminNews} />
      <Route path="/admin/live-streams" component={AdminLiveStreams} />
      <Route path="/admin/events" component={AdminEvents} />
      <Route path="/submit-plan" component={SubmitPlan} />
      <Route path="/vote" component={VotePage} />
      <Route path="/my-submissions" component={MySubmissions} />
      <Route path="/about" component={About} />
      <Route path="/introduction" component={Introduction} />
      <Route path="/faq" component={FaqQnaPage} />
      <Route path="/cart" component={CartPage} />
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable={true}>
        <TooltipProvider>
          <Toaster />
          <WalletConnectModal />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
