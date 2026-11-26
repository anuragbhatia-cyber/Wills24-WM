# Team Specification

## Overview
An admin wealth manager can have several sub wealth managers, shown in the interface as team members. Each team member logs in with their own email and password, adds their own customers and leads, and sees only their own records. The admin wealth manager sees their own data plus every team member's. The team shares the admin wealth manager's package and will credits. One level only: a team member cannot have team members of their own.

## Screens
- Team List — Team members with customers, active cases, credits used and status; add, edit, reset password, deactivate or activate. No delete.

## User Flows

### Admin wealth manager
- Open Team from the sidebar to see every team member with name, ID (e.g. PAT-00020-S01), email, phone, designation, status, customers, active cases, credits used and created date
- Add Team Member: full name, email (the login ID, unique across wealth managers and employees), phone, designation, and module access for Leads, Customers and Cases (None, View, Comment, Edit). A level above the admin wealth manager's own access cannot be chosen. A set-password link is emailed; the password is never shown
- Documents access is read-only here: only Wills24 admin can grant it
- Edit a team member's details and module access
- Reset password: emails a new set-password link and the old password stops working at once
- Deactivate blocks login and keeps all their records, which stay visible to the admin wealth manager; Activate restores login
- See the shared package: wills included, used and left for the whole team, and usage per team member
- On Home, Customers, CRM and Case Management, switch scope between Team (default), Mine, or one named team member. Summary cards, the Case Status donut and Recent Activity follow it
- Customer, lead and case tables show an Added by column and filter
- Detail pages show the owning team member and the admin wealth manager on the Wealth Manager card
- When adding a customer or lead, an optional owner picker adds it on behalf of a team member; the default owner is themselves

### Sub wealth manager (team member)
- Sees Home, Customers, CRM and Case Management with their own records only. No Team item and no scope switch
- The header shows a Team Login indicator with the admin wealth manager's company, on every page
- New customers and leads are tagged to themselves automatically
- Will credits remaining are read from the shared package balance
- Modules set to None are hidden; View cannot add or change anything

### Both
- Change their own password from the profile menu

## UI Requirements
- Team list as a table on desktop and cards on mobile, consistent with other lists
- Access levels shown as compact per-module pills (L / C / Ca)
- Inactive team members dimmed with a gray status badge
- Shared credit meter in the header area with used, left and total
- Scope switch is a segmented control (Team, Mine) plus a team member dropdown

## Configuration
- shell: true
