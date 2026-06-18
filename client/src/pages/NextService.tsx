import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Users, ChevronRight, Loader2, PartyPopper } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { useLocation } from "wouter";
import { format, formatDistanceToNow, isPast, differenceInDays, differenceInHours, differenceInMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";

function Countdown({ date }: { date: Date }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (isPast(date)) return <span className="text-emerald-600 font-semibold">Em andamento agora!</span>;

  const days = differenceInDays(date, now);
  const hours = differenceInHours(date, now) % 24;
  const minutes = differenceInMinutes(date, now) % 60;

  if (days > 0) {
    return (
      <div className="flex gap-3 items-end">
        <div className="text-center">
          <div className="text-4xl font-bold text-slate-900 tabular-nums">{days}</div>
          <div className="text-xs text-slate-500 uppercase tracking-wider">dias</div>
        </div>
        <div className="text-2xl font-light text-slate-400 pb-1">:</div>
        <div className="text-center">
          <div className="text-4xl font-bold text-slate-900 tabular-nums">{String(hours).padStart(2, "0")}</div>
          <div className="text-xs text-slate-500 uppercase tracking-wider">horas</div>
        </div>
        <div className="text-2xl font-light text-slate-400 pb-1">:</div>
        <div className="text-center">
          <div className="text-4xl font-bold text-slate-900 tabular-nums">{String(minutes).padStart(2, "0")}</div>
          <div className="text-xs text-slate-500 uppercase tracking-wider">min</div>
        </div>
      </div>
    );
  }

  const totalMinutes = differenceInMinutes(date, now);
  if (totalMinutes < 60) {
    return <span className="text-2xl font-bold text-amber-600">Em {totalMinutes} minutos!</span>;
  }

  return (
    <div className="flex gap-3 items-end">
      <div className="text-center">
        <div className="text-4xl font-bold text-amber-600 tabular-nums">{String(hours).padStart(2, "0")}</div>
        <div className="text-xs text-slate-500 uppercase tracking-wider">horas</div>
      </div>
      <div className="text-2xl font-light text-slate-400 pb-1">:</div>
      <div className="text-center">
        <div className="text-4xl font-bold text-amber-600 tabular-nums">{String(minutes).padStart(2, "0")}</div>
        <div className="text-xs text-slate-500 uppercase tracking-wider">min</div>
      </div>
    </div>
  );
}

export default function NextService() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { data: mySchedules, isLoading } = trpc.schedules.mySchedules.useQuery();

  const upcoming = useMemo(() => {
    if (!mySchedules) return [];
    const now = new Date();
    return mySchedules
      .filter((s: any) => !isPast(new Date(s.schedule.date)) || differenceInHours(now, new Date(s.schedule.date)) < 4)
      .sort((a: any, b: any) => new Date(a.schedule.date).getTime() - new Date(b.schedule.date).getTime());
  }, [mySchedules]);

  const next = upcoming[0];
  const rest = upcoming.slice(1, 4);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Meu Próximo Serviço</h1>
          <p className="text-slate-500 mt-1">Acompanhe quando e onde você está escalado</p>
        </div>

        {!next ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
                <PartyPopper className="w-8 h-8 text-emerald-500" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-slate-800">Nenhum serviço agendado</p>
                <p className="text-sm text-slate-500 mt-1">Você não tem escalas futuras no momento.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Hero card — next service */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-hidden">
              <CardContent className="p-6 space-y-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-slate-400 text-xs uppercase tracking-widest font-medium mb-1">Próximo serviço</p>
                    <h2 className="text-xl font-bold">{(next as any).event?.title || (next as any).schedule?.title}</h2>
                    {(next as any).assignment?.role && (
                      <Badge className="mt-2 bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs">
                        {(next as any).assignment.role}
                      </Badge>
                    )}
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                </div>

                <div className="border-t border-white/10 pt-4">
                  <Countdown date={new Date((next as any).schedule.date)} />
                </div>

                <div className="space-y-2 text-sm text-slate-300">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>
                      {format(new Date((next as any).schedule.date), "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  {(next as any).event?.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{(next as any).event.location}</span>
                    </div>
                  )}
                </div>

                <Button
                  className="w-full bg-white text-slate-900 hover:bg-slate-100 font-semibold"
                  onClick={() => navigate("/checkins")}
                >
                  Fazer Check-in
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </CardContent>
            </Card>

            {/* Upcoming services */}
            {rest.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Próximas escalas</h3>
                {rest.map((s: any, i: number) => (
                  <Card key={i} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                        <Calendar className="w-5 h-5 text-slate-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 truncate">
                          {s.event?.title || s.schedule?.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {format(new Date(s.schedule.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          {" · "}
                          {formatDistanceToNow(new Date(s.schedule.date), { addSuffix: true, locale: ptBR })}
                        </p>
                      </div>
                      {s.assignment?.role && (
                        <Badge variant="secondary" className="text-xs shrink-0">{s.assignment.role}</Badge>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
