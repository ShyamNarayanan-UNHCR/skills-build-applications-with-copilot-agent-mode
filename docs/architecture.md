# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

- Presentation tier decision: keep the UI thin and read-only; each page calls the shared API client and renders loading, empty, success, and error states in a reusable card component.
- Logic tier decision: centralize API behavior in service functions under `octofit-tracker/backend/src/services/octofitService.ts`, with Express routes delegating validation and business logic there.
- Data tier decision: define strict Mongoose validation at the schema level for required identity fields and associations, while seed logic keeps demo users and teams stable without clearing unrelated records.
- Activity tracking approach: accept `userId` and `teamId` input, validate Mongo IDs and existence, reject invalid input with 4xx, and store the normalized `user`, `team`, `type`, `minutes`, computed `points`, and `occurredAt` fields.
- Team management approach: require `name` and `mascot`, default `members` to an empty array, and normalize member IDs before creation.
- Leaderboard approach: aggregate activity points by team and rank teams in descending `totalPoints` order starting at rank 1.
- Workout suggestions approach: resolve the user by email, prefer the user's fitness goal (or latest activity pattern) as the recommendation focus, and return a reasoned suggestion list with a deliberate 4xx when the email is unknown.

## Test plan

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend` — validates Mongoose contracts and idempotent seed behavior.
- API command: `npm run test:api --prefix octofit-tracker/backend` — verifies the Express `/api/*` contract, validation, leaderboard ordering, and workout suggestions.
- Frontend command: `npm test --prefix octofit-tracker/frontend` — confirms route rendering, loading states, empty states, and API error handling in the React UI.
- Backend build command: `npm run build --prefix octofit-tracker/backend` — ensures the TypeScript backend compiles cleanly.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend` — ensures the React app builds for production without TypeScript or bundling errors.
