import { useAuth } from "@/_core/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { CalendarDays, MapPin, Plus, QrCode, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const EVENT_TYPES = [
  "Aniversário da Igreja",
  "Conferência de Jovens",
  "Conferência de Casais",
  "Conferência de Crianças",
  "Conferência de Mulheres",
  "Conferência de Solteiros",
  "Impacto",
  "Face a Face",
  "Culto",
  "Outro",
];

const statusConfig: Record<string, { label: string; className: string }> = {
  upcoming: { label: "Em breve", className: "bg-blue-100 text-blue-700 border-blue-200" },
  ongoing: { label: "Em andamento", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  completed: { label: "Concluído", className: "bg-gray-100 text-gray-600 border-gray-200" },
  cancelled: { label: "Cancelado", className: "bg-red-100 text-red-600 border-red-200" },
};

function QRCodeModal({ eventId, eventName, open, onClose }: { eventId: number; eventName: string; open: boolean; onClose: () => void }) {
  const { data: existing, isLoading: loadingGet, refetch } = trpc.qrcode.get.useQuery(
    { eventId },
    { enabled: open && !!eventId }
  );
  const generateMutation = trpc.qrcode.generate.useMutation({
    onSuccess: () => refetch(),
    onError: (e) => toast.error(e.message),
  });

  const qrDataUrl = existing?.qrDataUrl;
  const token = existing?.token;
  const checkinUrl = token ? `${window.location.origin}/qr-checkin?qr=${token}` : null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary" />
            QR Code — {eventName}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          {loadingGet ? (
            <Skeleton className="w-48 h-48 rounded-xl" />
          ) : qrDataUrl ? (
            <>
              <img
                src={qrDataUrl}
                alt="QR Code do evento"
                className="w-48 h-48 rounded-xl border border-border shadow-sm"
              />
              <p className="text-xs text-muted-foreground text-center px-4">
                Voluntários escaneiam este QR Code para fazer check-in no evento
              </p>
              {checkinUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 text-xs"
                  onClick={() => {
                    navigator.clipboard.writeText(checkinUrl);
                    toast.success("Link copiado!");
                  }}
                >
                  Copiar link de check-in
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={() => generateMutation.mutate({ eventId })}
                disabled={generateMutation.isPending}
              >
                {generateMutation.isPending ? "Gerando..." : "Gerar novo QR Code"}
              </Button>
            </>
          ) : (
            <>
              <div className="w-48 h-48 rounded-xl border-2 border-dashed border-border flex items-center justify-center">
                <QrCode className="w-16 h-16 text-muted-foreground/30" />
              </div>
              <p className="text-sm text-muted-foreground text-center">Nenhum QR Code gerado ainda</p>
              <Button
                onClick={() => generateMutation.mutate({ eventId })}
                disabled={generateMutation.isPending}
                className="gap-2"
              >
                <QrCode className="w-4 h-4" />
                {generateMutation.isPending ? "Gerando..." : "Gerar QR Code"}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Events() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [qrEvent, setQrEvent] = useState<{ id: number; name: string } | null>(null);
  const [form, setForm] = useState({
    name: "", description: "", location: "", startAt: "", endAt: "", type: "", status: "upcoming" as const,
  });

  useEffect(() => {
    if (!authLoading && !user) window.location.href = getLoginUrl();
    if (!authLoading && user?.role !== "admin") navigate("/dashboard");
  }, [user, authLoading]);

  const isAdmin = user?.role === "admin";
  const utils = trpc.useUtils();
  const { data: events, isLoading } = trpc.events.list.useQuery({});
  const createMutation = trpc.events.create.useMutation({
    onSuccess: () => {
      utils.events.list.invalidate();
      setDialogOpen(false);
      toast.success("Evento criado com sucesso!");
    },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.events.delete.useMutation({
    onSuccess: () => { utils.events.list.invalidate(); toast.success("Evento removido."); },
    onError: (e) => toast.error(e.message),
  });

  const filtered = events?.filter((e) => statusFilter === "all" || e.status === statusFilter) ?? [];

  const handleCreate = () => {
    if (!form.name || !form.startAt) return toast.error("Nome e data de início são obrigatórios");
    createMutation.mutate({
      name: form.name,
      description: form.description || undefined,
      location: form.location || undefined,
      startAt: new Date(form.startAt),
      endAt: form.endAt ? new Date(form.endAt) : undefined,
      type: form.type || undefined,
      status: form.status,
    });
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <CalendarDays className="w-6 h-6 text-primary" />
              Eventos
            </h1>
            <p className="text-muted-foreground mt-1">{filtered.length} evento{filtered.length !== 1 ? "s" : ""}</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="w-4 h-4" />Novo Evento</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Criar Evento</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Nome *</Label>
                  <Select value={form.name} onValueChange={(v) => setForm({ ...form, name: v })}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione ou digite o nome" /></SelectTrigger>
                    <SelectContent>
                      {EVENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input placeholder="Ou digite um nome personalizado" className="mt-2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Textarea placeholder="Descrição do evento" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1 resize-none" rows={2} />
                </div>
                <div>
                  <Label>Local</Label>
                  <Input placeholder="Endereço ou local" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="mt-1" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Início *</Label>
                    <Input type="datetime-local" value={form.startAt} onChange={(e) => setForm({ ...form, startAt: e.target.value })} className="mt-1" />
                  </div>
                  <div>
                    <Label>Término</Label>
                    <Input type="datetime-local" value={form.endAt} onChange={(e) => setForm({ ...form, endAt: e.target.value })} className="mt-1" />
                  </div>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v: any) => setForm({ ...form, status: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="upcoming">Em breve</SelectItem>
                      <SelectItem value="ongoing">Em andamento</SelectItem>
                      <SelectItem value="completed">Concluído</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full" onClick={handleCreate} disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Criando..." : "Criar Evento"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {["all", "upcoming", "ongoing", "completed", "cancelled"].map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(s)}
              className="text-xs"
            >
              {s === "all" ? "Todos" : statusConfig[s]?.label}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Nenhum evento encontrado</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((event) => {
              const status = statusConfig[event.status] ?? statusConfig.upcoming;
              return (
                <Card key={event.id} className="card-premium">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl bg-primary/10 flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-lg font-bold text-primary leading-none">
                          {format(new Date(event.startAt), "dd")}
                        </span>
                        <span className="text-xs text-primary/70 uppercase">
                          {format(new Date(event.startAt), "MMM", { locale: ptBR })}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-foreground">{event.name}</h3>
                          <Badge variant="outline" className={cn("text-xs flex-shrink-0", status.className)}>
                            {status.label}
                          </Badge>
                        </div>
                        {event.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{event.description}</p>}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>{format(new Date(event.startAt), "HH:mm")} {event.endAt ? `– ${format(new Date(event.endAt), "HH:mm")}` : ""}</span>
                          {event.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {event.location}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8 text-muted-foreground hover:text-primary"
                            title="QR Code do evento"
                            onClick={() => setQrEvent({ id: event.id, name: event.name })}
                          >
                            <QrCode className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteMutation.mutate({ id: event.id })}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {qrEvent && (
        <QRCodeModal
          eventId={qrEvent.id}
          eventName={qrEvent.name}
          open={!!qrEvent}
          onClose={() => setQrEvent(null)}
        />
      )}
    </AppLayout>
  );
}
