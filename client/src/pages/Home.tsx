import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { CalendarCheck, Network, Shield, Users } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Home() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex flex-col">
      {/* Header */}
      <header className="px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-white text-sm leading-tight">Cathedral</p>
            <p className="text-xs text-white/50">Gestão de Voluntários</p>
          </div>
        </div>
        <Button
          onClick={() => (window.location.href = getLoginUrl())}
          className="bg-white text-slate-900 hover:bg-white/90 font-semibold px-6"
        >
          Entrar
        </Button>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-1.5 text-white/80 text-sm mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Sistema de Gestão de Voluntários
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6 leading-tight tracking-tight">
            Organize sua{" "}
            <span className="bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
              equipe
            </span>{" "}
            com excelência
          </h1>

          <p className="text-lg text-white/60 mb-10 max-w-xl mx-auto leading-relaxed">
            Gerencie voluntários, escalas, eventos e presenças da Igreja Cathedral em uma plataforma elegante e eficiente.
          </p>

          <Button
            size="lg"
            onClick={() => (window.location.href = getLoginUrl())}
            className="bg-white text-slate-900 hover:bg-white/90 font-semibold px-8 py-6 text-base rounded-xl shadow-2xl shadow-indigo-500/20"
          >
            Acessar o Sistema
          </Button>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto mt-20 w-full">
          {[
            { icon: Users, title: "Voluntários", desc: "Cadastro completo com redes e ministérios" },
            { icon: CalendarCheck, title: "Check-in", desc: "Registro de presença em tempo real" },
            { icon: Network, title: "Escalas", desc: "Organização por evento e ministério" },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 text-left hover:bg-white/10 transition-colors duration-200"
            >
              <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-indigo-300" />
              </div>
              <h3 className="font-semibold text-white mb-1">{title}</h3>
              <p className="text-sm text-white/50">{desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="px-8 py-6 text-center text-white/30 text-sm">
        © 2025 Cathedral — Todos os direitos reservados
      </footer>
    </div>
  );
}
