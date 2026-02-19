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
      bar: {
        Row: {
          created_at: string
          id: number
          name: string
          slug: string
          thumb_url: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
          slug: string
          thumb_url?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
          slug?: string
          thumb_url?: string | null
        }
        Relationships: []
      }
      bar_menu: {
        Row: {
          bar_id: number
          menu_id: number
          menu_name: string | null
        }
        Insert: {
          bar_id: number
          menu_id: number
          menu_name?: string | null
        }
        Update: {
          bar_id?: number
          menu_id?: number
          menu_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bar_menu_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bar"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_menu_menu_id_fkey"
            columns: ["menu_id"]
            isOneToOne: false
            referencedRelation: "menu"
            referencedColumns: ["id"]
          },
        ]
      }
      drinks_glass: {
        Row: {
          active: boolean
          created_at: string
          id: number
          name: string
          slug: string
          thumb_url: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: number
          name: string
          slug: string
          thumb_url?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: number
          name?: string
          slug?: string
          thumb_url?: string | null
        }
        Relationships: []
      }
      menu: {
        Row: {
          active: boolean
          created_at: string
          id: number
          name: string
          slug: string
          thumb_url: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: number
          name: string
          slug: string
          thumb_url?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: number
          name?: string
          slug?: string
          thumb_url?: string | null
        }
        Relationships: []
      }
      menu_item: {
        Row: {
          active: boolean
          alcoholic: boolean | null
          category: string
          created_at: string
          glass: string | null
          id: number
          ingredients: string[] | null
          instructions: string | null
          last_modified: string | null
          measurements: string[] | null
          name: string
          price: number | null
          slug: string
          thumb_url: string
        }
        Insert: {
          active?: boolean
          alcoholic?: boolean | null
          category: string
          created_at?: string
          glass?: string | null
          id?: number
          ingredients?: string[] | null
          instructions?: string | null
          last_modified?: string | null
          measurements?: string[] | null
          name: string
          price?: number | null
          slug: string
          thumb_url: string
        }
        Update: {
          active?: boolean
          alcoholic?: boolean | null
          category?: string
          created_at?: string
          glass?: string | null
          id?: number
          ingredients?: string[] | null
          instructions?: string | null
          last_modified?: string | null
          measurements?: string[] | null
          name?: string
          price?: number | null
          slug?: string
          thumb_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_item_category_fkey"
            columns: ["category"]
            isOneToOne: false
            referencedRelation: "menu_item_category"
            referencedColumns: ["name"]
          },
          {
            foreignKeyName: "menu_item_glass_fkey"
            columns: ["glass"]
            isOneToOne: false
            referencedRelation: "drinks_glass"
            referencedColumns: ["name"]
          },
        ]
      }
      menu_item_category: {
        Row: {
          active: boolean
          created_at: string
          id: number
          menu: string
          name: string
          slug: string
          thumb_url: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: number
          menu: string
          name: string
          slug: string
          thumb_url?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: number
          menu?: string
          name?: string
          slug?: string
          thumb_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_item_category_menu_fkey"
            columns: ["menu"]
            isOneToOne: false
            referencedRelation: "menu"
            referencedColumns: ["name"]
          },
        ]
      }
      menu_item_ingredient: {
        Row: {
          active: boolean
          created_at: string
          id: number
          name: string
          slug: string
          thumb_url: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: number
          name: string
          slug: string
          thumb_url?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: number
          name?: string
          slug?: string
          thumb_url?: string | null
        }
        Relationships: []
      }
      profile: {
        Row: {
          active: boolean
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          mode: string
          password: string
          pin: string
          user_role: string
          username: string
        }
        Insert: {
          active?: boolean
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          mode?: string
          password: string
          pin: string
          user_role?: string
          username: string
        }
        Update: {
          active?: boolean
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          mode?: string
          password?: string
          pin?: string
          user_role?: string
          username?: string
        }
        Relationships: []
      }
      tab: {
        Row: {
          bar_id: number
          created_at: string
          id: number
          is_split: boolean
          settled_at: string | null
          special_notes: string | null
          split_count: number | null
          status: string
          subtotal: number
          tab_number: string
          tax_amount: number
          tip_amount: number | null
          total_before_tip: number
          total_owed: number
          updated_at: string
          user_id: string
        }
        Insert: {
          bar_id: number
          created_at?: string
          id?: number
          is_split?: boolean
          settled_at?: string | null
          special_notes?: string | null
          split_count?: number | null
          status?: string
          subtotal?: number
          tab_number: string
          tax_amount?: number
          tip_amount?: number | null
          total_before_tip?: number
          total_owed?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          bar_id?: number
          created_at?: string
          id?: number
          is_split?: boolean
          settled_at?: string | null
          special_notes?: string | null
          split_count?: number | null
          status?: string
          subtotal?: number
          tab_number?: string
          tax_amount?: number
          tip_amount?: number | null
          total_before_tip?: number
          total_owed?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tab_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bar"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tab_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
        ]
      }
      tab_item: {
        Row: {
          created_at: string
          id: number
          item_total: number
          menu_item_id: number
          quantity: number
          special_instructions: string | null
          tab_id: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          item_total: number
          menu_item_id: number
          quantity: number
          special_instructions?: string | null
          tab_id: number
          unit_price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          item_total?: number
          menu_item_id?: number
          quantity?: number
          special_instructions?: string | null
          tab_id?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tab_item_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_item"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tab_item_tab_id_fkey"
            columns: ["tab_id"]
            isOneToOne: false
            referencedRelation: "tab"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tab_item_tab_id_fkey"
            columns: ["tab_id"]
            isOneToOne: false
            referencedRelation: "view_tab_totals"
            referencedColumns: ["tab_id"]
          },
        ]
      }
      tab_payment: {
        Row: {
          amount_paid: number
          created_at: string
          id: number
          payment_method: string
          split_id: number | null
          status: string
          tab_id: number
          tip_added: number | null
        }
        Insert: {
          amount_paid: number
          created_at?: string
          id?: number
          payment_method?: string
          split_id?: number | null
          status?: string
          tab_id: number
          tip_added?: number | null
        }
        Update: {
          amount_paid?: number
          created_at?: string
          id?: number
          payment_method?: string
          split_id?: number | null
          status?: string
          tab_id?: number
          tip_added?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tab_payment_split_id_fkey"
            columns: ["split_id"]
            isOneToOne: false
            referencedRelation: "tab_split"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tab_payment_tab_id_fkey"
            columns: ["tab_id"]
            isOneToOne: false
            referencedRelation: "tab"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tab_payment_tab_id_fkey"
            columns: ["tab_id"]
            isOneToOne: false
            referencedRelation: "view_tab_totals"
            referencedColumns: ["tab_id"]
          },
        ]
      }
      tab_split: {
        Row: {
          amount_paid: number
          created_at: string
          id: number
          items_included: string[]
          settled_at: string | null
          split_number: number
          status: string
          subtotal: number
          tab_id: number
          tax_on_split: number
          tip_amount: number | null
          total_owed: number
          updated_at: string
        }
        Insert: {
          amount_paid?: number
          created_at?: string
          id?: number
          items_included?: string[]
          settled_at?: string | null
          split_number: number
          status?: string
          subtotal: number
          tab_id: number
          tax_on_split: number
          tip_amount?: number | null
          total_owed: number
          updated_at?: string
        }
        Update: {
          amount_paid?: number
          created_at?: string
          id?: number
          items_included?: string[]
          settled_at?: string | null
          split_number?: number
          status?: string
          subtotal?: number
          tab_id?: number
          tax_on_split?: number
          tip_amount?: number | null
          total_owed?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tab_split_tab_id_fkey"
            columns: ["tab_id"]
            isOneToOne: false
            referencedRelation: "tab"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tab_split_tab_id_fkey"
            columns: ["tab_id"]
            isOneToOne: false
            referencedRelation: "view_tab_totals"
            referencedColumns: ["tab_id"]
          },
        ]
      }
    }
    Views: {
      view_tab_totals: {
        Row: {
          subtotal: number | null
          tab_id: number | null
          tax_amount: number | null
          total_before_tip: number | null
          total_owed: number | null
        }
        Relationships: []
      }
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
