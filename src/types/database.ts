export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      campuses: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      contact_inquiries: {
        Row: {
          college: string | null
          created_at: string | null
          email: string
          id: string
          message: string
          name: string
          status: string | null
          subject: string
        }
        Insert: {
          college?: string | null
          created_at?: string | null
          email: string
          id?: string
          message: string
          name: string
          status?: string | null
          subject: string
        }
        Update: {
          college?: string | null
          created_at?: string | null
          email?: string
          id?: string
          message?: string
          name?: string
          status?: string | null
          subject?: string
        }
        Relationships: []
      }
      product_enquiries: {
        Row: {
          buyer_id: string | null
          buyer_name: string | null
          buyer_email: string | null
          created_at: string | null
          id: string
          message: string
          preferred_meetup: string | null
          product_id: string
          product_price: number | null
          product_title: string
          seller_id: string | null
          seller_name: string | null
          share_contact_consent: boolean | null
          status: string | null
        }
        Insert: {
          buyer_id?: string | null
          buyer_name?: string | null
          buyer_email?: string | null
          created_at?: string | null
          id?: string
          message: string
          preferred_meetup?: string | null
          product_id: string
          product_price?: number | null
          product_title: string
          seller_id?: string | null
          seller_name?: string | null
          share_contact_consent?: boolean | null
          status?: string | null
        }
        Update: {
          buyer_id?: string | null
          buyer_name?: string | null
          buyer_email?: string | null
          created_at?: string | null
          id?: string
          message?: string
          preferred_meetup?: string | null
          product_id?: string
          product_price?: number | null
          product_title?: string
          seller_id?: string | null
          seller_name?: string | null
          share_contact_consent?: boolean | null
          status?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          campus: string
          category: string
          condition: string
          created_at: string | null
          description: string | null
          featured: boolean | null
          id: string
          images: string[]
          in_stock: boolean | null
          is_recent: boolean | null
          original_price: number | null
          pickup_location: string
          price: number
          seller_avatar_url: string | null
          seller_department: string | null
          seller_hostel: string | null
          seller_id: string | null
          seller_name: string
          seller_rating: number | null
          seller_response_time: string | null
          seller_reviews_count: number | null
          seller_verified: boolean | null
          seller_year: string | null
          tags: string[] | null
          title: string
          status: string | null
          expires_at: string | null
          updated_at: string | null
          course_code: string | null
          semester: string | null
          category_fields: Json | null
        }
        Insert: {
          campus: string
          category: string
          condition: string
          created_at?: string | null
          description?: string | null
          featured?: boolean | null
          id: string
          images?: string[]
          in_stock?: boolean | null
          is_recent?: boolean | null
          original_price?: number | null
          pickup_location: string
          price: number
          seller_avatar_url?: string | null
          seller_department?: string | null
          seller_hostel?: string | null
          seller_id?: string | null
          seller_name: string
          seller_rating?: number | null
          seller_response_time?: string | null
          seller_reviews_count?: number | null
          seller_verified?: boolean | null
          seller_year?: string | null
          tags?: string[] | null
          title: string
          status?: string | null
          expires_at?: string | null
          updated_at?: string | null
          course_code?: string | null
          semester?: string | null
          category_fields?: Json | null
        }
        Update: {
          campus?: string
          category?: string
          condition?: string
          created_at?: string | null
          description?: string | null
          featured?: boolean | null
          id?: string
          images?: string[]
          in_stock?: boolean | null
          is_recent?: boolean | null
          original_price?: number | null
          pickup_location?: string
          price?: number
          seller_avatar_url?: string | null
          seller_department?: string | null
          seller_hostel?: string | null
          seller_id?: string | null
          seller_name?: string
          seller_rating?: number | null
          seller_response_time?: string | null
          seller_reviews_count?: number | null
          seller_verified?: boolean | null
          seller_year?: string | null
          tags?: string[] | null
          title?: string
          status?: string | null
          expires_at?: string | null
          updated_at?: string | null
          course_code?: string | null
          semester?: string | null
          category_fields?: Json | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          college: string | null
          department: string | null
          year: string | null
          hostel: string | null
          phone: string | null
          avatar_url: string | null
          verified_student: boolean | null
          rating: number | null
          reviews_count: number | null
          role: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          college?: string | null
          department?: string | null
          year?: string | null
          hostel?: string | null
          phone?: string | null
          avatar_url?: string | null
          verified_student?: boolean | null
          rating?: number | null
          reviews_count?: number | null
          role?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          college?: string | null
          department?: string | null
          year?: string | null
          hostel?: string | null
          phone?: string | null
          avatar_url?: string | null
          verified_student?: boolean | null
          rating?: number | null
          reviews_count?: number | null
          role?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      reservations: {
        Row: {
          buyer_id: string | null
          buyer_name: string | null
          buyer_email: string | null
          buyer_phone: string | null
          campus: string | null
          created_at: string | null
          id: string
          items: Json
          pickup_slot: string
          status: string | null
          total_amount: number
        }
        Insert: {
          buyer_id?: string | null
          buyer_name?: string | null
          buyer_email?: string | null
          buyer_phone?: string | null
          campus?: string | null
          created_at?: string | null
          id?: string
          items: Json
          pickup_slot: string
          status?: string | null
          total_amount: number
        }
        Update: {
          buyer_id?: string | null
          buyer_name?: string | null
          buyer_email?: string | null
          buyer_phone?: string | null
          campus?: string | null
          created_at?: string | null
          id?: string
          items?: Json
          pickup_slot?: string
          status?: string | null
          total_amount?: number
        }
        Relationships: []
      }
      conversations: {
        Row: {
          id: string
          listing_id: string
          buyer_id: string
          seller_id: string
          created_at: string | null
          updated_at: string | null
          last_message_text: string | null
          last_message_at: string | null
        }
        Insert: {
          id?: string
          listing_id: string
          buyer_id: string
          seller_id: string
          created_at?: string | null
          updated_at?: string | null
          last_message_text?: string | null
          last_message_at?: string | null
        }
        Update: {
          id?: string
          listing_id?: string
          buyer_id?: string
          seller_id?: string
          created_at?: string | null
          updated_at?: string | null
          last_message_text?: string | null
          last_message_at?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          message_text: string
          is_meetup_suggestion: boolean | null
          meetup_location: string | null
          read_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          message_text: string
          is_meetup_suggestion?: boolean | null
          meetup_location?: string | null
          read_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          message_text?: string
          is_meetup_suggestion?: boolean | null
          meetup_location?: string | null
          read_at?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      listing_reports: {
        Row: {
          id: string
          listing_id: string
          reporter_id: string
          reason: string
          explanation: string | null
          status: string | null
          moderator_notes: string | null
          resolution_notes: string | null
          reviewed_by: string | null
          resolved_by: string | null
          resolved_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          listing_id: string
          reporter_id: string
          reason: string
          explanation?: string | null
          status?: string | null
          moderator_notes?: string | null
          resolution_notes?: string | null
          reviewed_by?: string | null
          resolved_by?: string | null
          resolved_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          listing_id?: string
          reporter_id?: string
          reason?: string
          explanation?: string | null
          status?: string | null
          moderator_notes?: string | null
          resolution_notes?: string | null
          reviewed_by?: string | null
          resolved_by?: string | null
          resolved_at?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      wishlists: {
        Row: {
          id: string
          user_id: string
          product_id: string
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      register_student_account: {
        Args: {
          p_email: string
          p_password: string
          p_full_name: string
          p_college: string
          p_department?: string
        }
        Returns: Json
      }
      renew_listing: {
        Args: {
          p_listing_id: string
        }
        Returns: Json
      }
      expire_stale_listings: {
        Args: Record<PropertyKey, never>
        Returns: Json
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
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
