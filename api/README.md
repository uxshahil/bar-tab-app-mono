# Bar Tab API

The backend service for the Bar Tab application, built with Express.js, Supabase, and Socket.IO. It handles business logic, database interactions, and real-time event broadcasting.

## Features

- **REST API**: Comprehensive endpoints for managing users, bars, menus, drinks, tabs, and payments.
- **Real-time Updates**: Socket.IO integration to broadcast state changes to connected clients immediately.
- **Supabase Integration**: Direct interaction with Supabase Auth and Database (PostgreSQL) using the service role key for administrative tasks.
- **External APIs**: Fetches drink details from TheCocktailDB when not found locally.

## Prerequisities

- Node.js (v18+)
- Supabase Project (URL and Service Role Key)

## Installation

1.  **Install dependencies**

    ```bash
    npm install
    ```

2.  **Environment Configuration**
    Create a `.env` file in the root directory:

    ```env
    PORT=3000
    SUPABASE_URL=your_supabase_project_url
    SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
    NODE_ENV=development
    ```

3.  **Start the Server**

    ```bash
    # Development mode
    npm run dev

    # Production mode
    npm start
    ```

## API Reference

### User Management

- `POST /create-user` - Create new user with profile (Auth + DB)
- `PUT /update-user/:userId` - Update user profile and auth data
- `DELETE /delete-user/:userId` - Delete user and profile

### Bar Management

- `POST /bars` - Create new bar
- `PUT /bars/:id` - Update bar details
- `DELETE /bars/:id` - Delete bar

### Menu Management

- `POST /menus` - Create new menu
- `PUT /menus/:id` - Update menu details
- `DELETE /menus/:id` - Delete menu

### Drink Management

- `GET /drinks/:id` - Get drink by ID or Slug (checks DB, then External API)
- `POST /create-drink` - Add new drink to menu
- `PUT /update-drink/:drinkId` - Update drink details
- `DELETE /delete-drink/:drinkId` - Remove drink from menu

### Tab Management

- `POST /tabs` - Create new customer tab
- `PUT /tabs/:tabId` - Update tab details
- `POST /tabs/items` - Add item to tab
- `PUT /tabs/items/:itemId` - Update tab item
- `DELETE /tabs/items/:itemId` - Remove item from tab
- `POST /tabs/splits` - Split tab among customers
- `PUT /tabs/splits/:splitId` - Update tab split
- `POST /tabs/payments` - Record payment
- `POST /tabs/:tabId/settle` - Settle and close tab

### Health Check

- `GET /` - Returns API status and message.

## Socket.IO Events

The API broadcasts events to all connected clients when resources change.

| Resource     | Events                                                   | Payload                            |
| ------------ | -------------------------------------------------------- | ---------------------------------- |
| **User**     | `user:created`, `user:updated`, `user:deleted`           | `{ id: userId }`                   |
| **Bar**      | `bar:created`, `bar:updated`, `bar:deleted`              | `{ id: barId }`                    |
| **Menu**     | `menu:created`, `menu:updated`, `menu:deleted`           | `{ id: menuId }`                   |
| **Drink**    | `drink:created`, `drink:updated`, `drink:deleted`        | `{ id: drinkId }`                  |
| **Tab**      | `tab:created`, `tab:updated`                             | `{ id: tabId }`                    |
| **Tab Item** | `tab:item:added`, `tab:item:updated`, `tab:item:deleted` | `{ id: itemId, tab_id: tabId }`    |
| **Payment**  | `tab:payment:added`                                      | `{ id: paymentId, tab_id: tabId }` |

## Troubleshooting

### Port 3000 In Use

If you see `EADDRINUSE: address already in use :::3000`, it means another process (likely a previous instance of this server or another service) is occupying port 3000.
**Fix:**

```bash
# Find the process ID (PID)
lsof -i :3000

# Kill the process
kill -9 <PID>
```

Or start the server on a different port by updating `.env`.
