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
      notes: {
        Row: {
          content_json: Json
          content_text: string
          created_at: string
          entity_id: string | null
          entity_title: string | null
          entity_type: string | null
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content_json?: Json
          content_text?: string
          created_at?: string
          entity_id?: string | null
          entity_title?: string | null
          entity_type?: string | null
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content_json?: Json
          content_text?: string
          created_at?: string
          entity_id?: string | null
          entity_title?: string | null
          entity_type?: string | null
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization: {
        Row: {
          embedding: string | null
          flagship_products: string | null
          fts: unknown
          name: string | null
          organization_id: string
          organization_type: string | null
          overview: string | null
          primary_ai_focus: string | null
          search_text: string | null
          website_domain: string | null
        }
        Insert: {
          embedding?: string | null
          flagship_products?: string | null
          fts?: unknown
          name?: string | null
          organization_id: string
          organization_type?: string | null
          overview?: string | null
          primary_ai_focus?: string | null
          search_text?: string | null
          website_domain?: string | null
        }
        Update: {
          embedding?: string | null
          flagship_products?: string | null
          fts?: unknown
          name?: string | null
          organization_id?: string
          organization_type?: string | null
          overview?: string | null
          primary_ai_focus?: string | null
          search_text?: string | null
          website_domain?: string | null
        }
        Relationships: []
      }
      organization_has_ceo: {
        Row: {
          confidence: number | null
          needs_review: boolean | null
          organization_id: string
          person_id: string
          role_title: string | null
        }
        Insert: {
          confidence?: number | null
          needs_review?: boolean | null
          organization_id: string
          person_id: string
          role_title?: string | null
        }
        Update: {
          confidence?: number | null
          needs_review?: boolean | null
          organization_id?: string
          person_id?: string
          role_title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_has_ceo_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organization"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_has_ceo_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "person"
            referencedColumns: ["person_id"]
          },
        ]
      }
      person: {
        Row: {
          ai_engineer_url: string | null
          bio: string | null
          embedding: string | null
          expertise_or_focus_area: string | null
          first_name: string | null
          fts: unknown
          full_name: string | null
          last_name: string | null
          linkedin_url: string | null
          person_id: string
          role_title: string | null
          search_text: string | null
          sessionize_profile_picture_url: string | null
          tag_line: string | null
        }
        Insert: {
          ai_engineer_url?: string | null
          bio?: string | null
          embedding?: string | null
          expertise_or_focus_area?: string | null
          first_name?: string | null
          fts?: unknown
          full_name?: string | null
          last_name?: string | null
          linkedin_url?: string | null
          person_id: string
          role_title?: string | null
          search_text?: string | null
          sessionize_profile_picture_url?: string | null
          tag_line?: string | null
        }
        Update: {
          ai_engineer_url?: string | null
          bio?: string | null
          embedding?: string | null
          expertise_or_focus_area?: string | null
          first_name?: string | null
          fts?: unknown
          full_name?: string | null
          last_name?: string | null
          linkedin_url?: string | null
          person_id?: string
          role_title?: string | null
          search_text?: string | null
          sessionize_profile_picture_url?: string | null
          tag_line?: string | null
        }
        Relationships: []
      }
      person_appeared_in_video: {
        Row: {
          match_method: string | null
          matched_name_variant: string | null
          person_id: string
          video_id: string
        }
        Insert: {
          match_method?: string | null
          matched_name_variant?: string | null
          person_id: string
          video_id: string
        }
        Update: {
          match_method?: string | null
          matched_name_variant?: string | null
          person_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "person_appeared_in_video_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "person"
            referencedColumns: ["person_id"]
          },
          {
            foreignKeyName: "person_appeared_in_video_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "youtube_video"
            referencedColumns: ["video_id"]
          },
        ]
      }
      person_employed_by: {
        Row: {
          confidence: number | null
          needs_review: boolean | null
          organization_id: string
          person_id: string
          role_title: string | null
        }
        Insert: {
          confidence?: number | null
          needs_review?: boolean | null
          organization_id: string
          person_id: string
          role_title?: string | null
        }
        Update: {
          confidence?: number | null
          needs_review?: boolean | null
          organization_id?: string
          person_id?: string
          role_title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "person_employed_by_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "person_employed_by_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "person"
            referencedColumns: ["person_id"]
          },
        ]
      }
      person_founded_organization: {
        Row: {
          confidence: number | null
          needs_review: boolean | null
          organization_id: string
          person_id: string
          role_title: string | null
        }
        Insert: {
          confidence?: number | null
          needs_review?: boolean | null
          organization_id: string
          person_id: string
          role_title?: string | null
        }
        Update: {
          confidence?: number | null
          needs_review?: boolean | null
          organization_id?: string
          person_id?: string
          role_title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "person_founded_organization_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "person_founded_organization_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "person"
            referencedColumns: ["person_id"]
          },
        ]
      }
      person_presented_at_session: {
        Row: {
          person_id: string
          session_id: string
        }
        Insert: {
          person_id: string
          session_id: string
        }
        Update: {
          person_id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "person_presented_at_session_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "person"
            referencedColumns: ["person_id"]
          },
          {
            foreignKeyName: "person_presented_at_session_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "session"
            referencedColumns: ["session_id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      saved_items: {
        Row: {
          created_at: string
          entity_id: string
          entity_subtitle: string | null
          entity_title: string
          entity_type: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_subtitle?: string | null
          entity_title: string
          entity_type: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_subtitle?: string | null
          entity_title?: string
          entity_type?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      session: {
        Row: {
          description: string | null
          embedding: string | null
          extended_description: string | null
          level: string | null
          search_text: string | null
          session_id: string
          title: string | null
        }
        Insert: {
          description?: string | null
          embedding?: string | null
          extended_description?: string | null
          level?: string | null
          search_text?: string | null
          session_id: string
          title?: string | null
        }
        Update: {
          description?: string | null
          embedding?: string | null
          extended_description?: string | null
          level?: string | null
          search_text?: string | null
          session_id?: string
          title?: string | null
        }
        Relationships: []
      }
      session_recorded_as_video: {
        Row: {
          match_similarity: number | null
          session_id: string
          video_id: string
        }
        Insert: {
          match_similarity?: number | null
          session_id: string
          video_id: string
        }
        Update: {
          match_similarity?: number | null
          session_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_recorded_as_video_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "session"
            referencedColumns: ["session_id"]
          },
          {
            foreignKeyName: "session_recorded_as_video_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "youtube_video"
            referencedColumns: ["video_id"]
          },
        ]
      }
      youtube_channel: {
        Row: {
          channel_id: string
          channel_title: string | null
          channel_url: string | null
        }
        Insert: {
          channel_id: string
          channel_title?: string | null
          channel_url?: string | null
        }
        Update: {
          channel_id?: string
          channel_title?: string | null
          channel_url?: string | null
        }
        Relationships: []
      }
      youtube_video: {
        Row: {
          channel_id: string | null
          comment_count: number | null
          description: string | null
          duration: string | null
          duration_seconds: number | null
          embedding: string | null
          fts: unknown
          like_count: number | null
          published_at: string | null
          search_text: string | null
          thumbnail_url: string | null
          title: string | null
          url: string | null
          video_id: string
          view_count: number | null
        }
        Insert: {
          channel_id?: string | null
          comment_count?: number | null
          description?: string | null
          duration?: string | null
          duration_seconds?: number | null
          embedding?: string | null
          fts?: unknown
          like_count?: number | null
          published_at?: string | null
          search_text?: string | null
          thumbnail_url?: string | null
          title?: string | null
          url?: string | null
          video_id: string
          view_count?: number | null
        }
        Update: {
          channel_id?: string | null
          comment_count?: number | null
          description?: string | null
          duration?: string | null
          duration_seconds?: number | null
          embedding?: string | null
          fts?: unknown
          like_count?: number | null
          published_at?: string | null
          search_text?: string | null
          thumbnail_url?: string | null
          title?: string | null
          url?: string | null
          video_id?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "youtube_video_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "youtube_channel"
            referencedColumns: ["channel_id"]
          },
        ]
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
