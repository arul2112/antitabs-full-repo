# Security Checklist - AntiTabs Landing Page

## Pre-Deployment Security Checklist

Use this checklist before deploying to production. Check off each item as you complete it.

---

## 1. Environment Variables & Secrets

### Development
- [x] `.env` file created with all required variables
- [x] `.gitignore` file in place (prevents `.env` from being committed)
- [ ] Verify `.env` is NOT in Git history (`git log --all --full-history -- .env`)

### Production
- [ ] Production environment variables configured in hosting platform (Vercel/Netlify/etc.)
- [ ] All `VITE_*` variables are public keys only (no secrets)
- [ ] Service role key stored ONLY in Edge Functions environment
- [ ] Razorpay live keys configured (replace test keys)

**Required Environment Variables:**
```bash
# Public (safe to expose):
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_RAZORPAY_KEY_ID=rzp_live_xxx  # Use live key in production

# Private (NEVER in client code):
# These should ONLY be in Edge Functions:
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

---

## 2. Supabase Security

### Row Level Security (RLS)
- [ ] RLS enabled on `profiles` table
- [ ] RLS enabled on `subscriptions` table
- [ ] Users can only read their own profile
- [ ] Users can only insert their own profile (on signup)
- [ ] Users CANNOT modify `subscription_status` directly
- [ ] Users CANNOT modify `trial_ends_at` directly
- [ ] Tested RLS policies with multiple user accounts

**How to verify:**
1. Log in as User A
2. Try to read User B's profile → Should fail
3. Try to update own `subscription_status` → Should fail
4. Try to read own profile → Should succeed

### Database Policies
- [ ] No public tables (all tables require authentication)
- [ ] Subscription operations ONLY via Edge Functions
- [ ] Profile creation includes 1-day trial by default

---

## 3. Authentication

### Supabase Auth Configuration
- [ ] Email confirmation enabled
- [ ] Password strength requirements set (min 6 characters)
- [ ] Rate limiting enabled on auth endpoints
- [ ] Email templates customized with your branding
- [ ] Redirect URLs whitelisted in Supabase dashboard

### Session Management
- [ ] Sessions stored in localStorage (default Supabase behavior)
- [ ] Auto-refresh tokens enabled
- [ ] Session expiry configured (default 7 days)

---

## 4. Payment Security (Razorpay)

### Configuration
- [ ] Using Razorpay test keys in development
- [ ] Using Razorpay live keys in production
- [ ] Webhook configured in Razorpay dashboard
- [ ] Webhook secret stored in Edge Function environment
- [ ] Payment creation happens server-side (Edge Function)
- [ ] Payment verification happens server-side

### Client-Side Security
- [ ] Only `key_id` exposed to client (not secret)
- [ ] Subscription ID comes from server
- [ ] Payment data stored in sessionStorage (not localStorage)
- [ ] Payment data cleared after use

---

## 5. Code Security

### Console Logs
- [x] Production console.logs removed or gated with `import.meta.env.DEV`
- [x] Sensitive data not logged (payment IDs, user data, etc.)
- [ ] Error messages don't reveal database schema

### Input Validation
- [ ] Email validation on client and server
- [ ] Password strength validation (min 6 chars)
- [ ] XSS prevention (React handles this by default)
- [ ] SQL injection prevention (Supabase handles this)

### Dependencies
- [ ] All npm packages up to date
- [ ] No known vulnerabilities (`npm audit` shows no high/critical issues)
- [ ] Only trusted packages installed

---

## 6. Edge Functions Security

### Authentication
- [ ] All Edge Functions verify user authentication
- [ ] Service role key used ONLY in Edge Functions
- [ ] CORS configured properly

### Authorization
- [ ] Users can only create subscriptions for themselves
- [ ] Subscription updates verify ownership
- [ ] Rate limiting on expensive operations

---

## 7. Frontend Security

### Headers & CSP
- [ ] Content Security Policy (CSP) configured
- [ ] X-Frame-Options: DENY
- [ ] X-Content-Type-Options: nosniff
- [ ] Referrer-Policy: no-referrer-when-downgrade

**Recommended CSP Header:**
```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://checkout.razorpay.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://*.supabase.co https://api.razorpay.com;
```

### HTTPS
- [ ] Production site uses HTTPS only
- [ ] HTTP redirects to HTTPS
- [ ] Secure cookies enabled

---

## 8. Git & Version Control

### Repository Security
- [x] `.gitignore` includes `.env`, `node_modules`, `build/`
- [ ] No secrets in Git history
- [ ] Repository set to private (if applicable)
- [ ] Access tokens rotated if repository was ever public

### Commit History
```bash
# Check if .env was ever committed:
git log --all --full-history -- .env

# If found, you MUST:
# 1. Rotate all keys in .env
# 2. Use git-filter-repo to remove from history
# 3. Force push to remote (if safe to do so)
```

---

## 9. Testing

### Security Tests
- [ ] Cannot access other users' data
- [ ] Cannot modify subscription without payment
- [ ] Cannot extend trial period manually
- [ ] Authentication required for all protected routes
- [ ] Rate limiting works on auth endpoints

### Payment Tests
- [ ] Test payment with Razorpay test card
- [ ] Verify subscription created in database
- [ ] Verify user profile updated correctly
- [ ] Test payment failure scenario
- [ ] Test webhook handling

---

## 10. Monitoring & Logging

### Supabase Dashboard
- [ ] Auth logs monitored for suspicious activity
- [ ] Database query performance monitored
- [ ] Error logs reviewed regularly

### Razorpay Dashboard
- [ ] Payment logs monitored
- [ ] Failed payments reviewed
- [ ] Webhook delivery monitored

### Application Monitoring
- [ ] Error tracking configured (Sentry/etc.)
- [ ] Uptime monitoring configured
- [ ] Performance monitoring configured

---

## 11. Deployment

### Pre-Deployment
- [ ] All tests passing
- [ ] Build process successful
- [ ] Production environment variables configured
- [ ] Database migrations run (if any)
- [ ] Edge Functions deployed

### Post-Deployment
- [ ] Site accessible via HTTPS
- [ ] Authentication working
- [ ] Payment flow working end-to-end
- [ ] Webhooks receiving events
- [ ] No console errors in browser

---

## 12. Incident Response

### Preparation
- [ ] Security contact email configured
- [ ] Key rotation procedure documented
- [ ] Backup restoration procedure tested
- [ ] Emergency access to all services documented

### In Case of Breach
1. **Immediately:**
   - Rotate all API keys and secrets
   - Lock down affected accounts
   - Review access logs

2. **Within 24 hours:**
   - Notify affected users (if applicable)
   - Document incident
   - Implement fixes

3. **Follow-up:**
   - Post-mortem analysis
   - Update security procedures
   - Additional security training

---

## Emergency Contacts

**Supabase Support:** support@supabase.io
**Razorpay Support:** support@razorpay.com
**Your Security Contact:** [Add your email]

---

## Key Rotation Schedule

- [ ] Rotate Razorpay keys: Annually
- [ ] Rotate Supabase anon key: When compromised
- [ ] Review Edge Function secrets: Quarterly
- [ ] Review user access: Monthly

---

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/platform/security)
- [Razorpay Security](https://razorpay.com/docs/payments/security/)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

---

## Sign-Off

Before deploying to production, this checklist must be reviewed and signed off by:

- [ ] Developer: _________________ Date: _______
- [ ] Security Reviewer: __________ Date: _______
- [ ] Project Owner: ______________ Date: _______

---

**Last Updated:** 2025-01-24
**Version:** 1.0
