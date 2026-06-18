import { useAuth } from "@/_core/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import {
  CalendarCheck, CheckCircle2, Clock, LogIn, LogOut,
  MapPin, Star, Navigation, AlertCircle, Loader2
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// ─── GPS Hook ─────────────────────────────────────────────────────────────────
function useGPS() {
  const [loading, setLoading] = useState(false);
  const [denied, setDenied] = useState(false);

  const getPosition = useCallback((): Promise<{ lat: string; lng: string; address: string } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) { resolve(null); return; }
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          setLoading(false);
          const lat = pos.coords.latitude.toFixed(6);
          const lng = pos.coords.longitude.toFixed(6);
          let address = `${lat}, ${lng}`;
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
              { headers: { "Accept-Language": "pt-BR" } }
            );
            const data = await res.json();
            if (data.display_name) address = data.display_name.split(",").slice(0, 3).join(", ");
          } catch { /* fallback to coords */ }
          resolve({ lat, lng, address });
        },
        () => { setLoading(false); setDenied(true); resolve(null); },
        { timeout: 10000, enableHighAccuracy: true }
      );
    });
  }, []);

  return { getPosition, loading, denied };
}

// ─── Star Rating ──────────────────────────────────────────────────────────────
function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1 justify-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-110 active:scale-95"
        >
          <Star
            className={`w-9 h-9 transition-colors ${
              star <= (hover || value) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// ─── Satisfaction Modal ───────────────────────────────────────────────────────
function SatisfactionModal({
  open, onClose, eventId, checkinId
}: { open: boolean; onClose: () => void; eventId: number; checkinId?: number }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const utils = trpc.useUtils();
  const ratingLabels = ["", "Muito ruim", "Ruim", "Regular", "Bom", "Excelente!"];

  const submitMutation = trpc.satisfaction.submit.useMutation({
    onSuccess: () => {
      toast.success("Obrigado pela sua avaliação!");
      utils.checkins.myHistory.invalidate();
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" />
            Como foi sua experiência?
          </DialogTitle>
          <DialogDescription>
            Sua avaliação ajuda a melhorar os próximos eventos. Leva menos de 1 minuto!
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 py-2">
          <div className="flex flex-col items-center gap-2">
            <StarRating value={rating} onChange={setRating} />
            {rating > 0 && (
              <p className="text-sm font-semibold text-amber-600">{ratingLabels[rating]}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Comentário (opcional)</label>
            <Textarea
              placeholder="Compartilhe sua experiência, sugestões ou elogios..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1" onClick={onClose}>Pular</Button>
            <Button
              className="flex-1"
              disabled={rating === 0 || submitMutation.isPending}
              onClick={() => submitMutation.mutate({ eventId, checkinId, rating, comment: comment || undefined })}
            >
              {submitMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Enviar Avaliação
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── GPS Badge ────────────────────────────────────────────────────────────────
function GPSBadge({ lat, address }: { lat?: string | null; address?: string | null }) {
  if (!lat) return null;
  return (
    <span
      title={address ?? lat}
      className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5 cursor-help max-w-[160px] truncate"
    >
      <MapPin className="w-3 h-3 flex-shrink-0" />
      <span className="truncate">{address ? address.split(",")[0] : "GPS"}</span>
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Checkins() {
  const { user, loading: authLoading } = useAuth();
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const isAdmin = user?.role === "admin";
  const [satisfactionModal, setSatisfactionModal] = useState<{ open: boolean; eventId: number; checkinId?: number }>({
    open: false, eventId: 0,
  });
  const { getPosition, loading: gpsLoading, denied: gpsDenied } = useGPS();

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

  const activeCheckin = myHistory?.find((h) => !h.checkin.checkoutAt);

  const checkinMutation = trpc.checkins.checkin.useMutation({
    onSuccess: () => {
      utils.checkins.myHistory.invalidate();
      utils.checkins.byEvent.invalidate();
      toast.success("Check-in realizado com sucesso!");
    },
    onError: (e) => toast.error(e.message),
  });

  const checkoutMutation = trpc.checkins.checkout.useMutation({
    onSuccess: (data) => {
      utils.checkins.myHistory.invalidate();
      utils.checkins.byEvent.invalidate();
      toast.success("Check-out realizado!");
      if (activeCheckin?.event?.id) {
        setSatisfactionModal({ open: true, eventId: activeCheckin.event.id, checkinId: data.checkinId });
      }
    },
    onError: (e) => toast.error(e.message),
  });

  const handleCheckin = async (eventId: number) => {
    const gps = await getPosition();
    checkinMutation.mutate({ eventId, lat: gps?.lat, lng: gps?.lng, address: gps?.address });
  };

  const handleCheckout = async (eventId: number) => {
    const gps = await getPosition();
    checkoutMutation.mutate({ eventId, lat: gps?.lat, lng: gps?.lng });
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-primary" />
            Check-in / Check-out
          </h1>
          <p className="text-muted-foreground mt-1">
            {isAdmin ? "Gerencie presenças e monitore localização dos voluntários" : "Registre sua presença com localização GPS"}
          </p>
        </div>

        {/* GPS denied banner */}
        {gpsDenied && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm mb-6">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Permissão de localização negada. O check-in será registrado sem GPS.</span>
          </div>
        )}

        {/* Volunteer: Check-in / Check-out */}
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
                        <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                    disabled={!selectedEventId || checkinMutation.isPending || gpsLoading}
                    onClick={() => handleCheckin(Number(selectedEventId))}
                  >
                    {(checkinMutation.isPending || gpsLoading) ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Navigation className="w-4 h-4" />
                    )}
                    {gpsLoading ? "Obtendo GPS..." : checkinMutation.isPending ? "Registrando..." : "Confirmar Check-in"}
                  </Button>
                  {!gpsDenied && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      Sua localização será registrada automaticamente
                    </p>
                  )}
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
                    <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                      <p className="text-sm font-medium text-emerald-800">{activeCheckin.event?.name}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <p className="text-xs text-emerald-600">
                          Check-in: {activeCheckin.checkin.checkinAt
                            ? format(new Date(activeCheckin.checkin.checkinAt), "HH:mm", { locale: ptBR })
                            : "—"}
                        </p>
                        {activeCheckin.checkin.checkinLat && (
                          <GPSBadge lat={activeCheckin.checkin.checkinLat} address={activeCheckin.checkin.checkinAddress} />
                        )}
                      </div>
                    </div>
                    <Button
                      className="w-full gap-2 bg-amber-600 hover:bg-amber-700 text-white"
                      disabled={checkoutMutation.isPending || gpsLoading}
                      onClick={() => handleCheckout(activeCheckin.event!.id)}
                    >
                      {(checkoutMutation.isPending || gpsLoading) ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <LogOut className="w-4 h-4" />
                      )}
                      {gpsLoading ? "Obtendo GPS..." : checkoutMutation.isPending ? "Registrando..." : "Confirmar Check-out"}
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

        {/* Admin: Event selector */}
        {isAdmin && (
          <Card className="card-premium mb-6">
            <CardContent className="p-5">
              <label className="text-sm font-medium mb-2 block">Ver check-ins por evento</label>
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

        {/* Admin: Checkins table with GPS */}
        {isAdmin && selectedEventId && (
          <Card className="card-premium">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Presenças Registradas</CardTitle>
            </CardHeader>
            <CardContent>
              {checkinsLoading ? (
                <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
              ) : eventCheckins && eventCheckins.length > 0 ? (
                <div className="space-y-2">
                  {eventCheckins.map(({ checkin, volunteer }) => (
                    <div key={checkin.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border">
                      <Avatar className="w-9 h-9 flex-shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                          {volunteer?.name?.slice(0, 2).toUpperCase() ?? "V"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{volunteer?.name}</p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <LogIn className="w-3 h-3 text-emerald-600" />
                            {checkin.checkinAt ? format(new Date(checkin.checkinAt), "HH:mm") : "—"}
                          </span>
                          {(checkin as any).checkinLat && (
                            <GPSBadge lat={(checkin as any).checkinLat} address={(checkin as any).checkinAddress} />
                          )}
                          {checkin.checkoutAt && (
                            <span className="flex items-center gap-1">
                              <LogOut className="w-3 h-3 text-amber-600" />
                              {format(new Date(checkin.checkoutAt), "HH:mm")}
                            </span>
                          )}
                          {(checkin as any).checkoutLat && (
                            <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                              <MapPin className="w-3 h-3" />
                              GPS saída
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={checkin.checkoutAt
                          ? "bg-gray-100 text-gray-600 border-gray-200 text-xs flex-shrink-0"
                          : "bg-emerald-100 text-emerald-700 border-emerald-200 text-xs flex-shrink-0"}
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
                  <div key={checkin.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border">
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
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <p className="text-xs text-muted-foreground">
                          {checkin.checkinAt ? format(new Date(checkin.checkinAt), "HH:mm") : "—"}
                          {checkin.checkoutAt ? ` – ${format(new Date(checkin.checkoutAt), "HH:mm")}` : " (sem checkout)"}
                        </p>
                        {(checkin as any).checkinLat && (
                          <GPSBadge lat={(checkin as any).checkinLat} address={(checkin as any).checkinAddress} />
                        )}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={checkin.checkoutAt
                        ? "bg-gray-100 text-gray-600 border-gray-200 text-xs flex-shrink-0"
                        : "bg-emerald-100 text-emerald-700 border-emerald-200 text-xs flex-shrink-0"}
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

      {/* Satisfaction Modal */}
      <SatisfactionModal
        open={satisfactionModal.open}
        onClose={() => setSatisfactionModal(s => ({ ...s, open: false }))}
        eventId={satisfactionModal.eventId}
        checkinId={satisfactionModal.checkinId}
      />
    </AppLayout>
  );
}
