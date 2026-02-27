import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

console.log('🔧 Initializing Supabase client with URL:', supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Entity = Database['public']['Tables']['entities']['Row'];

export const RoleDisplay: Record<string, { label: string; bgColor: string; color: string }> = {
  super_admin: {
    label: 'Super Admin',
    bgColor: 'bg-red-100',
    color: 'text-red-800'
  },
  developer: {
    label: 'Developer',
    bgColor: 'bg-blue-100',
    color: 'text-blue-800'
  },
  owner: {
    label: 'Owner',
    bgColor: 'bg-purple-100',
    color: 'text-purple-800'
  },
  accountant: {
    label: 'Accountant',
    bgColor: 'bg-green-100',
    color: 'text-green-800'
  },
  user: {
    label: 'User',
    bgColor: 'bg-gray-100',
    color: 'text-gray-800'
  }
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          email: string | null
          avatar_url: string | null
          push_notifications: boolean | null
          email_notifications: boolean | null
          updated_at: string | null
          phone_number: string | null
          theme_preference: string | null
          view_preference: 'grid' | 'list' | null
          role: 'super_admin' | 'developer' | 'owner' | 'accountant' | 'user'
          owner_id: string | null
          entity_id: string | null
          active_entity_id: string | null
          current_entity_id: string | null
          header_visible: boolean | null
          show_enter_multiple_default: boolean | null
          show_create_reports_default: boolean | null
          show_billable_reimbursable_default: boolean | null
          show_billable_default: boolean | null
          show_reimbursable_default: boolean | null
          upload_multiple_images_default: boolean | null
          mfa_enabled: boolean
          mfa_preference: 'totp' | 'sms' | null
          mfa_backup_codes_generated_at: string | null
        }
        Insert: {
          id: string
          full_name?: string | null
          email?: string | null
          avatar_url?: string | null
          push_notifications?: boolean | null
          email_notifications?: boolean | null
          updated_at?: string | null
          phone_number?: string | null
          theme_preference?: string | null
          view_preference?: 'grid' | 'list' | null
          role?: 'super_admin' | 'developer' | 'owner' | 'accountant' | 'user'
          owner_id?: string | null
          entity_id?: string | null
          active_entity_id?: string | null
          current_entity_id?: string | null
          header_visible?: boolean | null
          show_enter_multiple_default?: boolean | null
          show_create_reports_default?: boolean | null
          show_billable_reimbursable_default?: boolean | null
          show_billable_default?: boolean | null
          show_reimbursable_default?: boolean | null
          upload_multiple_images_default?: boolean | null
          mfa_enabled?: boolean
          mfa_preference?: 'totp' | 'sms' | null
          mfa_backup_codes_generated_at?: string | null
        }
        Update: {
          id?: string
          full_name?: string | null
          email?: string | null
          avatar_url?: string | null
          push_notifications?: boolean | null
          email_notifications?: boolean | null
          updated_at?: string | null
          phone_number?: string | null
          theme_preference?: string | null
          view_preference?: 'grid' | 'list' | null
          role?: 'super_admin' | 'developer' | 'owner' | 'accountant' | 'user'
          owner_id?: string | null
          entity_id?: string | null
          active_entity_id?: string | null
          current_entity_id?: string | null
          header_visible?: boolean | null
          show_enter_multiple_default?: boolean | null
          show_create_reports_default?: boolean | null
          show_billable_reimbursable_default?: boolean | null
          show_billable_default?: boolean | null
          show_reimbursable_default?: boolean | null
          upload_multiple_images_default?: boolean | null
          mfa_enabled?: boolean
          mfa_preference?: 'totp' | 'sms' | null
          mfa_backup_codes_generated_at?: string | null
        }
      }
      entities: {
        Row: {
          id: string
          entity_id: string
          entity_name: string
          owner_id: string
          created_at: string | null
          updated_at: string | null
          entity_logo_url: string | null
          show_billable_default: boolean
          show_reimbursable_default: boolean
          show_enter_multiple_default: boolean
          show_create_reports_default: boolean
          upload_multiple_images_default: boolean
        }
        Insert: {
          id?: string
          entity_id: string
          entity_name: string
          owner_id: string
          created_at?: string | null
          updated_at?: string | null
          entity_logo_url?: string | null
          show_billable_default?: boolean
          show_reimbursable_default?: boolean
          show_enter_multiple_default?: boolean
          show_create_reports_default?: boolean
          upload_multiple_images_default?: boolean
        }
        Update: {
          id?: string
          entity_id?: string
          entity_name?: string
          owner_id?: string
          created_at?: string | null
          updated_at?: string | null
          entity_logo_url?: string | null
          show_billable_default?: boolean
          show_reimbursable_default?: boolean
          show_enter_multiple_default?: boolean
          show_create_reports_default?: boolean
          upload_multiple_images_default?: boolean
        }
      }
      stripe_customers: {
        Row: {
          id: number
          user_id: string
          customer_id: string
          created_at: string | null
          updated_at: string | null
          deleted_at: string | null
        }
        Insert: {
          user_id: string
          customer_id: string
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        }
        Update: {
          user_id?: string
          customer_id?: string
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        }
      }
      stripe_subscriptions: {
        Row: {
          id: number
          customer_id: string
          subscription_id: string | null
          price_id: string | null
          current_period_start: number | null
          current_period_end: number | null
          cancel_at_period_end: boolean | null
          payment_method_brand: string | null
          payment_method_last4: string | null
          status: 'not_started' | 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'paused'
          created_at: string | null
          updated_at: string | null
          deleted_at: string | null
        }
        Insert: {
          customer_id: string
          subscription_id?: string | null
          price_id?: string | null
          current_period_start?: number | null
          current_period_end?: number | null
          cancel_at_period_end?: boolean | null
          payment_method_brand?: string | null
          payment_method_last4?: string | null
          status: 'not_started' | 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'paused'
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        }
        Update: {
          customer_id?: string
          subscription_id?: string | null
          price_id?: string | null
          current_period_start?: number | null
          current_period_end?: number | null
          cancel_at_period_end?: boolean | null
          payment_method_brand?: string | null
          payment_method_last4?: string | null
          status?: 'not_started' | 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'paused'
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        }
      }
      stripe_orders: {
        Row: {
          id: number
          checkout_session_id: string
          payment_intent_id: string
          customer_id: string
          amount_subtotal: number
          amount_total: number
          currency: string
          payment_status: string
          status: 'pending' | 'completed' | 'canceled'
          created_at: string | null
          updated_at: string | null
          deleted_at: string | null
        }
        Insert: {
          checkout_session_id: string
          payment_intent_id: string
          customer_id: string
          amount_subtotal: number
          amount_total: number
          currency: string
          payment_status: string
          status?: 'pending' | 'completed' | 'canceled'
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        }
        Update: {
          checkout_session_id?: string
          payment_intent_id?: string
          customer_id?: string
          amount_subtotal?: number
          amount_total?: number
          currency?: string
          payment_status?: string
          status?: 'pending' | 'completed' | 'canceled'
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        }
      }
    }
    Views: {
      stripe_user_subscriptions: {
        Row: {
          customer_id: string | null
          subscription_id: string | null
          subscription_status: 'not_started' | 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'paused' | null
          price_id: string | null
          current_period_start: number | null
          current_period_end: number | null
          cancel_at_period_end: boolean | null
          payment_method_brand: string | null
          payment_method_last4: string | null
        }
      }
      stripe_user_orders: {
        Row: {
          customer_id: string | null
          order_id: number | null
          checkout_session_id: string | null
          payment_intent_id: string | null
          amount_subtotal: number | null
          amount_total: number | null
          currency: string | null
          payment_status: string | null
          order_status: 'pending' | 'completed' | 'canceled' | null
          order_date: string | null
        }
      }
    }
  }
}