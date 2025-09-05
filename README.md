#project memoire(temporaryname)

---
##APP OVERVIEW
An app that detects when users are feeling sad (using low hrv which is #1 predictor and sleep quality too in order to have more consistent results) and sends them something positive to keep their spirits up. 
---
##SYSTEM FLOW
User frontend app will request permission from wearables for data, send that data to backend where it will be stored. Backend will send notication to front end with content if low mood status is trigged or if user has automatic positive vibes set. User will open it, could be theirs or could be sent one from the database of shared content the backend owns, user if shown something from this will be able to like,share, save . 
---
## USER FUNCTIONS
User will be able to log in and select the wearable they will be using or select to self-report.
Users will be able to upload their own positive things  and have the option to share their uploads.
Users will be shown something positive when low mood is detected, if not their own content they will have the ability to like it, the option to save it, and the option to share with others.
---
##FEATURES
For wearables (apple watch, fitbit, oura ring).
For self-report options to report daily or weekly.
Also able to choose to be automatically send something positive regardless of data and able to choose frequency(but limited to twice a day max).
##OTHER
Maybe use ai to parse content and keep metadata about it, so when sent to user it can be sent with a nice message. A title can be generated, and keywords about it could be kept.
---

##TechStack
Backend – node.js , typescript
Database – postgresql
Content storage - cloudinary
Frontend – swift, react native
Authentication – token , google, facebook, apple
Extra- openai api for content sentiment analysis

---

