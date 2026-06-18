import { useAuth } from "@/_core/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Mail, Phone, Plus, Search, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { useEffect } from "react";

export default function Volunteers() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [networkFilter, setNetworkFilter] = useState<string>("all");
  const [ministryFilter, setMinistryFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) window.location.href = getLoginUrl();
    if (!authLoading && user?.role !== "admin") navigate("/dashboard");
  }, [user, authLoading]);

  const utils = trpc.useUtils();
  const { data: volunteers, isLoading } = trpc.volunteers.list.useQuery({});
  const { data: networks } = trpc.networks.list.useQuery();
  const { data: ministries } = trpc.ministries.list.useQuery();

  const createMutation = trpc.volunteers.create.useMutation({
    onSuccess: () => {
      utils.volunteers.list.invalidate();
      setDialogOpen(false);
      toast.success("Voluntário cadastrado com sucesso!");
    },
    onError: (e) => toast.error(e.message),
  });

  const [form, setForm] = useState({
    name: "", email: "", phone: "", networkId: "", ministryId: "", role: "",
  });

  const filtered = volunteers?.filter((v) => {
    const matchSearch = v.volunteer.name.toLowerCase().includes(search.toLowerCase()) ||
      v.volunteer.email?.toLowerCase().includes(search.toLowerCase()) || false;
    const matchNetwork = networkFilter === "all" || String(v.volunteer.networkId) === networkFilter;
    const matchMinistry = ministryFilter === "all" || String(v.volunteer.ministryId) === ministryFilter;
    return matchSearch && matchNetwork && matchMinistry;
  }) ?? [];

  const handleCreate = () => {
    if (!form.name) return toast.error("Nome é obrigatório");
    createMutation.mutate({
      name: form.name,
      email: form.email || undefined,
      phone: form.phone || undefined,
      networkId: form.networkId ? Number(form.networkId) : undefined,
      ministryId: form.ministryId ? Number(form.ministryId) : undefined,
      role: form.role || undefined,
    });
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              Voluntários
            </h1>
            <p className="text-muted-foreground mt-1">
              {filtered.length} voluntário{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Novo Voluntário
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Cadastrar Voluntário</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Nome *</Label>
                  <Input placeholder="Nome completo" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>E-mail</Label>
                    <Input placeholder="email@exemplo.com" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1" />
                  </div>
                  <div>
                    <Label>Telefone</Label>
                    <Input placeholder="(00) 00000-0000" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1" />
                  </div>
                </div>
                <div>
                  <Label>Rede</Label>
                  <Select value={form.networkId} onValueChange={(v) => setForm({ ...form, networkId: v })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione uma rede" />
                    </SelectTrigger>
                    <SelectContent>
                      {networks?.map((n) => (
                        <SelectItem key={n.id} value={String(n.id)}>{n.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Ministério</Label>
                  <Select value={form.ministryId} onValueChange={(v) => setForm({ ...form, ministryId: v })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione um ministério" />
                    </SelectTrigger>
                    <SelectContent>
                      {ministries?.map((m) => (
                        <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Função / Cargo</Label>
                  <Input placeholder="Ex: Líder de Célula" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="mt-1" />
                </div>
                <Button className="w-full" onClick={handleCreate} disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Salvando..." : "Cadastrar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou e-mail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={networkFilter} onValueChange={setNetworkFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Todas as redes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as redes</SelectItem>
              {networks?.map((n) => (
                <SelectItem key={n.id} value={String(n.id)}>{n.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={ministryFilter} onValueChange={setMinistryFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Todos os ministérios" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os ministérios</SelectItem>
              {ministries?.map((m) => (
                <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Nenhum voluntário encontrado</p>
            <p className="text-sm mt-1">Tente ajustar os filtros ou cadastre um novo voluntário</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(({ volunteer, network, ministry }) => (
              <Card
                key={volunteer.id}
                className="card-premium cursor-pointer group"
                onClick={() => navigate(`/volunteers/${volunteer.id}`)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <Avatar className="w-11 h-11 flex-shrink-0">
                      <AvatarFallback
                        className="text-sm font-semibold text-white"
                        style={{ backgroundColor: network?.color ?? "#6366f1" }}
                      >
                        {volunteer.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                        {volunteer.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{volunteer.role ?? "Voluntário"}</p>
                    </div>
                    <span
                      className={cn(
                        "w-2 h-2 rounded-full flex-shrink-0 mt-1",
                        volunteer.status === "active" ? "bg-emerald-500" : "bg-gray-300"
                      )}
                    />
                  </div>

                  <div className="space-y-1.5">
                    {volunteer.email && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Mail className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{volunteer.email}</span>
                      </div>
                    )}
                    {volunteer.phone && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Phone className="w-3 h-3 flex-shrink-0" />
                        <span>{volunteer.phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {network && (
                      <Badge
                        variant="outline"
                        className="text-xs px-2 py-0.5"
                        style={{ borderColor: network.color ?? undefined, color: network.color ?? undefined }}
                      >
                        {network.name}
                      </Badge>
                    )}
                    {ministry && (
                      <Badge variant="secondary" className="text-xs px-2 py-0.5">
                        {ministry.name}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
