import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, MapPin, QrCode, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function QRCheckin() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState<string | null>(null);
  const [gps, setGps] = useState<{ lat: string; lng: string; address: string } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [eventName, setEventName] = useState<string>("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qr = params.get("qr");
    if (qr) {
      setToken(qr);
      requestGps();
    }
  }, []);

  function requestGps() {
    setGpsLoading(true);
    if (!navigator.geolocation) {
      setGpsLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        setGps({ lat, lng, address: `${lat}, ${lng}` });
        setGpsLoading(false);
      },
      () => {
        setGpsLoading(false);
      },
      { timeout: 8000 }
    );
  }

  const checkinMutation = trpc.qrcode.checkinByQr.useMutation({
    onSuccess: (data) => {
      setDone(true);
      setEventName((data.event as any)?.title ?? "Evento");
      toast.success("Check-in realizado com sucesso!");
    },
    onError: (e) => toast.error(e.message),
  });

  function handleCheckin() {
    if (!token) return;
    checkinMutation.mutate({
      token,
      lat: gps?.lat,
      lng: gps?.lng,
      address: gps?.address,
    });
  }

  if (!token) {
    return (
      <AppLayout>
        <div className="max-w-md mx-auto py-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
            <QrCode className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800">QR Code não encontrado</h2>
          <p className="text-slate-500 text-sm">Escaneie o QR Code do evento para fazer check-in.</p>
          <Button variant="outline" onClick={() => setLocation("/checkins")}>Ir para Check-in</Button>
        </div>
      </AppLayout>
    );
  }

  if (done) {
    return (
      <AppLayout>
        <div className="max-w-md mx-auto py-16 text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Check-in realizado!</h2>
          <p className="text-slate-500">Você está presente em <strong>{eventName}</strong>.</p>
          {gps && (
            <p className="text-xs text-slate-400 flex items-center justify-center gap-1">
              <MapPin className="w-3 h-3" />
              Localização registrada
            </p>
          )}
          <Button onClick={() => setLocation("/my-schedule")}>Ver minha escala</Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-md mx-auto py-10 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">Check-in por QR Code</h1>
          <p className="text-slate-500 mt-1 text-sm">Confirme sua presença no evento</p>
        </div>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
              <QrCode className="w-5 h-5 text-slate-500 shrink-0" />
              <div>
                <p className="text-xs text-slate-500">Token do evento</p>
                <p className="font-mono text-sm text-slate-800 truncate">{token.slice(0, 16)}…</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
              <MapPin className="w-5 h-5 shrink-0 text-slate-500" />
              <div className="flex-1">
                <p className="text-xs text-slate-500">Localização GPS</p>
                {gpsLoading ? (
                  <p className="text-sm text-slate-400 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Obtendo localização...
                  </p>
                ) : gps ? (
                  <p className="text-sm text-emerald-600 font-medium">Localização obtida ✓</p>
                ) : (
                  <p className="text-sm text-amber-600">Sem localização (opcional)</p>
                )}
              </div>
              {!gps && !gpsLoading && (
                <Button size="sm" variant="outline" onClick={requestGps}>Tentar</Button>
              )}
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={handleCheckin}
              disabled={checkinMutation.isPending || gpsLoading}
            >
              {checkinMutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" />Registrando...</>
              ) : (
                <><CheckCircle2 className="w-4 h-4 mr-2" />Confirmar Check-in</>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
