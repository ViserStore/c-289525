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
      admin_users: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_active: boolean | null
          password: string
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          password: string
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          password?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      daily_profits: {
        Row: {
          created_at: string
          id: string
          profit_amount: number
          profit_date: string
          status: string
          updated_at: string
          user_id: string
          user_investment_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          profit_amount?: number
          profit_date?: string
          status?: string
          updated_at?: string
          user_id: string
          user_investment_id: string
        }
        Update: {
          created_at?: string
          id?: string
          profit_amount?: number
          profit_date?: string
          status?: string
          updated_at?: string
          user_id?: string
          user_investment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_daily_profits_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_daily_profits_user_investment"
            columns: ["user_investment_id"]
            isOneToOne: false
            referencedRelation: "user_investments"
            referencedColumns: ["id"]
          },
        ]
      }
      deposits: {
        Row: {
          admin_notes: string | null
          amount: number
          bank_details: string | null
          created_at: string
          id: string
          notes: string | null
          payment_method: string
          processed_at: string | null
          processed_by: string | null
          screenshot_url: string | null
          status: string
          transaction_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          bank_details?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          payment_method: string
          processed_at?: string | null
          processed_by?: string | null
          screenshot_url?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          bank_details?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: string
          processed_at?: string | null
          processed_by?: string | null
          screenshot_url?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deposits_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      game_plays: {
        Row: {
          amount_paid: number
          created_at: string
          id: string
          is_winner: boolean | null
          play_date: string
          prize_won: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_paid?: number
          created_at?: string
          id?: string
          is_winner?: boolean | null
          play_date?: string
          prize_won?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_paid?: number
          created_at?: string
          id?: string
          is_winner?: boolean | null
          play_date?: string
          prize_won?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_plays_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      investment_plans: {
        Row: {
          created_at: string
          daily_profit_percentage: number
          description: string | null
          duration_days: number
          id: string
          is_active: boolean | null
          maximum_amount: number | null
          minimum_amount: number
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          daily_profit_percentage: number
          description?: string | null
          duration_days: number
          id?: string
          is_active?: boolean | null
          maximum_amount?: number | null
          minimum_amount: number
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          daily_profit_percentage?: number
          description?: string | null
          duration_days?: number
          id?: string
          is_active?: boolean | null
          maximum_amount?: number | null
          minimum_amount?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          admin_id: string | null
          created_at: string
          expires_at: string | null
          icon: string | null
          id: string
          is_broadcast: boolean | null
          is_read: boolean | null
          message: string
          metadata: Json | null
          priority: string | null
          title: string
          type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_id?: string | null
          created_at?: string
          expires_at?: string | null
          icon?: string | null
          id?: string
          is_broadcast?: boolean | null
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          priority?: string | null
          title: string
          type: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_id?: string | null
          created_at?: string
          expires_at?: string | null
          icon?: string | null
          id?: string
          is_broadcast?: boolean | null
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          priority?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications_user: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          priority: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          priority?: string | null
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          priority?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_gateways: {
        Row: {
          configuration: Json | null
          created_at: string
          fees_fixed: number | null
          fees_percentage: number | null
          gateway_type: string
          id: string
          is_active: boolean | null
          maximum_amount: number | null
          minimum_amount: number | null
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          configuration?: Json | null
          created_at?: string
          fees_fixed?: number | null
          fees_percentage?: number | null
          gateway_type: string
          id?: string
          is_active?: boolean | null
          maximum_amount?: number | null
          minimum_amount?: number | null
          name: string
          type: string
          updated_at?: string
        }
        Update: {
          configuration?: Json | null
          created_at?: string
          fees_fixed?: number | null
          fees_percentage?: number | null
          gateway_type?: string
          id?: string
          is_active?: boolean | null
          maximum_amount?: number | null
          minimum_amount?: number | null
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      referral_commissions: {
        Row: {
          commission_amount: number
          commission_percentage: number
          created_at: string
          id: string
          level: number
          referred_user_id: string
          referrer_user_id: string
          status: string
          trigger_amount: number
          trigger_type: string
          updated_at: string
        }
        Insert: {
          commission_amount?: number
          commission_percentage?: number
          created_at?: string
          id?: string
          level: number
          referred_user_id: string
          referrer_user_id: string
          status?: string
          trigger_amount?: number
          trigger_type: string
          updated_at?: string
        }
        Update: {
          commission_amount?: number
          commission_percentage?: number
          created_at?: string
          id?: string
          level?: number
          referred_user_id?: string
          referrer_user_id?: string
          status?: string
          trigger_amount?: number
          trigger_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_commissions_referred_user_id_fkey"
            columns: ["referred_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_commissions_referrer_user_id_fkey"
            columns: ["referrer_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          setting_key: string
          setting_type: string | null
          setting_value: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key: string
          setting_type?: string | null
          setting_value: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key?: string
          setting_type?: string | null
          setting_value?: string
          updated_at?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          setting_key: string
          setting_type: string | null
          setting_value: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          setting_key: string
          setting_type?: string | null
          setting_value?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          setting_key?: string
          setting_type?: string | null
          setting_value?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          reference_id: string | null
          reference_type: string | null
          status: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          status?: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_investments: {
        Row: {
          amount: number
          created_at: string
          end_date: string
          id: string
          investment_plan_id: string
          last_profit_date: string | null
          start_date: string
          status: string
          total_profit_earned: number
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          end_date: string
          id?: string
          investment_plan_id: string
          last_profit_date?: string | null
          start_date?: string
          status?: string
          total_profit_earned?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          end_date?: string
          id?: string
          investment_plan_id?: string
          last_profit_date?: string | null
          start_date?: string
          status?: string
          total_profit_earned?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_investments_investment_plan_id_fkey"
            columns: ["investment_plan_id"]
            isOneToOne: false
            referencedRelation: "investment_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_levels: {
        Row: {
          benefits: Json | null
          bonus_amount: number
          color: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          level: number
          name: string
          referrals_required: number
          updated_at: string
        }
        Insert: {
          benefits?: Json | null
          bonus_amount?: number
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          level: number
          name: string
          referrals_required?: number
          updated_at?: string
        }
        Update: {
          benefits?: Json | null
          bonus_amount?: number
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          level?: number
          name?: string
          referrals_required?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_notification_reads: {
        Row: {
          id: string
          notification_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          id?: string
          notification_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          id?: string
          notification_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_notification_reads_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          account_status: string | null
          address: string | null
          available_balance: number
          bind_account_name: string | null
          bind_account_number: string | null
          bind_bank_name: string | null
          bind_status: number | null
          city: string | null
          country: string | null
          created_at: string
          current_plan_id: string | null
          date_of_birth: string | null
          email: string | null
          full_name: string
          id: string
          is_email_verified: boolean | null
          is_phone_verified: boolean | null
          kyc_status: string | null
          last_login_at: string | null
          password: string
          phone_number: string
          postal_code: string | null
          profile_image_url: string | null
          referral_code: string | null
          referred_by_code: string | null
          referred_by_user_id: string | null
          total_deposits: number
          total_withdrawals: number
          updated_at: string
          user_level: number | null
          username: string
          withdraw_pin: string
        }
        Insert: {
          account_status?: string | null
          address?: string | null
          available_balance?: number
          bind_account_name?: string | null
          bind_account_number?: string | null
          bind_bank_name?: string | null
          bind_status?: number | null
          city?: string | null
          country?: string | null
          created_at?: string
          current_plan_id?: string | null
          date_of_birth?: string | null
          email?: string | null
          full_name: string
          id?: string
          is_email_verified?: boolean | null
          is_phone_verified?: boolean | null
          kyc_status?: string | null
          last_login_at?: string | null
          password: string
          phone_number: string
          postal_code?: string | null
          profile_image_url?: string | null
          referral_code?: string | null
          referred_by_code?: string | null
          referred_by_user_id?: string | null
          total_deposits?: number
          total_withdrawals?: number
          updated_at?: string
          user_level?: number | null
          username: string
          withdraw_pin: string
        }
        Update: {
          account_status?: string | null
          address?: string | null
          available_balance?: number
          bind_account_name?: string | null
          bind_account_number?: string | null
          bind_bank_name?: string | null
          bind_status?: number | null
          city?: string | null
          country?: string | null
          created_at?: string
          current_plan_id?: string | null
          date_of_birth?: string | null
          email?: string | null
          full_name?: string
          id?: string
          is_email_verified?: boolean | null
          is_phone_verified?: boolean | null
          kyc_status?: string | null
          last_login_at?: string | null
          password?: string
          phone_number?: string
          postal_code?: string | null
          profile_image_url?: string | null
          referral_code?: string | null
          referred_by_code?: string | null
          referred_by_user_id?: string | null
          total_deposits?: number
          total_withdrawals?: number
          updated_at?: string
          user_level?: number | null
          username?: string
          withdraw_pin?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_users_current_plan"
            columns: ["current_plan_id"]
            isOneToOne: false
            referencedRelation: "investment_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_referred_by_user_id_fkey"
            columns: ["referred_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawals: {
        Row: {
          account_details: Json | null
          admin_notes: string | null
          amount: number
          created_at: string
          gateway_id: string
          id: string
          processed_at: string | null
          processed_by: string | null
          screenshot_url: string | null
          status: string
          transaction_id: string | null
          updated_at: string
          user_id: string
          withdrawal_method: string
        }
        Insert: {
          account_details?: Json | null
          admin_notes?: string | null
          amount: number
          created_at?: string
          gateway_id: string
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          screenshot_url?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
          user_id: string
          withdrawal_method: string
        }
        Update: {
          account_details?: Json | null
          admin_notes?: string | null
          amount?: number
          created_at?: string
          gateway_id?: string
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          screenshot_url?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
          withdrawal_method?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_gateway_id_fkey"
            columns: ["gateway_id"]
            isOneToOne: false
            referencedRelation: "payment_gateways"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawals_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activate_theme: {
        Args: { theme_name: string }
        Returns: boolean
      }
      calculate_user_level: {
        Args: { user_id: string }
        Returns: number
      }
      clear_user_notification: {
        Args: { p_notification_id: string }
        Returns: boolean
      }
      clear_user_notification_with_user: {
        Args: { p_notification_id: string; p_user_id: string }
        Returns: boolean
      }
      create_admin_notification: {
        Args: {
          p_admin_id: string
          p_type: string
          p_title: string
          p_message: string
          p_icon?: string
          p_priority?: string
          p_metadata?: Json
        }
        Returns: string
      }
      create_broadcast_notification: {
        Args: {
          p_admin_id: string
          p_type: string
          p_title: string
          p_message: string
          p_icon?: string
          p_priority?: string
          p_metadata?: Json
        }
        Returns: string
      }
      create_user_activity_notification: {
        Args: {
          p_user_id: string
          p_type: string
          p_title: string
          p_message: string
          p_icon?: string
          p_priority?: string
          p_metadata?: Json
        }
        Returns: string
      }
      create_user_notification: {
        Args: {
          p_user_id: string
          p_type: string
          p_title: string
          p_message: string
          p_icon?: string
          p_priority?: string
          p_metadata?: Json
        }
        Returns: string
      }
      generate_referral_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      increment_user_balance: {
        Args: { user_id: string; amount: number }
        Returns: undefined
      }
      mark_all_notifications_read: {
        Args: { p_user_id?: string }
        Returns: number
      }
      mark_notification_read: {
        Args: { p_notification_id: string }
        Returns: boolean
      }
      mark_notification_read_with_user: {
        Args: { p_notification_id: string; p_user_id: string }
        Returns: boolean
      }
      mark_user_notification_read: {
        Args: { p_notification_id: string }
        Returns: boolean
      }
      mark_user_notification_read_with_user: {
        Args: { p_notification_id: string; p_user_id: string }
        Returns: boolean
      }
      process_daily_profits: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      process_investment: {
        Args:
          | { p_user_id: string; p_amount: number }
          | { p_user_id: string; p_amount: number; p_plan_id: string }
          | { p_user_id: string; p_plan_id: string; p_amount: number }
        Returns: undefined
      }
      process_referral_commission: {
        Args: {
          p_referred_user_id: string
          p_trigger_amount: number
          p_trigger_type: string
        }
        Returns: boolean
      }
      record_game_play: {
        Args: {
          p_user_id: string
          p_amount_paid: number
          p_prize_won?: number
          p_is_winner?: boolean
        }
        Returns: string
      }
      subscribe_to_investment_plan: {
        Args: { p_user_id: string; p_plan_id: string; p_amount: number }
        Returns: string
      }
      user_has_read_broadcast: {
        Args: { p_user_id: string; p_notification_id: string }
        Returns: boolean
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
