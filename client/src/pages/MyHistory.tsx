import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, Calendar, CheckCircle2, XCircle, Star } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function MyHistory() {
  const { data: history, isLoading } = trpc.checkins.myHistory.useQuery();

  const stats = history
    ? {
        total: history.length,
        present: history.filter((h: any) => h.checkin?.checkoutTime).length,
        pending: history.filter((h: any) => h.checkin && !h.checkin?.checkoutTime).length,
        absent: history.filter((h: any) => !h.checkin).length,
      }
    : null;

  const attendanceRate = stats && stats.total > 0
    ? Math.round(((stats.present + stats.pending) / stats.total) * 100)
    : 0;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Meu Histórico</h1>
          <p className="text-slate-500 mt-1">Sua participação e frequência nos eventos</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : (
          <>
            {/* Stats */}
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
                    <div className="text-xs text-slate-500 mt-0.5">Escalas</div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-emerald-600">{stats.present}</div>
                    <div className="text-xs text-slate-500 mt-0.5">Presentes</div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-red-500">{stats.absent}</div>
                    <div className="text-xs text-slate-500 mt-0.5">Ausências</div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-amber-700">{attendanceRate}%</div>
                    <div className="text-xs text-amber-600 mt-0.5">Frequência</div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* History list */}
            {!history || history.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
                    <Calendar className="w-7 h-7 text-slate-400" />
                  </div>
                  <p className="font-medium text-slate-600">Nenhum histórico ainda</p>
                  <p className="text-sm text-slate-400">Suas participações aparecerão aqui.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {history.map((item: any, i: number) => {
                  const present = !!item.checkin;
                  const completed = present && !!item.checkin?.checkoutTime;
                  return (
                    <Card key={i} className="border-0 shadow-sm">
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                          completed ? "bg-emerald-100" : present ? "bg-amber-100" : "bg-red-100"
                        }`}>
                          {completed ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          ) : present ? (
                            <CheckCircle2 className="w-5 h-5 text-amber-500" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 truncate">
                            {item.event?.title || item.schedule?.title || "Evento"}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {item.schedule?.date
                              ? format(new Date(item.schedule.date), "dd/MM/yyyy", { locale: ptBR })
                              : "—"}
                            {item.assignment?.role && ` · ${item.assignment.role}`}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <Badge
                            className={`text-xs ${
                              completed
                                ? "bg-emerald-100 text-emerald-700"
                                : present
                                ? "bg-amber-100 text-amber-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {completed ? "Completo" : present ? "Check-in" : "Ausente"}
                          </Badge>
                          {item.satisfaction && (
                            <div className="flex items-center gap-0.5 justify-end mt-1">
                              {Array.from({ length: item.satisfaction.rating }).map((_, j) => (
                                <Star key={j} className="w-3 h-3 fill-amber-400 text-amber-400" />
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
