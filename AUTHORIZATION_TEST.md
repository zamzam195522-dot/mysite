# Authorization Test Guide

## Testing the Admin Role Implementation

### 1. Setup Database
Run the seed script to create the admin role and default admin user:

```bash
psql -d your_database_name -f db/seed-roles.sql
```

### 2. Test Login with Admin User
Use these credentials to test login:
- Username: `admin`
- Password: `admin123`

### 3. Test API Endpoints

#### Test without authentication (should return 401):
```bash
curl -X GET http://localhost:3000/api/employees
curl -X POST http://localhost:3000/api/customers -H "Content-Type: application/json" -d '{"name":"Test Customer"}'
```

#### Test with non-admin user (should return 403):
1. Create a regular user without admin role
2. Login with that user
3. Try to access admin endpoints

#### Test with admin user (should work):
1. Login with admin user
2. Access admin endpoints:
   - GET/POST `/api/employees`
   - GET/POST `/api/products`
   - GET/POST `/api/customers`
   - GET/POST `/api/vendors`
   - etc.

### 4. Expected Behavior

#### Middleware Protection:
- All API endpoints require authentication (401 if no session)
- Admin-only endpoints return 403 for non-admin users
- Admin-only endpoints work for admin users

#### Protected Endpoints:
- `/api/employees` - Admin only
- `/api/products` - Admin only
- `/api/product-categories` - Admin only
- `/api/vendors` - Admin only
- `/api/vendor-purchases` - Admin only
- `/api/vendor-payments` - Admin only
- `/api/expense-heads` - Admin only
- `/api/expenses` - Admin only
- `/api/areas` - Admin only
- `/api/banks` - Admin only
- `/api/employee-areas` - Admin only
- `/api/stock` - Admin only
- `/api/reports` - Admin only

#### Public/Read-only Endpoints:
- `/api/auth/login` - Public
- `/api/auth/logout` - Authenticated users
- `/api/auth/me` - Authenticated users
- `/api/sales-invoices` - May need role-based filtering

### 5. Session Validation
The session includes:
- User ID
- Username
- Roles array
- Issued timestamp (8-hour expiry)

### 6. Security Notes
- Default admin password should be changed after first login
- Session cookies are HTTP-only and secure in production
- Consider implementing session refresh for better UX
- Add rate limiting to login endpoints
