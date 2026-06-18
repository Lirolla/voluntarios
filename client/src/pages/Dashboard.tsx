import { useAuth } from "@/_core/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import {
  Bell,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Clock,
  Star,
  Users,
} from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  loading,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
  loading?: boolean;
}) {
  return (
    <Card className="card-premium">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium mb-1">{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-3xl font-bold text-foreground">{value.toLocaleString("pt-BR")}</p>
            )}
          </div>
          <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center", color)}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = getLoginUrl();
    }
  }, [user, authLoading, navigate]);

  const { data: stats, isLoading: statsLoading } = trpc.reports.dashboard.useQuery(undefined, { enabled: !!user });
  const { data: events, isLoading: eventsLoading } = trpc.events.list.useQuery({ status: "upcoming" }, { enabled: !!user });
  const { data: notifications } = trpc.notifications.list.useQuery(undefined, { enabled: !!user });
  const { data: birthdays } = trpc.birthdays.upcoming.useQuery(undefined, { enabled: !!user && user.role === 'admin' });

  const isAdmin = user?.role === "admin";
  const unreadNotifs = notifications?.filter((n) => !n.read) ?? [];

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">
            Bom dia, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>

        {/* Stats (admin only) */}
        {isAdmin && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              title="Voluntários Ativos"
              value={stats?.totalVolunteers ?? 0}
              icon={Users}
              color="bg-indigo-100 text-indigo-600"
              loading={statsLoading}
            />
            <StatCard
              title="Total de Eventos"
              value={stats?.totalEvents ?? 0}
              icon={CalendarDays}
              color="bg-emerald-100 text-emerald-600"
              loading={statsLoading}
            />
            <StatCard
              title="Check-ins Realizados"
              value={stats?.totalCheckins ?? 0}
              icon={CalendarCheck}
              color="bg-amber-100 text-amber-600"
              loading={statsLoading}
            />
            <StatCard
              title="Próximos Eventos"
              value={stats?.upcomingEvents ?? 0}
              icon={Clock}
              color="bg-purple-100 text-purple-600"
              loading={statsLoading}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming Events */}
          <div className="lg:col-span-2">
            <Card className="card-premium">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-primary" />
                  Próximos Eventos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {eventsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-lg" />
                    ))}
                  </div>
                ) : events && events.length > 0 ? (
                  <div className="space-y-3">
                    {events.slice(0, 5).map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex flex-col items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-primary leading-none">
                            {format(new Date(event.startAt), "dd")}
                          </span>
                          <span className="text-xs text-primary/70 uppercase leading-none">
                            {format(new Date(event.startAt), "MMM", { locale: ptBR })}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-foreground truncate">{event.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {event.location ?? "Local a definir"} · {format(new Date(event.startAt), "HH:mm")}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 flex-shrink-0"
                        >
                          Em breve
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CalendarDays className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Nenhum evento próximo</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Birthdays */}
          {isAdmin && birthdays && birthdays.length > 0 && (
            <div className="lg:col-span-3 mt-2">
              <Card className="card-premium border-amber-100">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500" />
                    Aniversariantes da Semana
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {(birthdays as any[]).map((v) => (
                      <div key={v.id} className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-100">
                        <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center text-amber-700 font-bold text-sm">
                          {v.name?.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">{v.name}</p>
                          {v.birthdate && (
                            <p className="text-xs text-amber-600">
                              {format(new Date(v.birthdate), "dd/MM", { locale: ptBR })}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          {/* Notifications */}
          <div>
            <Card className="card-premium">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary" />
                  Notificações
                  {unreadNotifs.length > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {unreadNotifs.length}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {unreadNotifs.length > 0 ? (
                  <div className="space-y-3">
                    {unreadNotifs.slice(0, 5).map((notif) => (
                      <div key={notif.id} className="flex gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                        <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{notif.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Tudo em dia!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
