import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AdCategory {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  keywords: string[];
  countries: string[];
  is_active: boolean;
  last_harvest_at: string | null;
  ads_count: number;
  created_at: string;
  updated_at: string;
}

const DEFAULT_CATEGORIES = [
  { name: "Emagrecimento", slug: "weight-loss", keywords: ["weight loss", "fat burner", "diet", "slim", "keto", "emagrecer", "perder peso", "queimar gordura"] },
  { name: "Suplementos", slug: "supplements", keywords: ["supplement", "vitamins", "protein", "creatine", "suplemento", "vitamina", "whey"] },
  { name: "Finanças", slug: "finance", keywords: ["crypto", "forex", "trading", "investment", "make money", "passive income", "renda extra", "investimento"] },
  { name: "Saúde Masculina", slug: "mens-health", keywords: ["testosterone", "ED", "male enhancement", "libido", "vigor", "potência"] },
  { name: "Skincare & Beleza", slug: "beauty", keywords: ["skincare", "anti-aging", "wrinkles", "collagen", "rejuvenescimento", "rugas", "beleza"] },
  { name: "E-commerce", slug: "ecommerce", keywords: ["dropshipping", "shopify", "amazon fba", "print on demand", "vender online"] },
  { name: "Info Produtos", slug: "info-products", keywords: ["course", "ebook", "masterclass", "webinar", "curso online", "mentoria"] },
  { name: "Apps & Software", slug: "apps", keywords: ["app", "software", "saas", "tool", "aplicativo", "ferramenta"] },
];

export function useAdCategories() {
  return useQuery({
    queryKey: ["ad-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ad_categories")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data as AdCategory[];
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (category: { name: string; slug: string; keywords: string[]; countries: string[] }) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .single();
      
      if (!profile?.tenant_id) throw new Error("No tenant found");
      
      const { data, error } = await supabase
        .from("ad_categories")
        .insert({
          ...category,
          tenant_id: profile.tenant_id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ad-categories"] });
      toast.success("Categoria criada com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao criar categoria: " + error.message);
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AdCategory> & { id: string }) => {
      const { data, error } = await supabase
        .from("ad_categories")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ad-categories"] });
      toast.success("Categoria atualizada");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar: " + error.message);
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ad_categories")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ad-categories"] });
      toast.success("Categoria removida");
    },
    onError: (error) => {
      toast.error("Erro ao remover: " + error.message);
    },
  });
}

export function useInitializeDefaultCategories() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .single();
      
      if (!profile?.tenant_id) throw new Error("No tenant found");
      
      const categoriesToInsert = DEFAULT_CATEGORIES.map(cat => ({
        ...cat,
        tenant_id: profile.tenant_id,
        countries: ["US", "BR"],
      }));
      
      const { data, error } = await supabase
        .from("ad_categories")
        .insert(categoriesToInsert)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ad-categories"] });
      toast.success("Categorias padrão inicializadas");
    },
    onError: (error) => {
      toast.error("Erro ao inicializar: " + error.message);
    },
  });
}

export function useHarvestCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (categoryId: string) => {
      const { data, error } = await supabase.functions.invoke("harvest-ads", {
        body: { categoryId },
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["ad-categories"] });
      queryClient.invalidateQueries({ queryKey: ["ads"] });
      toast.success(`Coletados ${data?.imported || 0} novos ads`);
    },
    onError: (error) => {
      toast.error("Erro na coleta: " + error.message);
    },
  });
}
