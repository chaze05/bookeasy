export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ============================================================
// Enums / union types
// ============================================================

export type UserRole = "superadmin" | "owner" | "staff" | "customer";
export type BusinessStatus = "active" | "suspended" | "pending";
export type NotificationType =
  | "new_booking"
  | "cancelled"
  | "slot_full"
  | "system";
export type BookingStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "no_show"
  | "completed";

// ============================================================
// Core domain types
// ============================================================

export interface Business {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  timezone: string;
  // Booking settings (migration_001)
  allow_multiple_bookings: boolean;
  max_bookings_per_slot: number;
  booking_interval: number;
  business_hours_start: string;
  business_hours_end: string;
  realtime_enabled: boolean;
  status: BusinessStatus;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Staff {
  id: string;
  business_id: string;
  user_id: string | null;
  full_name: string;
  email: string | null;
  avatar_url: string | null;
  role: "owner" | "staff";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Availability {
  id: string;
  business_id: string;
  staff_id: string;
  day_of_week: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
}

export interface BlockedDate {
  id: string;
  business_id: string;
  staff_id: string | null;
  blocked_on: string;
  reason: string | null;
  created_at: string;
}

export interface Booking {
  id: string;
  business_id: string;
  service_id: string;
  staff_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  payment_method_id: string | null;
  payment_proof_url: string | null;
  starts_at: string;
  ends_at: string;
  status: BookingStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookingWithRelations extends Booking {
  service: Pick<Service, "name" | "duration" | "price" | "color">;
  staff: Pick<Staff, "full_name" | "avatar_url"> | null;
}

// ============================================================
// Notifications & audit
// ============================================================

export interface Notification {
  id: string;
  user_id: string;
  business_id: string | null;
  type: NotificationType;
  title: string;
  message: string;
  read_at: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  business_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

// ============================================================
// Dashboard & admin aggregates
// ============================================================

export interface DashboardStats {
  totalBookings: number;
  todayBookings: number;
  weekRevenue: number;
  activeClients: number;
}

export interface SuperadminStats {
  totalBusinesses: number;
  activeBusinesses: number;
  suspendedBusinesses: number;
  totalUsers: number;
  totalBookings: number;
  totalRevenue: number;
  newBusinessesToday: number;
  newBookingsToday: number;
}

export interface BusinessWithOwner extends Business {
  owner: Pick<Profile, "id" | "full_name" | "avatar_url"> | null;
}

// ============================================================
// Kept for reference — NOT used as Supabase generic
// ============================================================

export interface Database {
  public: {
    Tables: {
      businesses: {
        Row: Business;
        Insert: Omit<Business, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Business, "id">>;
      };
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at" | "updated_at">;
        Update: Partial<Omit<Profile, "id">>;
      };
      services: {
        Row: Service;
        Insert: Omit<Service, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Service, "id">>;
      };
      staff: {
        Row: Staff;
        Insert: Omit<Staff, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Staff, "id">>;
      };
      availability: {
        Row: Availability;
        Insert: Omit<Availability, "id" | "created_at">;
        Update: Partial<Omit<Availability, "id">>;
      };
      blocked_dates: {
        Row: BlockedDate;
        Insert: Omit<BlockedDate, "id" | "created_at">;
        Update: Partial<Omit<BlockedDate, "id">>;
      };
      bookings: {
        Row: Booking;
        Insert: Omit<Booking, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Booking, "id">>;
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, "id" | "created_at">;
        Update: Partial<Omit<Notification, "id">>;
      };
      audit_logs: {
        Row: AuditLog;
        Insert: Omit<AuditLog, "id" | "created_at">;
        Update: Partial<Omit<AuditLog, "id">>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
