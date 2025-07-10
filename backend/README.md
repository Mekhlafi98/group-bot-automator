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

### Internal API (requires JWT authentication)
- `GET /api/webhook` — fetch webhook info
- `POST /api/webhook` — set webhook (body: `{ url, has_custom_certificate, max_connections, allowed_updates }`)
- `DELETE /api/webhook` — delete webhook 
- `GET /api/contacts` — get all contacts
- `GET /api/workflows` — get all workflows
- `GET /api/groups` — get all telegram groups
- And many more...

### External API (requires API token authentication)
The external API provides secure access to your application data for integrations and third-party applications.

**Base URL:** `/api/external`

**Authentication:** Include your API token in the `x-api-token` header

**Available endpoints:**
- `GET /api/external/health` — health check
- `GET /api/external/contacts` — get all contacts
- `POST /api/external/contacts` — create a new contact
- `PUT /api/external/contacts/:id` — update a contact
- `DELETE /api/external/contacts/:id` — delete a contact
- `GET /api/external/workflows` — get all workflows
- `GET /api/external/groups` — get all telegram groups
- `GET /api/external/system-status` — get system status
- `GET /api/external/logs` — get message logs with pagination

For detailed documentation, see [EXTERNAL_API.md](./EXTERNAL_API.md)

## Testing

Test the external API endpoints:
```sh
npm run test:external-api
```

Set environment variables for testing:
```sh
export API_BASE_URL=http://localhost:4000
export API_TOKEN=your-api-token-here
npm run test:external-api
``` 