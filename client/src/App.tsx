import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Volunteers from "./pages/Volunteers";
import VolunteerProfile from "./pages/VolunteerProfile";
import Networks from "./pages/Networks";
import Ministries from "./pages/Ministries";
import Events from "./pages/Events";
import Schedules from "./pages/Schedules";
import Checkins from "./pages/Checkins";
import Notifications from "./pages/Notifications";
import Reports from "./pages/Reports";
import MyProfile from "./pages/MyProfile";
import MySchedule from "./pages/MySchedule";
import LiveMonitor from "./pages/LiveMonitor";
import NextService from "./pages/NextService";
import Bulletin from "./pages/Bulletin";
import MyHistory from "./pages/MyHistory";
import QRCheckin from "./pages/QRCheckin";
import ImportVolunteers from "./pages/ImportVolunteers";
import { PWAInstallBanner } from "./components/PWAInstallBanner";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/volunteers" component={Volunteers} />
      <Route path="/volunteers/:id" component={VolunteerProfile} />
      <Route path="/networks" component={Networks} />
      <Route path="/ministries" component={Ministries} />
      <Route path="/events" component={Events} />
      <Route path="/schedules" component={Schedules} />
      <Route path="/checkins" component={Checkins} />
      <Route path="/live-monitor" component={LiveMonitor} />
      <Route path="/notifications" component={Notifications} />
      <Route path="/reports" component={Reports} />
      <Route path="/my-profile" component={MyProfile} />
      <Route path="/my-schedule" component={MySchedule} />
      <Route path="/next-service" component={NextService} />
      <Route path="/bulletin" component={Bulletin} />
      <Route path="/my-history" component={MyHistory} />
      <Route path="/qr-checkin" component={QRCheckin} />
      <Route path="/import-volunteers" component={ImportVolunteers} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <Router />
          <PWAInstallBanner />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
