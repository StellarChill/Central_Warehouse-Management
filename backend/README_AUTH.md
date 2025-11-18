# Auth and Registration

## Endpoints

- POST `/api/login`
  - Body: `{ "UserName": string, "UserPassword": string }`
  - Response: `{ token, user: { UserId, UserName, RoleId, roleCode, CompanyId, BranchId, Email, UserStatus } }`

- POST `/api/register`
  - Creates a user under an existing `CompanyId` (pass `CompanyId` or a valid `BranchId`).
  - Body: `{ UserName, UserPassword, RoleId, BranchId, Email, TelNumber, LineId?, CompanyId? }`
  - Response: `{ user: {...} }` (UserStatus defaults to `PENDING`)

- POST `/api/register-company`
  - Creates a new Company, default Branch and Warehouse, and a Company Admin user (ACTIVE) and returns a token for immediate login.
  - Body:
    ```json
    {
      "CompanyName": "Acme Co",
      "CompanyAddress": "Bangkok",
      "TaxId": "TAX-001",
      "CompanyEmail": "ops@acme.local",
      "CompanyTelNumber": "020000000",
      "AdminUserName": "acme-admin",
      "AdminUserPassword": "secret123",
      "AdminEmail": "admin@acme.local",
      "AdminTelNumber": "0900000000"
    }
    ```
  - Response: `{ token, company: { CompanyId, CompanyName, CompanyCode }, user: { ... } }`

- GET `/api/company` (PLATFORM_ADMIN only)
  - Requires Authorization header

## Notes
- JWT includes `roleCode`, `CompanyId`, `BranchId` and is required for all authenticated routes.
- Platform Admin may set `x-company-id` to impersonate a tenant; other roles cannot override company.
