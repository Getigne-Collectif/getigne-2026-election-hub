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
    PostgrestVersion: "13.0.4"
  }
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
      electoral_list: {
        Row: {
          created_at: string
          description: string | null
          election_date: string
          governance_content: Json | null
          id: string
          is_active: boolean
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          election_date: string
          governance_content?: Json | null
          id?: string
          is_active?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          election_date?: string
          governance_content?: Json | null
          id?: string
          is_active?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      electoral_list_members: {
        Row: {
          created_at: string
          electoral_list_id: string
          id: string
          position: number
          team_member_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          electoral_list_id: string
          id?: string
          position: number
          team_member_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          electoral_list_id?: string
          id?: string
          position?: number
          team_member_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "electoral_list_members_electoral_list_id_fkey"
            columns: ["electoral_list_id"]
            isOneToOne: false
            referencedRelation: "electoral_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "electoral_list_members_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      electoral_member_roles: {
        Row: {
          created_at: string
          electoral_list_member_id: string
          id: string
          is_primary: boolean
          thematic_role_id: string
        }
        Insert: {
          created_at?: string
          electoral_list_member_id: string
          id?: string
          is_primary?: boolean
          thematic_role_id: string
        }
        Update: {
          created_at?: string
          electoral_list_member_id?: string
          id?: string
          is_primary?: boolean
          thematic_role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "electoral_member_roles_electoral_list_member_id_fkey"
            columns: ["electoral_list_member_id"]
            isOneToOne: false
            referencedRelation: "electoral_list_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "electoral_member_roles_thematic_role_id_fkey"
            columns: ["thematic_role_id"]
            isOneToOne: false
            referencedRelation: "thematic_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          additional_guests: number | null
          created_at: string
          event_id: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          additional_guests?: number | null
          created_at?: string
          event_id: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          additional_guests?: number | null
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
          checklist_progress: Json | null
          committee: string | null
          committee_id: string | null
          content: string | null
          created_at: string
          date: string
          description: string
          event_type: string | null
          id: string
          image: string
          is_members_only: boolean | null
          kit_provided: boolean | null
          latitude: number | null
          location: string
          longitude: number | null
          max_participants: number | null
          member_present: boolean | null
          organizer_contact: string | null
          organizer_name: string | null
          slug: string | null
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          allow_registration?: boolean | null
          checklist_progress?: Json | null
          committee?: string | null
          committee_id?: string | null
          content?: string | null
          created_at?: string
          date: string
          description: string
          event_type?: string | null
          id?: string
          image: string
          is_members_only?: boolean | null
          kit_provided?: boolean | null
          latitude?: number | null
          location: string
          longitude?: number | null
          max_participants?: number | null
          member_present?: boolean | null
          organizer_contact?: string | null
          organizer_name?: string | null
          slug?: string | null
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          allow_registration?: boolean | null
          checklist_progress?: Json | null
          committee?: string | null
          committee_id?: string | null
          content?: string | null
          created_at?: string
          date?: string
          description?: string
          event_type?: string | null
          id?: string
          image?: string
          is_members_only?: boolean | null
          kit_provided?: boolean | null
          latitude?: number | null
          location?: string
          longitude?: number | null
          max_participants?: number | null
          member_present?: boolean | null
          organizer_contact?: string | null
          organizer_name?: string | null
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
      galaxy_items: {
        Row: {
          baseline: string
          color: string | null
          created_at: string
          icon: string
          icon_fg: string | null
          id: string
          is_external: boolean
          link: string
          name: string
          position: number
          status: string
          updated_at: string
        }
        Insert: {
          baseline: string
          color?: string | null
          created_at?: string
          icon: string
          icon_fg?: string | null
          id?: string
          is_external?: boolean
          link: string
          name: string
          position?: number
          status?: string
          updated_at?: string
        }
        Update: {
          baseline?: string
          color?: string | null
          created_at?: string
          icon?: string
          icon_fg?: string | null
          id?: string
          is_external?: boolean
          link?: string
          name?: string
          position?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      helloasso_memberships: {
        Row: {
          created_at: string | null
          discord_role_assigned: boolean | null
          discord_role_assigned_at: string | null
          discord_user_id: string | null
          email: string
          first_name: string | null
          helloasso_order_id: string | null
          id: string
          last_name: string | null
          membership_type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          discord_role_assigned?: boolean | null
          discord_role_assigned_at?: string | null
          discord_user_id?: string | null
          email: string
          first_name?: string | null
          helloasso_order_id?: string | null
          id?: string
          last_name?: string | null
          membership_type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          discord_role_assigned?: boolean | null
          discord_role_assigned_at?: string | null
          discord_user_id?: string | null
          email?: string
          first_name?: string | null
          helloasso_order_id?: string | null
          id?: string
          last_name?: string | null
          membership_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
      lexicon_entries: {
        Row: {
          acronym: string | null
          content: Json | null
          created_at: string
          external_link: string | null
          id: string
          logo_url: string | null
          name: string
          updated_at: string
        }
        Insert: {
          acronym?: string | null
          content?: Json | null
          created_at?: string
          external_link?: string | null
          id?: string
          logo_url?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          acronym?: string | null
          content?: Json | null
          created_at?: string
          external_link?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      lift_messages: {
        Row: {
          created_at: string
          id: string
          lift_post_id: string
          message: string
          sender_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lift_post_id: string
          message: string
          sender_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lift_post_id?: string
          message?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lift_messages_lift_post_id_fkey"
            columns: ["lift_post_id"]
            isOneToOne: false
            referencedRelation: "lift_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      lift_posts: {
        Row: {
          arrival_location: string
          available_seats: number
          created_at: string
          date: string
          day: string
          departure_location: string
          description: string | null
          id: string
          is_flexible_time: boolean | null
          recurrence: string
          status: string
          time_end: string | null
          time_start: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          arrival_location: string
          available_seats?: number
          created_at?: string
          date: string
          day: string
          departure_location: string
          description?: string | null
          id?: string
          is_flexible_time?: boolean | null
          recurrence: string
          status?: string
          time_end?: string | null
          time_start?: string | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          arrival_location?: string
          available_seats?: number
          created_at?: string
          date?: string
          day?: string
          departure_location?: string
          description?: string | null
          id?: string
          is_flexible_time?: boolean | null
          recurrence?: string
          status?: string
          time_end?: string | null
          time_start?: string | null
          type?: string
          updated_at?: string
          user_id?: string
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
          published_at: string | null
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
          published_at?: string | null
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
          published_at?: string | null
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
      observatory_documents: {
        Row: {
          analysis_data: Json | null
          created_at: string
          description: string | null
          error_message: string | null
          extracted_text: string | null
          file_name: string | null
          file_path: string | null
          file_size: number | null
          file_url: string | null
          id: string
          meeting_date: string | null
          meeting_type: string | null
          mime_type: string | null
          rolebase_meeting_id: string | null
          status: string | null
          title: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          analysis_data?: Json | null
          created_at?: string
          description?: string | null
          error_message?: string | null
          extracted_text?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          meeting_date?: string | null
          meeting_type?: string | null
          mime_type?: string | null
          rolebase_meeting_id?: string | null
          status?: string | null
          title: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          analysis_data?: Json | null
          created_at?: string
          description?: string | null
          error_message?: string | null
          extracted_text?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          meeting_date?: string | null
          meeting_type?: string | null
          mime_type?: string | null
          rolebase_meeting_id?: string | null
          status?: string | null
          title?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      observatory_groups: {
        Row: {
          color_hex: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          color_hex: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          color_hex?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      observatory_participants: {
        Row: {
          avatar_path: string | null
          created_at: string
          group_id: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          name: string
          party_affiliation: string | null
          position_title: string | null
          role: string
          type: string | null
          updated_at: string
        }
        Insert: {
          avatar_path?: string | null
          created_at?: string
          group_id?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name: string
          party_affiliation?: string | null
          position_title?: string | null
          role: string
          type?: string | null
          updated_at?: string
        }
        Update: {
          avatar_path?: string | null
          created_at?: string
          group_id?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name?: string
          party_affiliation?: string | null
          position_title?: string | null
          role?: string
          type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "observatory_participants_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "observatory_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      observatory_positions: {
        Row: {
          confidence_score: number | null
          content: string
          context: string | null
          document_id: string
          extracted_at: string
          id: string
          metadata: Json | null
          page_number: number | null
          participant_id: string | null
          position: string | null
          subject_id: string
        }
        Insert: {
          confidence_score?: number | null
          content: string
          context?: string | null
          document_id: string
          extracted_at?: string
          id?: string
          metadata?: Json | null
          page_number?: number | null
          participant_id?: string | null
          position?: string | null
          subject_id: string
        }
        Update: {
          confidence_score?: number | null
          content?: string
          context?: string | null
          document_id?: string
          extracted_at?: string
          id?: string
          metadata?: Json | null
          page_number?: number | null
          participant_id?: string | null
          position?: string | null
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "observatory_positions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "observatory_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "observatory_positions_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "observatory_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "observatory_positions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "observatory_subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      observatory_subjects: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          first_mention_date: string | null
          id: string
          keywords: string[] | null
          last_mention_date: string | null
          metadata: Json | null
          status: string | null
          title: string
          total_discussions: number | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          first_mention_date?: string | null
          id?: string
          keywords?: string[] | null
          last_mention_date?: string | null
          metadata?: Json | null
          status?: string | null
          title: string
          total_discussions?: number | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          first_mention_date?: string | null
          id?: string
          keywords?: string[] | null
          last_mention_date?: string | null
          metadata?: Json | null
          status?: string | null
          title?: string
          total_discussions?: number | null
          updated_at?: string
        }
        Relationships: []
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
      program_competent_entities: {
        Row: {
          created_at: string
          id: string
          logo_path: string | null
          logo_url: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_path?: string | null
          logo_url?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_path?: string | null
          logo_url?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      program_flagship_projects: {
        Row: {
          created_at: string
          description: Json | null
          effects: Json | null
          file_label: string | null
          file_path: string | null
          file_url: string | null
          id: string
          image_path: string | null
          image_url: string | null
          position: number
          timeline: Json | null
          timeline_horizon: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: Json | null
          effects?: Json | null
          file_label?: string | null
          file_path?: string | null
          file_url?: string | null
          id?: string
          image_path?: string | null
          image_url?: string | null
          position?: number
          timeline?: Json | null
          timeline_horizon?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: Json | null
          effects?: Json | null
          file_label?: string | null
          file_path?: string | null
          file_url?: string | null
          id?: string
          image_path?: string | null
          image_url?: string | null
          position?: number
          timeline?: Json | null
          timeline_horizon?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      program_general: {
        Row: {
          content: string
          created_at: string
          file: string | null
          file_path: string | null
          id: string
          updated_at: string
        }
        Insert: {
          content?: string
          created_at?: string
          file?: string | null
          file_path?: string | null
          id?: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          file?: string | null
          file_path?: string | null
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
          position: number | null
          slug: string
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
          position?: number | null
          slug: string
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
          position?: number | null
          slug?: string
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
          program_point_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          program_item_id: string
          program_point_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          program_item_id?: string
          program_point_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_program_likes_point"
            columns: ["program_point_id"]
            isOneToOne: false
            referencedRelation: "program_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_likes_program_item_id_fkey"
            columns: ["program_item_id"]
            isOneToOne: false
            referencedRelation: "program_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_likes_program_point_id_fkey"
            columns: ["program_point_id"]
            isOneToOne: false
            referencedRelation: "program_points"
            referencedColumns: ["id"]
          },
        ]
      }
      program_points: {
        Row: {
          competent_entity_id: string | null
          content: Json | null
          created_at: string
          files: Json | null
          files_metadata: Json
          id: string
          position: number
          program_item_id: string
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          competent_entity_id?: string | null
          content?: Json | null
          created_at?: string
          files?: Json | null
          files_metadata?: Json
          id?: string
          position: number
          program_item_id: string
          status?: string | null
          title?: string
          updated_at?: string
        }
        Update: {
          competent_entity_id?: string | null
          content?: Json | null
          created_at?: string
          files?: Json | null
          files_metadata?: Json
          id?: string
          position?: number
          program_item_id?: string
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_points_competent_entity_id_fkey"
            columns: ["competent_entity_id"]
            isOneToOne: false
            referencedRelation: "program_competent_entities"
            referencedColumns: ["id"]
          },
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
          address: string | null
          bio: string | null
          birth_date: string | null
          created_at: string
          education_level: 'brevet' | 'cap_bep' | 'bac_general' | 'bac_technologique' | 'bac_professionnel' | 'bac_plus_1_2' | 'bac_plus_3' | 'bac_plus_4_5' | 'bac_plus_6_plus' | null
          email: string | null
          gender: string | null
          id: string
          image: string | null
          is_board_member: boolean | null
          is_elected: boolean | null
          latitude: number | null
          longitude: number | null
          max_engagement_level: 'positions_1_8' | 'positions_9_21' | 'positions_22_29' | null
          name: string
          phone: string | null
          profession: string | null
          role: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          bio?: string | null
          birth_date?: string | null
          created_at?: string
          education_level?: 'brevet' | 'cap_bep' | 'bac_general' | 'bac_technologique' | 'bac_professionnel' | 'bac_plus_1_2' | 'bac_plus_3' | 'bac_plus_4_5' | 'bac_plus_6_plus' | null
          email?: string | null
          gender?: string | null
          id?: string
          image?: string | null
          is_board_member?: boolean | null
          is_elected?: boolean | null
          latitude?: number | null
          longitude?: number | null
          max_engagement_level?: 'positions_1_8' | 'positions_9_21' | 'positions_22_29' | null
          name: string
          phone?: string | null
          profession?: string | null
          role?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          bio?: string | null
          birth_date?: string | null
          created_at?: string
          education_level?: 'brevet' | 'cap_bep' | 'bac_general' | 'bac_technologique' | 'bac_professionnel' | 'bac_plus_1_2' | 'bac_plus_3' | 'bac_plus_4_5' | 'bac_plus_6_plus' | null
          email?: string | null
          gender?: string | null
          id?: string
          image?: string | null
          is_board_member?: boolean | null
          is_elected?: boolean | null
          latitude?: number | null
          longitude?: number | null
          max_engagement_level?: 'positions_1_8' | 'positions_9_21' | 'positions_22_29' | null
          name?: string
          phone?: string | null
          profession?: string | null
          role?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      thematic_roles: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          sort_order?: number
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
      count_program_likes: { Args: { program_id: string }; Returns: number }
      count_project_likes: { Args: { project_id: string }; Returns: number }
      get_user_roles: {
        Args: { uid: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      is_committee_member: {
        Args: { committee_id: string; user_id: string }
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

