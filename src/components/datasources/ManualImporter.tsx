import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  Upload, 
  FileJson, 
  FileText, 
  CheckCircle, 
  AlertTriangle,
  Loader2,
  Copy
} from "lucide-react";

interface ImportResult {
  total: number;
  imported: number;
  updated: number;
  errors: number;
  errorDetails?: string[];
}

// Sample JSON structure for reference
const SAMPLE_JSON = `[
  {
    "ad_library_id": "123456789",
    "page_name": "Nome do Anunciante",
    "page_id": "987654321",
    "primary_text": "Texto principal do anúncio",
    "headline": "Título do anúncio",
    "cta": "Saiba mais",
    "media_url": "https://...",
    "media_type": "image",
    "start_date": "2024-01-01",
    "countries": ["BR", "US"]
  }
]`;

// Sample CSV headers
const SAMPLE_CSV = `ad_library_id,page_name,page_id,primary_text,headline,cta,media_url,media_type,start_date,countries
123456789,Nome do Anunciante,987654321,Texto principal,Título,Saiba mais,https://....,image,2024-01-01,"BR,US"`;

export function ManualImporter() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [jsonData, setJsonData] = useState('');
  const [csvData, setCsvData] = useState('');
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // Import mutation
  const importMutation = useMutation({
    mutationFn: async ({ data, format }: { data: string; format: 'json' | 'csv' }) => {
      const { data: result, error } = await supabase.functions.invoke('import-external-ads', {
        body: { 
          action: 'import_manual', 
          format,
          data 
        }
      });

      if (error) throw error;
      if (!result.success) throw new Error(result.error);
      
      return result as ImportResult;
    },
    onSuccess: (result) => {
      setImportResult(result);
      queryClient.invalidateQueries({ queryKey: ['ads'] });
      queryClient.invalidateQueries({ queryKey: ['advertisers'] });
      toast.success(`Importados ${result.imported} de ${result.total} anúncios`);
    },
    onError: (error: Error) => {
      toast.error(`Erro na importação: ${error.message}`);
    }
  });

  // File upload handler
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const isJson = file.name.endsWith('.json');
    const isCsv = file.name.endsWith('.csv');

    if (isJson) {
      setJsonData(text);
      toast.success('Arquivo JSON carregado. Verifique os dados e clique em Importar.');
    } else if (isCsv) {
      setCsvData(text);
      toast.success('Arquivo CSV carregado. Verifique os dados e clique em Importar.');
    } else {
      toast.error('Formato não suportado. Use JSON ou CSV.');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImportJson = () => {
    if (!jsonData.trim()) {
      toast.error('Cole os dados JSON primeiro');
      return;
    }

    try {
      // Validate JSON
      JSON.parse(jsonData);
      importMutation.mutate({ data: jsonData, format: 'json' });
    } catch {
      toast.error('JSON inválido. Verifique a formatação.');
    }
  };

  const handleImportCsv = () => {
    if (!csvData.trim()) {
      toast.error('Cole os dados CSV primeiro');
      return;
    }
    importMutation.mutate({ data: csvData, format: 'csv' });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para a área de transferência');
  };

  return (
    <div className="space-y-6">
      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload de Arquivo
          </CardTitle>
          <CardDescription>
            Faça upload de arquivos JSON ou CSV exportados de outras ferramentas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.csv"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button 
            variant="outline" 
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-24 border-dashed"
          >
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <span>Clique para fazer upload (.json ou .csv)</span>
            </div>
          </Button>
        </CardContent>
      </Card>

      {/* Manual Input Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Entrada Manual</CardTitle>
          <CardDescription>
            Cole dados diretamente ou use os templates como referência
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="json">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="json" className="flex items-center gap-2">
                <FileJson className="h-4 w-4" />
                JSON
              </TabsTrigger>
              <TabsTrigger value="csv" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                CSV
              </TabsTrigger>
            </TabsList>

            <TabsContent value="json" className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Dados JSON</Label>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => copyToClipboard(SAMPLE_JSON)}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copiar template
                  </Button>
                </div>
                <Textarea
                  placeholder={SAMPLE_JSON}
                  value={jsonData}
                  onChange={(e) => setJsonData(e.target.value)}
                  className="font-mono text-xs min-h-[200px]"
                />
              </div>
              <Button 
                onClick={handleImportJson}
                disabled={importMutation.isPending || !jsonData.trim()}
                className="w-full"
              >
                {importMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Importar JSON
              </Button>
            </TabsContent>

            <TabsContent value="csv" className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Dados CSV</Label>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => copyToClipboard(SAMPLE_CSV)}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copiar template
                  </Button>
                </div>
                <Textarea
                  placeholder={SAMPLE_CSV}
                  value={csvData}
                  onChange={(e) => setCsvData(e.target.value)}
                  className="font-mono text-xs min-h-[200px]"
                />
              </div>
              <Button 
                onClick={handleImportCsv}
                disabled={importMutation.isPending || !csvData.trim()}
                className="w-full"
              >
                {importMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Importar CSV
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Import Result */}
      {importResult && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex gap-4">
              <Badge variant="default">{importResult.imported} importados</Badge>
              {importResult.updated > 0 && (
                <Badge variant="secondary">{importResult.updated} atualizados</Badge>
              )}
              {importResult.errors > 0 && (
                <Badge variant="destructive">{importResult.errors} erros</Badge>
              )}
            </div>
            {importResult.errorDetails && importResult.errorDetails.length > 0 && (
              <details className="mt-2 text-xs">
                <summary className="cursor-pointer">Ver detalhes dos erros</summary>
                <ul className="mt-1 list-disc pl-4">
                  {importResult.errorDetails.slice(0, 5).map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </details>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Supported Formats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Formatos Suportados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Campos obrigatórios:</h4>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">ad_library_id</Badge>
              <Badge variant="outline">page_name</Badge>
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-2">Campos opcionais:</h4>
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="secondary">page_id</Badge>
              <Badge variant="secondary">primary_text</Badge>
              <Badge variant="secondary">headline</Badge>
              <Badge variant="secondary">cta</Badge>
              <Badge variant="secondary">media_url</Badge>
              <Badge variant="secondary">media_type</Badge>
              <Badge variant="secondary">start_date</Badge>
              <Badge variant="secondary">end_date</Badge>
              <Badge variant="secondary">countries</Badge>
              <Badge variant="secondary">status</Badge>
            </div>
          </div>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Dados exportados de BigSpy, AdSpy, PipiAds geralmente precisam de mapeamento de campos. 
              Use o template como referência para o formato correto.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
