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
      ad_categories: {
        Row: {
          ads_count: number
          countries: string[]
          created_at: string
          id: string
          is_active: boolean
          keywords: string[]
          last_harvest_at: string | null
          name: string
          slug: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          ads_count?: number
          countries?: string[]
          created_at?: string
          id?: string
          is_active?: boolean
          keywords?: string[]
          last_harvest_at?: string | null
          name: string
          slug: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          ads_count?: number
          countries?: string[]
          created_at?: string
          id?: string
          is_active?: boolean
          keywords?: string[]
          last_harvest_at?: string | null
          name?: string
          slug?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_categories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
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
          category_id: string | null
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
          category_id?: string | null
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
          category_id?: string | null
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
            foreignKeyName: "ads_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "ad_categories"
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
      alerts: {
        Row: {
          alert_type: string
          created_at: string
          id: string
          is_read: boolean
          message: string | null
          metadata: Json | null
          related_ad_id: string | null
          related_advertiser_id: string | null
          severity: string
          tenant_id: string
          title: string
        }
        Insert: {
          alert_type?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          metadata?: Json | null
          related_ad_id?: string | null
          related_advertiser_id?: string | null
          severity?: string
          tenant_id: string
          title: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          metadata?: Json | null
          related_ad_id?: string | null
          related_advertiser_id?: string | null
          severity?: string
          tenant_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_related_ad_id_fkey"
            columns: ["related_ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_related_advertiser_id_fkey"
            columns: ["related_advertiser_id"]
            isOneToOne: false
            referencedRelation: "advertisers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_tenant_id_fkey"
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
      audit_findings: {
        Row: {
          affected_domain: string | null
          affected_url: string | null
          audit_id: string
          created_at: string
          description: string | null
          evidence: Json | null
          finding_type: string
          id: string
          is_false_positive: boolean | null
          is_resolved: boolean | null
          module_execution_id: string | null
          remediation: string | null
          severity: Database["public"]["Enums"]["finding_severity"]
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          affected_domain?: string | null
          affected_url?: string | null
          audit_id: string
          created_at?: string
          description?: string | null
          evidence?: Json | null
          finding_type: string
          id?: string
          is_false_positive?: boolean | null
          is_resolved?: boolean | null
          module_execution_id?: string | null
          remediation?: string | null
          severity?: Database["public"]["Enums"]["finding_severity"]
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          affected_domain?: string | null
          affected_url?: string | null
          audit_id?: string
          created_at?: string
          description?: string | null
          evidence?: Json | null
          finding_type?: string
          id?: string
          is_false_positive?: boolean | null
          is_resolved?: boolean | null
          module_execution_id?: string | null
          remediation?: string | null
          severity?: Database["public"]["Enums"]["finding_severity"]
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_findings_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "security_audits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_findings_module_execution_id_fkey"
            columns: ["module_execution_id"]
            isOneToOne: false
            referencedRelation: "audit_module_executions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_findings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_module_executions: {
        Row: {
          audit_id: string
          completed_at: string | null
          created_at: string
          duration_ms: number | null
          error_message: string | null
          id: string
          input_data: Json | null
          module_type: Database["public"]["Enums"]["audit_module_type"]
          output_data: Json | null
          resource_cost: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["audit_status"]
          tenant_id: string
        }
        Insert: {
          audit_id: string
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          input_data?: Json | null
          module_type: Database["public"]["Enums"]["audit_module_type"]
          output_data?: Json | null
          resource_cost?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["audit_status"]
          tenant_id: string
        }
        Update: {
          audit_id?: string
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          input_data?: Json | null
          module_type?: Database["public"]["Enums"]["audit_module_type"]
          output_data?: Json | null
          resource_cost?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["audit_status"]
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_module_executions_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "security_audits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_module_executions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      content_snapshots: {
        Row: {
          audit_id: string | null
          captured_at: string
          content_hash: string | null
          created_at: string
          geo_location: string | null
          headers_sent: Json | null
          html_content: string | null
          id: string
          redirect_chain: Json | null
          response_code: number | null
          response_headers: Json | null
          screenshot_url: string | null
          tenant_id: string
          text_content: string | null
          url: string
          user_agent: string | null
        }
        Insert: {
          audit_id?: string | null
          captured_at?: string
          content_hash?: string | null
          created_at?: string
          geo_location?: string | null
          headers_sent?: Json | null
          html_content?: string | null
          id?: string
          redirect_chain?: Json | null
          response_code?: number | null
          response_headers?: Json | null
          screenshot_url?: string | null
          tenant_id: string
          text_content?: string | null
          url: string
          user_agent?: string | null
        }
        Update: {
          audit_id?: string | null
          captured_at?: string
          content_hash?: string | null
          created_at?: string
          geo_location?: string | null
          headers_sent?: Json | null
          html_content?: string | null
          id?: string
          redirect_chain?: Json | null
          response_code?: number | null
          response_headers?: Json | null
          screenshot_url?: string | null
          tenant_id?: string
          text_content?: string | null
          url?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_snapshots_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "security_audits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_snapshots_tenant_id_fkey"
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
      import_schedules: {
        Row: {
          ad_active_status: string | null
          ad_reached_countries: string[] | null
          created_at: string
          id: string
          import_limit: number | null
          is_active: boolean | null
          last_run_at: string | null
          name: string
          search_page_ids: string[] | null
          search_terms: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          ad_active_status?: string | null
          ad_reached_countries?: string[] | null
          created_at?: string
          id?: string
          import_limit?: number | null
          is_active?: boolean | null
          last_run_at?: string | null
          name: string
          search_page_ids?: string[] | null
          search_terms?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          ad_active_status?: string | null
          ad_reached_countries?: string[] | null
          created_at?: string
          id?: string
          import_limit?: number | null
          is_active?: boolean | null
          last_run_at?: string | null
          name?: string
          search_page_ids?: string[] | null
          search_terms?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_schedules_tenant_id_fkey"
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
      log_exports: {
        Row: {
          created_at: string
          date_range_end: string | null
          date_range_start: string | null
          file_path: string
          file_size: number | null
          id: string
          log_count: number | null
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date_range_end?: string | null
          date_range_start?: string | null
          file_path: string
          file_size?: number | null
          id?: string
          log_count?: number | null
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          date_range_end?: string | null
          date_range_start?: string | null
          file_path?: string
          file_size?: number | null
          id?: string
          log_count?: number | null
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "log_exports_tenant_id_fkey"
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
      saved_ads: {
        Row: {
          ad_id: string
          created_at: string
          id: string
          notes: string | null
          tags: string[] | null
          tenant_id: string
          user_id: string
        }
        Insert: {
          ad_id: string
          created_at?: string
          id?: string
          notes?: string | null
          tags?: string[] | null
          tenant_id: string
          user_id: string
        }
        Update: {
          ad_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          tags?: string[] | null
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_ads_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_ads_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      security_audit_log: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          resource_id: string | null
          resource_type: string
          severity: string | null
          tenant_id: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type: string
          severity?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string
          severity?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "security_audit_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      security_audits: {
        Row: {
          completed_at: string | null
          config: Json | null
          created_at: string
          critical_findings: number | null
          cron_job_name: string | null
          description: string | null
          id: string
          is_recurring: boolean | null
          last_run_at: string | null
          name: string
          next_run_at: string | null
          recurrence_schedule: string | null
          resource_points: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["audit_status"]
          target_advertiser_id: string | null
          target_domain: string | null
          target_url: string | null
          tenant_id: string
          total_findings: number | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          config?: Json | null
          created_at?: string
          critical_findings?: number | null
          cron_job_name?: string | null
          description?: string | null
          id?: string
          is_recurring?: boolean | null
          last_run_at?: string | null
          name: string
          next_run_at?: string | null
          recurrence_schedule?: string | null
          resource_points?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["audit_status"]
          target_advertiser_id?: string | null
          target_domain?: string | null
          target_url?: string | null
          tenant_id: string
          total_findings?: number | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          config?: Json | null
          created_at?: string
          critical_findings?: number | null
          cron_job_name?: string | null
          description?: string | null
          id?: string
          is_recurring?: boolean | null
          last_run_at?: string | null
          name?: string
          next_run_at?: string | null
          recurrence_schedule?: string | null
          resource_points?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["audit_status"]
          target_advertiser_id?: string | null
          target_domain?: string | null
          target_url?: string | null
          tenant_id?: string
          total_findings?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "security_audits_target_advertiser_id_fkey"
            columns: ["target_advertiser_id"]
            isOneToOne: false
            referencedRelation: "advertisers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_audits_tenant_id_fkey"
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
      trend_validations: {
        Row: {
          created_at: string
          id: string
          interest_over_time: Json | null
          keyword: string
          region: string | null
          related_queries: Json | null
          tenant_id: string
          trend_direction: string | null
          trend_score: number | null
          validated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          interest_over_time?: Json | null
          keyword: string
          region?: string | null
          related_queries?: Json | null
          tenant_id: string
          trend_direction?: string | null
          trend_score?: number | null
          validated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          interest_over_time?: Json | null
          keyword?: string
          region?: string | null
          related_queries?: Json | null
          tenant_id?: string
          trend_direction?: string | null
          trend_score?: number | null
          validated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trend_validations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
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
      log_security_event: {
        Args: {
          _action: string
          _metadata?: Json
          _resource_id?: string
          _resource_type: string
          _severity?: string
        }
        Returns: string
      }
      validate_tenant_access: { Args: { _tenant_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      audit_module_type:
        | "social_media_ad_monitor"
        | "search_ad_monitor"
        | "tech_stack_identifier"
        | "public_record_correlator"
        | "content_render_auditor"
        | "ssl_certificate_auditor"
        | "header_consistency_checker"
        | "geolocation_load_tester"
        | "javascript_execution_auditor"
        | "redirect_path_mapper"
        | "parameter_analysis_tool"
        | "visual_diff_engine"
        | "textual_content_fingerprinter"
        | "domain_reputation_checker"
        | "campaign_pattern_mapper"
        | "entity_relationship_graph"
      audit_status: "pending" | "running" | "completed" | "failed" | "cancelled"
      finding_severity: "info" | "low" | "medium" | "high" | "critical"
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
      audit_module_type: [
        "social_media_ad_monitor",
        "search_ad_monitor",
        "tech_stack_identifier",
        "public_record_correlator",
        "content_render_auditor",
        "ssl_certificate_auditor",
        "header_consistency_checker",
        "geolocation_load_tester",
        "javascript_execution_auditor",
        "redirect_path_mapper",
        "parameter_analysis_tool",
        "visual_diff_engine",
        "textual_content_fingerprinter",
        "domain_reputation_checker",
        "campaign_pattern_mapper",
        "entity_relationship_graph",
      ],
      audit_status: ["pending", "running", "completed", "failed", "cancelled"],
      finding_severity: ["info", "low", "medium", "high", "critical"],
    },
  },
} as const
