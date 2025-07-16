export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      emotion_playlist_songs: {
        Row: {
          artist: string
          created_at: string
          emotion_playlist_id: string
          id: string
          position: number | null
          song_id: string
          thumbnail: string | null
          title: string
          url: string
        }
        Insert: {
          artist: string
          created_at?: string
          emotion_playlist_id: string
          id?: string
          position?: number | null
          song_id: string
          thumbnail?: string | null
          title: string
          url: string
        }
        Update: {
          artist?: string
          created_at?: string
          emotion_playlist_id?: string
          id?: string
          position?: number | null
          song_id?: string
          thumbnail?: string | null
          title?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "emotion_playlist_songs_emotion_playlist_id_fkey"
            columns: ["emotion_playlist_id"]
            isOneToOne: false
            referencedRelation: "emotion_playlists"
            referencedColumns: ["id"]
          },
        ]
      }
      emotion_playlists: {
        Row: {
          created_at: string
          description: string | null
          emotion: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          emotion: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          emotion?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      playlist_songs: {
        Row: {
          added_at: string
          artist: string
          id: string
          playlist_id: string
          position: number
          song_id: string
          thumbnail: string
          title: string
          url: string
        }
        Insert: {
          added_at?: string
          artist: string
          id?: string
          playlist_id: string
          position?: number
          song_id: string
          thumbnail: string
          title: string
          url: string
        }
        Update: {
          added_at?: string
          artist?: string
          id?: string
          playlist_id?: string
          position?: number
          song_id?: string
          thumbnail?: string
          title?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlist_songs_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
        ]
      }
      playlists: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
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
          id: string
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      secrets: {
        Row: {
          created_at: string | null
          key: string
          value: string
        }
        Insert: {
          created_at?: string | null
          key: string
          value: string
        }
        Update: {
          created_at?: string | null
          key?: string
          value?: string
        }
        Relationships: []
      }
      songs: {
        Row: {
          artist: string | null
          id: string
          title: string
          url: string | null
        }
        Insert: {
          artist?: string | null
          id?: string
          title: string
          url?: string | null
        }
        Update: {
          artist?: string | null
          id?: string
          title?: string
          url?: string | null
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          id: string
          ip_address: string | null
          login_method: string
          login_time: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          id?: string
          ip_address?: string | null
          login_method: string
          login_time?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          id?: string
          ip_address?: string | null
          login_method?: string
          login_time?: string
          user_agent?: string | null
          user_id?: string
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
