export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          company_name: string;
          is_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string;
          company_name?: string;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          company_name?: string;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      service_categories: {
        Row: {
          id: string;
          name: string;
          description: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          created_at?: string;
        };
      };
      service_offers: {
        Row: {
          id: string;
          category_id: string | null;
          title: string;
          description: string;
          features: string[];
          price_monthly: number;
          price_yearly: number;
          is_active: boolean;
          product_link: string | null;
          product_image: string | null;
          product_video: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id?: string | null;
          title: string;
          description?: string;
          features?: string[];
          price_monthly?: number;
          price_yearly?: number;
          is_active?: boolean;
          product_link?: string | null;
          product_image?: string | null;
          product_video?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string | null;
          title?: string;
          description?: string;
          features?: string[];
          price_monthly?: number;
          price_yearly?: number;
          is_active?: boolean;
          product_link?: string | null;
          product_image?: string | null;
          product_video?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          offer_id: string;
          status: 'active' | 'pending' | 'cancelled';
          billing_cycle: 'monthly' | 'yearly';
          started_at: string;
          next_billing_date: string | null;
          notes: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          offer_id: string;
          status?: 'active' | 'pending' | 'cancelled';
          billing_cycle?: 'monthly' | 'yearly';
          started_at?: string;
          next_billing_date?: string | null;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          offer_id?: string;
          status?: 'active' | 'pending' | 'cancelled';
          billing_cycle?: 'monthly' | 'yearly';
          started_at?: string;
          next_billing_date?: string | null;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
