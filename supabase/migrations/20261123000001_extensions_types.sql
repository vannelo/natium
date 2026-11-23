-- =============================================================================
-- NATIUM Entry — 0001 Extensions & enum types
-- =============================================================================
create extension if not exists "pgcrypto" with schema extensions;
create extension if not exists "pg_trgm" with schema extensions;
create extension if not exists "unaccent" with schema extensions;

-- Platform-wide user role. One role per profile for v1.
create type public.app_role as enum ('platform_admin', 'organizer', 'coach');

-- Organization membership role (organizers belong to an organization).
create type public.org_role as enum ('owner', 'admin', 'member');

-- Team membership role & status (coaches belong to teams).
create type public.team_role as enum ('owner', 'coach');
create type public.membership_status as enum ('pending', 'approved', 'rejected', 'revoked');

-- Athlete sex / sport classification. Extensible by the organizer via categories.
create type public.athlete_sex as enum ('F', 'M');

-- Athlete record status (soft delete preserves history).
create type public.record_status as enum ('active', 'inactive');

-- Pool course.
create type public.pool_course as enum ('SCM', 'LCM', 'OTHER');

-- Swimming strokes.
create type public.stroke as enum ('free', 'back', 'breast', 'fly', 'medley');

-- Competition lifecycle.
create type public.competition_status as enum ('draft', 'published', 'closed', 'finished');

-- Registration lifecycle (see docs/registrations.md for the state machine).
create type public.registration_status as enum (
  'draft', 'submitted', 'in_review', 'needs_correction', 'accepted', 'rejected', 'exported'
);

-- Source of a stored mark.
create type public.mark_source as enum ('entry', 'official', 'manual');

-- Export job lifecycle.
create type public.export_status as enum ('pending', 'running', 'completed', 'failed');

-- Custom field data types for organizer-required athlete data.
create type public.custom_field_type as enum ('text', 'number', 'date', 'boolean', 'select');
