import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import {
  Activity,
  Bell,
  BookOpen,
  Building2,
  CalendarCheck,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Network,
  QrCode,
  Settings,
  Shield,
  Star,
  Upload,
  User,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { getLoginUrl } from "@/const";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Voluntários", href: "/volunteers", icon: Users, adminOnly: true },
  { label: "Redes", href: "/networks", icon: Network, adminOnly: true },
  { label: "Ministérios", href: "/ministries", icon: Building2, adminOnly: true },
  { label: "Eventos", href: "/events", icon: CalendarDays, adminOnly: true },
  { label: "Escalas", href: "/schedules", icon: ClipboardList, adminOnly: true },
  { label: "Check-in", href: "/checkins", icon: CalendarCheck },
  { label: "Monitor ao Vivo", href: "/live-monitor", icon: Activity, adminOnly: true },
  { label: "Notificações", href: "/notifications", icon: Bell },
  { label: "Relatórios", href: "/reports", icon: BookOpen, adminOnly: true },
  { label: "Mural de Avisos", href: "/bulletin", icon: Megaphone, adminOnly: true },
  { label: "Importar CSV", href: "/import-volunteers", icon: Upload, adminOnly: true },
];

const volunteerNavItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Próximo Serviço", href: "/next-service", icon: CalendarDays },
  { label: "Minha Escala", href: "/my-schedule", icon: ClipboardList },
  { label: "Check-in", href: "/checkins", icon: CalendarCheck },
  { label: "Mural de Avisos", href: "/bulletin", icon: Megaphone },
  { label: "Meu Histórico", href: "/my-history", icon: BookOpen },
  { label: "Notificações", href: "/notifications", icon: Bell },
  { label: "Meu Perfil", href: "/my-profile", icon: User },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "admin";
  const items = isAdmin ? navItems : volunteerNavItems;

  const { data: notifData } = trpc.notifications.list.useQuery(undefined, { enabled: !!user });
  const unreadCount = notifData?.filter((n) => !n.read).length ?? 0;

  return (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sidebar-primary/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-sidebar-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm text-sidebar-foreground leading-tight">Cathedral</p>
            <p className="text-xs text-sidebar-foreground/50">Voluntários</p>
          </div>
        </div>
      </div>

      {/* Role badge */}
      <div className="px-6 pt-4 pb-2">
        <Badge
          variant="outline"
          className={cn(
            "text-xs border-sidebar-border",
            isAdmin
              ? "bg-sidebar-primary/20 text-sidebar-primary border-sidebar-primary/30"
              : "bg-sidebar-accent text-sidebar-accent-foreground"
          )}
        >
          {isAdmin ? "Administrador" : "Voluntário"}
        </Badge>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {items.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <button
                onClick={onNavigate}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.label === "Notificações" && unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
                {isActive && <ChevronRight className="w-3 h-3 opacity-60" />}
              </button>
            </Link>
          );
        })}
      </nav>

      <Separator className="bg-sidebar-border" />

      {/* User section */}
      <div className="px-3 py-4">
        {user ? (
          <div className="flex items-center gap-3 px-3 py-2">
            <Avatar className="w-8 h-8">
              <AvatarImage src={undefined} />
              <AvatarFallback className="bg-sidebar-primary/20 text-sidebar-primary text-xs font-semibold">
                {user.name?.slice(0, 2).toUpperCase() ?? "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{user.name}</p>
              <p className="text-xs text-sidebar-foreground/50 truncate">{user.email}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={() => logout()}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <Button
            className="w-full bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
            onClick={() => (window.location.href = getLoginUrl())}
          >
            Entrar
          </Button>
        )}
      </div>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 flex-col border-r border-border">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-64 bg-sidebar border-sidebar-border">
          <SidebarContent onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-background">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="w-9 h-9">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
          </Sheet>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-semibold text-sm">Cathedral Volunteers</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
