import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense } from "react";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

const Home = lazy(() => import("./pages/Home"));
const UserDashboard = lazy(() => import("./pages/UserDashboard"));
const PlansPage = lazy(() => import("./pages/PlansPage"));
const NodesPage = lazy(() => import("./pages/NodesPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const TicketsPage = lazy(() => import("./pages/TicketsPage"));
const ReferralsPage = lazy(() => import("./pages/ReferralsPage"));
const NoticesPage = lazy(() => import("./pages/NoticesPage"));
const NoticeDetailPage = lazy(() => import("./pages/NoticeDetailPage"));
const GoldenPage = lazy(() => import("./pages/GoldenPage"));
const SelfPage = lazy(() => import("./pages/SelfPage"));
const NodePage = lazy(() => import("./pages/NodePage"));
const LeaderPage = lazy(() => import("./pages/LeaderPage"));
const MemePage = lazy(() => import("./pages/MemePage"));
const InfluencerPage = lazy(() => import("./pages/InfluencerPage"));
const PlanDetailPage = lazy(() => import("./pages/PlanDetailPage"));
const FavoritesPage = lazy(() => import("./pages/FavoritesPage"));
const CbagPage = lazy(() => import("./pages/CbagPage"));
const AirdropPage = lazy(() => import("./pages/AirdropPage"));
const PartnersPage = lazy(() => import("./pages/PartnersPage"));
const ListingPage = lazy(() => import("./pages/ListingPage"));
const SubmitPlan = lazy(() => import("./pages/SubmitPlan"));
const VotePage = lazy(() => import("./pages/VotePage"));
const MySubmissions = lazy(() => import("./pages/MySubmissions"));
const About = lazy(() => import("./pages/About"));
const Introduction = lazy(() => import("./pages/Introduction"));
const FaqQnaPage = lazy(() => import("./pages/FaqQnaPage"));
const CartPage = lazy(() => import("./pages/CartPage"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const NotFound = lazy(() => import("./pages/NotFound"));

const AdminLogin = lazy(() => import("./pages/admin/Login"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminPlans = lazy(() => import("./pages/admin/Plans"));
const AdminNodes = lazy(() => import("./pages/admin/Nodes"));
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const AdminContent = lazy(() => import("./pages/admin/Content"));
const AdminTickets = lazy(() => import("./pages/admin/Tickets"));
const AdminAirdrops = lazy(() => import("./pages/admin/Airdrops"));
const AdminReferrals = lazy(() => import("./pages/admin/Referrals"));
const AdminAnalytics = lazy(() => import("./pages/admin/Analytics"));
const AdminSubAdmins = lazy(() => import("./pages/admin/SubAdmins"));
const AdminNotifications = lazy(() => import("./pages/admin/Notifications"));
const AdminAuditLogs = lazy(() => import("./pages/admin/AuditLogs"));
const AdminTelegramSchedules = lazy(() => import("./pages/admin/TelegramSchedules"));
const AdminMediaAssets = lazy(() => import("./pages/admin/MediaAssets"));
const AdminTrendingAlerts = lazy(() => import("./pages/admin/TrendingAlerts"));
const AdminListingRequests = lazy(() => import("./pages/admin/ListingRequests"));
const AdminPartners = lazy(() => import("./pages/admin/Partners"));
const AdminMyAccount = lazy(() => import("./pages/admin/MyAccount"));
const AdminSns = lazy(() => import("./pages/admin/Sns"));
const AdminAiPlanImport = lazy(() => import("./pages/admin/AiPlanImport"));
const AdminSubmissions = lazy(() => import("./pages/admin/Submissions"));
const AdminRewards = lazy(() => import("./pages/admin/Rewards"));
const AdminCbag = lazy(() => import("./pages/admin/Cbag"));
const AdminApiKeys = lazy(() => import("./pages/admin/ApiKeys"));
const WalletConnectModal = lazy(() =>
  import("./components/WalletConnectModal").then((module) => ({ default: module.WalletConnectModal }))
);

function Router() {
  return (
    <>
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={UserDashboard} />
      <Route path="/plans" component={PlansPage} />
      <Route path="/nodes" component={NodesPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/tickets" component={TicketsPage} />
      <Route path="/referrals" component={ReferralsPage} />
      <Route path="/notices" component={NoticesPage} />
      <Route path="/notices/:id" component={NoticeDetailPage} />
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
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable={true}>
        <TooltipProvider>
          <Toaster />
          <Suspense fallback={null}>
            <WalletConnectModal />
            <Router />
          </Suspense>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
