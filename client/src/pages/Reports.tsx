import { useAuth } from "@/_core/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { BookOpen, TrendingUp, Users } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function Reports() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!authLoading && !user) window.location.href = getLoginUrl();
    if (!authLoading && user?.role !== "admin") navigate("/dashboard");
  }, [user, authLoading]);

  const { data: networkReport, isLoading: networkLoading } = trpc.reports.byNetwork.useQuery(undefined, { enabled: !!user });
  const { data: ministryReport, isLoading: ministryLoading } = trpc.reports.byMinistry.useQuery(undefined, { enabled: !!user });
  const { data: presenceReport, isLoading: presenceLoading } = trpc.reports.presence.useQuery(undefined, { enabled: !!user });

  const networkData = networkReport?.map((r) => ({ name: r.networkName ?? "Sem rede", total: Number(r.total), color: r.networkColor ?? "#6366f1" })) ?? [];
  const ministryData = ministryReport?.map((r) => ({ name: r.ministryName ?? "Sem ministério", total: Number(r.total), color: r.ministryColor ?? "#7c3aed" })) ?? [];

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            Relatórios
          </h1>
          <p className="text-muted-foreground mt-1">Análise de participação e presença</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* By Network */}
          <Card className="card-premium">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Voluntários por Rede
              </CardTitle>
            </CardHeader>
            <CardContent>
              {networkLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : networkData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={networkData} margin={{ top: 5, right: 10, left: -20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} angle={-35} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                    <Tooltip
                      contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                      formatter={(v: number) => [v, "Voluntários"]}
                    />
                    <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                      {networkData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-10 text-muted-foreground text-sm">Sem dados disponíveis</div>
              )}
            </CardContent>
          </Card>

          {/* By Ministry */}
          <Card className="card-premium">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Voluntários por Ministério
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ministryLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : ministryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={ministryData} margin={{ top: 5, right: 10, left: -20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} angle={-35} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                    <Tooltip
                      contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                      formatter={(v: number) => [v, "Voluntários"]}
                    />
                    <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                      {ministryData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-10 text-muted-foreground text-sm">Sem dados disponíveis</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Presence ranking */}
        <Card className="card-premium">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Ranking de Presença
            </CardTitle>
          </CardHeader>
          <CardContent>
            {presenceLoading ? (
              <div className="space-y-2">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>
            ) : presenceReport && presenceReport.length > 0 ? (
              <div className="space-y-2">
                {presenceReport.slice(0, 10).map((row, idx) => (
                  <div key={row.volunteerId} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${idx === 0 ? "bg-amber-100 text-amber-700" : idx === 1 ? "bg-gray-100 text-gray-600" : idx === 2 ? "bg-orange-100 text-orange-700" : "bg-muted text-muted-foreground"}`}>
                      {idx + 1}
                    </span>
                    <p className="flex-1 text-sm font-medium text-foreground">{row.volunteerName}</p>
                    <span className="text-sm font-bold text-primary">{Number(row.totalCheckins)} presença{Number(row.totalCheckins) !== 1 ? "s" : ""}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground text-sm">Nenhum check-in registrado ainda</div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
