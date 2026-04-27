export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      attempt: {
        Row: {
          attempt_id: string
          challenge_id: string
          code_blob: string | null
          composite_score: number | null
          created_at: string
          finished_at: string | null
          judge_feedback: string | null
          judge_score: number | null
          sandbox_provider: string | null
          sandbox_session_id: string | null
          scoring_config: Json
          started_at: string
          tests_pass: number | null
          tests_total: number | null
          user_id: string
        }
        Insert: {
          attempt_id?: string
          challenge_id: string
          code_blob?: string | null
          composite_score?: number | null
          created_at?: string
          finished_at?: string | null
          judge_feedback?: string | null
          judge_score?: number | null
          sandbox_provider?: string | null
          sandbox_session_id?: string | null
          scoring_config?: Json
          started_at?: string
          tests_pass?: number | null
          tests_total?: number | null
          user_id: string
        }
        Update: {
          attempt_id?: string
          challenge_id?: string
          code_blob?: string | null
          composite_score?: number | null
          created_at?: string
          finished_at?: string | null
          judge_feedback?: string | null
          judge_score?: number | null
          sandbox_provider?: string | null
          sandbox_session_id?: string | null
          scoring_config?: Json
          started_at?: string
          tests_pass?: number | null
          tests_total?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attempt_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenge"
            referencedColumns: ["challenge_id"]
          },
          {
            foreignKeyName: "attempt_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "current_user_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "attempt_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attempt_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge: {
        Row: {
          challenge_id: string
          course_id: string | null
          created_at: string
          deps_json: Json
          est_minutes: number | null
          judge_model: string | null
          judge_prompt_md: string | null
          judge_rubric_version: string | null
          metadata: Json
          module_id: string | null
          rubric_md: string
          runtime: string
          slug: string
          starter_code: string | null
          status: string
          task_md: string
          tests_blob: string | null
          title: string
          updated_at: string
        }
        Insert: {
          challenge_id?: string
          course_id?: string | null
          created_at?: string
          deps_json?: Json
          est_minutes?: number | null
          judge_model?: string | null
          judge_prompt_md?: string | null
          judge_rubric_version?: string | null
          metadata?: Json
          module_id?: string | null
          rubric_md: string
          runtime: string
          slug: string
          starter_code?: string | null
          status?: string
          task_md: string
          tests_blob?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          challenge_id?: string
          course_id?: string | null
          created_at?: string
          deps_json?: Json
          est_minutes?: number | null
          judge_model?: string | null
          judge_prompt_md?: string | null
          judge_rubric_version?: string | null
          metadata?: Json
          module_id?: string | null
          rubric_md?: string
          runtime?: string
          slug?: string
          starter_code?: string | null
          status?: string
          task_md?: string
          tests_blob?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "challenge_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_module"
            referencedColumns: ["module_id"]
          },
        ]
      }
      chunk: {
        Row: {
          char_offset_end: number | null
          char_offset_start: number | null
          chunk_id: string
          content: string
          content_hash: string
          created_at: string
          embedding: string | null
          metadata: Json
          ord: number
          source_id: string
          source_kind: string
          token_count: number | null
          tsv: unknown
          updated_at: string
        }
        Insert: {
          char_offset_end?: number | null
          char_offset_start?: number | null
          chunk_id?: string
          content: string
          content_hash: string
          created_at?: string
          embedding?: string | null
          metadata?: Json
          ord?: number
          source_id: string
          source_kind: string
          token_count?: number | null
          tsv?: unknown
          updated_at?: string
        }
        Update: {
          char_offset_end?: number | null
          char_offset_start?: number | null
          chunk_id?: string
          content?: string
          content_hash?: string
          created_at?: string
          embedding?: string | null
          metadata?: Json
          ord?: number
          source_id?: string
          source_kind?: string
          token_count?: number | null
          tsv?: unknown
          updated_at?: string
        }
        Relationships: []
      }
      course: {
        Row: {
          authors: Json
          capstone_challenge_id: string | null
          course_id: string
          created_at: string
          domain_bucket: string
          domain_layer: string | null
          embedding: string | null
          est_hours: number | null
          fts: unknown
          is_latest_published: boolean
          metadata: Json
          narrative_md: string | null
          search_text: string | null
          slug: string
          status: string
          summary: string | null
          title: string
          updated_at: string
          version: string
        }
        Insert: {
          authors?: Json
          capstone_challenge_id?: string | null
          course_id?: string
          created_at?: string
          domain_bucket: string
          domain_layer?: string | null
          embedding?: string | null
          est_hours?: number | null
          fts?: unknown
          is_latest_published?: boolean
          metadata?: Json
          narrative_md?: string | null
          search_text?: string | null
          slug: string
          status?: string
          summary?: string | null
          title: string
          updated_at?: string
          version?: string
        }
        Update: {
          authors?: Json
          capstone_challenge_id?: string | null
          course_id?: string
          created_at?: string
          domain_bucket?: string
          domain_layer?: string | null
          embedding?: string | null
          est_hours?: number | null
          fts?: unknown
          is_latest_published?: boolean
          metadata?: Json
          narrative_md?: string | null
          search_text?: string | null
          slug?: string
          status?: string
          summary?: string | null
          title?: string
          updated_at?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_capstone_challenge_id_fkey"
            columns: ["capstone_challenge_id"]
            isOneToOne: false
            referencedRelation: "challenge"
            referencedColumns: ["challenge_id"]
          },
        ]
      }
      course_enrollment: {
        Row: {
          completed_at: string | null
          course_id: string
          progress: Json
          started_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          progress?: Json
          started_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          progress?: Json
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollment_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "course_enrollment_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "current_user_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "course_enrollment_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_enrollment_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      course_module: {
        Row: {
          authors: Json
          body_kind: string | null
          body_md: string
          content_hash: string | null
          created_at: string
          difficulty: string | null
          domain_buckets: string[]
          duration_min: number | null
          embedding: string | null
          fts: unknown
          is_latest_published: boolean
          learning_objectives: Json
          metadata: Json
          mini_quiz: Json
          module_id: string
          search_text: string | null
          slug: string
          source_path: string | null
          status: string
          title: string
          updated_at: string
          version: string
        }
        Insert: {
          authors?: Json
          body_kind?: string | null
          body_md: string
          content_hash?: string | null
          created_at?: string
          difficulty?: string | null
          domain_buckets?: string[]
          duration_min?: number | null
          embedding?: string | null
          fts?: unknown
          is_latest_published?: boolean
          learning_objectives?: Json
          metadata?: Json
          mini_quiz?: Json
          module_id?: string
          search_text?: string | null
          slug: string
          source_path?: string | null
          status?: string
          title: string
          updated_at?: string
          version?: string
        }
        Update: {
          authors?: Json
          body_kind?: string | null
          body_md?: string
          content_hash?: string | null
          created_at?: string
          difficulty?: string | null
          domain_buckets?: string[]
          duration_min?: number | null
          embedding?: string | null
          fts?: unknown
          is_latest_published?: boolean
          learning_objectives?: Json
          metadata?: Json
          mini_quiz?: Json
          module_id?: string
          search_text?: string | null
          slug?: string
          source_path?: string | null
          status?: string
          title?: string
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      course_module_completion: {
        Row: {
          attempts: number
          completed_at: string
          course_id: string
          course_version: string
          metadata: Json
          module_id: string
          module_version: string
          quiz_responses: Json
          quiz_score: number | null
          time_spent_seconds: number | null
          user_id: string
        }
        Insert: {
          attempts?: number
          completed_at?: string
          course_id: string
          course_version: string
          metadata?: Json
          module_id: string
          module_version: string
          quiz_responses?: Json
          quiz_score?: number | null
          time_spent_seconds?: number | null
          user_id: string
        }
        Update: {
          attempts?: number
          completed_at?: string
          course_id?: string
          course_version?: string
          metadata?: Json
          module_id?: string
          module_version?: string
          quiz_responses?: Json
          quiz_score?: number | null
          time_spent_seconds?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_module_completion_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "course_module_completion_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_module"
            referencedColumns: ["module_id"]
          },
          {
            foreignKeyName: "course_module_completion_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "current_user_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "course_module_completion_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_module_completion_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      course_module_in_course: {
        Row: {
          course_id: string
          created_at: string
          module_id: string
          ord: number
          pinned_version: string | null
          role: string | null
        }
        Insert: {
          course_id: string
          created_at?: string
          module_id: string
          ord: number
          pinned_version?: string | null
          role?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string
          module_id?: string
          ord?: number
          pinned_version?: string | null
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_module_in_course_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "course_module_in_course_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_module"
            referencedColumns: ["module_id"]
          },
        ]
      }
      course_module_requires: {
        Row: {
          created_at: string
          module_id: string
          prereq_module_id: string
        }
        Insert: {
          created_at?: string
          module_id: string
          prereq_module_id: string
        }
        Update: {
          created_at?: string
          module_id?: string
          prereq_module_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_module_requires_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_module"
            referencedColumns: ["module_id"]
          },
          {
            foreignKeyName: "course_module_requires_prereq_module_id_fkey"
            columns: ["prereq_module_id"]
            isOneToOne: false
            referencedRelation: "course_module"
            referencedColumns: ["module_id"]
          },
        ]
      }
      course_module_review: {
        Row: {
          created_at: string
          decision: string
          module_id: string
          notes_md: string | null
          review_id: string
          reviewer_id: string | null
          version: string
        }
        Insert: {
          created_at?: string
          decision: string
          module_id: string
          notes_md?: string | null
          review_id?: string
          reviewer_id?: string | null
          version: string
        }
        Update: {
          created_at?: string
          decision?: string
          module_id?: string
          notes_md?: string | null
          review_id?: string
          reviewer_id?: string | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_module_review_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_module"
            referencedColumns: ["module_id"]
          },
          {
            foreignKeyName: "course_module_review_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "current_user_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "course_module_review_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_module_review_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "public_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      event: {
        Row: {
          agenda_url: string | null
          attendee_count: number | null
          city: string | null
          country: string | null
          created_at: string
          description: string | null
          edition: number | null
          embedding: string | null
          end_date: string | null
          event_id: string
          fts: unknown
          is_aie_official: boolean
          metadata: Json
          name: string
          region: string | null
          search_text: string | null
          series: string | null
          session_count: number | null
          slug: string
          speaker_count: number | null
          start_date: string | null
          tagline: string | null
          topic_tags: string[]
          updated_at: string
          venue: string | null
          website_url: string | null
          youtube_playlist_url: string | null
        }
        Insert: {
          agenda_url?: string | null
          attendee_count?: number | null
          city?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          edition?: number | null
          embedding?: string | null
          end_date?: string | null
          event_id: string
          fts?: unknown
          is_aie_official?: boolean
          metadata?: Json
          name: string
          region?: string | null
          search_text?: string | null
          series?: string | null
          session_count?: number | null
          slug: string
          speaker_count?: number | null
          start_date?: string | null
          tagline?: string | null
          topic_tags?: string[]
          updated_at?: string
          venue?: string | null
          website_url?: string | null
          youtube_playlist_url?: string | null
        }
        Update: {
          agenda_url?: string | null
          attendee_count?: number | null
          city?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          edition?: number | null
          embedding?: string | null
          end_date?: string | null
          event_id?: string
          fts?: unknown
          is_aie_official?: boolean
          metadata?: Json
          name?: string
          region?: string | null
          search_text?: string | null
          series?: string | null
          session_count?: number | null
          slug?: string
          speaker_count?: number | null
          start_date?: string | null
          tagline?: string | null
          topic_tags?: string[]
          updated_at?: string
          venue?: string | null
          website_url?: string | null
          youtube_playlist_url?: string | null
        }
        Relationships: []
      }
      image: {
        Row: {
          alt: string
          attribution: string | null
          blurhash: string | null
          byte_size: number | null
          caption: string | null
          cdn_url: string | null
          content_hash: string | null
          content_warning: string | null
          created_at: string
          created_by: string | null
          dominant_color: string | null
          focal_x: number | null
          focal_y: number | null
          fts: unknown
          height: number | null
          image_id: string
          is_animated: boolean
          license: string | null
          metadata: Json
          mime_type: string | null
          nsfw: boolean
          palette: Json
          safe_area: Json | null
          source: string
          source_url: string | null
          storage_bucket: string | null
          storage_key: string | null
          storage_provider: string
          storage_region: string | null
          thumbhash: string | null
          title: string | null
          updated_at: string
          url: string
          width: number | null
        }
        Insert: {
          alt?: string
          attribution?: string | null
          blurhash?: string | null
          byte_size?: number | null
          caption?: string | null
          cdn_url?: string | null
          content_hash?: string | null
          content_warning?: string | null
          created_at?: string
          created_by?: string | null
          dominant_color?: string | null
          focal_x?: number | null
          focal_y?: number | null
          fts?: unknown
          height?: number | null
          image_id?: string
          is_animated?: boolean
          license?: string | null
          metadata?: Json
          mime_type?: string | null
          nsfw?: boolean
          palette?: Json
          safe_area?: Json | null
          source?: string
          source_url?: string | null
          storage_bucket?: string | null
          storage_key?: string | null
          storage_provider?: string
          storage_region?: string | null
          thumbhash?: string | null
          title?: string | null
          updated_at?: string
          url: string
          width?: number | null
        }
        Update: {
          alt?: string
          attribution?: string | null
          blurhash?: string | null
          byte_size?: number | null
          caption?: string | null
          cdn_url?: string | null
          content_hash?: string | null
          content_warning?: string | null
          created_at?: string
          created_by?: string | null
          dominant_color?: string | null
          focal_x?: number | null
          focal_y?: number | null
          fts?: unknown
          height?: number | null
          image_id?: string
          is_animated?: boolean
          license?: string | null
          metadata?: Json
          mime_type?: string | null
          nsfw?: boolean
          palette?: Json
          safe_area?: Json | null
          source?: string
          source_url?: string | null
          storage_bucket?: string | null
          storage_key?: string | null
          storage_provider?: string
          storage_region?: string | null
          thumbhash?: string | null
          title?: string | null
          updated_at?: string
          url?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "image_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "current_user_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "image_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "image_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      image_attachment: {
        Row: {
          alt_override: string | null
          attachment_id: string
          caption: string | null
          created_at: string
          entity_id: string
          entity_kind: string
          image_id: string
          ord: number
          render_hints: Json
          role: string
          variant: string | null
        }
        Insert: {
          alt_override?: string | null
          attachment_id?: string
          caption?: string | null
          created_at?: string
          entity_id: string
          entity_kind: string
          image_id: string
          ord?: number
          render_hints?: Json
          role: string
          variant?: string | null
        }
        Update: {
          alt_override?: string | null
          attachment_id?: string
          caption?: string | null
          created_at?: string
          entity_id?: string
          entity_kind?: string
          image_id?: string
          ord?: number
          render_hints?: Json
          role?: string
          variant?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "image_attachment_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "image"
            referencedColumns: ["image_id"]
          },
        ]
      }
      library: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          docs_url: string | null
          domain_layer: string | null
          embedding: string | null
          first_release_at: string | null
          fts: unknown
          github_forks: number | null
          github_open_issues: number | null
          github_stars: number | null
          github_url: string | null
          github_watchers: number | null
          homepage_url: string | null
          huggingface_id: string | null
          is_open_source: boolean
          kind: string | null
          language: string | null
          last_harvested_at: string | null
          latest_release_at: string | null
          latest_version: string | null
          license: string | null
          metadata: Json
          name: string
          npm_name: string | null
          npm_weekly_downloads: number | null
          organization_id: string | null
          popularity_score: number | null
          pypi_monthly_downloads: number | null
          pypi_name: string | null
          search_text: string | null
          slug: string
          tagline: string | null
          tags: string[]
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          docs_url?: string | null
          domain_layer?: string | null
          embedding?: string | null
          first_release_at?: string | null
          fts?: unknown
          github_forks?: number | null
          github_open_issues?: number | null
          github_stars?: number | null
          github_url?: string | null
          github_watchers?: number | null
          homepage_url?: string | null
          huggingface_id?: string | null
          is_open_source?: boolean
          kind?: string | null
          language?: string | null
          last_harvested_at?: string | null
          latest_release_at?: string | null
          latest_version?: string | null
          license?: string | null
          metadata?: Json
          name: string
          npm_name?: string | null
          npm_weekly_downloads?: number | null
          organization_id?: string | null
          popularity_score?: number | null
          pypi_monthly_downloads?: number | null
          pypi_name?: string | null
          search_text?: string | null
          slug: string
          tagline?: string | null
          tags?: string[]
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          docs_url?: string | null
          domain_layer?: string | null
          embedding?: string | null
          first_release_at?: string | null
          fts?: unknown
          github_forks?: number | null
          github_open_issues?: number | null
          github_stars?: number | null
          github_url?: string | null
          github_watchers?: number | null
          homepage_url?: string | null
          huggingface_id?: string | null
          is_open_source?: boolean
          kind?: string | null
          language?: string | null
          last_harvested_at?: string | null
          latest_release_at?: string | null
          latest_version?: string | null
          license?: string | null
          metadata?: Json
          name?: string
          npm_name?: string | null
          npm_weekly_downloads?: number | null
          organization_id?: string | null
          popularity_score?: number | null
          pypi_monthly_downloads?: number | null
          pypi_name?: string | null
          search_text?: string | null
          slug?: string
          tagline?: string | null
          tags?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "library_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      library_appeared_in_session: {
        Row: {
          confidence: number | null
          created_at: string
          evidence: Json
          library_slug: string
          session_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          evidence?: Json
          library_slug: string
          session_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          evidence?: Json
          library_slug?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "library_appeared_in_session_library_slug_fkey"
            columns: ["library_slug"]
            isOneToOne: false
            referencedRelation: "library"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "library_appeared_in_session_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "session"
            referencedColumns: ["session_id"]
          },
        ]
      }
      library_appeared_in_video: {
        Row: {
          confidence: number | null
          created_at: string
          evidence: Json
          library_slug: string
          video_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          evidence?: Json
          library_slug: string
          video_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          evidence?: Json
          library_slug?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "library_appeared_in_video_library_slug_fkey"
            columns: ["library_slug"]
            isOneToOne: false
            referencedRelation: "library"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "library_appeared_in_video_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "youtube_video"
            referencedColumns: ["video_id"]
          },
        ]
      }
      library_uses_library: {
        Row: {
          child_library_slug: string
          created_at: string
          dep_kind: string | null
          parent_library_slug: string
        }
        Insert: {
          child_library_slug: string
          created_at?: string
          dep_kind?: string | null
          parent_library_slug: string
        }
        Update: {
          child_library_slug?: string
          created_at?: string
          dep_kind?: string | null
          parent_library_slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "library_uses_library_child_library_slug_fkey"
            columns: ["child_library_slug"]
            isOneToOne: false
            referencedRelation: "library"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "library_uses_library_parent_library_slug_fkey"
            columns: ["parent_library_slug"]
            isOneToOne: false
            referencedRelation: "library"
            referencedColumns: ["slug"]
          },
        ]
      }
      module_completion: {
        Row: {
          attempts: number
          completed_at: string
          module_id: string
          module_version: string | null
          quiz_responses: Json
          quiz_score: number | null
          time_spent_seconds: number | null
          user_id: string
        }
        Insert: {
          attempts?: number
          completed_at?: string
          module_id: string
          module_version?: string | null
          quiz_responses?: Json
          quiz_score?: number | null
          time_spent_seconds?: number | null
          user_id: string
        }
        Update: {
          attempts?: number
          completed_at?: string
          module_id?: string
          module_version?: string | null
          quiz_responses?: Json
          quiz_score?: number | null
          time_spent_seconds?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_completion_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_module"
            referencedColumns: ["module_id"]
          },
          {
            foreignKeyName: "module_completion_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "current_user_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "module_completion_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_completion_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      module_uses_artifact: {
        Row: {
          artifact_id: string
          artifact_kind: string
          chunk_id: string | null
          created_at: string
          module_id: string
          ord: number
          role: string | null
        }
        Insert: {
          artifact_id: string
          artifact_kind: string
          chunk_id?: string | null
          created_at?: string
          module_id: string
          ord?: number
          role?: string | null
        }
        Update: {
          artifact_id?: string
          artifact_kind?: string
          chunk_id?: string | null
          created_at?: string
          module_id?: string
          ord?: number
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "module_uses_artifact_chunk_id_fkey"
            columns: ["chunk_id"]
            isOneToOne: false
            referencedRelation: "chunk"
            referencedColumns: ["chunk_id"]
          },
          {
            foreignKeyName: "module_uses_artifact_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_module"
            referencedColumns: ["module_id"]
          },
        ]
      }
      news_item: {
        Row: {
          announced_at_event_id: string | null
          body_md: string | null
          categories: string[]
          created_at: string
          domain_layer: string | null
          embedding: string | null
          fts: unknown
          funding_amount_usd: number | null
          funding_round: string | null
          headline: string | null
          hero_image_url: string | null
          importance: number
          kind: string
          metadata: Json
          model_params_b: number | null
          news_item_id: string
          occurred_on: string | null
          primary_org_id: string | null
          primary_person_id: string | null
          published_at: string
          related_library_slugs: string[]
          related_org_slugs: string[]
          related_paper_slugs: string[]
          related_person_slugs: string[]
          related_product_slugs: string[]
          related_video_ids: string[]
          search_text: string | null
          slug: string
          source_kind: string | null
          source_name: string | null
          source_url: string | null
          status: string
          summary: string | null
          tags: string[]
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          announced_at_event_id?: string | null
          body_md?: string | null
          categories?: string[]
          created_at?: string
          domain_layer?: string | null
          embedding?: string | null
          fts?: unknown
          funding_amount_usd?: number | null
          funding_round?: string | null
          headline?: string | null
          hero_image_url?: string | null
          importance?: number
          kind: string
          metadata?: Json
          model_params_b?: number | null
          news_item_id?: string
          occurred_on?: string | null
          primary_org_id?: string | null
          primary_person_id?: string | null
          published_at?: string
          related_library_slugs?: string[]
          related_org_slugs?: string[]
          related_paper_slugs?: string[]
          related_person_slugs?: string[]
          related_product_slugs?: string[]
          related_video_ids?: string[]
          search_text?: string | null
          slug: string
          source_kind?: string | null
          source_name?: string | null
          source_url?: string | null
          status?: string
          summary?: string | null
          tags?: string[]
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          announced_at_event_id?: string | null
          body_md?: string | null
          categories?: string[]
          created_at?: string
          domain_layer?: string | null
          embedding?: string | null
          fts?: unknown
          funding_amount_usd?: number | null
          funding_round?: string | null
          headline?: string | null
          hero_image_url?: string | null
          importance?: number
          kind?: string
          metadata?: Json
          model_params_b?: number | null
          news_item_id?: string
          occurred_on?: string | null
          primary_org_id?: string | null
          primary_person_id?: string | null
          published_at?: string
          related_library_slugs?: string[]
          related_org_slugs?: string[]
          related_paper_slugs?: string[]
          related_person_slugs?: string[]
          related_product_slugs?: string[]
          related_video_ids?: string[]
          search_text?: string | null
          slug?: string
          source_kind?: string | null
          source_name?: string | null
          source_url?: string | null
          status?: string
          summary?: string | null
          tags?: string[]
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_item_announced_at_event_id_fkey"
            columns: ["announced_at_event_id"]
            isOneToOne: false
            referencedRelation: "event"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "news_item_primary_org_id_fkey"
            columns: ["primary_org_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "news_item_primary_person_id_fkey"
            columns: ["primary_person_id"]
            isOneToOne: false
            referencedRelation: "person"
            referencedColumns: ["person_id"]
          },
        ]
      }
      notes: {
        Row: {
          content_json: Json
          content_text: string
          created_at: string
          entity_id: string | null
          entity_title: string | null
          entity_type: string | null
          fts: unknown
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
          fts?: unknown
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
          fts?: unknown
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
            referencedRelation: "current_user_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      notification: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: string
          read_at: string | null
          ref_id: string | null
          ref_kind: string | null
          title: string
          url: string | null
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind: string
          read_at?: string | null
          ref_id?: string | null
          ref_kind?: string | null
          title: string
          url?: string | null
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          read_at?: string | null
          ref_id?: string | null
          ref_kind?: string | null
          title?: string
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "current_user_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "notification_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      organization: {
        Row: {
          blog_url: string | null
          business_model: string | null
          careers_url: string | null
          categories: string[]
          crunchbase_url: string | null
          docs_url: string | null
          domain_layers: string[]
          embedding: string | null
          flagship_products: string | null
          founded_year: number | null
          fts: unknown
          funding_total_usd: number | null
          github_org: string | null
          headcount_band: string | null
          headquarters_city: string | null
          headquarters_country: string | null
          homepage_url: string | null
          is_ai_first: boolean
          is_ai_innovator: boolean
          is_aie_sponsor: boolean
          last_enriched_at: string | null
          last_funding_at: string | null
          last_funding_round: string | null
          legal_entity_name: string | null
          linkedin_url: string | null
          logo_url: string | null
          metadata: Json
          name: string | null
          org_kind: string | null
          organization_id: string
          organization_type: string | null
          overview: string | null
          parent_org_id: string | null
          primary_ai_focus: string | null
          region: string | null
          search_text: string | null
          slug: string
          stage: string | null
          status_url: string | null
          tags: string[]
          ticker_symbol: string | null
          twitter_handle: string | null
          updated_at: string
          valuation_usd: number | null
          website_domain: string | null
        }
        Insert: {
          blog_url?: string | null
          business_model?: string | null
          careers_url?: string | null
          categories?: string[]
          crunchbase_url?: string | null
          docs_url?: string | null
          domain_layers?: string[]
          embedding?: string | null
          flagship_products?: string | null
          founded_year?: number | null
          fts?: unknown
          funding_total_usd?: number | null
          github_org?: string | null
          headcount_band?: string | null
          headquarters_city?: string | null
          headquarters_country?: string | null
          homepage_url?: string | null
          is_ai_first?: boolean
          is_ai_innovator?: boolean
          is_aie_sponsor?: boolean
          last_enriched_at?: string | null
          last_funding_at?: string | null
          last_funding_round?: string | null
          legal_entity_name?: string | null
          linkedin_url?: string | null
          logo_url?: string | null
          metadata?: Json
          name?: string | null
          org_kind?: string | null
          organization_id: string
          organization_type?: string | null
          overview?: string | null
          parent_org_id?: string | null
          primary_ai_focus?: string | null
          region?: string | null
          search_text?: string | null
          slug: string
          stage?: string | null
          status_url?: string | null
          tags?: string[]
          ticker_symbol?: string | null
          twitter_handle?: string | null
          updated_at?: string
          valuation_usd?: number | null
          website_domain?: string | null
        }
        Update: {
          blog_url?: string | null
          business_model?: string | null
          careers_url?: string | null
          categories?: string[]
          crunchbase_url?: string | null
          docs_url?: string | null
          domain_layers?: string[]
          embedding?: string | null
          flagship_products?: string | null
          founded_year?: number | null
          fts?: unknown
          funding_total_usd?: number | null
          github_org?: string | null
          headcount_band?: string | null
          headquarters_city?: string | null
          headquarters_country?: string | null
          homepage_url?: string | null
          is_ai_first?: boolean
          is_ai_innovator?: boolean
          is_aie_sponsor?: boolean
          last_enriched_at?: string | null
          last_funding_at?: string | null
          last_funding_round?: string | null
          legal_entity_name?: string | null
          linkedin_url?: string | null
          logo_url?: string | null
          metadata?: Json
          name?: string | null
          org_kind?: string | null
          organization_id?: string
          organization_type?: string | null
          overview?: string | null
          parent_org_id?: string | null
          primary_ai_focus?: string | null
          region?: string | null
          search_text?: string | null
          slug?: string
          stage?: string | null
          status_url?: string | null
          tags?: string[]
          ticker_symbol?: string | null
          twitter_handle?: string | null
          updated_at?: string
          valuation_usd?: number | null
          website_domain?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_parent_org_id_fkey"
            columns: ["parent_org_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["organization_id"]
          },
        ]
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
      organization_sponsored_event: {
        Row: {
          amount_usd: number | null
          created_at: string
          event_id: string
          notes: string | null
          organization_id: string
          tier: string | null
        }
        Insert: {
          amount_usd?: number | null
          created_at?: string
          event_id: string
          notes?: string | null
          organization_id: string
          tier?: string | null
        }
        Update: {
          amount_usd?: number | null
          created_at?: string
          event_id?: string
          notes?: string | null
          organization_id?: string
          tier?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_sponsored_event_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "organization_sponsored_event_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      paper: {
        Row: {
          abstract: string | null
          arxiv_id: string | null
          authors: Json
          categories: string[]
          citation_count: number | null
          created_at: string
          doi: string | null
          domain_layer: string | null
          embedding: string | null
          fts: unknown
          last_harvested_at: string | null
          metadata: Json
          pdf_url: string | null
          popularity_score: number | null
          published_on: string | null
          search_text: string | null
          slug: string
          tags: string[]
          title: string
          updated_at: string
          url: string | null
          venue: string | null
        }
        Insert: {
          abstract?: string | null
          arxiv_id?: string | null
          authors?: Json
          categories?: string[]
          citation_count?: number | null
          created_at?: string
          doi?: string | null
          domain_layer?: string | null
          embedding?: string | null
          fts?: unknown
          last_harvested_at?: string | null
          metadata?: Json
          pdf_url?: string | null
          popularity_score?: number | null
          published_on?: string | null
          search_text?: string | null
          slug: string
          tags?: string[]
          title: string
          updated_at?: string
          url?: string | null
          venue?: string | null
        }
        Update: {
          abstract?: string | null
          arxiv_id?: string | null
          authors?: Json
          categories?: string[]
          citation_count?: number | null
          created_at?: string
          doi?: string | null
          domain_layer?: string | null
          embedding?: string | null
          fts?: unknown
          last_harvested_at?: string | null
          metadata?: Json
          pdf_url?: string | null
          popularity_score?: number | null
          published_on?: string | null
          search_text?: string | null
          slug?: string
          tags?: string[]
          title?: string
          updated_at?: string
          url?: string | null
          venue?: string | null
        }
        Relationships: []
      }
      paper_appeared_in_video: {
        Row: {
          confidence: number | null
          created_at: string
          evidence: Json
          paper_slug: string
          video_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          evidence?: Json
          paper_slug: string
          video_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          evidence?: Json
          paper_slug?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "paper_appeared_in_video_paper_slug_fkey"
            columns: ["paper_slug"]
            isOneToOne: false
            referencedRelation: "paper"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "paper_appeared_in_video_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "youtube_video"
            referencedColumns: ["video_id"]
          },
        ]
      }
      paper_authored_by: {
        Row: {
          affiliation_org: string | null
          created_at: string
          is_corresponding: boolean
          ord: number
          paper_slug: string
          person_id: string
        }
        Insert: {
          affiliation_org?: string | null
          created_at?: string
          is_corresponding?: boolean
          ord?: number
          paper_slug: string
          person_id: string
        }
        Update: {
          affiliation_org?: string | null
          created_at?: string
          is_corresponding?: boolean
          ord?: number
          paper_slug?: string
          person_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "paper_authored_by_affiliation_org_fkey"
            columns: ["affiliation_org"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "paper_authored_by_paper_slug_fkey"
            columns: ["paper_slug"]
            isOneToOne: false
            referencedRelation: "paper"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "paper_authored_by_person_id_fkey"
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
          city: string | null
          country: string | null
          embedding: string | null
          expertise_or_focus_area: string | null
          expertise_tags: string[]
          first_name: string | null
          fts: unknown
          full_name: string | null
          github_username: string | null
          is_founder: boolean
          is_speaker: boolean
          last_enriched_at: string | null
          last_name: string | null
          linkedin_url: string | null
          metadata: Json
          notable_for: string | null
          person_id: string
          personal_website: string | null
          primary_org_id: string | null
          role_bucket: string | null
          role_title: string | null
          search_text: string | null
          seniority_level: string | null
          sessionize_profile_picture_url: string | null
          slug: string
          tag_line: string | null
          timezone: string | null
          twitter_handle: string | null
          updated_at: string
        }
        Insert: {
          ai_engineer_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          embedding?: string | null
          expertise_or_focus_area?: string | null
          expertise_tags?: string[]
          first_name?: string | null
          fts?: unknown
          full_name?: string | null
          github_username?: string | null
          is_founder?: boolean
          is_speaker?: boolean
          last_enriched_at?: string | null
          last_name?: string | null
          linkedin_url?: string | null
          metadata?: Json
          notable_for?: string | null
          person_id: string
          personal_website?: string | null
          primary_org_id?: string | null
          role_bucket?: string | null
          role_title?: string | null
          search_text?: string | null
          seniority_level?: string | null
          sessionize_profile_picture_url?: string | null
          slug: string
          tag_line?: string | null
          timezone?: string | null
          twitter_handle?: string | null
          updated_at?: string
        }
        Update: {
          ai_engineer_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          embedding?: string | null
          expertise_or_focus_area?: string | null
          expertise_tags?: string[]
          first_name?: string | null
          fts?: unknown
          full_name?: string | null
          github_username?: string | null
          is_founder?: boolean
          is_speaker?: boolean
          last_enriched_at?: string | null
          last_name?: string | null
          linkedin_url?: string | null
          metadata?: Json
          notable_for?: string | null
          person_id?: string
          personal_website?: string | null
          primary_org_id?: string | null
          role_bucket?: string | null
          role_title?: string | null
          search_text?: string | null
          seniority_level?: string | null
          sessionize_profile_picture_url?: string | null
          slug?: string
          tag_line?: string | null
          timezone?: string | null
          twitter_handle?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "person_primary_org_id_fkey"
            columns: ["primary_org_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["organization_id"]
          },
        ]
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
      person_attended_event: {
        Row: {
          affiliation_org: string | null
          created_at: string
          event_id: string
          match_method: string | null
          person_id: string
          role: string
        }
        Insert: {
          affiliation_org?: string | null
          created_at?: string
          event_id: string
          match_method?: string | null
          person_id: string
          role?: string
        }
        Update: {
          affiliation_org?: string | null
          created_at?: string
          event_id?: string
          match_method?: string | null
          person_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "person_attended_event_affiliation_org_fkey"
            columns: ["affiliation_org"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "person_attended_event_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "person_attended_event_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "person"
            referencedColumns: ["person_id"]
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
      product: {
        Row: {
          categories: string[]
          created_at: string
          description: string | null
          docs_url: string | null
          domain_layer: string | null
          embedding: string | null
          fts: unknown
          homepage_url: string | null
          is_flagship: boolean
          kind: string | null
          last_enriched_at: string | null
          launch_date: string | null
          metadata: Json
          name: string
          organization_id: string | null
          pricing_model: string | null
          pricing_url: string | null
          search_text: string | null
          slug: string
          tagline: string | null
          tags: string[]
          updated_at: string
        }
        Insert: {
          categories?: string[]
          created_at?: string
          description?: string | null
          docs_url?: string | null
          domain_layer?: string | null
          embedding?: string | null
          fts?: unknown
          homepage_url?: string | null
          is_flagship?: boolean
          kind?: string | null
          last_enriched_at?: string | null
          launch_date?: string | null
          metadata?: Json
          name: string
          organization_id?: string | null
          pricing_model?: string | null
          pricing_url?: string | null
          search_text?: string | null
          slug: string
          tagline?: string | null
          tags?: string[]
          updated_at?: string
        }
        Update: {
          categories?: string[]
          created_at?: string
          description?: string | null
          docs_url?: string | null
          domain_layer?: string | null
          embedding?: string | null
          fts?: unknown
          homepage_url?: string | null
          is_flagship?: boolean
          kind?: string | null
          last_enriched_at?: string | null
          launch_date?: string | null
          metadata?: Json
          name?: string
          organization_id?: string | null
          pricing_model?: string | null
          pricing_url?: string | null
          search_text?: string | null
          slug?: string
          tagline?: string | null
          tags?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      product_appeared_in_video: {
        Row: {
          confidence: number | null
          created_at: string
          evidence: Json
          product_slug: string
          video_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          evidence?: Json
          product_slug: string
          video_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          evidence?: Json
          product_slug?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_appeared_in_video_product_slug_fkey"
            columns: ["product_slug"]
            isOneToOne: false
            referencedRelation: "product"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "product_appeared_in_video_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "youtube_video"
            referencedColumns: ["video_id"]
          },
        ]
      }
      profile_followed_entity: {
        Row: {
          created_at: string
          entity_id: string
          entity_kind: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_kind: string
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_kind?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_followed_entity_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "current_user_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "profile_followed_entity_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_followed_entity_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          country: string | null
          created_at: string
          current_org_id: string | null
          current_role_title: string | null
          display_name: string | null
          email: string | null
          experience_level: string | null
          expertise_tags: string[]
          goals: string[]
          headline: string | null
          home_layer: string | null
          id: string
          interest_tags: string[]
          is_admin: boolean
          is_public: boolean
          linked_accounts: Json
          location: string | null
          metadata: Json
          onboarding_status: string
          timezone: string | null
          updated_at: string
          username: string | null
          xp_total: number
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          country?: string | null
          created_at?: string
          current_org_id?: string | null
          current_role_title?: string | null
          display_name?: string | null
          email?: string | null
          experience_level?: string | null
          expertise_tags?: string[]
          goals?: string[]
          headline?: string | null
          home_layer?: string | null
          id: string
          interest_tags?: string[]
          is_admin?: boolean
          is_public?: boolean
          linked_accounts?: Json
          location?: string | null
          metadata?: Json
          onboarding_status?: string
          timezone?: string | null
          updated_at?: string
          username?: string | null
          xp_total?: number
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          country?: string | null
          created_at?: string
          current_org_id?: string | null
          current_role_title?: string | null
          display_name?: string | null
          email?: string | null
          experience_level?: string | null
          expertise_tags?: string[]
          goals?: string[]
          headline?: string | null
          home_layer?: string | null
          id?: string
          interest_tags?: string[]
          is_admin?: boolean
          is_public?: boolean
          linked_accounts?: Json
          location?: string | null
          metadata?: Json
          onboarding_status?: string
          timezone?: string | null
          updated_at?: string
          username?: string | null
          xp_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "profiles_current_org_id_fkey"
            columns: ["current_org_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      repo: {
        Row: {
          created_at: string
          created_at_github: string | null
          default_branch: string | null
          description: string | null
          forks: number | null
          fts: unknown
          github_org: string
          github_repo: string
          github_url: string
          is_archived: boolean
          is_official: boolean
          last_harvested_at: string | null
          last_pushed_at: string | null
          library_slug: string | null
          license: string | null
          metadata: Json
          open_issues: number | null
          organization_id: string | null
          primary_language: string | null
          slug: string
          stars: number | null
          topics: string[]
          updated_at: string
          watchers: number | null
        }
        Insert: {
          created_at?: string
          created_at_github?: string | null
          default_branch?: string | null
          description?: string | null
          forks?: number | null
          fts?: unknown
          github_org: string
          github_repo: string
          github_url: string
          is_archived?: boolean
          is_official?: boolean
          last_harvested_at?: string | null
          last_pushed_at?: string | null
          library_slug?: string | null
          license?: string | null
          metadata?: Json
          open_issues?: number | null
          organization_id?: string | null
          primary_language?: string | null
          slug: string
          stars?: number | null
          topics?: string[]
          updated_at?: string
          watchers?: number | null
        }
        Update: {
          created_at?: string
          created_at_github?: string | null
          default_branch?: string | null
          description?: string | null
          forks?: number | null
          fts?: unknown
          github_org?: string
          github_repo?: string
          github_url?: string
          is_archived?: boolean
          is_official?: boolean
          last_harvested_at?: string | null
          last_pushed_at?: string | null
          library_slug?: string | null
          license?: string | null
          metadata?: Json
          open_issues?: number | null
          organization_id?: string | null
          primary_language?: string | null
          slug?: string
          stars?: number | null
          topics?: string[]
          updated_at?: string
          watchers?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "repo_library_slug_fkey"
            columns: ["library_slug"]
            isOneToOne: false
            referencedRelation: "library"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "repo_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      repo_for_library: {
        Row: {
          created_at: string
          library_slug: string
          repo_slug: string
          role: string
        }
        Insert: {
          created_at?: string
          library_slug: string
          repo_slug: string
          role?: string
        }
        Update: {
          created_at?: string
          library_slug?: string
          repo_slug?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "repo_for_library_library_slug_fkey"
            columns: ["library_slug"]
            isOneToOne: false
            referencedRelation: "library"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "repo_for_library_repo_slug_fkey"
            columns: ["repo_slug"]
            isOneToOne: false
            referencedRelation: "repo"
            referencedColumns: ["slug"]
          },
        ]
      }
      report: {
        Row: {
          authors: Json
          body_md: string | null
          bucket: string | null
          cited_library_slugs: string[]
          cited_org_ids: string[]
          cited_paper_slugs: string[]
          cited_video_ids: string[]
          created_at: string
          domain_layer: string | null
          embedding: string | null
          event_id: string | null
          fts: unknown
          metadata: Json
          organization_id: string | null
          published_at: string | null
          report_id: string
          report_kind: string
          search_text: string | null
          slug: string
          status: string
          summary: string | null
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          authors?: Json
          body_md?: string | null
          bucket?: string | null
          cited_library_slugs?: string[]
          cited_org_ids?: string[]
          cited_paper_slugs?: string[]
          cited_video_ids?: string[]
          created_at?: string
          domain_layer?: string | null
          embedding?: string | null
          event_id?: string | null
          fts?: unknown
          metadata?: Json
          organization_id?: string | null
          published_at?: string | null
          report_id?: string
          report_kind: string
          search_text?: string | null
          slug: string
          status?: string
          summary?: string | null
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          authors?: Json
          body_md?: string | null
          bucket?: string | null
          cited_library_slugs?: string[]
          cited_org_ids?: string[]
          cited_paper_slugs?: string[]
          cited_video_ids?: string[]
          created_at?: string
          domain_layer?: string | null
          embedding?: string | null
          event_id?: string | null
          fts?: unknown
          metadata?: Json
          organization_id?: string | null
          published_at?: string | null
          report_id?: string
          report_kind?: string
          search_text?: string | null
          slug?: string
          status?: string
          summary?: string | null
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "report_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["organization_id"]
          },
        ]
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
            referencedRelation: "current_user_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "saved_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      score_event: {
        Row: {
          created_at: string
          kind: string
          metadata: Json
          points: number
          ref_id: string | null
          ref_kind: string | null
          score_event_id: string
          source_attempt: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          kind: string
          metadata?: Json
          points?: number
          ref_id?: string | null
          ref_kind?: string | null
          score_event_id?: string
          source_attempt?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          kind?: string
          metadata?: Json
          points?: number
          ref_id?: string | null
          ref_kind?: string | null
          score_event_id?: string
          source_attempt?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "score_event_source_attempt_fkey"
            columns: ["source_attempt"]
            isOneToOne: false
            referencedRelation: "attempt"
            referencedColumns: ["attempt_id"]
          },
          {
            foreignKeyName: "score_event_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "current_user_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "score_event_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "score_event_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      session: {
        Row: {
          category: string | null
          code_repo_url: string | null
          description: string | null
          domain_layer: string | null
          duration_minutes: number | null
          embedding: string | null
          event_id: string | null
          extended_description: string | null
          fts: unknown
          language: string
          level: string | null
          metadata: Json
          room: string | null
          scheduled_at: string | null
          search_text: string | null
          session_format: string | null
          session_id: string
          slides_url: string | null
          slug: string
          tags: string[]
          title: string | null
          track: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          code_repo_url?: string | null
          description?: string | null
          domain_layer?: string | null
          duration_minutes?: number | null
          embedding?: string | null
          event_id?: string | null
          extended_description?: string | null
          fts?: unknown
          language?: string
          level?: string | null
          metadata?: Json
          room?: string | null
          scheduled_at?: string | null
          search_text?: string | null
          session_format?: string | null
          session_id: string
          slides_url?: string | null
          slug: string
          tags?: string[]
          title?: string | null
          track?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          code_repo_url?: string | null
          description?: string | null
          domain_layer?: string | null
          duration_minutes?: number | null
          embedding?: string | null
          event_id?: string | null
          extended_description?: string | null
          fts?: unknown
          language?: string
          level?: string | null
          metadata?: Json
          room?: string | null
          scheduled_at?: string | null
          search_text?: string | null
          session_format?: string | null
          session_id?: string
          slides_url?: string | null
          slug?: string
          tags?: string[]
          title?: string | null
          track?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event"
            referencedColumns: ["event_id"]
          },
        ]
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
          category: string | null
          channel_id: string | null
          chapters: Json | null
          comment_count: number | null
          description: string | null
          domain_layer: string | null
          duration: string | null
          duration_seconds: number | null
          embedding: string | null
          event_id: string | null
          fts: unknown
          is_short: boolean
          language: string
          last_enriched_at: string | null
          like_count: number | null
          metadata: Json
          popularity_score: number | null
          published_at: string | null
          search_text: string | null
          slug: string
          summary_status: string
          tags: string[]
          thumbnail_url: string | null
          title: string | null
          transcript_status: string
          updated_at: string
          url: string | null
          video_id: string
          view_count: number | null
        }
        Insert: {
          category?: string | null
          channel_id?: string | null
          chapters?: Json | null
          comment_count?: number | null
          description?: string | null
          domain_layer?: string | null
          duration?: string | null
          duration_seconds?: number | null
          embedding?: string | null
          event_id?: string | null
          fts?: unknown
          is_short?: boolean
          language?: string
          last_enriched_at?: string | null
          like_count?: number | null
          metadata?: Json
          popularity_score?: number | null
          published_at?: string | null
          search_text?: string | null
          slug: string
          summary_status?: string
          tags?: string[]
          thumbnail_url?: string | null
          title?: string | null
          transcript_status?: string
          updated_at?: string
          url?: string | null
          video_id: string
          view_count?: number | null
        }
        Update: {
          category?: string | null
          channel_id?: string | null
          chapters?: Json | null
          comment_count?: number | null
          description?: string | null
          domain_layer?: string | null
          duration?: string | null
          duration_seconds?: number | null
          embedding?: string | null
          event_id?: string | null
          fts?: unknown
          is_short?: boolean
          language?: string
          last_enriched_at?: string | null
          like_count?: number | null
          metadata?: Json
          popularity_score?: number | null
          published_at?: string | null
          search_text?: string | null
          slug?: string
          summary_status?: string
          tags?: string[]
          thumbnail_url?: string | null
          title?: string | null
          transcript_status?: string
          updated_at?: string
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
          {
            foreignKeyName: "youtube_video_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event"
            referencedColumns: ["event_id"]
          },
        ]
      }
    }
    Views: {
      current_user_stats: {
        Row: {
          streak_days: number | null
          user_id: string | null
          xp_total: number | null
        }
        Insert: {
          streak_days?: never
          user_id?: string | null
          xp_total?: number | null
        }
        Update: {
          streak_days?: never
          user_id?: string | null
          xp_total?: number | null
        }
        Relationships: []
      }
      public_profile: {
        Row: {
          avatar_url: string | null
          bio: string | null
          country: string | null
          current_role_title: string | null
          display_name: string | null
          expertise_tags: string[] | null
          headline: string | null
          id: string | null
          interest_tags: string[] | null
          is_public: boolean | null
          username: string | null
          xp_total: number | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          country?: string | null
          current_role_title?: string | null
          display_name?: string | null
          expertise_tags?: string[] | null
          headline?: string | null
          id?: string | null
          interest_tags?: string[] | null
          is_public?: boolean | null
          username?: string | null
          xp_total?: number | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          country?: string | null
          current_role_title?: string | null
          display_name?: string | null
          expertise_tags?: string[] | null
          headline?: string | null
          id?: string | null
          interest_tags?: string[] | null
          is_public?: boolean | null
          username?: string | null
          xp_total?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      backfill_person_primary_org: { Args: never; Returns: number }
      current_streak_days: { Args: { p_user_id: string }; Returns: number }
      explore_libraries: {
        Args: {
          categories?: string[]
          layers?: string[]
          limit_count?: number
          offset_count?: number
          q?: string
          sort?: string
          tags?: string[]
        }
        Returns: {
          category: string
          description: string
          entity_id: string
          image_url: string
          layer: string
          out_tags: string[]
          popularity: number
          rank: number
          recent_at: string
          slug: string
          snippet: string
          subtitle: string
          title: string
          total_count: number
        }[]
      }
      explore_organizations: {
        Args: {
          categories?: string[]
          layers?: string[]
          limit_count?: number
          offset_count?: number
          q?: string
          sort?: string
          tags?: string[]
        }
        Returns: {
          category: string
          description: string
          entity_id: string
          image_url: string
          layer: string
          out_tags: string[]
          popularity: number
          rank: number
          recent_at: string
          slug: string
          snippet: string
          subtitle: string
          title: string
          total_count: number
        }[]
      }
      explore_papers: {
        Args: {
          categories?: string[]
          layers?: string[]
          limit_count?: number
          offset_count?: number
          q?: string
          sort?: string
          tags?: string[]
        }
        Returns: {
          category: string
          description: string
          entity_id: string
          image_url: string
          layer: string
          out_tags: string[]
          popularity: number
          rank: number
          recent_at: string
          slug: string
          snippet: string
          subtitle: string
          title: string
          total_count: number
        }[]
      }
      explore_people: {
        Args: {
          categories?: string[]
          layers?: string[]
          limit_count?: number
          offset_count?: number
          org_ids?: string[]
          q?: string
          role_buckets?: string[]
          sort?: string
          tags?: string[]
        }
        Returns: {
          category: string
          description: string
          entity_id: string
          image_url: string
          layer: string
          org_id: string
          org_name: string
          out_tags: string[]
          popularity: number
          rank: number
          recent_at: string
          role_bucket: string
          slug: string
          snippet: string
          subtitle: string
          title: string
          total_count: number
        }[]
      }
      explore_people_facets: {
        Args: {
          facet_limit?: number
          org_ids?: string[]
          q?: string
          role_buckets?: string[]
          tags?: string[]
        }
        Returns: Json
      }
      explore_sessions: {
        Args: {
          categories?: string[]
          layers?: string[]
          limit_count?: number
          offset_count?: number
          q?: string
          sort?: string
          tags?: string[]
        }
        Returns: {
          category: string
          description: string
          entity_id: string
          image_url: string
          layer: string
          out_tags: string[]
          popularity: number
          rank: number
          recent_at: string
          slug: string
          snippet: string
          subtitle: string
          title: string
          total_count: number
        }[]
      }
      explore_youtube_videos: {
        Args: {
          categories?: string[]
          layers?: string[]
          limit_count?: number
          offset_count?: number
          q?: string
          sort?: string
          tags?: string[]
        }
        Returns: {
          category: string
          description: string
          entity_id: string
          image_url: string
          layer: string
          out_tags: string[]
          popularity: number
          rank: number
          recent_at: string
          slug: string
          snippet: string
          subtitle: string
          title: string
          total_count: number
        }[]
      }
      immutable_array_to_string: {
        Args: { arr: string[]; delim: string }
        Returns: string
      }
      match_chunks: {
        Args: {
          filter?: Json
          full_text_weight?: number
          match_count?: number
          query_embedding: string
          query_text?: string
          rrf_k?: number
          semantic_weight?: number
          source_kinds?: string[]
        }
        Returns: {
          chunk_id: string
          content: string
          metadata: Json
          ord: number
          rrf_score: number
          source_id: string
          source_kind: string
        }[]
      }
      search_all: {
        Args: { kinds?: string[]; limit_count?: number; q: string }
        Returns: {
          entity_id: string
          entity_kind: string
          image_url: string
          rank: number
          slug: string
          snippet: string
          subtitle: string
          title: string
        }[]
      }
      search_fuzzy: {
        Args: { kinds?: string[]; limit_count?: number; prefix: string }
        Returns: {
          entity_id: string
          entity_kind: string
          image_url: string
          similarity: number
          slug: string
          title: string
        }[]
      }
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

