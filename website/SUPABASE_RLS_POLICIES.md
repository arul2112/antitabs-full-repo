# Supabase Row Level Security (RLS) Policies

## ⚠️ CRITICAL: You MUST set up these RLS policies in Supabase

Without these policies, **any user can read/modify ANY data** in your database!

---

## How to Apply These Policies

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor** in the left sidebar
4. Copy and paste each SQL block below
5. Click **Run** for each block

---

## 1. Enable RLS on All Tables

```sql
-- Enable Row Level Security on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Enable Row Level Security on subscriptions table
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
```

---

## 2. Profiles Table Policies

### Policy: Users can view their own profile
```sql
CREATE POLICY "Users can view own profile"
ON profiles
FOR SELECT
USING (auth.uid() = id);
```

### Policy: Users can insert their own profile (for signup)
```sql
CREATE POLICY "Users can insert own profile"
ON profiles
FOR INSERT
WITH CHECK (auth.uid() = id);
```

### Policy: Users can update their own profile (limited fields)
```sql
CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND (
    -- Users can only update these fields:
    OLD.id = NEW.id
    AND OLD.email = NEW.email
    AND OLD.trial_started_at = NEW.trial_started_at
    AND OLD.trial_ends_at = NEW.trial_ends_at
    AND OLD.subscription_status = NEW.subscription_status
    AND OLD.subscription_id = NEW.subscription_id
    AND OLD.plan_type = NEW.plan_type
    AND OLD.subscription_ends_at = NEW.subscription_ends_at
  )
);
```

**Note:** Users CANNOT modify critical fields like trial dates or subscription status directly. These should only be modified via Edge Functions with service role key.

---

## 3. Subscriptions Table Policies

### Policy: Users can view their own subscriptions
```sql
CREATE POLICY "Users can view own subscriptions"
ON subscriptions
FOR SELECT
USING (auth.uid() = user_id);
```

### Policy: Only service role can insert subscriptions
```sql
-- No INSERT policy for users
-- Subscriptions should ONLY be created via Edge Functions
```

### Policy: Only service role can update subscriptions
```sql
-- No UPDATE policy for users
-- Subscriptions should ONLY be updated via Edge Functions
```

---

## 4. Verify RLS is Working

After applying policies, test with this SQL:

```sql
-- Should return true for both tables
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('profiles', 'subscriptions');
```

Expected result:
```
schemaname | tablename      | rowsecurity
-----------+----------------+-------------
public     | profiles       | true
public     | subscriptions  | true
```

---

## 5. Security Best Practices

### ✅ DO:
- Always use Edge Functions for sensitive operations (subscription creation/updates)
- Use service role key ONLY in Edge Functions (never in client code)
- Test policies with different users
- Regularly audit access logs

### ❌ DON'T:
- Never expose service role key to client
- Don't allow users to modify trial dates
- Don't allow users to set their own subscription_status
- Don't skip RLS policies thinking "I'll add them later"

---

## 6. Testing Your Policies

### Test 1: User can read own profile
```javascript
// In browser console (while logged in):
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .single();

console.log(data); // Should return YOUR profile only
```

### Test 2: User CANNOT read other profiles
```javascript
// Try to read a different user's profile:
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', 'some-other-user-id');

console.log(data); // Should return empty or error
```

### Test 3: User CANNOT modify subscription_status
```javascript
// Try to upgrade yourself for free:
const { error } = await supabase
  .from('profiles')
  .update({ subscription_status: 'active' })
  .eq('id', 'your-user-id');

console.log(error); // Should fail with RLS error
```

---

## 7. Edge Function Security

Your Edge Functions should use the service role key to bypass RLS when needed.

### Example: Create Subscription Edge Function

```typescript
// In your Edge Function:
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Service role key
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Now you can modify subscriptions:
const { error } = await supabaseAdmin
  .from('subscriptions')
  .insert({
    user_id: userId,
    plan_type: 'yearly',
    status: 'active'
  })
```

---

## 8. Migration Checklist

Before going to production:

- [ ] RLS enabled on all tables
- [ ] All policies created and tested
- [ ] Service role key ONLY in Edge Functions
- [ ] Anon key in client code (already correct)
- [ ] Tested with multiple user accounts
- [ ] Cannot access other users' data
- [ ] Cannot modify subscription status from client
- [ ] Edge Functions working correctly with service role

---

## Need Help?

If you see errors after applying policies:
1. Check Supabase logs: Dashboard → Logs
2. Test each policy individually
3. Verify user is authenticated (auth.uid() is not null)
4. Check that table column names match exactly

---

## Additional Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers)
