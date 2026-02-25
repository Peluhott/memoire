#project memoire(temporaryname)

---
## App overview
> An app that sends users random positive content to keep their spirits up. Users can also receive random positive feedback from their friend network.
---
## System Flow
> Backend will randomly send a notification to the frontend with positive content. Content can come from the app's shared database or from a user's friends. Users will open the notification and can like, save, or share the content they receive.
---
## User Functions
> User will be able to log in and manage their friend network.
> Users will be able to upload their own positive content and have the option to share their uploads.
> Users will randomly receive something positive — either from the shared content database or as positive feedback sent by a friend. If shown content from the database, they will have the ability to like it, save it, and share it with others.
---
## Features
> Randomly delivered positive content — users can choose frequency (limited to twice a day max).
> Friend network — users can send and receive random positive feedback from friends.
> Content uploads — users can upload and optionally share their own positive content.
---
## Other
> Maybe use ai to parse content and keep metadata about it, so when sent to user it can be sent with a nice message. A title can be generated, and keywords about it could be kept.
---

## TechStack
> Backend – node.js , typescript
> Database – postgresql
> Content storage - cloudinary
> Frontend – swift, react native
> Authentication – token , google, facebook, apple
> Extra- openai api for content sentiment analysis

---

