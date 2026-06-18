import { useAuth } from "@/_core/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { ClipboardList, Plus, UserPlus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Schedules() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(null);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({ title: "", date: "", notes: "" });
  const [assignForm, setAssignForm] = useState({ volunteerId: "", role: "" });

  useEffect(() => {
    if (!authLoading && !user) window.location.href = getLoginUrl();
    if (!authLoading && user?.role !== "admin") navigate("/dashboard");
  }, [user, authLoading]);

  const utils = trpc.useUtils();
  const { data: events } = trpc.events.list.useQuery({});
  const { data: schedules, isLoading: schedulesLoading } = trpc.schedules.byEvent.useQuery(
    { eventId: Number(selectedEventId) },
    { enabled: !!selectedEventId }
  );
  const { data: assignments, isLoading: assignmentsLoading } = trpc.schedules.assignments.useQuery(
    { scheduleId: selectedScheduleId! },
    { enabled: !!selectedScheduleId }
  );
  const { data: volunteers } = trpc.volunteers.list.useQuery({});

  const createScheduleMutation = trpc.schedules.create.useMutation({
    onSuccess: () => {
      utils.schedules.byEvent.invalidate();
      setScheduleDialogOpen(false);
      setScheduleForm({ title: "", date: "", notes: "" });
      toast.success("Escala criada!");
    },
    onError: (e) => toast.error(e.message),
  });

  const assignMutation = trpc.schedules.assign.useMutation({
    onSuccess: () => {
      utils.schedules.assignments.invalidate();
      setAssignDialogOpen(false);
      setAssignForm({ volunteerId: "", role: "" });
      toast.success("Voluntário adicionado à escala!");
    },
    onError: (e) => toast.error(e.message),
  });

  const unassignMutation = trpc.schedules.unassign.useMutation({
    onSuccess: () => { utils.schedules.assignments.invalidate(); toast.success("Voluntário removido."); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-primary" />
            Escalas
          </h1>
          <p className="text-muted-foreground mt-1">Gerencie as escalas de voluntários por evento</p>
        </div>

        {/* Event selector */}
        <Card className="card-premium mb-6">
          <CardContent className="p-5">
            <Label className="text-sm font-medium mb-2 block">Selecione o Evento</Label>
            <Select value={selectedEventId} onValueChange={setSelectedEventId}>
              <SelectTrigger className="max-w-sm">
                <SelectValue placeholder="Escolha um evento..." />
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

        {selectedEventId && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Schedules list */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-foreground">Escalas do Evento</h2>
                <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-2"><Plus className="w-3 h-3" />Nova Escala</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-sm">
                    <DialogHeader><DialogTitle>Criar Escala</DialogTitle></DialogHeader>
                    <div className="space-y-4 pt-2">
                      <div>
                        <Label>Título *</Label>
                        <Input placeholder="Ex: Equipe de Louvor" value={scheduleForm.title} onChange={(e) => setScheduleForm({ ...scheduleForm, title: e.target.value })} className="mt-1" />
                      </div>
                      <div>
                        <Label>Data/Hora *</Label>
                        <Input type="datetime-local" value={scheduleForm.date} onChange={(e) => setScheduleForm({ ...scheduleForm, date: e.target.value })} className="mt-1" />
                      </div>
                      <div>
                        <Label>Observações</Label>
                        <Input placeholder="Observações opcionais" value={scheduleForm.notes} onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })} className="mt-1" />
                      </div>
                      <Button className="w-full" disabled={createScheduleMutation.isPending}
                        onClick={() => {
                          if (!scheduleForm.title || !scheduleForm.date) return toast.error("Preencha título e data");
                          createScheduleMutation.mutate({ eventId: Number(selectedEventId), title: scheduleForm.title, date: new Date(scheduleForm.date), notes: scheduleForm.notes || undefined });
                        }}>
                        {createScheduleMutation.isPending ? "Criando..." : "Criar Escala"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {schedulesLoading ? (
                <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
              ) : schedules && schedules.length > 0 ? (
                <div className="space-y-2">
                  {schedules.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedScheduleId(s.id)}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${selectedScheduleId === s.id ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/50"}`}
                    >
                      <p className="font-medium text-sm text-foreground">{s.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(s.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                      {s.notes && <p className="text-xs text-muted-foreground mt-1 italic">{s.notes}</p>}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground border border-dashed border-border rounded-xl">
                  <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhuma escala criada para este evento</p>
                </div>
              )}
            </div>

            {/* Assignments */}
            <div>
              {selectedScheduleId ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-foreground">Voluntários na Escala</h2>
                    <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="gap-2"><UserPlus className="w-3 h-3" />Adicionar</Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-sm">
                        <DialogHeader><DialogTitle>Adicionar Voluntário</DialogTitle></DialogHeader>
                        <div className="space-y-4 pt-2">
                          <div>
                            <Label>Voluntário *</Label>
                            <Select value={assignForm.volunteerId} onValueChange={(v) => setAssignForm({ ...assignForm, volunteerId: v })}>
                              <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                              <SelectContent>
                                {volunteers?.filter((v) => v.volunteer.status === "active").map(({ volunteer }) => (
                                  <SelectItem key={volunteer.id} value={String(volunteer.id)}>{volunteer.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Função na Escala</Label>
                            <Input placeholder="Ex: Vocal, Guitarra..." value={assignForm.role} onChange={(e) => setAssignForm({ ...assignForm, role: e.target.value })} className="mt-1" />
                          </div>
                          <Button className="w-full" disabled={assignMutation.isPending}
                            onClick={() => {
                              if (!assignForm.volunteerId) return toast.error("Selecione um voluntário");
                              assignMutation.mutate({ scheduleId: selectedScheduleId, volunteerId: Number(assignForm.volunteerId), role: assignForm.role || undefined });
                            }}>
                            {assignMutation.isPending ? "Adicionando..." : "Adicionar"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {assignmentsLoading ? (
                    <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
                  ) : assignments && assignments.length > 0 ? (
                    <div className="space-y-2">
                      {assignments.map(({ assignment, volunteer }) => (
                        <div key={assignment.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
                          <Avatar className="w-9 h-9">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                              {volunteer?.name?.slice(0, 2).toUpperCase() ?? "V"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">{volunteer?.name}</p>
                            {assignment.role && <p className="text-xs text-muted-foreground">{assignment.role}</p>}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-7 h-7 text-muted-foreground hover:text-destructive"
                            onClick={() => unassignMutation.mutate({ scheduleId: selectedScheduleId, volunteerId: assignment.volunteerId })}
                          >
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-muted-foreground border border-dashed border-border rounded-xl">
                      <p className="text-sm">Nenhum voluntário nesta escala</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-xl">
                  <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Selecione uma escala para ver os voluntários</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
