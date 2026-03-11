# Memoire

Memoire is a small v1 app for resurfacing meaningful memories by email.

The current product goal is narrow:

1. Sign up
2. Log in
3. Upload a photo with a description
4. Receive a random memory link by email
5. Open the link and view the memory

## Repo Layout

- `server/`: Express + TypeScript API, Prisma schema, upload and delivery logic
- `client/vite-project/`: React web client scaffold for the v1 frontend
- `agent.md`: project constraints and implementation guidance
- `spec.md`: product and engineering spec for v1
- `tasks.md`: lightweight status list for current work

## v1 Scope

In scope:

- User sign-up and login
- Memory upload with photo and description
- Memory storage
- Random memory delivery by email
- Viewing a delivered memory

Out of scope:

- Friend connections
- Social sharing
- AI-generated messages
- Notifications beyond email
- Health tracking

## Current State

- Backend user creation and login are implemented
- Frontend exists as an initial React app scaffold and still needs Memoire-specific screens
- Email delivery setup is planned but not fully wired
