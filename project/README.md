## Nearby Home Services

Full-stack web application that connects customers with nearby verified household service providers (plumber, electrician, AC mechanic, carpenter, etc.) with real-time matching and live tracking.

### Tech Stack

- **Frontend**: React + TypeScript, Vite, TailwindCSS, React Router, Mapbox (via `react-map-gl`), Socket.IO client
- **Backend**: Node.js, Express, MongoDB, Mongoose, Socket.IO, JWT auth, Multer for uploads

### Features

- Customer can create service requests with location and category.
- Providers register with profile photo and ID proof; admin must approve before they go online.
- Nearby approved providers receive new requests in real time; the first to accept gets the job (atomic).
- Provider sends live GPS updates; customer can track on a map.
- Provider confirms payment received to complete the session.

### Folder Structure

- `server/` – Express API, Socket.IO, MongoDB models
- `client/` – React app (Vite + Tailwind)

---

### Setup – Backend (`server`)

1. Install MongoDB and make sure it is running (`mongodb://127.0.0.1:27017` by default).
2. In `server/`, create `.env` from the example:

```bash
cd server
cp .env.example .env
```

3. Edit `.env`:

- `MONGO_URI` – your Mongo connection string (default is local).
- `JWT_SECRET` – any long random string.
- `CLIENT_URL` – `http://localhost:5173` for local dev.

4. Install dependencies:

```bash
cd server
npm install
```

5. Start backend:

```bash
npm run dev
```

Backend listens on `http://localhost:4000`.

---

### Setup – Frontend (`client`)

1. In `client/`, create `.env` from example:

```bash
cd client
cp .env.example .env
```

2. Edit `.env`:

- `VITE_API_URL=http://localhost:4000/api`
- `VITE_SOCKET_URL=http://localhost:4000`
- `VITE_MAPBOX_TOKEN=YOUR_MAPBOX_PUBLIC_TOKEN_HERE`  
  (Create a free account at Mapbox and use the public access token.)

3. Install dependencies:

```bash
cd client
npm install
```

4. Start frontend:

```bash
npm run dev
```

Frontend runs on `http://localhost:5173`.

---

### Auth & Roles

- **CUSTOMER** – can create new service requests and track them.
- **PROVIDER** – registers with full details and uploads; must be approved.
- **ADMIN** – manages provider verification and can see all requests.

Initial admin user must be created manually (e.g. inserting a `User` with `role: "ADMIN"` and a bcrypt password hash in MongoDB) or by temporarily allowing admin registration in `auth` route for local development.

---

### Key API Endpoints

- `POST /api/auth/register` – customer or provider registration (multipart for providers).
- `POST /api/auth/login` – login, returns JWT.
- `PATCH /api/provider/availability` – provider availability; requires APPROVED provider to go AVAILABLE.
- `GET /api/providers/nearby` – nearby available approved providers for a location.
- `GET /api/admin/providers` – list and manage providers.
- `POST /api/admin/provider/:id/approve` – approve provider.
- `POST /api/admin/provider/:id/reject` – reject provider with reason.
- `POST /api/admin/provider/:id/deactivate` – deactivate provider.
- `POST /api/requests` – create service request (customer).
- `POST /api/requests/:id/accept` – provider accepts (atomic).
- `POST /api/requests/:id/status` – provider status updates.
- `POST /api/requests/:id/payment-confirm` – provider confirms payment.
- `GET /api/requests/:id` – fetch request details for tracking.

---

### Frontend Routes

- Customer:
  - `/customer/new-request` – create new request and see nearby providers on map.
  - `/customer/request/:id` – live tracking view (provider image, details, status timeline).
- Provider:
  - `/provider/register` – provider registration with file uploads.
  - `/provider/dashboard` – verification status, availability toggle, incoming requests.
  - `/provider/request/:id` – detailed job view with status and GPS update controls.
- Admin:
  - `/admin/providers` – list providers, view documents, approve/reject/deactivate.
  - `/admin/requests` – list all service requests.
- Shared:
  - `/login` – login for all roles.

---

### Socket.IO Events

- `request:new` – sent to nearby providers when a customer creates a request.
- `request:accepted` – sent to customer when a provider accepts.
- `request:taken` – tells other providers the request is no longer available.
- `request:statusUpdate` – status timeline updates.
- `provider:locationUpdate` – provider GPS to customer tracking page.

Frontend joins rooms:

- `join:provider` – provider personal room for new requests.
- `join:request` – request room for both customer and provider.

---

### Notes

- Provider images and documents are stored on disk in `server/uploads` and exposed via `/uploads/...` URLs.
- Customer model does **not** have an image field.
- Provider cannot go `AVAILABLE` or receive requests until `verificationStatus === "APPROVED"`.

