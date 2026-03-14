# Memoire

Memoire is a memory resurfacing product that starts with email and expands over time.

The long-term idea is simple: help users save meaningful memories, then bring those memories back at the right time.

## Product Roadmap

### Version 1

Version 1 is focused on email delivery.

Users will be able to:

1. Sign up
2. Log in
3. Upload a photo with a description
4. Have a random future date generated for delivery
5. Receive that memory by email on the scheduled date

The goal of v1 is to prove that memory resurfacing by email is useful on its own.

### Version 2

Version 2 is planned to add a dedicated app experience on top of the core memory system.

This stage is meant to move Memoire beyond basic email delivery and into a fuller product experience.

### Version 3

Version 3 is planned to add health tracking.

At that stage, memory delivery would no longer rely only on random dates. Instead, delivery timing would be influenced by a user's health metrics.

## Current Focus

Right now the main focus is v1:

- User authentication
- Memory upload and storage
- Delivery scheduling using a random date generator
- Sending memories back by email

## Repo Layout

- `server/`: Express + TypeScript API, Prisma schema, auth, content, and delivery logic
- `client/vite-project/`: React client for the product UI
- `agent.md`: project constraints and implementation guidance
- `spec.md`: product and engineering spec
- `tasks.md`: lightweight status list for current work

## Current State

- The backend already includes user, content, delivery, and related domain code
- The frontend already includes Memoire-specific UI, not just a scaffold
- The project is still being shaped around the v1 email delivery flow
