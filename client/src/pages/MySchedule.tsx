import { useAuth } from "@/_core/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { CalendarDays, ClipboardList, MapPin } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function MySchedule() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!authLoading && !user) window.location.href = getLoginUrl();
  }, [user, authLoading]);

  const { data: schedules, isLoading } = trpc.schedules.mySchedules.useQuery(undefined, { enabled: !!user });

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-primary" />
            Minha Escala
          </h1>
          <p className="text-muted-foreground mt-1">Seus próximos compromissos e escalas</p>
        </div>

        {isLoading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
        ) : schedules && schedules.length > 0 ? (
          <div className="space-y-3">
            {schedules.map(({ assignment, schedule, event }) => {
              if (!schedule || !event) return null;
              const isPast = new Date(schedule.date) < new Date();
              return (
                <Card key={assignment.id} className={`card-premium ${isPast ? "opacity-60" : ""}`}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl bg-primary/10 flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-lg font-bold text-primary leading-none">
                          {format(new Date(schedule.date), "dd")}
                        </span>
                        <span className="text-xs text-primary/70 uppercase">
                          {format(new Date(schedule.date), "MMM", { locale: ptBR })}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-foreground">{schedule.title}</h3>
                            <p className="text-sm text-muted-foreground">{event.name}</p>
                          </div>
                          <Badge
                            variant="outline"
                            className={isPast
                              ? "bg-gray-100 text-gray-500 border-gray-200 text-xs"
                              : "bg-blue-100 text-blue-700 border-blue-200 text-xs"}
                          >
                            {isPast ? "Realizado" : "Agendado"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <CalendarDays className="w-3 h-3" />
                            {format(new Date(schedule.date), "HH:mm", { locale: ptBR })}
                          </span>
                          {event.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {event.location}
                            </span>
                          )}
                          {assignment.role && (
                            <span className="font-medium text-primary">{assignment.role}</span>
                          )}
                        </div>
                        {schedule.notes && (
                          <p className="text-xs text-muted-foreground mt-1.5 italic">{schedule.notes}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground border border-dashed border-border rounded-2xl">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Nenhuma escala encontrada</p>
            <p className="text-sm mt-1">Você ainda não foi adicionado a nenhuma escala</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
