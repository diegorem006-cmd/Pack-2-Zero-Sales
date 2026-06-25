export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      settings: {
        Row: {
          id: string;
          app_name: string;
          company_description: string;
          logo_url: string | null;
          primary_color: string;
          accent_color: string;
          sender_email: string;
          sender_name: string;
          resend_api_key: string | null;
          llm_api_key: string | null;
          llm_provider: "openai" | "anthropic";
          access_password_hash: string;
          column_mapping: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          app_name?: string;
          company_description: string;
          logo_url?: string | null;
          primary_color?: string;
          accent_color?: string;
          sender_email: string;
          sender_name: string;
          resend_api_key?: string | null;
          llm_api_key?: string | null;
          llm_provider?: "openai" | "anthropic";
          access_password_hash: string;
          column_mapping?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          app_name?: string;
          company_description?: string;
          logo_url?: string | null;
          primary_color?: string;
          accent_color?: string;
          sender_email?: string;
          sender_name?: string;
          resend_api_key?: string | null;
          llm_api_key?: string | null;
          llm_provider?: "openai" | "anthropic";
          access_password_hash?: string;
          column_mapping?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      team_members: {
        Row: {
          id: string;
          name: string;
          email: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      contacts: {
        Row: {
          id: string;
          first_name: string;
          last_name: string | null;
          company_name: string | null;
          email: string;
          website: string | null;
          country: string | null;
          state: string | null;
          type: "Productor" | "Distribuidor" | "Marca nueva" | "Consumidor" | "Otro";
          priority: "Alta" | "Media" | "Baja";
          source: string | null;
          submission_date: string | null;
          status: "Nuevo" | "Pendiente" | "Contestado";
          assigned_to: string | null;
          extra: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          first_name: string;
          last_name?: string | null;
          company_name?: string | null;
          email: string;
          website?: string | null;
          country?: string | null;
          state?: string | null;
          type: "Productor" | "Distribuidor" | "Marca nueva" | "Consumidor" | "Otro";
          priority: "Alta" | "Media" | "Baja";
          source?: string | null;
          submission_date?: string | null;
          status?: "Nuevo" | "Pendiente" | "Contestado";
          assigned_to?: string | null;
          extra?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          first_name?: string;
          last_name?: string | null;
          company_name?: string | null;
          email?: string;
          website?: string | null;
          country?: string | null;
          state?: string | null;
          type?: "Productor" | "Distribuidor" | "Marca nueva" | "Consumidor" | "Otro";
          priority?: "Alta" | "Media" | "Baja";
          source?: string | null;
          submission_date?: string | null;
          status?: "Nuevo" | "Pendiente" | "Contestado";
          assigned_to?: string | null;
          extra?: Json | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "contacts_assigned_to_fkey";
            columns: ["assigned_to"];
            isOneToOne: false;
            referencedRelation: "team_members";
            referencedColumns: ["id"];
          },
        ];
      };
      messages: {
        Row: {
          id: string;
          contact_id: string;
          direction: "recibido" | "enviado";
          subject: string | null;
          body: string;
          sent_by: string | null;
          channel: "email" | "nota";
          created_at: string;
        };
        Insert: {
          id?: string;
          contact_id: string;
          direction: "recibido" | "enviado";
          subject?: string | null;
          body: string;
          sent_by?: string | null;
          channel?: "email" | "nota";
          created_at?: string;
        };
        Update: {
          id?: string;
          contact_id?: string;
          direction?: "recibido" | "enviado";
          subject?: string | null;
          body?: string;
          sent_by?: string | null;
          channel?: "email" | "nota";
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_sent_by_fkey";
            columns: ["sent_by"];
            isOneToOne: false;
            referencedRelation: "team_members";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      contact_type: "Productor" | "Distribuidor" | "Marca nueva" | "Consumidor" | "Otro";
      contact_priority: "Alta" | "Media" | "Baja";
      contact_status: "Nuevo" | "Pendiente" | "Contestado";
      message_direction: "recibido" | "enviado";
      message_channel: "email" | "nota";
      llm_provider: "openai" | "anthropic";
    };
    CompositeTypes: Record<string, never>;
  };
}

export type Settings = Database["public"]["Tables"]["settings"]["Row"];
export type SettingsInsert = Database["public"]["Tables"]["settings"]["Insert"];
export type SettingsUpdate = Database["public"]["Tables"]["settings"]["Update"];

export type TeamMember = Database["public"]["Tables"]["team_members"]["Row"];
export type TeamMemberInsert = Database["public"]["Tables"]["team_members"]["Insert"];
export type TeamMemberUpdate = Database["public"]["Tables"]["team_members"]["Update"];

export type Contact = Database["public"]["Tables"]["contacts"]["Row"];
export type ContactInsert = Database["public"]["Tables"]["contacts"]["Insert"];
export type ContactUpdate = Database["public"]["Tables"]["contacts"]["Update"];

export type Message = Database["public"]["Tables"]["messages"]["Row"];
export type MessageInsert = Database["public"]["Tables"]["messages"]["Insert"];
export type MessageUpdate = Database["public"]["Tables"]["messages"]["Update"];
