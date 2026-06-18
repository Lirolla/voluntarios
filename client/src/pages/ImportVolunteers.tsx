import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileSpreadsheet, CheckCircle2, XCircle, Loader2, Download } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import Papa from "papaparse";

type ParsedRow = {
  name: string;
  email?: string;
  phone?: string;
  birthdate?: string;
  status: "valid" | "error";
  error?: string;
};

const CSV_TEMPLATE = "name,email,phone,birthdate\nJoão Silva,joao@email.com,(11)99999-9999,1990-05-15\nMaria Santos,maria@email.com,(11)88888-8888,1995-03-22\n";

export default function ImportVolunteers() {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<{ success: number; errors: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const createMutation = trpc.volunteers.create.useMutation();

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const parsed: ParsedRow[] = result.data.map((row: any) => {
          if (!row.name?.trim()) {
            return { name: row.name ?? "", status: "error", error: "Nome obrigatório" };
          }
          return {
            name: row.name.trim(),
            email: row.email?.trim() || undefined,
            phone: row.phone?.trim() || undefined,
            birthdate: row.birthdate?.trim() || undefined,
            status: "valid",
          };
        });
        setRows(parsed);
        setResults(null);
      },
      error: () => toast.error("Erro ao ler o arquivo CSV."),
    });
  }

  async function handleImport() {
    const valid = rows.filter((r) => r.status === "valid");
    if (valid.length === 0) return;
    setImporting(true);
    let success = 0;
    let errors = 0;
    for (const row of valid) {
      try {
        await createMutation.mutateAsync({
          name: row.name,
          email: row.email,
          phone: row.phone,
        });
        success++;
      } catch {
        errors++;
      }
    }
    setImporting(false);
    setResults({ success, errors });
    toast.success(`${success} voluntários importados!`);
  }

  function downloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modelo-voluntarios.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const validCount = rows.filter((r) => r.status === "valid").length;
  const errorCount = rows.filter((r) => r.status === "error").length;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Importar Voluntários</h1>
            <p className="text-slate-500 mt-1">Cadastre vários voluntários de uma vez via planilha CSV</p>
          </div>
          <Button variant="outline" onClick={downloadTemplate} className="gap-2">
            <Download className="w-4 h-4" />
            Modelo CSV
          </Button>
        </div>

        {/* Upload area */}
        <Card
          className="border-2 border-dashed border-slate-200 shadow-none cursor-pointer hover:border-slate-400 transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
              <FileSpreadsheet className="w-7 h-7 text-slate-400" />
            </div>
            <p className="font-medium text-slate-700">Clique para selecionar um arquivo CSV</p>
            <p className="text-sm text-slate-400">Colunas: name, email, phone, birthdate</p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFile}
            />
          </CardContent>
        </Card>

        {/* Preview */}
        {rows.length > 0 && (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Prévia ({rows.length} linhas)</CardTitle>
                <div className="flex gap-2">
                  {validCount > 0 && (
                    <Badge className="bg-emerald-100 text-emerald-700">{validCount} válidos</Badge>
                  )}
                  {errorCount > 0 && (
                    <Badge className="bg-red-100 text-red-700">{errorCount} com erro</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="text-left px-4 py-2 text-slate-500 font-medium">Nome</th>
                      <th className="text-left px-4 py-2 text-slate-500 font-medium">E-mail</th>
                      <th className="text-left px-4 py-2 text-slate-500 font-medium">Telefone</th>
                      <th className="text-left px-4 py-2 text-slate-500 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={i} className="border-t border-slate-100">
                        <td className="px-4 py-2 text-slate-800">{row.name || "—"}</td>
                        <td className="px-4 py-2 text-slate-500">{row.email || "—"}</td>
                        <td className="px-4 py-2 text-slate-500">{row.phone || "—"}</td>
                        <td className="px-4 py-2">
                          {row.status === "valid" ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <span className="flex items-center gap-1 text-red-500">
                              <XCircle className="w-4 h-4" />
                              <span className="text-xs">{row.error}</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {results && (
          <Card className="border-0 shadow-sm bg-emerald-50">
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-medium text-emerald-800">Importação concluída</p>
                <p className="text-sm text-emerald-600">
                  {results.success} importados com sucesso
                  {results.errors > 0 && `, ${results.errors} com erro`}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {rows.length > 0 && !results && (
          <Button
            className="w-full"
            size="lg"
            onClick={handleImport}
            disabled={validCount === 0 || importing}
          >
            {importing ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" />Importando...</>
            ) : (
              <><Upload className="w-4 h-4 mr-2" />Importar {validCount} voluntários</>
            )}
          </Button>
        )}
      </div>
    </AppLayout>
  );
}
