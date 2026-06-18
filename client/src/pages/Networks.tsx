import { useAuth } from "@/_core/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { Network, Plus, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";

export default function Networks() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", color: "#6366f1" });

  useEffect(() => {
    if (!authLoading && !user) window.location.href = getLoginUrl();
    if (!authLoading && user?.role !== "admin") navigate("/dashboard");
  }, [user, authLoading]);

  const utils = trpc.useUtils();
  const { data: networks, isLoading } = trpc.networks.list.useQuery();
  const { data: volunteers } = trpc.volunteers.list.useQuery({});

  const createMutation = trpc.networks.create.useMutation({
    onSuccess: () => {
      utils.networks.list.invalidate();
      setDialogOpen(false);
      setForm({ name: "", description: "", color: "#6366f1" });
      toast.success("Rede criada com sucesso!");
    },
    onError: (e) => toast.error(e.message),
  });

  const getVolunteerCount = (networkId: number) =>
    volunteers?.filter((v) => v.volunteer.networkId === networkId).length ?? 0;

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Network className="w-6 h-6 text-primary" />
              Redes
            </h1>
            <p className="text-muted-foreground mt-1">{networks?.length ?? 0} redes cadastradas</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="w-4 h-4" />Nova Rede</Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader><DialogTitle>Criar Rede</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Nome *</Label>
                  <Input placeholder="Nome da rede" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Input placeholder="Descrição opcional" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label>Cor</Label>
                  <div className="flex items-center gap-3 mt-1">
                    <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-10 h-10 rounded-lg border border-border cursor-pointer" />
                    <Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="flex-1" />
                  </div>
                </div>
                <Button className="w-full" onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Criando..." : "Criar Rede"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {networks?.map((network) => (
              <Card key={network.id} className="card-premium overflow-hidden">
                <div className="h-1.5" style={{ backgroundColor: network.color ?? "#6366f1" }} />
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${network.color}20` }}>
                      <Network className="w-5 h-5" style={{ color: network.color ?? "#6366f1" }} />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      <Users className="w-3 h-3 mr-1" />
                      {getVolunteerCount(network.id)}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-foreground">{network.name}</h3>
                  {network.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{network.description}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
