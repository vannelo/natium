export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: { extensions?: Json; operationName?: string; query?: string; variables?: Json }
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
  public: {
    Tables: {
      athlete_custom_values: {
        Row: {
          athlete_id: string
          field_id: string
          updated_at: string
          value: Json | null
        }
        ComputedFields: never
        Insert: {
          athlete_id: string
          field_id: string
          updated_at?: string
          value?: Json | null
        }
        Update: {
          athlete_id?: string
          field_id?: string
          updated_at?: string
          value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: 'athlete_custom_values_athlete_id_fkey'
            columns: ['athlete_id']
            isOneToOne: false
            referencedRelation: 'athletes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'athlete_custom_values_field_id_fkey'
            columns: ['field_id']
            isOneToOne: false
            referencedRelation: 'competition_custom_fields'
            referencedColumns: ['id']
          },
        ]
      }
      athlete_marks: {
        Row: {
          athlete_id: string
          competition_id: string | null
          created_at: string
          created_by: string | null
          event_catalog_id: string
          id: string
          pool_course: Database['public']['Enums']['pool_course']
          recorded_at: string
          source: Database['public']['Enums']['mark_source']
          time_cs: number
        }
        ComputedFields: never
        Insert: {
          athlete_id: string
          competition_id?: string | null
          created_at?: string
          created_by?: string | null
          event_catalog_id: string
          id?: string
          pool_course: Database['public']['Enums']['pool_course']
          recorded_at?: string
          source?: Database['public']['Enums']['mark_source']
          time_cs: number
        }
        Update: {
          athlete_id?: string
          competition_id?: string | null
          created_at?: string
          created_by?: string | null
          event_catalog_id?: string
          id?: string
          pool_course?: Database['public']['Enums']['pool_course']
          recorded_at?: string
          source?: Database['public']['Enums']['mark_source']
          time_cs?: number
        }
        Relationships: [
          {
            foreignKeyName: 'athlete_marks_athlete_id_fkey'
            columns: ['athlete_id']
            isOneToOne: false
            referencedRelation: 'athletes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'athlete_marks_competition_id_fkey'
            columns: ['competition_id']
            isOneToOne: false
            referencedRelation: 'competitions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'athlete_marks_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'athlete_marks_event_catalog_id_fkey'
            columns: ['event_catalog_id']
            isOneToOne: false
            referencedRelation: 'event_catalog'
            referencedColumns: ['id']
          },
        ]
      }
      athlete_team_memberships: {
        Row: {
          athlete_id: string
          id: string
          joined_at: string
          left_at: string | null
          team_id: string
        }
        ComputedFields: never
        Insert: {
          athlete_id: string
          id?: string
          joined_at?: string
          left_at?: string | null
          team_id: string
        }
        Update: {
          athlete_id?: string
          id?: string
          joined_at?: string
          left_at?: string | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'athlete_team_memberships_athlete_id_fkey'
            columns: ['athlete_id']
            isOneToOne: false
            referencedRelation: 'athletes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'athlete_team_memberships_team_id_fkey'
            columns: ['team_id']
            isOneToOne: false
            referencedRelation: 'teams'
            referencedColumns: ['id']
          },
        ]
      }
      athletes: {
        Row: {
          birth_date: string
          created_at: string
          created_by: string
          display_id: string
          first_name: string
          id: string
          last_name: string
          name_normalized: string
          photo_path: string | null
          sex: Database['public']['Enums']['athlete_sex']
          status: Database['public']['Enums']['record_status']
          team_id: string
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          birth_date: string
          created_at?: string
          created_by: string
          display_id?: string
          first_name: string
          id?: string
          last_name: string
          name_normalized?: string
          photo_path?: string | null
          sex: Database['public']['Enums']['athlete_sex']
          status?: Database['public']['Enums']['record_status']
          team_id: string
          updated_at?: string
        }
        Update: {
          birth_date?: string
          created_at?: string
          created_by?: string
          display_id?: string
          first_name?: string
          id?: string
          last_name?: string
          name_normalized?: string
          photo_path?: string | null
          sex?: Database['public']['Enums']['athlete_sex']
          status?: Database['public']['Enums']['record_status']
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'athletes_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'athletes_team_id_fkey'
            columns: ['team_id']
            isOneToOne: false
            referencedRelation: 'teams'
            referencedColumns: ['id']
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity: string
          entity_id: string | null
          id: number
          metadata: Json | null
        }
        ComputedFields: never
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: never
          metadata?: Json | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: never
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: 'audit_logs_actor_id_fkey'
            columns: ['actor_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      competition_categories: {
        Row: {
          code: string | null
          competition_id: string
          id: string
          max_age: number
          min_age: number
          name: string
          sex: Database['public']['Enums']['athlete_sex'] | null
          sort_order: number
        }
        ComputedFields: never
        Insert: {
          code?: string | null
          competition_id: string
          id?: string
          max_age?: number
          min_age?: number
          name: string
          sex?: Database['public']['Enums']['athlete_sex'] | null
          sort_order?: number
        }
        Update: {
          code?: string | null
          competition_id?: string
          id?: string
          max_age?: number
          min_age?: number
          name?: string
          sex?: Database['public']['Enums']['athlete_sex'] | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: 'competition_categories_competition_id_fkey'
            columns: ['competition_id']
            isOneToOne: false
            referencedRelation: 'competitions'
            referencedColumns: ['id']
          },
        ]
      }
      competition_custom_fields: {
        Row: {
          competition_id: string
          field_type: Database['public']['Enums']['custom_field_type']
          id: string
          is_required: boolean
          justification: string | null
          key: string
          label: string
          options: Json | null
          sort_order: number
          validation: Json | null
        }
        ComputedFields: never
        Insert: {
          competition_id: string
          field_type?: Database['public']['Enums']['custom_field_type']
          id?: string
          is_required?: boolean
          justification?: string | null
          key: string
          label: string
          options?: Json | null
          sort_order?: number
          validation?: Json | null
        }
        Update: {
          competition_id?: string
          field_type?: Database['public']['Enums']['custom_field_type']
          id?: string
          is_required?: boolean
          justification?: string | null
          key?: string
          label?: string
          options?: Json | null
          sort_order?: number
          validation?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: 'competition_custom_fields_competition_id_fkey'
            columns: ['competition_id']
            isOneToOne: false
            referencedRelation: 'competitions'
            referencedColumns: ['id']
          },
        ]
      }
      competition_events: {
        Row: {
          category_id: string | null
          competition_id: string
          event_catalog_id: string
          event_number: number | null
          external_code: string | null
          id: string
          is_active: boolean
          sex: Database['public']['Enums']['athlete_sex'] | null
          sort_order: number
        }
        ComputedFields: never
        Insert: {
          category_id?: string | null
          competition_id: string
          event_catalog_id: string
          event_number?: number | null
          external_code?: string | null
          id?: string
          is_active?: boolean
          sex?: Database['public']['Enums']['athlete_sex'] | null
          sort_order?: number
        }
        Update: {
          category_id?: string | null
          competition_id?: string
          event_catalog_id?: string
          event_number?: number | null
          external_code?: string | null
          id?: string
          is_active?: boolean
          sex?: Database['public']['Enums']['athlete_sex'] | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: 'competition_events_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'competition_categories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'competition_events_competition_id_fkey'
            columns: ['competition_id']
            isOneToOne: false
            referencedRelation: 'competitions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'competition_events_event_catalog_id_fkey'
            columns: ['event_catalog_id']
            isOneToOne: false
            referencedRelation: 'event_catalog'
            referencedColumns: ['id']
          },
        ]
      }
      competitions: {
        Row: {
          age_reference_date: string | null
          allow_no_time: boolean
          city: string | null
          code: string
          created_at: string
          created_by: string
          description: string | null
          end_date: string
          folio_seq: number
          id: string
          max_entries_per_athlete: number | null
          name: string
          organization_id: string
          pool_course: Database['public']['Enums']['pool_course']
          pool_length_m: number
          registration_closes_at: string
          registration_opens_at: string
          requirements: string | null
          start_date: string
          status: Database['public']['Enums']['competition_status']
          updated_at: string
          venue: string | null
        }
        ComputedFields: never
        Insert: {
          age_reference_date?: string | null
          allow_no_time?: boolean
          city?: string | null
          code: string
          created_at?: string
          created_by: string
          description?: string | null
          end_date: string
          folio_seq?: number
          id?: string
          max_entries_per_athlete?: number | null
          name: string
          organization_id: string
          pool_course?: Database['public']['Enums']['pool_course']
          pool_length_m?: number
          registration_closes_at: string
          registration_opens_at: string
          requirements?: string | null
          start_date: string
          status?: Database['public']['Enums']['competition_status']
          updated_at?: string
          venue?: string | null
        }
        Update: {
          age_reference_date?: string | null
          allow_no_time?: boolean
          city?: string | null
          code?: string
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string
          folio_seq?: number
          id?: string
          max_entries_per_athlete?: number | null
          name?: string
          organization_id?: string
          pool_course?: Database['public']['Enums']['pool_course']
          pool_length_m?: number
          registration_closes_at?: string
          registration_opens_at?: string
          requirements?: string | null
          start_date?: string
          status?: Database['public']['Enums']['competition_status']
          updated_at?: string
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'competitions_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'competitions_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      event_catalog: {
        Row: {
          created_at: string
          distance_m: number
          external_code: string | null
          id: string
          is_active: boolean
          is_relay: boolean
          name: string
          sort_order: number
          stroke: Database['public']['Enums']['stroke']
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          distance_m: number
          external_code?: string | null
          id?: string
          is_active?: boolean
          is_relay?: boolean
          name: string
          sort_order?: number
          stroke: Database['public']['Enums']['stroke']
        }
        Update: {
          created_at?: string
          distance_m?: number
          external_code?: string | null
          id?: string
          is_active?: boolean
          is_relay?: boolean
          name?: string
          sort_order?: number
          stroke?: Database['public']['Enums']['stroke']
        }
        Relationships: []
      }
      export_job_items: {
        Row: {
          export_job_id: string
          id: string
          message: string | null
          registration_id: string
          status: string
        }
        ComputedFields: never
        Insert: {
          export_job_id: string
          id?: string
          message?: string | null
          registration_id: string
          status?: string
        }
        Update: {
          export_job_id?: string
          id?: string
          message?: string | null
          registration_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: 'export_job_items_export_job_id_fkey'
            columns: ['export_job_id']
            isOneToOne: false
            referencedRelation: 'export_jobs'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'export_job_items_registration_id_fkey'
            columns: ['registration_id']
            isOneToOne: false
            referencedRelation: 'registrations'
            referencedColumns: ['id']
          },
        ]
      }
      export_jobs: {
        Row: {
          competition_id: string
          completed_at: string | null
          created_at: string
          error_report: NonNullable<Json>
          export_profile_id: string | null
          file_path: string | null
          id: string
          requested_by: string
          status: Database['public']['Enums']['export_status']
          team_id: string | null
          version: number
        }
        ComputedFields: never
        Insert: {
          competition_id: string
          completed_at?: string | null
          created_at?: string
          error_report?: NonNullable<Json>
          export_profile_id?: string | null
          file_path?: string | null
          id?: string
          requested_by: string
          status?: Database['public']['Enums']['export_status']
          team_id?: string | null
          version?: number
        }
        Update: {
          competition_id?: string
          completed_at?: string | null
          created_at?: string
          error_report?: NonNullable<Json>
          export_profile_id?: string | null
          file_path?: string | null
          id?: string
          requested_by?: string
          status?: Database['public']['Enums']['export_status']
          team_id?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: 'export_jobs_competition_id_fkey'
            columns: ['competition_id']
            isOneToOne: false
            referencedRelation: 'competitions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'export_jobs_export_profile_id_fkey'
            columns: ['export_profile_id']
            isOneToOne: false
            referencedRelation: 'export_profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'export_jobs_requested_by_fkey'
            columns: ['requested_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'export_jobs_team_id_fkey'
            columns: ['team_id']
            isOneToOne: false
            referencedRelation: 'teams'
            referencedColumns: ['id']
          },
        ]
      }
      export_profiles: {
        Row: {
          config: NonNullable<Json>
          created_at: string
          format: string
          id: string
          is_active: boolean
          name: string
          organization_id: string
        }
        ComputedFields: never
        Insert: {
          config?: NonNullable<Json>
          created_at?: string
          format: string
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
        }
        Update: {
          config?: NonNullable<Json>
          created_at?: string
          format?: string
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'export_profiles_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          organization_id: string
          role: Database['public']['Enums']['org_role']
          user_id: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          organization_id: string
          role?: Database['public']['Enums']['org_role']
          user_id: string
        }
        Update: {
          created_at?: string
          organization_id?: string
          role?: Database['public']['Enums']['org_role']
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'organization_members_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'organization_members_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      organizations: {
        Row: {
          city: string | null
          contact_email: string | null
          country: string
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          name: string
          slug: string
          state: string | null
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          city?: string | null
          contact_email?: string | null
          country?: string
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          state?: string | null
          updated_at?: string
        }
        Update: {
          city?: string | null
          contact_email?: string | null
          country?: string
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          state?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'organizations_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          avatar_path: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          role: Database['public']['Enums']['app_role']
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          avatar_path?: string | null
          created_at?: string
          email: string
          full_name?: string
          id: string
          phone?: string | null
          role?: Database['public']['Enums']['app_role']
          updated_at?: string
        }
        Update: {
          avatar_path?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          role?: Database['public']['Enums']['app_role']
          updated_at?: string
        }
        Relationships: []
      }
      registration_athletes: {
        Row: {
          athlete_id: string
          category_id: string | null
          created_at: string
          id: string
          registration_id: string
        }
        ComputedFields: never
        Insert: {
          athlete_id: string
          category_id?: string | null
          created_at?: string
          id?: string
          registration_id: string
        }
        Update: {
          athlete_id?: string
          category_id?: string | null
          created_at?: string
          id?: string
          registration_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'registration_athletes_athlete_id_fkey'
            columns: ['athlete_id']
            isOneToOne: false
            referencedRelation: 'athletes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'registration_athletes_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'competition_categories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'registration_athletes_registration_id_fkey'
            columns: ['registration_id']
            isOneToOne: false
            referencedRelation: 'registrations'
            referencedColumns: ['id']
          },
        ]
      }
      registration_entries: {
        Row: {
          competition_event_id: string
          created_at: string
          entry_time_cs: number | null
          id: string
          no_time: boolean
          registration_athlete_id: string
          registration_id: string
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          competition_event_id: string
          created_at?: string
          entry_time_cs?: number | null
          id?: string
          no_time?: boolean
          registration_athlete_id: string
          registration_id: string
          updated_at?: string
        }
        Update: {
          competition_event_id?: string
          created_at?: string
          entry_time_cs?: number | null
          id?: string
          no_time?: boolean
          registration_athlete_id?: string
          registration_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'registration_entries_competition_event_id_fkey'
            columns: ['competition_event_id']
            isOneToOne: false
            referencedRelation: 'competition_events'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'registration_entries_registration_athlete_id_fkey'
            columns: ['registration_athlete_id']
            isOneToOne: false
            referencedRelation: 'registration_athletes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'registration_entries_registration_id_fkey'
            columns: ['registration_id']
            isOneToOne: false
            referencedRelation: 'registrations'
            referencedColumns: ['id']
          },
        ]
      }
      registration_status_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          from_status: Database['public']['Enums']['registration_status'] | null
          id: string
          reason: string | null
          registration_id: string
          to_status: Database['public']['Enums']['registration_status']
        }
        ComputedFields: never
        Insert: {
          changed_at?: string
          changed_by?: string | null
          from_status?: Database['public']['Enums']['registration_status'] | null
          id?: string
          reason?: string | null
          registration_id: string
          to_status: Database['public']['Enums']['registration_status']
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          from_status?: Database['public']['Enums']['registration_status'] | null
          id?: string
          reason?: string | null
          registration_id?: string
          to_status?: Database['public']['Enums']['registration_status']
        }
        Relationships: [
          {
            foreignKeyName: 'registration_status_history_changed_by_fkey'
            columns: ['changed_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'registration_status_history_registration_id_fkey'
            columns: ['registration_id']
            isOneToOne: false
            referencedRelation: 'registrations'
            referencedColumns: ['id']
          },
        ]
      }
      registrations: {
        Row: {
          competition_id: string
          created_at: string
          created_by: string
          folio: string | null
          id: string
          review_note: string | null
          status: Database['public']['Enums']['registration_status']
          submitted_at: string | null
          submitted_by: string | null
          team_id: string
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          competition_id: string
          created_at?: string
          created_by: string
          folio?: string | null
          id?: string
          review_note?: string | null
          status?: Database['public']['Enums']['registration_status']
          submitted_at?: string | null
          submitted_by?: string | null
          team_id: string
          updated_at?: string
        }
        Update: {
          competition_id?: string
          created_at?: string
          created_by?: string
          folio?: string | null
          id?: string
          review_note?: string | null
          status?: Database['public']['Enums']['registration_status']
          submitted_at?: string | null
          submitted_by?: string | null
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'registrations_competition_id_fkey'
            columns: ['competition_id']
            isOneToOne: false
            referencedRelation: 'competitions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'registrations_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'registrations_submitted_by_fkey'
            columns: ['submitted_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'registrations_team_id_fkey'
            columns: ['team_id']
            isOneToOne: false
            referencedRelation: 'teams'
            referencedColumns: ['id']
          },
        ]
      }
      team_members: {
        Row: {
          decided_at: string | null
          decided_by: string | null
          requested_at: string
          role: Database['public']['Enums']['team_role']
          status: Database['public']['Enums']['membership_status']
          team_id: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          decided_at?: string | null
          decided_by?: string | null
          requested_at?: string
          role?: Database['public']['Enums']['team_role']
          status?: Database['public']['Enums']['membership_status']
          team_id: string
          user_id: string
        }
        Update: {
          decided_at?: string | null
          decided_by?: string | null
          requested_at?: string
          role?: Database['public']['Enums']['team_role']
          status?: Database['public']['Enums']['membership_status']
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'team_members_decided_by_fkey'
            columns: ['decided_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'team_members_team_id_fkey'
            columns: ['team_id']
            isOneToOne: false
            referencedRelation: 'teams'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'team_members_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      teams: {
        Row: {
          city: string | null
          code: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          country: string
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          logo_path: string | null
          name: string
          name_normalized: string
          short_name: string
          state: string | null
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          city?: string | null
          code?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          country?: string
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          logo_path?: string | null
          name: string
          name_normalized?: string
          short_name: string
          state?: string | null
          updated_at?: string
        }
        Update: {
          city?: string | null
          code?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          country?: string
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          logo_path?: string | null
          name?: string
          name_normalized?: string
          short_name?: string
          state?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'teams_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      age_on: { Args: { birth: string; reference: string }; Returns: number }
      can_access_registration: { Args: { p_registration_id: string }; Returns: boolean }
      coach_dashboard: { Args: Record<PropertyKey, never>; Returns: Json }
      current_app_role: {
        Args: Record<PropertyKey, never>
        Returns: Database['public']['Enums']['app_role']
      }
      decide_team_access: {
        Args: { p_approve: boolean; p_team_id: string; p_user_id: string }
        Returns: {
          decided_at: string | null
          decided_by: string | null
          requested_at: string
          role: Database['public']['Enums']['team_role']
          status: Database['public']['Enums']['membership_status']
          team_id: string
          user_id: string
        }
        SetofOptions: {
          from: '*'
          to: 'team_members'
          isOneToOne: true
          isSetofReturn: false
        }
      }
      eligible_events: {
        Args: { p_athlete_id: string; p_competition_id: string }
        Returns: {
          category_id: string | null
          competition_id: string
          event_catalog_id: string
          event_number: number | null
          external_code: string | null
          id: string
          is_active: boolean
          sex: Database['public']['Enums']['athlete_sex'] | null
          sort_order: number
        }[]
        SetofOptions: {
          from: '*'
          to: 'competition_events'
          isOneToOne: false
          isSetofReturn: true
        }
      }
      find_similar_athletes: {
        Args: {
          p_birth_date?: string
          p_first_name: string
          p_last_name: string
          p_team_id: string
        }
        Returns: {
          birth_date: string
          display_id: string
          first_name: string
          id: string
          last_name: string
          similarity: number
        }[]
      }
      get_or_create_registration: {
        Args: { p_competition_id: string; p_team_id: string }
        Returns: {
          competition_id: string
          created_at: string
          created_by: string
          folio: string | null
          id: string
          review_note: string | null
          status: Database['public']['Enums']['registration_status']
          submitted_at: string | null
          submitted_by: string | null
          team_id: string
          updated_at: string
        }
        SetofOptions: {
          from: '*'
          to: 'registrations'
          isOneToOne: true
          isSetofReturn: false
        }
      }
      is_competition_organizer: { Args: { p_competition_id: string }; Returns: boolean }
      is_org_member: { Args: { p_org_id: string }; Returns: boolean }
      is_platform_admin: { Args: Record<PropertyKey, never>; Returns: boolean }
      is_team_member: { Args: { p_team_id: string }; Returns: boolean }
      is_team_owner: { Args: { p_team_id: string }; Returns: boolean }
      log_action: {
        Args: { p_action: string; p_entity: string; p_entity_id: string; p_meta?: Json }
        Returns: undefined
      }
      normalize_text: { Args: { input: string }; Returns: string }
      organizer_can_see_athlete: { Args: { p_athlete_id: string }; Returns: boolean }
      organizer_can_see_team: { Args: { p_team_id: string }; Returns: boolean }
      organizer_dashboard: { Args: Record<PropertyKey, never>; Returns: Json }
      registration_editable: { Args: { p_registration_id: string }; Returns: boolean }
      registration_transition_allowed: {
        Args: {
          p_from: Database['public']['Enums']['registration_status']
          p_to: Database['public']['Enums']['registration_status']
        }
        Returns: boolean
      }
      request_team_access: {
        Args: { p_team_id: string }
        Returns: {
          decided_at: string | null
          decided_by: string | null
          requested_at: string
          role: Database['public']['Enums']['team_role']
          status: Database['public']['Enums']['membership_status']
          team_id: string
          user_id: string
        }
        SetofOptions: {
          from: '*'
          to: 'team_members'
          isOneToOne: true
          isSetofReturn: false
        }
      }
      resolve_category: {
        Args: { p_athlete_id: string; p_competition_id: string }
        Returns: string
      }
      review_registration: {
        Args: {
          p_reason?: string
          p_registration_id: string
          p_status: Database['public']['Enums']['registration_status']
        }
        Returns: {
          competition_id: string
          created_at: string
          created_by: string
          folio: string | null
          id: string
          review_note: string | null
          status: Database['public']['Enums']['registration_status']
          submitted_at: string | null
          submitted_by: string | null
          team_id: string
          updated_at: string
        }
        SetofOptions: {
          from: '*'
          to: 'registrations'
          isOneToOne: true
          isSetofReturn: false
        }
      }
      revoke_team_access: { Args: { p_team_id: string; p_user_id: string }; Returns: undefined }
      save_mark_from_entry: {
        Args: { p_entry_id: string }
        Returns: {
          athlete_id: string
          competition_id: string | null
          created_at: string
          created_by: string | null
          event_catalog_id: string
          id: string
          pool_course: Database['public']['Enums']['pool_course']
          recorded_at: string
          source: Database['public']['Enums']['mark_source']
          time_cs: number
        }
        SetofOptions: {
          from: '*'
          to: 'athlete_marks'
          isOneToOne: true
          isSetofReturn: false
        }
      }
      search_teams_directory: {
        Args: { p_query: string }
        Returns: {
          city: string
          id: string
          is_active: boolean
          name: string
          short_name: string
          similarity: number
          state: string
        }[]
      }
      submit_registration: {
        Args: { p_registration_id: string }
        Returns: {
          competition_id: string
          created_at: string
          created_by: string
          folio: string | null
          id: string
          review_note: string | null
          status: Database['public']['Enums']['registration_status']
          submitted_at: string | null
          submitted_by: string | null
          team_id: string
          updated_at: string
        }
        SetofOptions: {
          from: '*'
          to: 'registrations'
          isOneToOne: true
          isSetofReturn: false
        }
      }
      validate_registration: { Args: { p_registration_id: string }; Returns: Json }
    }
    Enums: {
      app_role: 'platform_admin' | 'organizer' | 'coach'
      athlete_sex: 'F' | 'M'
      competition_status: 'draft' | 'published' | 'closed' | 'finished'
      custom_field_type: 'text' | 'number' | 'date' | 'boolean' | 'select'
      export_status: 'pending' | 'running' | 'completed' | 'failed'
      mark_source: 'entry' | 'official' | 'manual'
      membership_status: 'pending' | 'approved' | 'rejected' | 'revoked'
      org_role: 'owner' | 'admin' | 'member'
      pool_course: 'SCM' | 'LCM' | 'OTHER'
      record_status: 'active' | 'inactive'
      registration_status:
        | 'draft'
        | 'submitted'
        | 'in_review'
        | 'needs_correction'
        | 'accepted'
        | 'rejected'
        | 'exported'
      stroke: 'free' | 'back' | 'breast' | 'fly' | 'medley'
      team_role: 'owner' | 'coach'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ['platform_admin', 'organizer', 'coach'],
      athlete_sex: ['F', 'M'],
      competition_status: ['draft', 'published', 'closed', 'finished'],
      custom_field_type: ['text', 'number', 'date', 'boolean', 'select'],
      export_status: ['pending', 'running', 'completed', 'failed'],
      mark_source: ['entry', 'official', 'manual'],
      membership_status: ['pending', 'approved', 'rejected', 'revoked'],
      org_role: ['owner', 'admin', 'member'],
      pool_course: ['SCM', 'LCM', 'OTHER'],
      record_status: ['active', 'inactive'],
      registration_status: [
        'draft',
        'submitted',
        'in_review',
        'needs_correction',
        'accepted',
        'rejected',
        'exported',
      ],
      stroke: ['free', 'back', 'breast', 'fly', 'medley'],
      team_role: ['owner', 'coach'],
    },
  },
} as const
