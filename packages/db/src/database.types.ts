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
      _github_pending_installations: {
        Row: {
          created_at: string
          id: number
          payload: Json
        }
        Insert: {
          created_at?: string
          id?: number
          payload: Json
        }
        Update: {
          created_at?: string
          id?: number
          payload?: Json
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          applied_suggestion_hashes: string[]
          completed_at: string | null
          content: string
          created_at: string
          file_references: Json | null
          id: string
          role: string
          selection_text: string | null
          thread_id: string
          user_id: string | null
        }
        Insert: {
          applied_suggestion_hashes?: string[]
          completed_at?: string | null
          content: string
          created_at?: string
          file_references?: Json | null
          id?: string
          role?: string
          selection_text?: string | null
          thread_id: string
          user_id?: string | null
        }
        Update: {
          applied_suggestion_hashes?: string[]
          completed_at?: string | null
          content?: string
          created_at?: string
          file_references?: Json | null
          id?: string
          role?: string
          selection_text?: string | null
          thread_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_threads: {
        Row: {
          created_at: string
          document_id: string | null
          document_update_id: string | null
          id: string
          is_default: boolean
          parent_id: string | null
          type: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          document_id?: string | null
          document_update_id?: string | null
          id?: string
          is_default?: boolean
          parent_id?: string | null
          type?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          document_id?: string | null
          document_update_id?: string | null
          id?: string
          is_default?: boolean
          parent_id?: string | null
          type?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_threads_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "thoughts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_threads_document_update_id_fkey"
            columns: ["document_update_id"]
            isOneToOne: false
            referencedRelation: "document_updates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_threads_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_threads_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_thoughts: {
        Row: {
          collection_id: string
          created_at: string
          id: string
          thought_id: string
          workspace_id: string
        }
        Insert: {
          collection_id: string
          created_at?: string
          id?: string
          thought_id: string
          workspace_id: string
        }
        Update: {
          collection_id?: string
          created_at?: string
          id?: string
          thought_id?: string
          workspace_id?: string
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
          {
            foreignKeyName: "fk_collection_thoughts_workspace"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          author_id: string | null
          created_at: string
          id: string
          intent_embedding: string | null
          is_auto: boolean
          parent_collection_id: string | null
          summary: Json | null
          summary_updated_at: string | null
          title: string | null
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          author_id?: string | null
          created_at?: string
          id?: string
          intent_embedding?: string | null
          is_auto?: boolean
          parent_collection_id?: string | null
          summary?: Json | null
          summary_updated_at?: string | null
          title?: string | null
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          author_id?: string | null
          created_at?: string
          id?: string
          intent_embedding?: string | null
          is_auto?: boolean
          parent_collection_id?: string | null
          summary?: Json | null
          summary_updated_at?: string | null
          title?: string | null
          updated_at?: string
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
          {
            foreignKeyName: "collections_parent_collection_id_fkey"
            columns: ["parent_collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
        ]
      }
      document_repo_links: {
        Row: {
          branch: string | null
          created_at: string
          document_id: string
          id: string
          path: string
          repo_connection_id: string
          type: string
        }
        Insert: {
          branch?: string | null
          created_at?: string
          document_id: string
          id?: string
          path: string
          repo_connection_id: string
          type: string
        }
        Update: {
          branch?: string | null
          created_at?: string
          document_id?: string
          id?: string
          path?: string
          repo_connection_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_file_links_doc_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "thoughts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_file_links_repo_connection_id_fkey"
            columns: ["repo_connection_id"]
            isOneToOne: false
            referencedRelation: "repository_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      document_shares: {
        Row: {
          created_at: string
          document_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_shares_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "thoughts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_shares_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      document_update_links: {
        Row: {
          created_at: string
          document_update_id: string
          id: string
          repo_link_id: string
        }
        Insert: {
          created_at?: string
          document_update_id: string
          id?: string
          repo_link_id: string
        }
        Update: {
          created_at?: string
          document_update_id?: string
          id?: string
          repo_link_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_update_links_document_update_id_fkey"
            columns: ["document_update_id"]
            isOneToOne: false
            referencedRelation: "document_updates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_update_links_repo_link_id_fkey"
            columns: ["repo_link_id"]
            isOneToOne: false
            referencedRelation: "document_repo_links"
            referencedColumns: ["id"]
          },
        ]
      }
      document_updates: {
        Row: {
          commit_sha: string
          document_id: string
          generation_completed_at: string | null
          id: string
          repo_connection_id: string
          triggered_at: string
        }
        Insert: {
          commit_sha: string
          document_id: string
          generation_completed_at?: string | null
          id?: string
          repo_connection_id: string
          triggered_at?: string
        }
        Update: {
          commit_sha?: string
          document_id?: string
          generation_completed_at?: string | null
          id?: string
          repo_connection_id?: string
          triggered_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_updates_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "thoughts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_updates_repo_connection_id_fkey"
            columns: ["repo_connection_id"]
            isOneToOne: false
            referencedRelation: "repository_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      document_versions: {
        Row: {
          content_html: string
          content_json: Json
          content_md: string
          created_at: string
          document_id: string
          id: string
          published_by: string
          title: string
        }
        Insert: {
          content_html: string
          content_json: Json
          content_md: string
          created_at?: string
          document_id: string
          id?: string
          published_by: string
          title?: string
        }
        Update: {
          content_html?: string
          content_json?: Json
          content_md?: string
          created_at?: string
          document_id?: string
          id?: string
          published_by?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_version_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "thoughts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_version_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      folders: {
        Row: {
          access_strategy: string | null
          created_at: string
          id: string
          index: number | null
          is_root: boolean
          name: string | null
          parent_id: string | null
          project_id: string | null
          workspace_id: string
        }
        Insert: {
          access_strategy?: string | null
          created_at?: string
          id?: string
          index?: number | null
          is_root?: boolean
          name?: string | null
          parent_id?: string | null
          project_id?: string | null
          workspace_id: string
        }
        Update: {
          access_strategy?: string | null
          created_at?: string
          id?: string
          index?: number | null
          is_root?: boolean
          name?: string | null
          parent_id?: string | null
          project_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folders_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
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
      projects: {
        Row: {
          connections: Json
          created_at: string
          id: string
          name: string
          slug: string
          workspace_id: string
        }
        Insert: {
          connections?: Json
          created_at?: string
          id?: string
          name: string
          slug: string
          workspace_id: string
        }
        Update: {
          connections?: Json
          created_at?: string
          id?: string
          name?: string
          slug?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      repository_connections: {
        Row: {
          created_at: string
          default_branch: string
          external_id: string
          id: string
          installation_id: string
          name: string
          owner: string
          project_id: string
          provider: string
        }
        Insert: {
          created_at?: string
          default_branch?: string
          external_id: string
          id?: string
          installation_id: string
          name: string
          owner: string
          project_id: string
          provider: string
        }
        Update: {
          created_at?: string
          default_branch?: string
          external_id?: string
          id?: string
          installation_id?: string
          name?: string
          owner?: string
          project_id?: string
          provider?: string
        }
        Relationships: [
          {
            foreignKeyName: "repository_connections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      thought_attachments: {
        Row: {
          created_at: string
          id: string
          path: string
          thought_id: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          path: string
          thought_id?: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          path?: string
          thought_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "thought_attachments_thought_id_fkey"
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
          access_strategy: string
          author_id: string
          collection_suggestions: Json | null
          content: string | null
          content_json: Json | null
          content_md: string | null
          content_plaintext: string | null
          content_ts: string
          created_at: string
          disable_title_suggestions: boolean | null
          embeddings_version: number
          folder_id: string | null
          generated_at: string | null
          generated_intents: string[]
          generated_summary: string | null
          generated_summary_content_md: string | null
          generated_type: string | null
          generation_prompt: string | null
          id: string
          ignored_collection_suggestions: Json | null
          index: number | null
          is_suggestion_paused: boolean
          last_suggestion_content_md: string | null
          latest_version_id: string | null
          project_id: string | null
          signals: Json | null
          suggestion_index: number
          suggestion_status: string
          title: string | null
          title_suggestion: string | null
          title_suggestion_content_md: string | null
          title_ts: string
          updated_at: string
          user_intent: string | null
          workspace_id: string
        }
        Insert: {
          access_strategy?: string
          author_id?: string
          collection_suggestions?: Json | null
          content?: string | null
          content_json?: Json | null
          content_md?: string | null
          content_plaintext?: string | null
          content_ts?: string
          created_at?: string
          disable_title_suggestions?: boolean | null
          embeddings_version?: number
          folder_id?: string | null
          generated_at?: string | null
          generated_intents?: string[]
          generated_summary?: string | null
          generated_summary_content_md?: string | null
          generated_type?: string | null
          generation_prompt?: string | null
          id?: string
          ignored_collection_suggestions?: Json | null
          index?: number | null
          is_suggestion_paused?: boolean
          last_suggestion_content_md?: string | null
          latest_version_id?: string | null
          project_id?: string | null
          signals?: Json | null
          suggestion_index?: number
          suggestion_status?: string
          title?: string | null
          title_suggestion?: string | null
          title_suggestion_content_md?: string | null
          title_ts?: string
          updated_at?: string
          user_intent?: string | null
          workspace_id: string
        }
        Update: {
          access_strategy?: string
          author_id?: string
          collection_suggestions?: Json | null
          content?: string | null
          content_json?: Json | null
          content_md?: string | null
          content_plaintext?: string | null
          content_ts?: string
          created_at?: string
          disable_title_suggestions?: boolean | null
          embeddings_version?: number
          folder_id?: string | null
          generated_at?: string | null
          generated_intents?: string[]
          generated_summary?: string | null
          generated_summary_content_md?: string | null
          generated_type?: string | null
          generation_prompt?: string | null
          id?: string
          ignored_collection_suggestions?: Json | null
          index?: number | null
          is_suggestion_paused?: boolean
          last_suggestion_content_md?: string | null
          latest_version_id?: string | null
          project_id?: string | null
          signals?: Json | null
          suggestion_index?: number
          suggestion_status?: string
          title?: string | null
          title_suggestion?: string | null
          title_suggestion_content_md?: string | null
          title_ts?: string
          updated_at?: string
          user_intent?: string | null
          workspace_id?: string
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
            foreignKeyName: "thoughts_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thoughts_latest_version_id_fkey"
            columns: ["latest_version_id"]
            isOneToOne: false
            referencedRelation: "document_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thoughts_organization_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thoughts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
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
      workspace_github_connections: {
        Row: {
          created_at: string
          id: string
          installation_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          installation_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          installation_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_github_connections_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_memories: {
        Row: {
          mission_blurb: string | null
          workspace_id: string
        }
        Insert: {
          mission_blurb?: string | null
          workspace_id: string
        }
        Update: {
          mission_blurb?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_memories_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
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
          folders_migrated_at: string | null
          id: string
          name: string
          onboarding_status: string
          slug: string
          stripe_customer_id: string | null
        }
        Insert: {
          created_at?: string
          folders_migrated_at?: string | null
          id?: string
          name: string
          onboarding_status?: string
          slug?: string
          stripe_customer_id?: string | null
        }
        Update: {
          created_at?: string
          folders_migrated_at?: string | null
          id?: string
          name?: string
          onboarding_status?: string
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
      check_thought_access: {
        Args: {
          thought_id: string
          user_id: string
        }
        Returns: boolean
      }
      check_workspace_membership: {
        Args: {
          workspace_id: string
          user_id: string
        }
        Returns: boolean
      }
      generate_hmac: {
        Args: {
          secret_key: string
          payload: string
        }
        Returns: string
      }
      get_collection_parents: {
        Args: {
          collection_id: string
        }
        Returns: {
          id: string
          title: string
        }[]
      }
      get_folder_ancestors: {
        Args: {
          folder_id: string
        }
        Returns: {
          id: string
          name: string
          parent_id: string
          depth: number
          access_strategy: string
        }[]
      }
      get_folder_children_count: {
        Args: {
          p_folder_id: string
        }
        Returns: number
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
      search_docs: {
        Args: {
          search_query: string
          p_workspace_id: string
        }
        Returns: {
          doc_id: string
          doc_title: string
          doc_content_md: string
          doc_content_plaintext: string
          doc_updated_at: string
          doc_project_id: string
          project_name: string
          project_slug: string
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

