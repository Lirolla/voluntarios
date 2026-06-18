import { useAuth } from "@/_core/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Activity, MapPin, Star, Users, Clock, TrendingUp,
  AlertTriangle, CheckCircle2, LogIn
} from "lucide-react";
import { useEffect } from "react";
import { getLoginUrl } from "@/const";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

// ─── GPS Map Link ─────────────────────────────────────────────────────────────
function MapLink({ lat, lng, address }: { lat?: string | null; lng?: string | null; address?: string | null }) {
  if (!lat || !lng) return <span className="text-xs text-muted-foreground">Sem GPS</span>;
  const url = `https://www.google.com/maps?q=${lat},${lng}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
      title={address ?? `${lat}, ${lng}`}
    >
      <MapPin className="w-3 h-3" />
      {address ? address.split(",")[0] : `${lat}, ${lng}`}
    </a>
  );
}

// ─── Star display ─────────────────────────────────────────────────────────────
function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-3.5 h-3.5 ${s <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20"}`}
        />
      ))}
      <span className="text-xs text-muted-foreground ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LiveMonitor() {
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) window.location.href = getLoginUrl();
    if (!authLoading && user?.role !== "admin") window.location.href = "/dashboard";
  }, [user, authLoading]);

  const { data: liveCheckins, isLoading: liveLoading } = trpc.checkins.liveMonitor.useQuery(undefined, {
    refetchInterval: 30000, // auto-refresh every 30s
  });
  const { data: satisfactionAvg, isLoading: satLoading } = trpc.satisfaction.avgByEvent.useQuery();

  const totalPresent = liveCheckins?.length ?? 0;

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Activity className="w-6 h-6 text-emerald-500" />
              Monitoramento ao Vivo
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Voluntários presentes agora, localização GPS e satisfação dos eventos
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full border">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Atualiza a cada 30s
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="card-premium">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Presentes Agora</p>
                <p className="text-2xl font-bold text-foreground">{totalPresent}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="card-premium">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Com GPS Registrado</p>
                <p className="text-2xl font-bold text-foreground">
                  {liveCheckins?.filter(r => (r.checkin as any).checkinLat).length ?? 0}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="card-premium">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Star className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Satisfação Média</p>
                <p className="text-2xl font-bold text-foreground">
                  {satisfactionAvg && satisfactionAvg.length > 0
                    ? (satisfactionAvg.reduce((acc, r) => acc + Number(r.avgRating), 0) / satisfactionAvg.length).toFixed(1)
                    : "—"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Checkins Table */}
        <Card className="card-premium">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              Voluntários Presentes Agora
              {totalPresent > 0 && (
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs ml-1">
                  {totalPresent} ativo{totalPresent !== 1 ? "s" : ""}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {liveLoading ? (
              <div className="space-y-2">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
            ) : liveCheckins && liveCheckins.length > 0 ? (
              <div className="space-y-2">
                {liveCheckins.map(({ checkin, volunteer, event }) => (
                  <div key={checkin.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border hover:bg-muted/60 transition-colors">
                    <Avatar className="w-9 h-9 flex-shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                        {volunteer?.name?.slice(0, 2).toUpperCase() ?? "V"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-foreground">{volunteer?.name}</p>
                        <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                          Presente
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <LogIn className="w-3 h-3 text-emerald-600" />
                          {checkin.checkinAt ? format(new Date(checkin.checkinAt), "HH:mm", { locale: ptBR }) : "—"}
                        </span>
                        {event && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {event.name}
                          </span>
                        )}
                        <MapLink
                          lat={(checkin as any).checkinLat}
                          lng={(checkin as any).checkinLng}
                          address={(checkin as any).checkinAddress}
                        />
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-xs text-muted-foreground">
                        {checkin.checkinAt
                          ? `${Math.floor((Date.now() - new Date(checkin.checkinAt).getTime()) / 60000)}min`
                          : "—"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhum voluntário com check-in ativo no momento</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Satisfaction by Event */}
        <Card className="card-premium">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              Satisfação por Evento
            </CardTitle>
          </CardHeader>
          <CardContent>
            {satLoading ? (
              <Skeleton className="h-40 rounded-lg" />
            ) : satisfactionAvg && satisfactionAvg.length > 0 ? (
              <div className="space-y-4">
                {/* Bar Chart */}
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={satisfactionAvg} margin={{ top: 4, right: 8, left: -20, bottom: 4 }}>
                    <XAxis
                      dataKey="eventName"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v: string) => v?.length > 14 ? v.slice(0, 14) + "…" : v}
                    />
                    <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(value: number) => [`${Number(value).toFixed(1)} ★`, "Média"]}
                      labelStyle={{ fontSize: 12 }}
                    />
                    <Bar dataKey="avgRating" radius={[4, 4, 0, 0]}>
                      {satisfactionAvg.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={Number(entry.avgRating) >= 4 ? "#10b981" : Number(entry.avgRating) >= 3 ? "#f59e0b" : "#ef4444"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                {/* Detail list */}
                <div className="space-y-2">
                  {satisfactionAvg.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{item.eventName}</p>
                        <p className="text-xs text-muted-foreground">{item.totalRatings} avaliação{Number(item.totalRatings) !== 1 ? "ões" : ""}</p>
                      </div>
                      <StarDisplay rating={Number(item.avgRating)} />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Star className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhuma avaliação registrada ainda</p>
                <p className="text-xs mt-1">As avaliações aparecem após os voluntários fazerem check-out</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
