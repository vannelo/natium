import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from './layouts/AppShell'
import { AuthLayout } from './layouts/AuthLayout'
import { RedirectIfAuthed, RequireAuth } from './guards/RequireAuth'
import { RequireRole } from './guards/RequireRole'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { RegisterPage } from '@/features/auth/pages/RegisterPage'
import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage'
import { UpdatePasswordPage } from '@/features/auth/pages/UpdatePasswordPage'
import { HomeRedirect } from '@/features/dashboard/HomeRedirect'
import { CoachDashboardPage } from '@/features/dashboard/CoachDashboardPage'
import { OrganizerDashboardPage } from '@/features/dashboard/OrganizerDashboardPage'
import { AdminDashboardPage } from '@/features/admin/AdminDashboardPage'
import { AdminUsersPage } from '@/features/admin/AdminUsersPage'
import { AdminAuditPage } from '@/features/admin/AdminAuditPage'
import { TeamsPage } from '@/features/teams/pages/TeamsPage'
import { TeamDetailPage } from '@/features/teams/pages/TeamDetailPage'
import { AthletesPage } from '@/features/athletes/pages/AthletesPage'
import { AthleteDetailPage } from '@/features/athletes/pages/AthleteDetailPage'
import { OpenCompetitionsPage } from '@/features/competitions/pages/OpenCompetitionsPage'
import { CompetitionPublicPage } from '@/features/competitions/pages/CompetitionPublicPage'
import { OrgCompetitionsPage } from '@/features/competitions/pages/OrgCompetitionsPage'
import { CompetitionFormPage } from '@/features/competitions/pages/CompetitionFormPage'
import { OrgCompetitionDetailPage } from '@/features/competitions/pages/OrgCompetitionDetailPage'
import { OrganizationPage } from '@/features/competitions/pages/OrganizationPage'
import { CatalogPage } from '@/features/catalog/CatalogPage'
import { MyRegistrationsPage } from '@/features/registrations/pages/MyRegistrationsPage'
import { RegistrationWizardPage } from '@/features/registrations/pages/RegistrationWizardPage'
import { RegistrationDetailPage } from '@/features/registrations/pages/RegistrationDetailPage'
import { OrgRegistrationsPage } from '@/features/registrations/pages/OrgRegistrationsPage'
import { NotFoundPage } from '@/shared/ui/StatusPages'

export const router = createBrowserRouter([
  {
    element: <RedirectIfAuthed />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/register', element: <RegisterPage /> },
          { path: '/reset-password', element: <ResetPasswordPage /> },
        ],
      },
    ],
  },
  {
    element: <AuthLayout />,
    children: [{ path: '/update-password', element: <UpdatePasswordPage /> }],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/', element: <HomeRedirect /> },
          // Coach
          {
            element: <RequireRole roles={['coach', 'platform_admin']} />,
            children: [
              { path: '/dashboard', element: <CoachDashboardPage /> },
              { path: '/teams', element: <TeamsPage /> },
              { path: '/teams/:teamId', element: <TeamDetailPage /> },
              { path: '/athletes', element: <AthletesPage /> },
              { path: '/athletes/:athleteId', element: <AthleteDetailPage /> },
              { path: '/competitions', element: <OpenCompetitionsPage /> },
              { path: '/competitions/:competitionId', element: <CompetitionPublicPage /> },
              { path: '/registrations', element: <MyRegistrationsPage /> },
              {
                path: '/registrations/:registrationId/wizard',
                element: <RegistrationWizardPage />,
              },
            ],
          },
          { path: '/registrations/:registrationId', element: <RegistrationDetailPage /> },
          // Organizer
          {
            element: <RequireRole roles={['organizer', 'platform_admin']} />,
            children: [
              { path: '/org', element: <OrganizerDashboardPage /> },
              { path: '/org/organization', element: <OrganizationPage /> },
              { path: '/org/competitions', element: <OrgCompetitionsPage /> },
              { path: '/org/competitions/new', element: <CompetitionFormPage /> },
              { path: '/org/competitions/:competitionId', element: <OrgCompetitionDetailPage /> },
              { path: '/org/competitions/:competitionId/edit', element: <CompetitionFormPage /> },
              { path: '/org/registrations', element: <OrgRegistrationsPage /> },
              { path: '/org/catalog', element: <CatalogPage /> },
            ],
          },
          // Platform admin
          {
            element: <RequireRole roles={['platform_admin']} />,
            children: [
              { path: '/admin', element: <AdminDashboardPage /> },
              { path: '/admin/users', element: <AdminUsersPage /> },
              { path: '/admin/audit', element: <AdminAuditPage /> },
            ],
          },
          { path: '/home', element: <Navigate to="/" replace /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
])
