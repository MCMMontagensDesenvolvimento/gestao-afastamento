export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      afastamento_andamentos: {
        Row: {
          afastamento_id: string
          created_at: string
          data_andamento: string
          data_proxima_acao: string | null
          descricao: string
          id: string
          proxima_acao: string | null
          tipo_andamento_id: string
          updated_at: string
        }
        Insert: {
          afastamento_id: string
          created_at?: string
          data_andamento: string
          data_proxima_acao?: string | null
          descricao: string
          id?: string
          proxima_acao?: string | null
          tipo_andamento_id: string
          updated_at?: string
        }
        Update: {
          afastamento_id?: string
          created_at?: string
          data_andamento?: string
          data_proxima_acao?: string | null
          descricao?: string
          id?: string
          proxima_acao?: string | null
          tipo_andamento_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "afastamento_andamentos_afastamento_id_fkey"
            columns: ["afastamento_id"]
            isOneToOne: false
            referencedRelation: "afastamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "afastamento_andamentos_tipo_andamento_id_fkey"
            columns: ["tipo_andamento_id"]
            isOneToOne: false
            referencedRelation: "tipos_andamento_afastamento"
            referencedColumns: ["id"]
          },
        ]
      }
      afastamento_documentos: {
        Row: {
          afastamento_id: string
          andamento_id: string | null
          created_at: string
          data_documento: string
          id: string
          nome_arquivo: string
          storage_path: string
          tipo_documento_id: string
        }
        Insert: {
          afastamento_id: string
          andamento_id?: string | null
          created_at?: string
          data_documento: string
          id?: string
          nome_arquivo: string
          storage_path: string
          tipo_documento_id: string
        }
        Update: {
          afastamento_id?: string
          andamento_id?: string | null
          created_at?: string
          data_documento?: string
          id?: string
          nome_arquivo?: string
          storage_path?: string
          tipo_documento_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "afastamento_documentos_afastamento_id_fkey"
            columns: ["afastamento_id"]
            isOneToOne: false
            referencedRelation: "afastamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "afastamento_documentos_andamento_id_fkey"
            columns: ["andamento_id"]
            isOneToOne: false
            referencedRelation: "afastamento_andamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "afastamento_documentos_tipo_documento_id_fkey"
            columns: ["tipo_documento_id"]
            isOneToOne: false
            referencedRelation: "tipos_documento_afastamento"
            referencedColumns: ["id"]
          },
        ]
      }
      afastamentos: {
        Row: {
          causa_cid: string | null
          colaborador_id: string
          created_at: string
          data_afastamento: string
          data_aposentadoria: string | null
          data_fim_beneficio: string | null
          data_inicio_beneficio: string | null
          data_retorno_efetivo: string | null
          data_retorno_previsto: string | null
          funcao_id: string | null
          id: string
          obra_id: string | null
          observacoes: string | null
          situacao_afastamento_id: string
          tipo_beneficio_id: string | null
          updated_at: string
        }
        Insert: {
          causa_cid?: string | null
          colaborador_id: string
          created_at?: string
          data_afastamento: string
          data_aposentadoria?: string | null
          data_fim_beneficio?: string | null
          data_inicio_beneficio?: string | null
          data_retorno_efetivo?: string | null
          data_retorno_previsto?: string | null
          funcao_id?: string | null
          id?: string
          obra_id?: string | null
          observacoes?: string | null
          situacao_afastamento_id: string
          tipo_beneficio_id?: string | null
          updated_at?: string
        }
        Update: {
          causa_cid?: string | null
          colaborador_id?: string
          created_at?: string
          data_afastamento?: string
          data_aposentadoria?: string | null
          data_fim_beneficio?: string | null
          data_inicio_beneficio?: string | null
          data_retorno_efetivo?: string | null
          data_retorno_previsto?: string | null
          funcao_id?: string | null
          id?: string
          obra_id?: string | null
          observacoes?: string | null
          situacao_afastamento_id?: string
          tipo_beneficio_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "afastamentos_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "afastamentos_funcao_id_fkey"
            columns: ["funcao_id"]
            isOneToOne: false
            referencedRelation: "funcoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "afastamentos_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "afastamentos_situacao_afastamento_id_fkey"
            columns: ["situacao_afastamento_id"]
            isOneToOne: false
            referencedRelation: "situacoes_afastamento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "afastamentos_tipo_beneficio_id_fkey"
            columns: ["tipo_beneficio_id"]
            isOneToOne: false
            referencedRelation: "tipos_beneficio"
            referencedColumns: ["id"]
          },
        ]
      }
      colaboradores: {
        Row: {
          ativo: boolean
          codigo_interno: string
          contato: string | null
          created_at: string
          data_admissao: string | null
          data_nascimento: string | null
          funcao_id: string | null
          id: string
          nome: string
          obra_id: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          codigo_interno?: string
          contato?: string | null
          created_at?: string
          data_admissao?: string | null
          data_nascimento?: string | null
          funcao_id?: string | null
          id?: string
          nome: string
          obra_id?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          codigo_interno?: string
          contato?: string | null
          created_at?: string
          data_admissao?: string | null
          data_nascimento?: string | null
          funcao_id?: string | null
          id?: string
          nome?: string
          obra_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "colaboradores_funcao_id_fkey"
            columns: ["funcao_id"]
            isOneToOne: false
            referencedRelation: "funcoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "colaboradores_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      funcoes: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      obras: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      situacoes_afastamento: {
        Row: {
          ativo: boolean
          classificacao_sistema: string
          created_at: string
          id: string
          nome: string
          ordem_exibicao: number
        }
        Insert: {
          ativo?: boolean
          classificacao_sistema: string
          created_at?: string
          id?: string
          nome: string
          ordem_exibicao?: number
        }
        Update: {
          ativo?: boolean
          classificacao_sistema?: string
          created_at?: string
          id?: string
          nome?: string
          ordem_exibicao?: number
        }
        Relationships: []
      }
      tipos_andamento_afastamento: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
          ordem_exibicao: number
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
          ordem_exibicao?: number
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
          ordem_exibicao?: number
        }
        Relationships: []
      }
      tipos_beneficio: {
        Row: {
          ativo: boolean
          codigo: string | null
          created_at: string
          id: string
          nome: string
          ordem_exibicao: number
        }
        Insert: {
          ativo?: boolean
          codigo?: string | null
          created_at?: string
          id?: string
          nome: string
          ordem_exibicao?: number
        }
        Update: {
          ativo?: boolean
          codigo?: string | null
          created_at?: string
          id?: string
          nome?: string
          ordem_exibicao?: number
        }
        Relationships: []
      }
      tipos_documento_afastamento: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
          ordem_exibicao: number
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
          ordem_exibicao?: number
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
          ordem_exibicao?: number
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
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
