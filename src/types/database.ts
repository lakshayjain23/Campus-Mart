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
        }
        Relationships: []
      }
      reservations: {
        Row: {
          campus: string | null
          created_at: string | null
          id: string
          items: Json
          pickup_slot: string
          status: string | null
          total_amount: number
        }
        Insert: {
          campus?: string | null
          created_at?: string | null
          id?: string
          items: Json
          pickup_slot: string
          status?: string | null
          total_amount: number
        }
        Update: {
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
