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
      app_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      citizen_committees: {
        Row: {
          color: string | null
          cover_photo_url: string | null
          created_at: string
          description: string
          icon: string
          id: string
          team_photo_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          cover_photo_url?: string | null
          created_at?: string
          description: string
          icon: string
          id?: string
          team_photo_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          cover_photo_url?: string | null
          created_at?: string
          description?: string
          icon?: string
          id?: string
          team_photo_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          news_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          news_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          news_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_news_id_fkey"
            columns: ["news_id"]
            isOneToOne: false
            referencedRelation: "news"
            referencedColumns: ["id"]
          },
        ]
      }
      committee_members: {
        Row: {
          committee_id: string
          created_at: string
          id: string
          name: string
          photo: string
          role: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          committee_id: string
          created_at?: string
          id?: string
          name: string
          photo: string
          role: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          committee_id?: string
          created_at?: string
          id?: string
          name?: string
          photo?: string
          role?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "committee_members_committee_id_fkey"
            columns: ["committee_id"]
            isOneToOne: false
            referencedRelation: "citizen_committees"
            referencedColumns: ["id"]
          },
        ]
      }
      committee_works: {
        Row: {
          committee_id: string
          content: string
          created_at: string
          date: string
          files: Json | null
          id: string
          images: Json | null
          title: string
          updated_at: string
        }
        Insert: {
          committee_id: string
          content: string
          created_at?: string
          date: string
          files?: Json | null
          id?: string
          images?: Json | null
          title: string
          updated_at?: string
        }
        Update: {
          committee_id?: string
          content?: string
          created_at?: string
          date?: string
          files?: Json | null
          id?: string
          images?: Json | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "committee_works_committee_id_fkey"
            columns: ["committee_id"]
            isOneToOne: false
            referencedRelation: "citizen_committees"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          created_at: string
          event_id: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          allow_registration: boolean | null
          committee: string | null
          committee_id: string | null
          content: string | null
          created_at: string
          date: string
          description: string
          id: string
          image: string
          is_members_only: boolean | null
          location: string
          slug: string | null
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          allow_registration?: boolean | null
          committee?: string | null
          committee_id?: string | null
          content?: string | null
          created_at?: string
          date: string
          description: string
          id?: string
          image: string
          is_members_only?: boolean | null
          location: string
          slug?: string | null
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          allow_registration?: boolean | null
          committee?: string | null
          committee_id?: string | null
          content?: string | null
          created_at?: string
          date?: string
          description?: string
          id?: string
          image?: string
          is_members_only?: boolean | null
          location?: string
          slug?: string | null
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_committee_id_fkey"
            columns: ["committee_id"]
            isOneToOne: false
            referencedRelation: "citizen_committees"
            referencedColumns: ["id"]
          },
        ]
      }
      invited_users: {
        Row: {
          created_at: string | null
          email: string
          first_name: string
          id: string
          last_name: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          first_name: string
          id?: string
          last_name: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          status?: string | null
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          created_at: string
          external_url: string | null
          id: string
          label: string
          page_id: string | null
          parent_id: string | null
          position: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          external_url?: string | null
          id?: string
          label: string
          page_id?: string | null
          parent_id?: string | null
          position?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          external_url?: string | null
          id?: string
          label?: string
          page_id?: string | null
          parent_id?: string | null
          position?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      news: {
        Row: {
          author_id: string | null
          category: string
          category_id: string | null
          comments_enabled: boolean | null
          content: string
          created_at: string
          date: string
          excerpt: string
          id: string
          image: string
          publication_date: string | null
          slug: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          category: string
          category_id?: string | null
          comments_enabled?: boolean | null
          content: string
          created_at?: string
          date: string
          excerpt: string
          id?: string
          image: string
          publication_date?: string | null
          slug?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          category?: string
          category_id?: string | null
          comments_enabled?: boolean | null
          content?: string
          created_at?: string
          date?: string
          excerpt?: string
          id?: string
          image?: string
          publication_date?: string | null
          slug?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_news_author"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "news_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      news_categories: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      news_tags: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      news_to_tags: {
        Row: {
          created_at: string
          id: string
          news_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          news_id: string
          tag_id: string
        }
        Update: {
          created_at?: string
          id?: string
          news_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_to_tags_news_id_fkey"
            columns: ["news_id"]
            isOneToOne: false
            referencedRelation: "news"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_to_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "news_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          content: string
          created_at: string
          id: string
          parent_id: string | null
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          parent_id?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pages_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          first_name: string
          id: string
          is_member: boolean | null
          last_name: string
          status: string | null
          theme_preference: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          first_name: string
          id: string
          is_member?: boolean | null
          last_name: string
          status?: string | null
          theme_preference?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          is_member?: boolean | null
          last_name?: string
          status?: string | null
          theme_preference?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      program_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          program_item_id: string
          program_point_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          program_item_id: string
          program_point_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          program_item_id?: string
          program_point_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_program_comments_point"
            columns: ["program_point_id"]
            isOneToOne: false
            referencedRelation: "program_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_comments_program_item_id_fkey"
            columns: ["program_item_id"]
            isOneToOne: false
            referencedRelation: "program_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_comments_program_point_id_fkey"
            columns: ["program_point_id"]
            isOneToOne: false
            referencedRelation: "program_points"
            referencedColumns: ["id"]
          },
        ]
      }
      program_general: {
        Row: {
          content: string
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      program_items: {
        Row: {
          content: string | null
          created_at: string
          description: string
          icon: string
          id: string
          image: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          description: string
          icon: string
          id?: string
          image?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          description?: string
          icon?: string
          id?: string
          image?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      program_likes: {
        Row: {
          created_at: string
          id: string
          program_item_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          program_item_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          program_item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_likes_program_item_id_fkey"
            columns: ["program_item_id"]
            isOneToOne: false
            referencedRelation: "program_items"
            referencedColumns: ["id"]
          },
        ]
      }
      program_points: {
        Row: {
          content: string
          created_at: string
          files: Json | null
          id: string
          position: number
          program_item_id: string
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          files?: Json | null
          id?: string
          position: number
          program_item_id: string
          title?: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          files?: Json | null
          id?: string
          position?: number
          program_item_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_points_program_item_id_fkey"
            columns: ["program_item_id"]
            isOneToOne: false
            referencedRelation: "program_items"
            referencedColumns: ["id"]
          },
        ]
      }
      project_likes: {
        Row: {
          created_at: string
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_likes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          contact_email: string | null
          contact_info: string | null
          created_at: string | null
          description: string
          development_status: string
          id: string
          image: string | null
          is_featured: boolean | null
          sort_order: number | null
          status: string | null
          title: string
          updated_at: string | null
          url: string | null
        }
        Insert: {
          contact_email?: string | null
          contact_info?: string | null
          created_at?: string | null
          description: string
          development_status?: string
          id?: string
          image?: string | null
          is_featured?: boolean | null
          sort_order?: number | null
          status?: string | null
          title: string
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          contact_email?: string | null
          contact_info?: string | null
          created_at?: string | null
          description?: string
          development_status?: string
          id?: string
          image?: string | null
          is_featured?: boolean | null
          sort_order?: number | null
          status?: string | null
          title?: string
          updated_at?: string | null
          url?: string | null
        }
        Relationships: []
      }
      team_members: {
        Row: {
          bio: string
          created_at: string
          id: string
          image: string
          is_board_member: boolean | null
          is_elected: boolean | null
          name: string
          role: string
          updated_at: string
        }
        Insert: {
          bio: string
          created_at?: string
          id?: string
          image: string
          is_board_member?: boolean | null
          is_elected?: boolean | null
          name: string
          role: string
          updated_at?: string
        }
        Update: {
          bio?: string
          created_at?: string
          id?: string
          image?: string
          is_board_member?: boolean | null
          is_elected?: boolean | null
          name?: string
          role?: string
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
          role: Database["public"]["Enums"]["app_role"]
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
      count_program_likes: {
        Args: { program_id: string }
        Returns: number
      }
      count_project_likes: {
        Args: { project_id: string }
        Returns: number
      }
      get_user_roles: {
        Args: { uid: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      is_committee_member: {
        Args: { user_id: string; committee_id: string }
        Returns: boolean
      }
      user_has_liked_project: {
        Args: { project_id: string; user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "moderator"
        | "user"
        | "program_manager"
        | "program_team"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "moderator",
        "user",
        "program_manager",
        "program_team",
      ],
    },
  },
} as const
