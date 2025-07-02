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
      message_filters: {
        Row: {
          ai_prompt: string | null
          created_at: string
          filter_name: string
          filter_type: string
          filter_value: string
          group_id: string | null
          id: string
          is_active: boolean | null
          priority: number | null
          updated_at: string
          workflow_id: string | null
        }
        Insert: {
          ai_prompt?: string | null
          created_at?: string
          filter_name: string
          filter_type: string
          filter_value: string
          group_id?: string | null
          id?: string
          is_active?: boolean | null
          priority?: number | null
          updated_at?: string
          workflow_id?: string | null
        }
        Update: {
          ai_prompt?: string | null
          created_at?: string
          filter_name?: string
          filter_type?: string
          filter_value?: string
          group_id?: string | null
          id?: string
          is_active?: boolean | null
          priority?: number | null
          updated_at?: string
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_filters_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "telegram_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_filters_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "n8n_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      message_logs: {
        Row: {
          filter_id: string | null
          group_id: string | null
          id: string
          matched_filter_type: string | null
          matched_filter_value: string | null
          message_id: number
          message_text: string | null
          message_type: string | null
          processed_at: string
          sender_id: number
          sender_username: string | null
          workflow_id: string | null
          workflow_response: string | null
          workflow_triggered: boolean | null
        }
        Insert: {
          filter_id?: string | null
          group_id?: string | null
          id?: string
          matched_filter_type?: string | null
          matched_filter_value?: string | null
          message_id: number
          message_text?: string | null
          message_type?: string | null
          processed_at?: string
          sender_id: number
          sender_username?: string | null
          workflow_id?: string | null
          workflow_response?: string | null
          workflow_triggered?: boolean | null
        }
        Update: {
          filter_id?: string | null
          group_id?: string | null
          id?: string
          matched_filter_type?: string | null
          matched_filter_value?: string | null
          message_id?: number
          message_text?: string | null
          message_type?: string | null
          processed_at?: string
          sender_id?: number
          sender_username?: string | null
          workflow_id?: string | null
          workflow_response?: string | null
          workflow_triggered?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "message_logs_filter_id_fkey"
            columns: ["filter_id"]
            isOneToOne: false
            referencedRelation: "message_filters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_logs_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "telegram_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_logs_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "n8n_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      n8n_workflows: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
          webhook_url: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
          webhook_url: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
          webhook_url?: string
        }
        Relationships: []
      }
      telegram_groups: {
        Row: {
          chat_id: number
          chat_title: string | null
          chat_type: string | null
          created_at: string
          id: string
          is_active: boolean | null
          updated_at: string
        }
        Insert: {
          chat_id: number
          chat_title?: string | null
          chat_type?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          updated_at?: string
        }
        Update: {
          chat_id?: number
          chat_title?: string | null
          chat_type?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          updated_at?: string
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
    Enums: {},
  },
} as const
