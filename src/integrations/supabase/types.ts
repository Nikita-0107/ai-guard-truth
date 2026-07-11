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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      demo_investigations: {
        Row: {
          city: string
          date: string
          id: string
          risk_score: number
          scam_type: string
          status: string
        }
        Insert: {
          city: string
          date?: string
          id?: string
          risk_score: number
          scam_type: string
          status: string
        }
        Update: {
          city?: string
          date?: string
          id?: string
          risk_score?: number
          scam_type?: string
          status?: string
        }
        Relationships: []
      }
      hotspot_statistics: {
        Row: {
          city: string
          critical_cases: number
          id: string
          last_updated: string
          state: string | null
          top_scam: string | null
          total_cases: number
          trend: string | null
        }
        Insert: {
          city: string
          critical_cases: number
          id?: string
          last_updated?: string
          state?: string | null
          top_scam?: string | null
          total_cases: number
          trend?: string | null
        }
        Update: {
          city?: string
          critical_cases?: number
          id?: string
          last_updated?: string
          state?: string | null
          top_scam?: string | null
          total_cases?: number
          trend?: string | null
        }
        Relationships: []
      }
      investigation_results: {
        Row: {
          created_at: string
          evidence: Json | null
          id: string
          investigation_id: string
          raw_report: Json | null
          recommendations: Json | null
          risk_level: string
          risk_score: number
          scam_category: string | null
          scam_dna: Json | null
          summary: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          evidence?: Json | null
          id?: string
          investigation_id: string
          raw_report?: Json | null
          recommendations?: Json | null
          risk_level?: string
          risk_score?: number
          scam_category?: string | null
          scam_dna?: Json | null
          summary?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          evidence?: Json | null
          id?: string
          investigation_id?: string
          raw_report?: Json | null
          recommendations?: Json | null
          risk_level?: string
          risk_score?: number
          scam_category?: string | null
          scam_dna?: Json | null
          summary?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investigation_results_investigation_id_fkey"
            columns: ["investigation_id"]
            isOneToOne: false
            referencedRelation: "investigations"
            referencedColumns: ["id"]
          },
        ]
      }
      investigations: {
        Row: {
          attachment_url: string | null
          content: string | null
          created_at: string
          id: string
          investigation_type: string
          status: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          attachment_url?: string | null
          content?: string | null
          created_at?: string
          id?: string
          investigation_type: string
          status?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          attachment_url?: string | null
          content?: string | null
          created_at?: string
          id?: string
          investigation_type?: string
          status?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      scam_trends: {
        Row: {
          color: string | null
          id: string
          last_updated: string
          percentage: number
          priority: number
          scam_type: string
        }
        Insert: {
          color?: string | null
          id?: string
          last_updated?: string
          percentage: number
          priority?: number
          scam_type: string
        }
        Update: {
          color?: string | null
          id?: string
          last_updated?: string
          percentage?: number
          priority?: number
          scam_type?: string
        }
        Relationships: []
      }
      threat_alerts: {
        Row: {
          city: string
          description: string | null
          id: string
          scam_type: string
          severity: string
          state: string | null
          timestamp: string
          title: string
        }
        Insert: {
          city: string
          description?: string | null
          id?: string
          scam_type: string
          severity: string
          state?: string | null
          timestamp?: string
          title: string
        }
        Update: {
          city?: string
          description?: string | null
          id?: string
          scam_type?: string
          severity?: string
          state?: string | null
          timestamp?: string
          title?: string
        }
        Relationships: []
      }
      threat_metrics: {
        Row: {
          id: string
          last_updated: string
          metric_change: string | null
          metric_name: string
          metric_status: string | null
          metric_value: string
          sort_order: number
        }
        Insert: {
          id?: string
          last_updated?: string
          metric_change?: string | null
          metric_name: string
          metric_status?: string | null
          metric_value: string
          sort_order?: number
        }
        Update: {
          id?: string
          last_updated?: string
          metric_change?: string | null
          metric_name?: string
          metric_status?: string | null
          metric_value?: string
          sort_order?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
