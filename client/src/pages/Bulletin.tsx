import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Megaphone, Plus, Loader2, Trash2, Pin, Users, Calendar } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const AUDIENCE_LABELS: Record<string, string> = {
  all: "Todos",
  admin: "Apenas Admins",
};

const TYPE_COLORS: Record<string, string> = {
  general: "bg-slate-100 text-slate-700",
  urgent: "bg-red-100 text-red-700",
  event: "bg-blue-100 text-blue-700",
  pastoral: "bg-purple-100 text-purple-700",
};

const TYPE_LABELS: Record<string, string> = {
  general: "Geral",
  urgent: "Urgente",
  event: "Evento",
  pastoral: "Pastoral",
};

export default function Bulletin() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<"general" | "urgent" | "event" | "pastoral">("general");
  const [audience, setAudience] = useState<"all" | "admin">("all");

  const { data: posts, isLoading, refetch } = trpc.bulletin.list.useQuery();
  const createMutation = trpc.bulletin.create.useMutation({
    onSuccess: () => { toast.success("Aviso publicado!"); setOpen(false); setTitle(""); setContent(""); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.bulletin.delete.useMutation({
    onSuccess: () => { toast.success("Aviso removido."); refetch(); },
  });

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Mural de Avisos</h1>
            <p className="text-slate-500 mt-1">Comunicados e informações importantes</p>
          </div>
          {isAdmin && (
            <Button onClick={() => setOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Aviso
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : !posts || posts.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
                <Megaphone className="w-7 h-7 text-slate-400" />
              </div>
              <p className="font-medium text-slate-600">Nenhum aviso publicado</p>
              <p className="text-sm text-slate-400">Os comunicados da liderança aparecerão aqui.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {posts.map((post: any) => (
              <Card key={post.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge className={`text-xs font-medium ${TYPE_COLORS[post.type] || TYPE_COLORS.general}`}>
                          {TYPE_LABELS[post.type] || post.type}
                        </Badge>
                        {post.audience !== "all" && (
                          <Badge variant="outline" className="text-xs">
                            <Users className="w-3 h-3 mr-1" />
                            {AUDIENCE_LABELS[post.audience] || post.audience}
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-slate-900">{post.title}</h3>
                      <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{post.content}</p>
                      <div className="flex items-center gap-1 mt-3 text-xs text-slate-400">
                        <Calendar className="w-3 h-3" />
                        <span>{format(new Date(post.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                      </div>
                    </div>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-slate-400 hover:text-red-500"
                        onClick={() => deleteMutation.mutate({ id: post.id })}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Aviso</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Título</Label>
              <Input placeholder="Título do aviso" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Conteúdo</Label>
              <Textarea
                placeholder="Escreva o comunicado..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <Select value={type} onValueChange={(v) => setType(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">Geral</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                    <SelectItem value="event">Evento</SelectItem>
                    <SelectItem value="pastoral">Pastoral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Público</Label>
                <Select value={audience} onValueChange={(v) => setAudience(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="admin">Apenas Admins</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button
              disabled={!title.trim() || !content.trim() || createMutation.isPending}
              onClick={() => createMutation.mutate({ title, content, type: type as any, audience: audience as any })}
            >
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Publicar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
