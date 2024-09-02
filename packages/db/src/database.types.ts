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
        }
        Insert: {
          author_id?: string | null
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collections_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
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
          role: string
          suggestion: string | null
        }
        Insert: {
          comment_id: string
          content: string
          created_at?: string
          id?: string
          is_applied?: boolean
          role?: string
          suggestion?: string | null
        }
        Update: {
          comment_id?: string
          content?: string
          created_at?: string
          id?: string
          is_applied?: boolean
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
          thought_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          matched_by: string
          matches: string
          thought_id: string
        }
        Update: {
          created_at?: string
          id?: string
          matched_by?: string
          matches?: string
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
      thoughts: {
        Row: {
          author_id: string
          content: string | null
          content_md: string | null
          content_ts: string
          created_at: string
          embeddings_version: number
          id: string
          is_suggestion_paused: boolean
          last_suggestion_content_md: string | null
          signals: Json | null
          suggested_goal: string | null
          suggestion_index: number
          suggestion_status: string
          title: string | null
          title_ts: string
          updated_at: string
          user_intent: string | null
        }
        Insert: {
          author_id?: string
          content?: string | null
          content_md?: string | null
          content_ts?: string
          created_at?: string
          embeddings_version?: number
          id?: string
          is_suggestion_paused?: boolean
          last_suggestion_content_md?: string | null
          signals?: Json | null
          suggested_goal?: string | null
          suggestion_index?: number
          suggestion_status?: string
          title?: string | null
          title_ts?: string
          updated_at?: string
          user_intent?: string | null
        }
        Update: {
          author_id?: string
          content?: string | null
          content_md?: string | null
          content_ts?: string
          created_at?: string
          embeddings_version?: number
          id?: string
          is_suggestion_paused?: boolean
          last_suggestion_content_md?: string | null
          signals?: Json | null
          suggested_goal?: string | null
          suggestion_index?: number
          suggestion_status?: string
          title?: string | null
          title_ts?: string
          updated_at?: string
          user_intent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "thoughts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          id: string
          name: string | null
          stripe_customer_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string | null
          stripe_customer_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string | null
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
          input_author_id: string
        }
        Returns: {
          created_at: string
          embedding: string
          hash: string
          id: string
          index: number
          thought_id: string
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

