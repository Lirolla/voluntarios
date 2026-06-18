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
import { Bell, BellOff, CheckCheck, Plus, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const typeConfig: Record<string, { label: string; color: string }> = {
  schedule: { label: "Escala", color: "bg-blue-100 text-blue-700 border-blue-200" },
  event: { label: "Evento", color: "bg-purple-100 text-purple-700 border-purple-200" },
  general: { label: "Geral", color: "bg-gray-100 text-gray-600 border-gray-200" },
  checkin: { label: "Check-in", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
};

export default function Notifications() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: "", message: "", type: "general" as const, volunteerId: "" });
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!authLoading && !user) window.location.href = getLoginUrl();
  }, [user, authLoading]);

  const utils = trpc.useUtils();
  const { data: notifications, isLoading } = trpc.notifications.list.useQuery(undefined, { enabled: !!user });
  const { data: volunteers } = trpc.volunteers.list.useQuery({}, { enabled: isAdmin });

  const sendMutation = trpc.notifications.send.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
      setDialogOpen(false);
      setForm({ title: "", message: "", type: "general", volunteerId: "" });
      toast.success("Notificação enviada!");
    },
    onError: (e) => toast.error(e.message),
  });

  const markReadMutation = trpc.notifications.markRead.useMutation({
    onSuccess: () => utils.notifications.list.invalidate(),
  });

  const markAllReadMutation = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
      toast.success("Todas as notificações marcadas como lidas.");
    },
  });

  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Bell className="w-6 h-6 text-primary" />
              Notificações
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              )}
            </h1>
            <p className="text-muted-foreground mt-1">{notifications?.length ?? 0} notificações</p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && !isAdmin && (
              <Button variant="outline" size="sm" className="gap-2" onClick={() => markAllReadMutation.mutate()}>
                <CheckCheck className="w-4 h-4" />
                Marcar todas
              </Button>
            )}
            {isAdmin && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2"><Send className="w-4 h-4" />Enviar</Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader><DialogTitle>Enviar Notificação</DialogTitle></DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div>
                      <Label>Destinatário</Label>
                      <Select value={form.volunteerId} onValueChange={(v) => setForm({ ...form, volunteerId: v })}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Todos os voluntários" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos os voluntários</SelectItem>
                          {volunteers?.map(({ volunteer }) => (
                            <SelectItem key={volunteer.id} value={String(volunteer.id)}>{volunteer.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Tipo</Label>
                      <Select value={form.type} onValueChange={(v: any) => setForm({ ...form, type: v })}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">Geral</SelectItem>
                          <SelectItem value="event">Evento</SelectItem>
                          <SelectItem value="schedule">Escala</SelectItem>
                          <SelectItem value="checkin">Check-in</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Título *</Label>
                      <Input placeholder="Título da notificação" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1" />
                    </div>
                    <div>
                      <Label>Mensagem *</Label>
                      <Textarea placeholder="Mensagem..." value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="mt-1 resize-none" rows={3} />
                    </div>
                    <Button className="w-full gap-2" disabled={sendMutation.isPending}
                      onClick={() => {
                        if (!form.title || !form.message) return toast.error("Preencha título e mensagem");
                        sendMutation.mutate({
                          title: form.title,
                          message: form.message,
                          type: form.type,
                          volunteerId: form.volunteerId && form.volunteerId !== "all" ? Number(form.volunteerId) : undefined,
                        });
                      }}>
                      <Send className="w-4 h-4" />
                      {sendMutation.isPending ? "Enviando..." : "Enviar Notificação"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
        ) : notifications && notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notif) => {
              const type = typeConfig[notif.type] ?? typeConfig.general;
              return (
                <Card
                  key={notif.id}
                  className={cn("card-premium cursor-pointer transition-all", !notif.read && "border-primary/30 bg-primary/5")}
                  onClick={() => !notif.read && markReadMutation.mutate({ id: notif.id })}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={cn("w-2 h-2 rounded-full mt-2 flex-shrink-0", notif.read ? "bg-gray-300" : "bg-primary")} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className={cn("text-sm font-semibold", notif.read ? "text-muted-foreground" : "text-foreground")}>
                            {notif.title}
                          </p>
                          <Badge variant="outline" className={cn("text-xs ml-auto flex-shrink-0", type.color)}>
                            {type.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{notif.message}</p>
                        <p className="text-xs text-muted-foreground/60 mt-1.5">
                          {format(new Date(notif.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <BellOff className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Nenhuma notificação</p>
            <p className="text-sm mt-1">Você está em dia!</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
