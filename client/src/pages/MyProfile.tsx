import { useAuth } from "@/_core/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { Mail, Phone, Save, User } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";

export default function MyProfile() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", role: "" });

  useEffect(() => {
    if (!authLoading && !user) window.location.href = getLoginUrl();
  }, [user, authLoading]);

  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.volunteers.myProfile.useQuery(undefined, { enabled: !!user });

  useEffect(() => {
    if (data) {
      setForm({
        name: data.volunteer.name ?? "",
        email: data.volunteer.email ?? "",
        phone: data.volunteer.phone ?? "",
        role: data.volunteer.role ?? "",
      });
    }
  }, [data]);

  const updateMutation = trpc.volunteers.update.useMutation({
    onSuccess: () => {
      utils.volunteers.myProfile.invalidate();
      setEditing(false);
      toast.success("Perfil atualizado!");
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-6 lg:p-8 max-w-2xl mx-auto">
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </AppLayout>
    );
  }

  const volunteer = data?.volunteer;
  const network = data?.network;
  const ministry = data?.ministry;

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <User className="w-6 h-6 text-primary" />
            Meu Perfil
          </h1>
        </div>

        {!volunteer ? (
          <Card className="card-premium">
            <CardContent className="p-8 text-center text-muted-foreground">
              <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Perfil de voluntário não encontrado</p>
              <p className="text-sm mt-1">Entre em contato com um administrador para ser cadastrado.</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="card-premium">
            <CardContent className="p-6">
              <div className="flex items-start gap-5 mb-6">
                <Avatar className="w-16 h-16">
                  <AvatarFallback
                    className="text-xl font-bold text-white"
                    style={{ backgroundColor: network?.color ?? "#6366f1" }}
                  >
                    {volunteer.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-foreground">{volunteer.name}</h2>
                  <p className="text-muted-foreground text-sm">{volunteer.role ?? "Voluntário"}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {network && (
                      <Badge variant="outline" style={{ borderColor: network.color ?? undefined, color: network.color ?? undefined }}>
                        {network.name}
                      </Badge>
                    )}
                    {ministry && <Badge variant="secondary">{ministry.name}</Badge>}
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setEditing(!editing)}>
                  {editing ? "Cancelar" : "Editar"}
                </Button>
              </div>

              {editing ? (
                <div className="space-y-4 border-t border-border pt-5">
                  <div>
                    <Label>Nome</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>E-mail</Label>
                      <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1" />
                    </div>
                    <div>
                      <Label>Telefone</Label>
                      <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1" />
                    </div>
                  </div>
                  <Button
                    className="gap-2"
                    disabled={updateMutation.isPending}
                    onClick={() => updateMutation.mutate({ id: volunteer.id, name: form.name, email: form.email || undefined, phone: form.phone || undefined })}
                  >
                    <Save className="w-4 h-4" />
                    {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 border-t border-border pt-5">
                  {volunteer.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      <span>{volunteer.email}</span>
                    </div>
                  )}
                  {volunteer.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <span>{volunteer.phone}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
