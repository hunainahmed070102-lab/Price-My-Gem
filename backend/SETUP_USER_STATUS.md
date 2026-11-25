# Quick Setup Guide: User Status Feature

## Prerequisites
- Backend server running
- Database configured and connected
- Admin account created

## Setup Steps

### Step 1: Add Status Column to Database

```bash
cd backend
node add-status-column.js
```

**Expected Output:**
```
✅ Status column added successfully
✅ Updated X users to active status
```

### Step 2: Restart Backend Server

```bash
# Stop the current server (Ctrl+C)
npm start
```

### Step 3: Test the Feature

#### Test 1: View Users in Admin Dashboard
1. Login to admin dashboard at `http://localhost:5173`
2. Navigate to "Users" page
3. You should see three statistics cards:
   - Total App Users
   - Active Users
   - Blocked Users
4. Each user row should have a status badge (green "Active" or red "Blocked")

#### Test 2: Block a User
1. Find a test user in the users table
2. Click the green "Active" button
3. Confirm the action
4. Status should change to red "Blocked" badge
5. Statistics should update automatically

#### Test 3: Verify Blocked User Can't Login
1. Open mobile app (or test with API)
2. Try to login with blocked user credentials
3. Should receive error message:
   ```
   Your account has been blocked by the administrator. 
   Please contact support.
   ```

#### Test 4: Unblock a User
1. Click the red "Blocked" button on a blocked user
2. Confirm the action
3. Status should change to green "Active" badge
4. User should now be able to login

## API Testing with cURL

### Block a User
```bash
curl -X PUT http://localhost:5000/api/admin/users/1/status \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"blocked"}'
```

### Unblock a User
```bash
curl -X PUT http://localhost:5000/api/admin/users/1/status \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"active"}'
```

### Test Blocked User Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"blocked@user.com","password":"password123"}'
```

**Expected Response (403):**
```json
{
  "success": false,
  "message": "Your account has been blocked by the administrator. Please contact support.",
  "blocked": true,
  "contactEmail": "pricemygem@gmail.com",
  "contactWhatsApp": "+923112345678"
}
```

## Verification Checklist

- [ ] Migration script runs without errors
- [ ] Status column exists in users table
- [ ] All existing users have 'active' status
- [ ] Admin dashboard shows user statistics
- [ ] Status toggle buttons work
- [ ] Blocked users can't login
- [ ] Active users can login
- [ ] Error messages display contact information
- [ ] Statistics update after status changes

## Rollback (if needed)

If you need to remove the status column:

```sql
ALTER TABLE users DROP COLUMN status;
```

⚠️ **Warning**: This will remove all status data permanently.

## Common Issues

### Issue: "Column 'status' doesn't exist"
**Solution**: Run the migration script again:
```bash
node add-status-column.js
```

### Issue: Frontend shows status as 'undefined'
**Solution**: 
1. Clear browser cache
2. Restart frontend dev server
3. Verify backend is returning status field

### Issue: Can't block admin account
**Solution**: This is correct behavior. Only regular users (from users table) have status. Admins (from admins table) don't have status field.

## Next Steps

After successful setup:
1. Test with real user accounts
2. Document your blocking policies
3. Set up communication channels for blocked users
4. Consider implementing email notifications
5. Review blocked accounts periodically

## Support

Need help? Contact:
- **Email**: pricemygem@gmail.com
- **WhatsApp**: +923112345678

---

**Last Updated**: January 2025
