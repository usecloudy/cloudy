export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  auth: {
    Tables: {
      audit_log_entries: {
        Row: {
          created_at: string | null
          id: string
          instance_id: string | null
          ip_address: string
          payload: Json | null
        }
        Insert: {
          created_at?: string | null
          id: string
          instance_id?: string | null
          ip_address?: string
          payload?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string
          instance_id?: string | null
          ip_address?: string
          payload?: Json | null
        }
        Relationships: []
      }
      flow_state: {
        Row: {
          auth_code: string
          auth_code_issued_at: string | null
          authentication_method: string
          code_challenge: string
          code_challenge_method: Database["auth"]["Enums"]["code_challenge_method"]
          created_at: string | null
          id: string
          provider_access_token: string | null
          provider_refresh_token: string | null
          provider_type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          auth_code: string
          auth_code_issued_at?: string | null
          authentication_method: string
          code_challenge: string
          code_challenge_method: Database["auth"]["Enums"]["code_challenge_method"]
          created_at?: string | null
          id: string
          provider_access_token?: string | null
          provider_refresh_token?: string | null
          provider_type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          auth_code?: string
          auth_code_issued_at?: string | null
          authentication_method?: string
          code_challenge?: string
          code_challenge_method?: Database["auth"]["Enums"]["code_challenge_method"]
          created_at?: string | null
          id?: string
          provider_access_token?: string | null
          provider_refresh_token?: string | null
          provider_type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      identities: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          identity_data: Json
          last_sign_in_at: string | null
          provider: string
          provider_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          identity_data: Json
          last_sign_in_at?: string | null
          provider: string
          provider_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          identity_data?: Json
          last_sign_in_at?: string | null
          provider?: string
          provider_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "identities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      instances: {
        Row: {
          created_at: string | null
          id: string
          raw_base_config: string | null
          updated_at: string | null
          uuid: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          raw_base_config?: string | null
          updated_at?: string | null
          uuid?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          raw_base_config?: string | null
          updated_at?: string | null
          uuid?: string | null
        }
        Relationships: []
      }
      mfa_amr_claims: {
        Row: {
          authentication_method: string
          created_at: string
          id: string
          session_id: string
          updated_at: string
        }
        Insert: {
          authentication_method: string
          created_at: string
          id: string
          session_id: string
          updated_at: string
        }
        Update: {
          authentication_method?: string
          created_at?: string
          id?: string
          session_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mfa_amr_claims_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      mfa_challenges: {
        Row: {
          created_at: string
          factor_id: string
          id: string
          ip_address: unknown
          otp_code: string | null
          verified_at: string | null
        }
        Insert: {
          created_at: string
          factor_id: string
          id: string
          ip_address: unknown
          otp_code?: string | null
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          factor_id?: string
          id?: string
          ip_address?: unknown
          otp_code?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mfa_challenges_auth_factor_id_fkey"
            columns: ["factor_id"]
            isOneToOne: false
            referencedRelation: "mfa_factors"
            referencedColumns: ["id"]
          },
        ]
      }
      mfa_factors: {
        Row: {
          created_at: string
          factor_type: Database["auth"]["Enums"]["factor_type"]
          friendly_name: string | null
          id: string
          last_challenged_at: string | null
          phone: string | null
          secret: string | null
          status: Database["auth"]["Enums"]["factor_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at: string
          factor_type: Database["auth"]["Enums"]["factor_type"]
          friendly_name?: string | null
          id: string
          last_challenged_at?: string | null
          phone?: string | null
          secret?: string | null
          status: Database["auth"]["Enums"]["factor_status"]
          updated_at: string
          user_id: string
        }
        Update: {
          created_at?: string
          factor_type?: Database["auth"]["Enums"]["factor_type"]
          friendly_name?: string | null
          id?: string
          last_challenged_at?: string | null
          phone?: string | null
          secret?: string | null
          status?: Database["auth"]["Enums"]["factor_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mfa_factors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      one_time_tokens: {
        Row: {
          created_at: string
          id: string
          relates_to: string
          token_hash: string
          token_type: Database["auth"]["Enums"]["one_time_token_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id: string
          relates_to: string
          token_hash: string
          token_type: Database["auth"]["Enums"]["one_time_token_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          relates_to?: string
          token_hash?: string
          token_type?: Database["auth"]["Enums"]["one_time_token_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "one_time_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      refresh_tokens: {
        Row: {
          created_at: string | null
          id: number
          instance_id: string | null
          parent: string | null
          revoked: boolean | null
          session_id: string | null
          token: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          instance_id?: string | null
          parent?: string | null
          revoked?: boolean | null
          session_id?: string | null
          token?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          instance_id?: string | null
          parent?: string | null
          revoked?: boolean | null
          session_id?: string | null
          token?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "refresh_tokens_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      saml_providers: {
        Row: {
          attribute_mapping: Json | null
          created_at: string | null
          entity_id: string
          id: string
          metadata_url: string | null
          metadata_xml: string
          name_id_format: string | null
          sso_provider_id: string
          updated_at: string | null
        }
        Insert: {
          attribute_mapping?: Json | null
          created_at?: string | null
          entity_id: string
          id: string
          metadata_url?: string | null
          metadata_xml: string
          name_id_format?: string | null
          sso_provider_id: string
          updated_at?: string | null
        }
        Update: {
          attribute_mapping?: Json | null
          created_at?: string | null
          entity_id?: string
          id?: string
          metadata_url?: string | null
          metadata_xml?: string
          name_id_format?: string | null
          sso_provider_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saml_providers_sso_provider_id_fkey"
            columns: ["sso_provider_id"]
            isOneToOne: false
            referencedRelation: "sso_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      saml_relay_states: {
        Row: {
          created_at: string | null
          flow_state_id: string | null
          for_email: string | null
          id: string
          redirect_to: string | null
          request_id: string
          sso_provider_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          flow_state_id?: string | null
          for_email?: string | null
          id: string
          redirect_to?: string | null
          request_id: string
          sso_provider_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          flow_state_id?: string | null
          for_email?: string | null
          id?: string
          redirect_to?: string | null
          request_id?: string
          sso_provider_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saml_relay_states_flow_state_id_fkey"
            columns: ["flow_state_id"]
            isOneToOne: false
            referencedRelation: "flow_state"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saml_relay_states_sso_provider_id_fkey"
            columns: ["sso_provider_id"]
            isOneToOne: false
            referencedRelation: "sso_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      schema_migrations: {
        Row: {
          version: string
        }
        Insert: {
          version: string
        }
        Update: {
          version?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          aal: Database["auth"]["Enums"]["aal_level"] | null
          created_at: string | null
          factor_id: string | null
          id: string
          ip: unknown | null
          not_after: string | null
          refreshed_at: string | null
          tag: string | null
          updated_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          aal?: Database["auth"]["Enums"]["aal_level"] | null
          created_at?: string | null
          factor_id?: string | null
          id: string
          ip?: unknown | null
          not_after?: string | null
          refreshed_at?: string | null
          tag?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          aal?: Database["auth"]["Enums"]["aal_level"] | null
          created_at?: string | null
          factor_id?: string | null
          id?: string
          ip?: unknown | null
          not_after?: string | null
          refreshed_at?: string | null
          tag?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sso_domains: {
        Row: {
          created_at: string | null
          domain: string
          id: string
          sso_provider_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          domain: string
          id: string
          sso_provider_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          domain?: string
          id?: string
          sso_provider_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sso_domains_sso_provider_id_fkey"
            columns: ["sso_provider_id"]
            isOneToOne: false
            referencedRelation: "sso_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      sso_providers: {
        Row: {
          created_at: string | null
          id: string
          resource_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          resource_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          resource_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          aud: string | null
          banned_until: string | null
          confirmation_sent_at: string | null
          confirmation_token: string | null
          confirmed_at: string | null
          created_at: string | null
          deleted_at: string | null
          email: string | null
          email_change: string | null
          email_change_confirm_status: number | null
          email_change_sent_at: string | null
          email_change_token_current: string | null
          email_change_token_new: string | null
          email_confirmed_at: string | null
          encrypted_password: string | null
          id: string
          instance_id: string | null
          invited_at: string | null
          is_anonymous: boolean
          is_sso_user: boolean
          is_super_admin: boolean | null
          last_sign_in_at: string | null
          phone: string | null
          phone_change: string | null
          phone_change_sent_at: string | null
          phone_change_token: string | null
          phone_confirmed_at: string | null
          raw_app_meta_data: Json | null
          raw_user_meta_data: Json | null
          reauthentication_sent_at: string | null
          reauthentication_token: string | null
          recovery_sent_at: string | null
          recovery_token: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          aud?: string | null
          banned_until?: string | null
          confirmation_sent_at?: string | null
          confirmation_token?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          email_change?: string | null
          email_change_confirm_status?: number | null
          email_change_sent_at?: string | null
          email_change_token_current?: string | null
          email_change_token_new?: string | null
          email_confirmed_at?: string | null
          encrypted_password?: string | null
          id: string
          instance_id?: string | null
          invited_at?: string | null
          is_anonymous?: boolean
          is_sso_user?: boolean
          is_super_admin?: boolean | null
          last_sign_in_at?: string | null
          phone?: string | null
          phone_change?: string | null
          phone_change_sent_at?: string | null
          phone_change_token?: string | null
          phone_confirmed_at?: string | null
          raw_app_meta_data?: Json | null
          raw_user_meta_data?: Json | null
          reauthentication_sent_at?: string | null
          reauthentication_token?: string | null
          recovery_sent_at?: string | null
          recovery_token?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          aud?: string | null
          banned_until?: string | null
          confirmation_sent_at?: string | null
          confirmation_token?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          email_change?: string | null
          email_change_confirm_status?: number | null
          email_change_sent_at?: string | null
          email_change_token_current?: string | null
          email_change_token_new?: string | null
          email_confirmed_at?: string | null
          encrypted_password?: string | null
          id?: string
          instance_id?: string | null
          invited_at?: string | null
          is_anonymous?: boolean
          is_sso_user?: boolean
          is_super_admin?: boolean | null
          last_sign_in_at?: string | null
          phone?: string | null
          phone_change?: string | null
          phone_change_sent_at?: string | null
          phone_change_token?: string | null
          phone_confirmed_at?: string | null
          raw_app_meta_data?: Json | null
          raw_user_meta_data?: Json | null
          reauthentication_sent_at?: string | null
          reauthentication_token?: string | null
          recovery_sent_at?: string | null
          recovery_token?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      email: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      jwt: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      uid: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      aal_level: "aal1" | "aal2" | "aal3"
      code_challenge_method: "s256" | "plain"
      factor_status: "unverified" | "verified"
      factor_type: "totp" | "webauthn" | "phone"
      one_time_token_type:
        | "confirmation_token"
        | "reauthentication_token"
        | "recovery_token"
        | "email_change_token_new"
        | "email_change_token_current"
        | "phone_change_token"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      collection_thoughts: {
        Row: {
          collection_id: string
          created_at: string
          id: string
          thought_id: string
        }
        Insert: {
          collection_id: string
          created_at?: string
          id?: string
          thought_id: string
        }
        Update: {
          collection_id?: string
          created_at?: string
          id?: string
          thought_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_thoughts_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_thoughts_thought_id_fkey"
            columns: ["thought_id"]
            isOneToOne: false
            referencedRelation: "thoughts"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          author_id: string | null
          created_at: string
          id: string
          title: string | null
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          author_id?: string | null
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          author_id?: string | null
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collections_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collections_organization_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_access_scopes: {
        Row: {
          created_at: string
          id: string
        }
        Insert: {
          created_at?: string
          id?: string
        }
        Update: {
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      integration_message_embeddings: {
        Row: {
          created_at: string
          embedding: string
          embedding_ver: string
          id: string
          index: number
          message_id: string
        }
        Insert: {
          created_at?: string
          embedding: string
          embedding_ver: string
          id?: string
          index: number
          message_id: string
        }
        Update: {
          created_at?: string
          embedding?: string
          embedding_ver?: string
          id?: string
          index?: number
          message_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_message_embeddings_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "integration_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_messages: {
        Row: {
          content: string | null
          created_at: string
          external_id: string
          id: string
          link_url: string | null
          organization: string
          sent_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          external_id: string
          id?: string
          link_url?: string | null
          organization: string
          sent_at: string
        }
        Update: {
          content?: string | null
          created_at?: string
          external_id?: string
          id?: string
          link_url?: string | null
          organization?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_messages_organization_fkey"
            columns: ["organization"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_setups: {
        Row: {
          created_at: string
          id: string
          last_synced_at: string | null
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_synced_at?: string | null
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          last_synced_at?: string | null
          type?: string
        }
        Relationships: []
      }
      note_contents: {
        Row: {
          content: string | null
          created_at: string
          id: string
          title: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          title?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "note_contents_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "thoughts"
            referencedColumns: ["id"]
          },
        ]
      }
      thought_chat_threads: {
        Row: {
          comment_id: string
          content: string
          created_at: string
          id: string
          is_applied: boolean
          is_loading_suggestion: boolean | null
          role: string
          suggestion: string | null
        }
        Insert: {
          comment_id: string
          content: string
          created_at?: string
          id?: string
          is_applied?: boolean
          is_loading_suggestion?: boolean | null
          role?: string
          suggestion?: string | null
        }
        Update: {
          comment_id?: string
          content?: string
          created_at?: string
          id?: string
          is_applied?: boolean
          is_loading_suggestion?: boolean | null
          role?: string
          suggestion?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "thought_chat_threads_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "thought_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      thought_chats: {
        Row: {
          action_prompt: string | null
          content: string | null
          created_at: string
          embedding: string | null
          id: string
          is_archived: boolean
          is_pinned: boolean
          is_seen: boolean
          is_thread_loading: boolean
          related_chunks: string[] | null
          role: string
          suggestion_index: number
          thought_id: string | null
          type: string
        }
        Insert: {
          action_prompt?: string | null
          content?: string | null
          created_at?: string
          embedding?: string | null
          id?: string
          is_archived?: boolean
          is_pinned?: boolean
          is_seen?: boolean
          is_thread_loading?: boolean
          related_chunks?: string[] | null
          role?: string
          suggestion_index?: number
          thought_id?: string | null
          type?: string
        }
        Update: {
          action_prompt?: string | null
          content?: string | null
          created_at?: string
          embedding?: string | null
          id?: string
          is_archived?: boolean
          is_pinned?: boolean
          is_seen?: boolean
          is_thread_loading?: boolean
          related_chunks?: string[] | null
          role?: string
          suggestion_index?: number
          thought_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "thought_chats_thought_id_fkey"
            columns: ["thought_id"]
            isOneToOne: false
            referencedRelation: "thoughts"
            referencedColumns: ["id"]
          },
        ]
      }
      thought_embedding_matches: {
        Row: {
          created_at: string
          id: string
          matched_by: string
          matches: string
          matches_thought_id: string
          similarity: number
          thought_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          matched_by: string
          matches: string
          matches_thought_id: string
          similarity?: number
          thought_id: string
        }
        Update: {
          created_at?: string
          id?: string
          matched_by?: string
          matches?: string
          matches_thought_id?: string
          similarity?: number
          thought_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "thought_embedding_matches_matched_by_fkey"
            columns: ["matched_by"]
            isOneToOne: false
            referencedRelation: "thought_embeddings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thought_embedding_matches_matches_fkey"
            columns: ["matches"]
            isOneToOne: false
            referencedRelation: "thought_embeddings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thought_embedding_matches_matches_thought_id_fkey"
            columns: ["matches_thought_id"]
            isOneToOne: false
            referencedRelation: "thoughts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thought_embedding_matches_thought_id_fkey"
            columns: ["thought_id"]
            isOneToOne: false
            referencedRelation: "thoughts"
            referencedColumns: ["id"]
          },
        ]
      }
      thought_embeddings: {
        Row: {
          created_at: string
          embedding: string
          hash: string
          id: string
          index: number
          thought_id: string
        }
        Insert: {
          created_at?: string
          embedding: string
          hash: string
          id?: string
          index: number
          thought_id: string
        }
        Update: {
          created_at?: string
          embedding?: string
          hash?: string
          id?: string
          index?: number
          thought_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "thought_embeddings_thought_id_fkey"
            columns: ["thought_id"]
            isOneToOne: false
            referencedRelation: "thoughts"
            referencedColumns: ["id"]
          },
        ]
      }
      thought_links: {
        Row: {
          created_at: string
          id: string
          linked_from: string
          linked_to: string
        }
        Insert: {
          created_at?: string
          id?: string
          linked_from: string
          linked_to: string
        }
        Update: {
          created_at?: string
          id?: string
          linked_from?: string
          linked_to?: string
        }
        Relationships: [
          {
            foreignKeyName: "thought_links_linked_from_fkey"
            columns: ["linked_from"]
            isOneToOne: false
            referencedRelation: "thoughts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thought_links_linked_to_fkey"
            columns: ["linked_to"]
            isOneToOne: false
            referencedRelation: "thoughts"
            referencedColumns: ["id"]
          },
        ]
      }
      thoughts: {
        Row: {
          author_id: string
          collection_suggestions: Json | null
          content: string | null
          content_md: string | null
          content_plaintext: string | null
          content_ts: string
          created_at: string
          embeddings_version: number
          id: string
          ignored_collection_suggestions: Json | null
          is_suggestion_paused: boolean
          last_suggestion_content_md: string | null
          signals: Json | null
          suggestion_index: number
          suggestion_status: string
          title: string | null
          title_ts: string
          updated_at: string
          user_intent: string | null
          workspace_id: string | null
        }
        Insert: {
          author_id?: string
          collection_suggestions?: Json | null
          content?: string | null
          content_md?: string | null
          content_plaintext?: string | null
          content_ts?: string
          created_at?: string
          embeddings_version?: number
          id?: string
          ignored_collection_suggestions?: Json | null
          is_suggestion_paused?: boolean
          last_suggestion_content_md?: string | null
          signals?: Json | null
          suggestion_index?: number
          suggestion_status?: string
          title?: string | null
          title_ts?: string
          updated_at?: string
          user_intent?: string | null
          workspace_id?: string | null
        }
        Update: {
          author_id?: string
          collection_suggestions?: Json | null
          content?: string | null
          content_md?: string | null
          content_plaintext?: string | null
          content_ts?: string
          created_at?: string
          embeddings_version?: number
          id?: string
          ignored_collection_suggestions?: Json | null
          is_suggestion_paused?: boolean
          last_suggestion_content_md?: string | null
          signals?: Json | null
          suggestion_index?: number
          suggestion_status?: string
          title?: string | null
          title_ts?: string
          updated_at?: string
          user_intent?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "thoughts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thoughts_organization_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      topic_message_matches: {
        Row: {
          created_at: string
          id: string
          message_id: string | null
          topic_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message_id?: string | null
          topic_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message_id?: string | null
          topic_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "topic_message_matches_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "integration_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topic_message_matches_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          created_at: string
          id: string
          organization: string
          query: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization: string
          query: string
        }
        Update: {
          created_at?: string
          id?: string
          organization?: string
          query?: string
        }
        Relationships: [
          {
            foreignKeyName: "topics_organization_fkey"
            columns: ["organization"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      user_pending_invites: {
        Row: {
          created_at: string
          id: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_pending_invites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_pending_invites_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string | null
          id: string
          is_pending: boolean | null
          name: string | null
          options: Json
          stripe_customer_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          is_pending?: boolean | null
          name?: string | null
          options?: Json
          stripe_customer_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          is_pending?: boolean | null
          name?: string | null
          options?: Json
          stripe_customer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_users: {
        Row: {
          created_at: string
          id: string
          role: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_users_organization_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          stripe_customer_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug?: string
          stripe_customer_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          stripe_customer_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize:
        | {
            Args: {
              "": string
            }
            Returns: unknown
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
      halfvec_avg: {
        Args: {
          "": number[]
        }
        Returns: unknown
      }
      halfvec_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      halfvec_send: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
      hnsw_bit_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnswhandler: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflathandler: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      l2_norm:
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
      l2_normalize:
        | {
            Args: {
              "": string
            }
            Returns: string
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
      match_thought_chats: {
        Args: {
          query_embedding: string
          match_threshold: number
          match_count: number
          thought_id: string
        }
        Returns: {
          action_prompt: string | null
          content: string | null
          created_at: string
          embedding: string | null
          id: string
          is_archived: boolean
          is_pinned: boolean
          is_seen: boolean
          is_thread_loading: boolean
          related_chunks: string[] | null
          role: string
          suggestion_index: number
          thought_id: string | null
          type: string
        }[]
      }
      match_thought_chunks: {
        Args: {
          query_embedding: string
          match_threshold: number
          match_count: number
          exclude_thought_id: string
          input_workspace_id: string
        }
        Returns: {
          id: string
          thought_id: string
          similarity: number
        }[]
      }
      match_thoughts:
        | {
            Args: {
              query_embedding: string
              match_threshold: number
              match_count: number
              author_id: string
            }
            Returns: {
              thought_id: string
              similarity: number
            }[]
          }
        | {
            Args: {
              query_embedding: string
              match_threshold: number
              match_count: number
              author_id: string
              collection_id: string
            }
            Returns: {
              thought_id: string
              similarity: number
            }[]
          }
      multi_embedding_search: {
        Args: {
          query_embeddings: string[]
          match_threshold: number
          max_results: number
        }
        Returns: {
          message_id: string
          similarity_score: number
        }[]
      }
      search_thoughts: {
        Args: {
          search_query: string
          p_workspace_id: string
        }
        Returns: {
          thought_id: string
          thought_title: string
          thought_content_md: string
          thought_content_plaintext: string
          thought_updated_at: string
        }[]
      }
      sparsevec_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      sparsevec_send: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
      update_thought_embedding_matches: {
        Args: {
          p_thought_id: string
          p_match_pairs: Json
        }
        Returns: {
          created_at: string
          id: string
          matched_by: string
          matches: string
          matches_thought_id: string
          similarity: number
          thought_id: string
        }[]
      }
      vector_avg: {
        Args: {
          "": number[]
        }
        Returns: string
      }
      vector_dims:
        | {
            Args: {
              "": string
            }
            Returns: number
          }
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
      vector_norm: {
        Args: {
          "": string
        }
        Returns: number
      }
      vector_out: {
        Args: {
          "": string
        }
        Returns: unknown
      }
      vector_send: {
        Args: {
          "": string
        }
        Returns: string
      }
      vector_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

