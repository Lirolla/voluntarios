import { useAuth } from "@/_core/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { CalendarCheck, CheckCircle2, Clock, LogIn, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Checkins() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!authLoading && !user) window.location.href = getLoginUrl();
  }, [user, authLoading]);

  const utils = trpc.useUtils();
  const { data: events } = trpc.events.list.useQuery({});
  const { data: myHistory } = trpc.checkins.myHistory.useQuery(undefined, { enabled: !!user && !isAdmin });
  const { data: eventCheckins, isLoading: checkinsLoading } = trpc.checkins.byEvent.useQuery(
    { eventId: Number(selectedEventId) },
    { enabled: isAdmin && !!selectedEventId }
  );

  const checkinMutation = trpc.checkins.checkin.useMutation({
    onSuccess: () => {
      utils.checkins.myHistory.invalidate();
      utils.checkins.byEvent.invalidate();
      toast.success("Check-in realizado com sucesso!");
    },
    onError: (e) => toast.error(e.message),
  });

  const checkoutMutation = trpc.checkins.checkout.useMutation({
    onSuccess: () => {
      utils.checkins.myHistory.invalidate();
      utils.checkins.byEvent.invalidate();
      toast.success("Check-out realizado!");
    },
    onError: (e) => toast.error(e.message),
  });

  // Find active checkin for current user
  const activeCheckin = myHistory?.find((h) => !h.checkin.checkoutAt);

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-primary" />
            Check-in / Check-out
          </h1>
          <p className="text-muted-foreground mt-1">Registre sua presença nos eventos</p>
        </div>

        {/* Volunteer: Quick Check-in */}
        {!isAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Check-in card */}
            <Card className="card-premium">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <LogIn className="w-4 h-4 text-emerald-600" />
                  Fazer Check-in
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o evento..." />
                    </SelectTrigger>
                    <SelectContent>
                      {events?.filter((e) => e.status === "upcoming" || e.status === "ongoing").map((e) => (
                        <SelectItem key={e.id} value={String(e.id)}>
                          {e.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                    disabled={!selectedEventId || checkinMutation.isPending}
                    onClick={() => checkinMutation.mutate({ eventId: Number(selectedEventId) })}
                  >
                    <LogIn className="w-4 h-4" />
                    {checkinMutation.isPending ? "Registrando..." : "Confirmar Check-in"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Check-out card */}
            <Card className="card-premium">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <LogOut className="w-4 h-4 text-amber-600" />
                  Fazer Check-out
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeCheckin ? (
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                      <p className="text-sm font-medium text-amber-800">{activeCheckin.event?.name}</p>
                      <p className="text-xs text-amber-600 mt-0.5">
                        Check-in: {activeCheckin.checkin.checkinAt
                          ? format(new Date(activeCheckin.checkin.checkinAt), "HH:mm", { locale: ptBR })
                          : "—"}
                      </p>
                    </div>
                    <Button
                      className="w-full gap-2 bg-amber-600 hover:bg-amber-700 text-white"
                      disabled={checkoutMutation.isPending}
                      onClick={() => checkoutMutation.mutate({ eventId: activeCheckin.event!.id })}
                    >
                      <LogOut className="w-4 h-4" />
                      {checkoutMutation.isPending ? "Registrando..." : "Confirmar Check-out"}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Nenhum check-in ativo</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Admin: Event checkins view */}
        {isAdmin && (
          <Card className="card-premium mb-6">
            <CardContent className="p-5">
              <Label className="text-sm font-medium mb-2 block">Ver check-ins por evento</Label>
              <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                <SelectTrigger className="max-w-sm">
                  <SelectValue placeholder="Selecione um evento..." />
                </SelectTrigger>
                <SelectContent>
                  {events?.map((e) => (
                    <SelectItem key={e.id} value={String(e.id)}>
                      {e.name} — {format(new Date(e.startAt), "dd/MM/yyyy", { locale: ptBR })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {/* Admin: Checkins table */}
        {isAdmin && selectedEventId && (
          <Card className="card-premium">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Presenças Registradas</CardTitle>
            </CardHeader>
            <CardContent>
              {checkinsLoading ? (
                <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
              ) : eventCheckins && eventCheckins.length > 0 ? (
                <div className="space-y-2">
                  {eventCheckins.map(({ checkin, volunteer }) => (
                    <div key={checkin.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
                      <Avatar className="w-9 h-9">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                          {volunteer?.name?.slice(0, 2).toUpperCase() ?? "V"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{volunteer?.name}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                          <span className="flex items-center gap-1">
                            <LogIn className="w-3 h-3 text-emerald-600" />
                            {checkin.checkinAt ? format(new Date(checkin.checkinAt), "HH:mm") : "—"}
                          </span>
                          <span className="flex items-center gap-1">
                            <LogOut className="w-3 h-3 text-amber-600" />
                            {checkin.checkoutAt ? format(new Date(checkin.checkoutAt), "HH:mm") : "—"}
                          </span>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={checkin.checkoutAt
                          ? "bg-gray-100 text-gray-600 border-gray-200 text-xs"
                          : "bg-emerald-100 text-emerald-700 border-emerald-200 text-xs"}
                      >
                        {checkin.checkoutAt ? "Saiu" : "Presente"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  <CalendarCheck className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhum check-in registrado para este evento</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Volunteer: History */}
        {!isAdmin && myHistory && myHistory.length > 0 && (
          <Card className="card-premium">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Histórico de Presenças
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {myHistory.map(({ checkin, event }) => (
                  <div key={checkin.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-primary leading-none">
                        {checkin.checkinAt ? format(new Date(checkin.checkinAt), "dd") : "—"}
                      </span>
                      <span className="text-xs text-primary/70 uppercase leading-none">
                        {checkin.checkinAt ? format(new Date(checkin.checkinAt), "MMM", { locale: ptBR }) : ""}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{event?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {checkin.checkinAt ? format(new Date(checkin.checkinAt), "HH:mm") : "—"}
                        {checkin.checkoutAt ? ` – ${format(new Date(checkin.checkoutAt), "HH:mm")}` : " (sem checkout)"}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={checkin.checkoutAt
                        ? "bg-gray-100 text-gray-600 border-gray-200 text-xs"
                        : "bg-emerald-100 text-emerald-700 border-emerald-200 text-xs"}
                    >
                      {checkin.checkoutAt ? "Concluído" : "Em andamento"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={`text-sm font-medium text-foreground ${className ?? ""}`}>{children}</label>;
}
