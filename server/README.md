# Memoire Server

## Overview

This server supports the v1 Memoire flow:

1. A user signs up and logs in
2. A user uploads a memory with a photo and description
3. The server stores the memory
4. The server sends the user a random memory link by email
5. The user opens the link and views the memory

The backend should stay focused on that loop. Social features, friend connections, and AI-generated messages are out of scope for v1.

## Current Stack

- Node.js
- TypeScript
- Express
- Prisma
- PostgreSQL
- Cloudinary
- JWT authentication
- Resend for email delivery

## Environment

The server expects these environment variables:

- `DATABASE_URL`
- `JWT_SECRET`
- `CRON_SECRET`
- `FRONTEND_URL`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_URL_SIGNING_KEY`
- `RESEND_API_KEY`
- `OPENAI_API_KEY`

`POST /deliveries/process-pending` is intended for scheduled automation and uses the `x-cron-secret` request header instead of JWT auth. Set `CRON_SECRET` in the deployed server environment and send the same value from your scheduler.

## Main Domains

- `user`: account creation and login
- `content`: memory uploads and retrieval
- `delivery`: random memory delivery and view tracking

## Out of Scope

Do not add these unless explicitly requested:

- Friend network features
- Shared memories between users
- Likes, comments, or social actions
- AI-generated captions or sentiment workflows
- Push notifications
- Health tracking features
