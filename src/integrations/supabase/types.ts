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
      generated_documents: {
        Row: {
          chat_id: string | null
          created_at: string
          document_type: string
          file_path: string
          file_url: string
          id: string
          request_id: string | null
          title: string
          topic: string
          user_id: string
        }
        Insert: {
          chat_id?: string | null
          created_at?: string
          document_type: string
          file_path: string
          file_url: string
          id?: string
          request_id?: string | null
          title: string
          topic?: string
          user_id: string
        }
        Update: {
          chat_id?: string | null
          created_at?: string
          document_type?: string
          file_path?: string
          file_url?: string
          id?: string
          request_id?: string | null
          title?: string
          topic?: string
          user_id?: string
        }
        Relationships: []
      }
      hugo_audit_feedback: {
        Row: {
          audit_id: string
          comment: string | null
          created_at: string
          id: string
          rating: string
          reasons: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          audit_id: string
          comment?: string | null
          created_at?: string
          id?: string
          rating: string
          reasons?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          audit_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          rating?: string
          reasons?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hugo_audit_feedback_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "hugo_contract_audits"
            referencedColumns: ["id"]
          },
        ]
      }
      hugo_audit_usage: {
        Row: {
          audit_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          audit_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          audit_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hugo_audit_usage_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: true
            referencedRelation: "hugo_contract_audits"
            referencedColumns: ["id"]
          },
        ]
      }
      hugo_chats: {
        Row: {
          created_at: string
          id: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      hugo_contract_audits: {
        Row: {
          analysis: Json | null
          chat_id: string
          created_at: string
          error_message: string | null
          essence: Json | null
          file_name: string
          file_path: string
          id: string
          message_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          analysis?: Json | null
          chat_id: string
          created_at?: string
          error_message?: string | null
          essence?: Json | null
          file_name: string
          file_path: string
          id?: string
          message_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          analysis?: Json | null
          chat_id?: string
          created_at?: string
          error_message?: string | null
          essence?: Json | null
          file_name?: string
          file_path?: string
          id?: string
          message_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hugo_contract_audits_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "hugo_chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hugo_contract_audits_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "hugo_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      hugo_curation_staging: {
        Row: {
          chosen: string | null
          created_at: string
          id: string
          prompt: string
          reasons: string[]
          redactions: number
          rejected: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_notes: string | null
          source_id: string
          source_kind: string
          source_user_id: string
          status: string
          track: string
        }
        Insert: {
          chosen?: string | null
          created_at?: string
          id?: string
          prompt: string
          reasons?: string[]
          redactions?: number
          rejected?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          source_id: string
          source_kind: string
          source_user_id: string
          status?: string
          track: string
        }
        Update: {
          chosen?: string | null
          created_at?: string
          id?: string
          prompt?: string
          reasons?: string[]
          redactions?: number
          rejected?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          source_id?: string
          source_kind?: string
          source_user_id?: string
          status?: string
          track?: string
        }
        Relationships: []
      }
      hugo_feedback: {
        Row: {
          chat_id: string
          comment: string | null
          created_at: string
          id: string
          message_id: string
          rating: string
          reasons: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          chat_id: string
          comment?: string | null
          created_at?: string
          id?: string
          message_id: string
          rating: string
          reasons?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          chat_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          message_id?: string
          rating?: string
          reasons?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      hugo_knowledge_sources: {
        Row: {
          check_status: string
          content_hash: string | null
          created_at: string
          effective_from: string
          effective_until: string | null
          excerpt: string
          id: string
          jurisdiction: string
          last_checked_at: string | null
          monitored_text: string | null
          review_due_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          source_url: string
          status: string
          title: string
          topic: string
          unapplied_effects: number | null
          updated_at: string
        }
        Insert: {
          check_status?: string
          content_hash?: string | null
          created_at?: string
          effective_from: string
          effective_until?: string | null
          excerpt: string
          id?: string
          jurisdiction: string
          last_checked_at?: string | null
          monitored_text?: string | null
          review_due_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_url: string
          status?: string
          title: string
          topic: string
          unapplied_effects?: number | null
          updated_at?: string
        }
        Update: {
          check_status?: string
          content_hash?: string | null
          created_at?: string
          effective_from?: string
          effective_until?: string | null
          excerpt?: string
          id?: string
          jurisdiction?: string
          last_checked_at?: string | null
          monitored_text?: string | null
          review_due_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_url?: string
          status?: string
          title?: string
          topic?: string
          unapplied_effects?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      hugo_messages: {
        Row: {
          chat_id: string
          content: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          chat_id: string
          content: string
          created_at?: string
          id?: string
          role?: string
        }
        Update: {
          chat_id?: string
          content?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "hugo_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "hugo_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      hugo_metrics: {
        Row: {
          chat_id: string | null
          clarity_score: number | null
          conciseness_score: number | null
          context_retention_score: number | null
          created_at: string
          doc_safety_score: number | null
          doc_structure_score: number | null
          document_id: string | null
          empathy_score: number | null
          escalation_score: number | null
          ethics_flags: string | null
          id: string
          interaction_type: string
          overall_score: number | null
          relevance_score: number | null
          retention_score: number | null
          risk_accuracy_score: number | null
          title_quality_score: number | null
          user_id: string
          weakest_areas: string | null
        }
        Insert: {
          chat_id?: string | null
          clarity_score?: number | null
          conciseness_score?: number | null
          context_retention_score?: number | null
          created_at?: string
          doc_safety_score?: number | null
          doc_structure_score?: number | null
          document_id?: string | null
          empathy_score?: number | null
          escalation_score?: number | null
          ethics_flags?: string | null
          id?: string
          interaction_type?: string
          overall_score?: number | null
          relevance_score?: number | null
          retention_score?: number | null
          risk_accuracy_score?: number | null
          title_quality_score?: number | null
          user_id: string
          weakest_areas?: string | null
        }
        Update: {
          chat_id?: string | null
          clarity_score?: number | null
          conciseness_score?: number | null
          context_retention_score?: number | null
          created_at?: string
          doc_safety_score?: number | null
          doc_structure_score?: number | null
          document_id?: string | null
          empathy_score?: number | null
          escalation_score?: number | null
          ethics_flags?: string | null
          id?: string
          interaction_type?: string
          overall_score?: number | null
          relevance_score?: number | null
          retention_score?: number | null
          risk_accuracy_score?: number | null
          title_quality_score?: number | null
          user_id?: string
          weakest_areas?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hugo_metrics_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "hugo_chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hugo_metrics_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "generated_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      hugo_provider_state: {
        Row: {
          blocked_at: string
          message: string
          provider: string
          status: number
        }
        Insert: {
          blocked_at?: string
          message: string
          provider: string
          status: number
        }
        Update: {
          blocked_at?: string
          message?: string
          provider?: string
          status?: number
        }
        Relationships: []
      }
      hugo_request_windows: {
        Row: {
          attempts: number
          bucket: string
          user_id: string
          window_start: string
        }
        Insert: {
          attempts?: number
          bucket: string
          user_id: string
          window_start?: string
        }
        Update: {
          attempts?: number
          bucket?: string
          user_id?: string
          window_start?: string
        }
        Relationships: []
      }
      hugo_source_changes: {
        Row: {
          analysis_status: string
          change_kind: string
          detected_at: string
          id: string
          impact_analysis: string | null
          new_hash: string | null
          new_text: string | null
          new_unapplied: number | null
          previous_hash: string | null
          previous_text: string | null
          previous_unapplied: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          source_id: string
        }
        Insert: {
          analysis_status?: string
          change_kind: string
          detected_at?: string
          id?: string
          impact_analysis?: string | null
          new_hash?: string | null
          new_text?: string | null
          new_unapplied?: number | null
          previous_hash?: string | null
          previous_text?: string | null
          previous_unapplied?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_id: string
        }
        Update: {
          analysis_status?: string
          change_kind?: string
          detected_at?: string
          id?: string
          impact_analysis?: string | null
          new_hash?: string | null
          new_text?: string | null
          new_unapplied?: number | null
          previous_hash?: string | null
          previous_text?: string | null
          previous_unapplied?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hugo_source_changes_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "hugo_knowledge_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      hugo_source_reviews: {
        Row: {
          checks: Json
          decision: string
          id: string
          notes: string
          reviewed_at: string
          reviewer_id: string
          source_id: string
          source_snapshot: Json
        }
        Insert: {
          checks: Json
          decision: string
          id?: string
          notes: string
          reviewed_at?: string
          reviewer_id: string
          source_id: string
          source_snapshot: Json
        }
        Update: {
          checks?: Json
          decision?: string
          id?: string
          notes?: string
          reviewed_at?: string
          reviewer_id?: string
          source_id?: string
          source_snapshot?: Json
        }
        Relationships: [
          {
            foreignKeyName: "hugo_source_reviews_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "hugo_knowledge_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      hugo_training_consent: {
        Row: {
          allow_training_curation: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          allow_training_curation?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          allow_training_curation?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      legal_request_admin_notes: {
        Row: {
          notes: string
          request_id: string
          updated_at: string
        }
        Insert: {
          notes?: string
          request_id: string
          updated_at?: string
        }
        Update: {
          notes?: string
          request_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "legal_request_admin_notes_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: true
            referencedRelation: "legal_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_requests: {
        Row: {
          admin_notes: string | null
          admin_response: string | null
          assigned_at: string | null
          assigned_to: string | null
          assigned_to_name: string | null
          audit_log: Json | null
          created_at: string
          description: string
          facts: Json | null
          file_urls: string[] | null
          id: string
          responded_at: string | null
          state: string | null
          status: Database["public"]["Enums"]["request_status"]
          ticket_number: string | null
          title: string | null
          topic: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          admin_response?: string | null
          assigned_at?: string | null
          assigned_to?: string | null
          assigned_to_name?: string | null
          audit_log?: Json | null
          created_at?: string
          description: string
          facts?: Json | null
          file_urls?: string[] | null
          id?: string
          responded_at?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          ticket_number?: string | null
          title?: string | null
          topic: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          admin_response?: string | null
          assigned_at?: string | null
          assigned_to?: string | null
          assigned_to_name?: string | null
          audit_log?: Json | null
          created_at?: string
          description?: string
          facts?: Json | null
          file_urls?: string[] | null
          id?: string
          responded_at?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          ticket_number?: string | null
          title?: string | null
          topic?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          first_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      request_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          request_id: string
          sender_id: string
          sender_role: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          request_id: string
          sender_id: string
          sender_role?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          request_id?: string
          sender_id?: string
          sender_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_messages_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "legal_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      audit_quota_status: {
        Args: never
        Returns: {
          monthly_limit: number
          unlimited: boolean
          used: number
        }[]
      }
      consume_audit_credit: {
        Args: { p_audit: string; p_limit?: number; p_user: string }
        Returns: boolean
      }
      consume_hugo_request: {
        Args: { p_bucket: string; p_user: string }
        Returns: boolean
      }
      generate_ticket_number: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      list_verified_hugo_citations: {
        Args: never
        Returns: {
          effective_from: string
          excerpt: string
          id: string
          jurisdiction: string
          reviewed_at: string
          source_url: string
          title: string
        }[]
      }
      review_hugo_source: {
        Args: {
          p_checks: Json
          p_decision: string
          p_effective_from: string
          p_effective_until: string
          p_excerpt: string
          p_expected_hash: string
          p_expected_updated_at: string
          p_jurisdiction: string
          p_notes: string
          p_review_due_at: string
          p_source_id: string
          p_topic: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      request_status: "pending" | "reviewing" | "completed" | "archived"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      request_status: ["pending", "reviewing", "completed", "archived"],
    },
  },
} as const
