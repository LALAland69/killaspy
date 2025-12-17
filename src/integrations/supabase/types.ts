export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ad_history: {
        Row: {
          ad_id: string
          created_at: string
          creative_hash: string | null
          engagement_score: number | null
          id: string
          landing_page_hash: string | null
          snapshot_date: string
          status: string | null
          suspicion_score: number | null
          tenant_id: string
        }
        Insert: {
          ad_id: string
          created_at?: string
          creative_hash?: string | null
          engagement_score?: number | null
          id?: string
          landing_page_hash?: string | null
          snapshot_date?: string
          status?: string | null
          suspicion_score?: number | null
          tenant_id: string
        }
        Update: {
          ad_id?: string
          created_at?: string
          creative_hash?: string | null
          engagement_score?: number | null
          id?: string
          landing_page_hash?: string | null
          snapshot_date?: string
          status?: string | null
          suspicion_score?: number | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_history_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_history_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ads: {
        Row: {
          ad_library_id: string | null
          advertiser_id: string | null
          cloaker_token: string | null
          copy_sentiment: string | null
          countries: string[] | null
          created_at: string
          cta: string | null
          detected_black_url: string | null
          domain_id: string | null
          end_date: string | null
          engagement_score: number | null
          final_lp_url: string | null
          headline: string | null
          id: string
          is_cloaked_flag: boolean | null
          language: string | null
          last_snapshot_at: string | null
          longevity_days: number | null
          media_type: string | null
          media_url: string | null
          offer_category: string | null
          page_name: string | null
          primary_text: string | null
          region: string | null
          start_date: string | null
          status: string | null
          suspicion_score: number | null
          tenant_id: string
          updated_at: string
          visual_hook_score: number | null
          white_url: string | null
        }
        Insert: {
          ad_library_id?: string | null
          advertiser_id?: string | null
          cloaker_token?: string | null
          copy_sentiment?: string | null
          countries?: string[] | null
          created_at?: string
          cta?: string | null
          detected_black_url?: string | null
          domain_id?: string | null
          end_date?: string | null
          engagement_score?: number | null
          final_lp_url?: string | null
          headline?: string | null
          id?: string
          is_cloaked_flag?: boolean | null
          language?: string | null
          last_snapshot_at?: string | null
          longevity_days?: number | null
          media_type?: string | null
          media_url?: string | null
          offer_category?: string | null
          page_name?: string | null
          primary_text?: string | null
          region?: string | null
          start_date?: string | null
          status?: string | null
          suspicion_score?: number | null
          tenant_id: string
          updated_at?: string
          visual_hook_score?: number | null
          white_url?: string | null
        }
        Update: {
          ad_library_id?: string | null
          advertiser_id?: string | null
          cloaker_token?: string | null
          copy_sentiment?: string | null
          countries?: string[] | null
          created_at?: string
          cta?: string | null
          detected_black_url?: string | null
          domain_id?: string | null
          end_date?: string | null
          engagement_score?: number | null
          final_lp_url?: string | null
          headline?: string | null
          id?: string
          is_cloaked_flag?: boolean | null
          language?: string | null
          last_snapshot_at?: string | null
          longevity_days?: number | null
          media_type?: string | null
          media_url?: string | null
          offer_category?: string | null
          page_name?: string | null
          primary_text?: string | null
          region?: string | null
          start_date?: string | null
          status?: string | null
          suspicion_score?: number | null
          tenant_id?: string
          updated_at?: string
          visual_hook_score?: number | null
          white_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ads_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "advertisers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ads_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ads_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      advertisers: {
        Row: {
          active_ads: number | null
          avg_suspicion_score: number | null
          countries: number | null
          created_at: string
          domains_count: number | null
          id: string
          name: string
          page_id: string | null
          tenant_id: string
          total_ads: number | null
          updated_at: string
        }
        Insert: {
          active_ads?: number | null
          avg_suspicion_score?: number | null
          countries?: number | null
          created_at?: string
          domains_count?: number | null
          id?: string
          name: string
          page_id?: string | null
          tenant_id: string
          total_ads?: number | null
          updated_at?: string
        }
        Update: {
          active_ads?: number | null
          avg_suspicion_score?: number | null
          countries?: number | null
          created_at?: string
          domains_count?: number | null
          id?: string
          name?: string
          page_id?: string | null
          tenant_id?: string
          total_ads?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "advertisers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      analysis_scores: {
        Row: {
          ad_domain_disparity_score: number | null
          ad_id: string | null
          ad_lp_mismatch_score: number | null
          behavioral_divergence_score: number | null
          created_at: string
          creative_rotation_score: number | null
          domain_id: string | null
          domain_mapping_score: number | null
          id: string
          redirect_chain_score: number | null
          risk_level: string | null
          tenant_id: string
          total_score: number | null
          updated_at: string
        }
        Insert: {
          ad_domain_disparity_score?: number | null
          ad_id?: string | null
          ad_lp_mismatch_score?: number | null
          behavioral_divergence_score?: number | null
          created_at?: string
          creative_rotation_score?: number | null
          domain_id?: string | null
          domain_mapping_score?: number | null
          id?: string
          redirect_chain_score?: number | null
          risk_level?: string | null
          tenant_id: string
          total_score?: number | null
          updated_at?: string
        }
        Update: {
          ad_domain_disparity_score?: number | null
          ad_id?: string | null
          ad_lp_mismatch_score?: number | null
          behavioral_divergence_score?: number | null
          created_at?: string
          creative_rotation_score?: number | null
          domain_id?: string | null
          domain_mapping_score?: number | null
          id?: string
          redirect_chain_score?: number | null
          risk_level?: string | null
          tenant_id?: string
          total_score?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "analysis_scores_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analysis_scores_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analysis_scores_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_reports: {
        Row: {
          created_at: string
          id: string
          new_cloakers_detected: number | null
          report_date: string
          tenant_id: string
          top_aggressive_ads: Json | null
          top_longevity_ads: Json | null
          total_ads_analyzed: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          new_cloakers_detected?: number | null
          report_date?: string
          tenant_id: string
          top_aggressive_ads?: Json | null
          top_longevity_ads?: Json | null
          total_ads_analyzed?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          new_cloakers_detected?: number | null
          report_date?: string
          tenant_id?: string
          top_aggressive_ads?: Json | null
          top_longevity_ads?: Json | null
          total_ads_analyzed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_reports_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      domain_pages: {
        Row: {
          created_at: string
          domain_id: string
          has_payment_button: boolean | null
          has_testimonials: boolean | null
          id: string
          internal_links_to: string[] | null
          page_classification: string | null
          tech_stack_detected: string[] | null
          tenant_id: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          domain_id: string
          has_payment_button?: boolean | null
          has_testimonials?: boolean | null
          id?: string
          internal_links_to?: string[] | null
          page_classification?: string | null
          tech_stack_detected?: string[] | null
          tenant_id: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          domain_id?: string
          has_payment_button?: boolean | null
          has_testimonials?: boolean | null
          id?: string
          internal_links_to?: string[] | null
          page_classification?: string | null
          tech_stack_detected?: string[] | null
          tenant_id?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "domain_pages_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "domain_pages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      domains: {
        Row: {
          advertiser_id: string | null
          compliance_pages: number | null
          created_at: string
          domain: string
          id: string
          page_count: number | null
          sales_pages: number | null
          suspicion_score: number | null
          tech_stack: string[] | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          advertiser_id?: string | null
          compliance_pages?: number | null
          created_at?: string
          domain: string
          id?: string
          page_count?: number | null
          sales_pages?: number | null
          suspicion_score?: number | null
          tech_stack?: string[] | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          advertiser_id?: string | null
          compliance_pages?: number | null
          created_at?: string
          domain?: string
          id?: string
          page_count?: number | null
          sales_pages?: number | null
          suspicion_score?: number | null
          tech_stack?: string[] | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "domains_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "advertisers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "domains_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      job_runs: {
        Row: {
          ads_processed: number | null
          completed_at: string | null
          created_at: string
          divergences_found: number | null
          duration_ms: number | null
          error_message: string | null
          errors_count: number | null
          id: string
          job_name: string
          metadata: Json | null
          schedule_type: string
          started_at: string
          status: string
          task_type: string
          tenant_id: string | null
        }
        Insert: {
          ads_processed?: number | null
          completed_at?: string | null
          created_at?: string
          divergences_found?: number | null
          duration_ms?: number | null
          error_message?: string | null
          errors_count?: number | null
          id?: string
          job_name: string
          metadata?: Json | null
          schedule_type: string
          started_at?: string
          status?: string
          task_type: string
          tenant_id?: string | null
        }
        Update: {
          ads_processed?: number | null
          completed_at?: string | null
          created_at?: string
          divergences_found?: number | null
          duration_ms?: number | null
          error_message?: string | null
          errors_count?: number | null
          id?: string
          job_name?: string
          metadata?: Json | null
          schedule_type?: string
          started_at?: string
          status?: string
          task_type?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_runs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_page_snapshots: {
        Row: {
          ad_id: string
          captured_at: string
          content_preview: string | null
          created_at: string
          detected_token: string | null
          domain_id: string | null
          final_redirect_url: string | null
          html_hash: string | null
          id: string
          ip_geo: string | null
          is_black_page: boolean | null
          redirect_chain: string[] | null
          referer: string | null
          response_code: number | null
          snapshot_condition: string
          tenant_id: string
          user_agent: string | null
        }
        Insert: {
          ad_id: string
          captured_at?: string
          content_preview?: string | null
          created_at?: string
          detected_token?: string | null
          domain_id?: string | null
          final_redirect_url?: string | null
          html_hash?: string | null
          id?: string
          ip_geo?: string | null
          is_black_page?: boolean | null
          redirect_chain?: string[] | null
          referer?: string | null
          response_code?: number | null
          snapshot_condition: string
          tenant_id: string
          user_agent?: string | null
        }
        Update: {
          ad_id?: string
          captured_at?: string
          content_preview?: string | null
          created_at?: string
          detected_token?: string | null
          domain_id?: string | null
          final_redirect_url?: string | null
          html_hash?: string | null
          id?: string
          ip_geo?: string | null
          is_black_page?: boolean | null
          redirect_chain?: string[] | null
          referer?: string | null
          response_code?: number | null
          snapshot_condition?: string
          tenant_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "landing_page_snapshots_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landing_page_snapshots_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landing_page_snapshots_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      niche_trends: {
        Row: {
          created_at: string
          id: string
          last_updated: string
          new_ads_7d: number | null
          niche_name: string
          saturation_level: string | null
          tenant_id: string
          top_advertisers: string[] | null
          velocity_change: string | null
          velocity_score: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          last_updated?: string
          new_ads_7d?: number | null
          niche_name: string
          saturation_level?: string | null
          tenant_id: string
          top_advertisers?: string[] | null
          velocity_change?: string | null
          velocity_score?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          last_updated?: string
          new_ads_7d?: number | null
          niche_name?: string
          saturation_level?: string | null
          tenant_id?: string
          top_advertisers?: string[] | null
          velocity_change?: string | null
          velocity_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "niche_trends_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          tenant_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          tenant_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          tenant_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_tenant_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
