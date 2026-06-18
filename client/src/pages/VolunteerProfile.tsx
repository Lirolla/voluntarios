import { useAuth } from "@/_core/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, CalendarCheck, Mail, Phone, User } from "lucide-react";
import { useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { getLoginUrl } from "@/const";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function VolunteerProfile() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  useEffect(() => {
    if (!authLoading && !user) window.location.href = getLoginUrl();
    if (!authLoading && user?.role !== "admin") navigate("/dashboard");
  }, [user, authLoading]);

  const { data, isLoading } = trpc.volunteers.byId.useQuery({ id }, { enabled: !!id });
  const { data: checkinHistory } = trpc.checkins.byEvent.useQuery({ eventId: 0 }, { enabled: false });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-6 lg:p-8 max-w-3xl mx-auto">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </AppLayout>
    );
  }

  if (!data) {
    return (
      <AppLayout>
        <div className="p-6 lg:p-8 max-w-3xl mx-auto text-center py-16 text-muted-foreground">
          <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Voluntário não encontrado.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/volunteers")}>Voltar</Button>
        </div>
      </AppLayout>
    );
  }

  const { volunteer, network, ministry } = data;

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        <Button variant="ghost" className="gap-2 mb-6 -ml-2" onClick={() => navigate("/volunteers")}>
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>

        <Card className="card-premium mb-6">
          <CardContent className="p-6">
            <div className="flex items-start gap-5">
              <Avatar className="w-16 h-16">
                <AvatarFallback
                  className="text-xl font-bold text-white"
                  style={{ backgroundColor: network?.color ?? "#6366f1" }}
                >
                  {volunteer.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h1 className="text-xl font-bold text-foreground">{volunteer.name}</h1>
                    <p className="text-muted-foreground">{volunteer.role ?? "Voluntário"}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={volunteer.status === "active"
                      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                      : "bg-gray-100 text-gray-600 border-gray-200"}
                  >
                    {volunteer.status === "active" ? "Ativo" : "Inativo"}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-2 mt-3">
                  {network && (
                    <Badge variant="outline" style={{ borderColor: network.color ?? undefined, color: network.color ?? undefined }}>
                      {network.name}
                    </Badge>
                  )}
                  {ministry && <Badge variant="secondary">{ministry.name}</Badge>}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5 pt-5 border-t border-border">
              {volunteer.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <span>{volunteer.email}</span>
                </div>
              )}
              {volunteer.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <span>{volunteer.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarCheck className="w-4 h-4 flex-shrink-0" />
                <span>Cadastrado em {format(new Date(volunteer.createdAt), "dd/MM/yyyy", { locale: ptBR })}</span>
              </div>
            </div>

            {volunteer.notes && (
              <div className="mt-4 p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">{volunteer.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
