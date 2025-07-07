# Group Bot Backend

A minimal Express backend in TypeScript for webhook management.

## Setup

1. Install dependencies:
   ```sh
   npm install
   ```

2. Run in development mode (with hot-reload):
   ```sh
   npm run dev
   ```

3. Build for production:
   ```sh
   npm run build
   ```

4. Start the production server:
   ```sh
   npm start
   ```

The server will run on [http://localhost:4000](http://localhost:4000) by default.

## Endpoints

- `GET /api/webhook` — fetch webhook info
- `POST /api/webhook` — set webhook (body: `{ url, has_custom_certificate, max_connections, allowed_updates }`)
- `DELETE /api/webhook` — delete webhook 