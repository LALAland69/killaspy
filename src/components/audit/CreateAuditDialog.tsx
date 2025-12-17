import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useCreateAudit, moduleTypeLabels, moduleCategories, AuditModuleType } from "@/hooks/useSecurityAudits";
import { Loader2, Shield, Globe, FileText } from "lucide-react";

interface CreateAuditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateAuditDialog({ open, onOpenChange }: CreateAuditDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [selectedModules, setSelectedModules] = useState<AuditModuleType[]>([
    "header_consistency_checker",
    "redirect_path_mapper",
    "ssl_certificate_auditor",
    "domain_reputation_checker",
    "tech_stack_identifier",
  ]);

  const createAudit = useCreateAudit();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await createAudit.mutateAsync({
      name,
      description: description || undefined,
      target_url: targetUrl || undefined,
      target_domain: targetUrl ? new URL(targetUrl).hostname : undefined,
      config: { modules: selectedModules },
    });

    setName("");
    setDescription("");
    setTargetUrl("");
    onOpenChange(false);
  };

  const toggleModule = (module: AuditModuleType) => {
    setSelectedModules(prev => 
      prev.includes(module) 
        ? prev.filter(m => m !== module)
        : [...prev, module]
    );
  };

  const toggleCategory = (category: keyof typeof moduleCategories) => {
    const categoryModules = moduleCategories[category] as AuditModuleType[];
    const allSelected = categoryModules.every(m => selectedModules.includes(m));
    
    if (allSelected) {
      setSelectedModules(prev => prev.filter(m => !categoryModules.includes(m)));
    } else {
      setSelectedModules(prev => [...new Set([...prev, ...categoryModules])]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Nova Auditoria de Segurança
          </DialogTitle>
          <DialogDescription>
            Configure os parâmetros da auditoria de segurança e conformidade
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Auditoria *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Auditoria Landing Page Concorrente"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o objetivo desta auditoria..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetUrl" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                URL Alvo
              </Label>
              <Input
                id="targetUrl"
                type="url"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://exemplo.com/landing-page"
              />
            </div>
          </div>

          {/* Module Selection */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Módulos de Auditoria
            </Label>

            {/* Collection Layer */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={moduleCategories.collection.every(m => selectedModules.includes(m as AuditModuleType))}
                  onCheckedChange={() => toggleCategory("collection")}
                />
                <span className="text-sm font-medium">Camada 1: Coleta de Dados</span>
              </div>
              <div className="ml-6 grid grid-cols-2 gap-2">
                {(moduleCategories.collection as AuditModuleType[]).map((module) => (
                  <div key={module} className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedModules.includes(module)}
                      onCheckedChange={() => toggleModule(module)}
                    />
                    <span className="text-sm text-muted-foreground">
                      {moduleTypeLabels[module]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Verification Layer */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={moduleCategories.verification.every(m => selectedModules.includes(m as AuditModuleType))}
                  onCheckedChange={() => toggleCategory("verification")}
                />
                <span className="text-sm font-medium">Camada 2: Verificação de Condicionamento</span>
              </div>
              <div className="ml-6 grid grid-cols-2 gap-2">
                {(moduleCategories.verification as AuditModuleType[]).map((module) => (
                  <div key={module} className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedModules.includes(module)}
                      onCheckedChange={() => toggleModule(module)}
                    />
                    <span className="text-sm text-muted-foreground">
                      {moduleTypeLabels[module]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Analysis Layer */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={moduleCategories.analysis.every(m => selectedModules.includes(m as AuditModuleType))}
                  onCheckedChange={() => toggleCategory("analysis")}
                />
                <span className="text-sm font-medium">Camada 3: Análise e Modelagem</span>
              </div>
              <div className="ml-6 grid grid-cols-2 gap-2">
                {(moduleCategories.analysis as AuditModuleType[]).map((module) => (
                  <div key={module} className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedModules.includes(module)}
                      onCheckedChange={() => toggleModule(module)}
                    />
                    <span className="text-sm text-muted-foreground">
                      {moduleTypeLabels[module]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createAudit.isPending || !name}>
              {createAudit.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Shield className="h-4 w-4 mr-2" />
              )}
              Criar Auditoria
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
