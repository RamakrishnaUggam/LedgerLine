# BalanceVault

BalanceVault is a fintech account-management prototype with a responsive React frontend and an Express/MongoDB API in the same repository.

## Current implementation

- Responsive landing, authentication, account-holder, admin, and auditor workspaces
- Animated dashboards, account cards, transaction tables, forms, and responsive navigation
- Persistent local demo state for frontend-only exploration
- JWT registration, login, and current-user endpoints
- Role guards for account holders, admins, and auditors
- Account onboarding and admin status approval
- Deposits, withdrawals, and two-sided transfers
- Transaction history and audit records
- Health and database readiness endpoints
- Helmet, CORS, request validation, rate limiting, password hashing, and optional Redis storage

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and set `MONGODB_URI` and a long random `JWT_SECRET`.

3. Start the frontend:

   ```bash
   npm run dev
   ```

4. Start the API in a second terminal:

   ```bash
   npm run dev:api
   ```

The frontend runs on `http://localhost:5173`; the API runs on `http://localhost:4000`.

To create local admin and auditor accounts, set the `SEED_*` variables in `.env` and run:

```bash
npm run seed
```

## API endpoints

- `GET /api/health`
- `GET /api/ready`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET|POST /api/accounts`
- `GET /api/transactions`
- `POST /api/actions/deposit`
- `POST /api/actions/withdraw`
- `POST /api/actions/transfer`
- `GET /api/admin/users`
- `PATCH /api/admin/accounts/:id/status`
- `GET /api/auditor/records`

Authenticated endpoints require `Authorization: Bearer <token>`.

## Verification

```bash
npm run build
npm run build:server
npm run lint
```

Full database-backed integration tests require a reachable MongoDB instance configured through `MONGODB_URI`. Never commit `.env` files or secret values.
