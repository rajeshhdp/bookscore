# RSVP page

Static RSVP site for GitHub Pages. Guests enter a name plus number of adults and kids. The admin logs in to see the totals and the list.

- `index.html` – public RSVP link (share this)
- `admin.html` – admin login, shows total responses / adults / kids / people (live)

GitHub Pages has no server, so responses are stored in Firebase (free Spark plan).

## Setup (about 5 minutes)
1. Create a project at https://console.firebase.google.com.
2. **Build > Firestore Database** > Create database. Then open **Rules**, paste `firestore.rules`, and Publish.
3. **Build > Authentication** > Get started > enable **Email/Password**. Under Users, **Add user** with the admin email and password. Then disable new sign-ups: Authentication > Settings > User actions > uncheck "Enable create (sign-up)".
4. **Project settings > Your apps > Web (`</>`)**: register an app, copy the config into `config.js`. Edit `EVENT_TITLE` and `EVENT_DETAILS` there too.
5. Authentication > Settings > **Authorized domains**: add `<your-username>.github.io`.
6. Push to GitHub, then Settings > Pages > deploy from the branch (root).

Links: `https://<user>.github.io/<repo>/` (public) and `https://<user>.github.io/<repo>/admin.html` (admin).

Only create the single admin user. Any account in the project can read the data, so do not enable other sign-in methods.
