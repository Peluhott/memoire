## 2026-03-10 11:05:44 EDT

- Implemented server-side logout by invalidating prior JWTs with a user `tokenVersion`.
- Added backend TypeScript project scaffolding and verified the server with `npx prisma generate` and `npm run typecheck`.

## 2026-03-10 11:07:33 EDT

- Replaced the Vite starter UI with a small Memoire auth test screen for login, logout, and revoked-token verification.
- Updated backend CORS to allow the local Vite client and verified the frontend with `npm run build`.

## 2026-03-10 11:21:45 EDT

- Added a catch-up Prisma migration to align the database with the current backend schema.
- Resolved the failed migration state and successfully applied the migration to the Neon database so login can query the `user` table without missing-column errors.

## 2026-03-10 11:25:42 EDT

- Added a create-user form to the frontend auth test page so new accounts can be created before testing login/logout.
- Verified the updated client with `npm run build`.

## 2026-03-10 11:33:05 EDT

- Expanded the frontend into a small state-driven app with auth, uploads listing, and upload form views.
- Wired the client to the existing `/content` endpoints for authenticated listing, signed preview lookup, and multipart upload.
- Verified the updated client with `npm run build`.

## 2026-03-10 11:56:14 EDT

- Increased signed Cloudinary image URL lifetime from 1 minute to 25 minutes.
- Updated the uploads UI to expose the fetched signed image URL as an explicit "Open signed image" link in addition to inline preview rendering.
- Verified the client with `npm run build` and the server with `npm run typecheck`.

## 2026-03-11 09:01:00 EDT

- Fixed upload image access by returning stable signed Cloudinary URLs instead of expiring tokenized URLs.
- Added owner-only lookup for individual content image URLs and included `imageUrl` on authenticated content listings.
- Verified the server with `npm run typecheck`.

## 2026-03-11 09:12:00 EDT

- Added an authenticated delivery test-email endpoint that sends a Resend email from `j_sedanomar@uncg.edu`.
- Created the controller and route in the `delivery` module and wired the service to accept a recipient email from the request body.
- Verified the server with `npm run typecheck`.

## 2026-03-11 09:16:00 EDT

- Updated the delivery test-email controller to resolve the authenticated user's email from their user ID instead of reading an email from the request body.
- Verified the server with `npm run typecheck`.

## 2026-03-11 09:24:00 EDT

- Added a `Send Test Email` button to the frontend uploads view and wired it to the authenticated `/deliveries/test-email` endpoint.
- Verified the frontend with `npm run build`.

## 2026-03-11 09:31:00 EDT

- Fixed the chat completion utility by declaring the prompt constant, validating `OPENAI_API_KEY`, and returning the generated `output_text`.
- Verified the server with `npm run typecheck`.

## 2026-03-11 09:39:00 EDT

- Added a delivery endpoint that accepts an image title and description, generates an uplifting message, and emails it to the authenticated user.
- Extended the delivery email sender to accept a custom message body and verified the server with `npm run typecheck`.

## 2026-03-11 09:46:00 EDT

- Added a per-image `Send Email` button to the uploads view that submits that image's title and description to the generated-email delivery endpoint.
- Verified the frontend with `npm run build`.

## 2026-03-11 09:52:00 EDT

- Switched the delivery sender back to Resend's hosted `onboarding@resend.dev` address so email sending does not depend on a custom domain sender.
- Verified the server with `npm run typecheck`.

## 2026-03-11 10:01:00 EDT

- Added server-side logging around generated-message email requests, OpenAI message generation, and Resend send attempts so upstream failures can be identified quickly.
- Verified the server with `npm run typecheck`.

## 2026-03-11 10:08:00 EDT

- Updated the root `.gitignore` to exclude local env files, TypeScript build artifacts, OS junk, and local planning/scratch markdown files before pushing the repo online.

## 2026-03-12 09:40:38 EDT

- Updated generated delivery emails to accept the selected Cloudinary image identity and attach the signed asset URL when the email is sent.
- Kept Resend's `from` address unchanged and verified the backend with `npm run typecheck`.
