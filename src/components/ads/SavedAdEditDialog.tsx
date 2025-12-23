import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, Tag, FileText, Loader2 } from "lucide-react";
import { useUpdateSavedAd, SavedAd } from "@/hooks/useSavedAds";

interface SavedAdEditDialogProps {
  savedAd: SavedAd | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SavedAdEditDialog({ savedAd, open, onOpenChange }: SavedAdEditDialogProps) {
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  
  const updateSavedAd = useUpdateSavedAd();

  useEffect(() => {
    if (savedAd) {
      setNotes(savedAd.notes || "");
      setTags(savedAd.tags || []);
    }
  }, [savedAd]);

  const handleAddTag = () => {
    const trimmedTag = newTag.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSave = () => {
    if (!savedAd) return;
    
    updateSavedAd.mutate(
      { adId: savedAd.ad_id, notes, tags },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  const suggestedTags = ["winner", "inspiração", "copy", "hook", "vídeo", "imagem", "high-ticket", "dropshipping", "nutra", "info-produto"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Editar Anotações
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              placeholder="Adicione suas observações sobre este anúncio..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Tags
            </Label>
            
            {/* Current tags */}
            <div className="flex flex-wrap gap-2 min-h-[32px]">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 rounded-full p-0.5 hover:bg-destructive/20"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>

            {/* Add tag input */}
            <div className="flex gap-2">
              <Input
                id="tags"
                placeholder="Adicionar tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1"
              />
              <Button type="button" variant="outline" size="sm" onClick={handleAddTag}>
                Adicionar
              </Button>
            </div>

            {/* Suggested tags */}
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Sugestões:</p>
              <div className="flex flex-wrap gap-1">
                {suggestedTags
                  .filter(t => !tags.includes(t))
                  .slice(0, 6)
                  .map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setTags([...tags, tag])}
                      className="px-2 py-0.5 text-xs rounded-full bg-secondary text-secondary-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      + {tag}
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={updateSavedAd.isPending}>
            {updateSavedAd.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
