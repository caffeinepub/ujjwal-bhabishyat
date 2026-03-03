# Ujjwal Bhabishyat

## Current State
- Login system uses a single hardcoded username (`dipak`) and password (`manager123`) stored in localStorage.
- No user registration system exists.
- All authenticated users are admins with full access.
- Backend has teacher, student, and payment management APIs.

## Requested Changes (Diff)

### Add
- User registration flow: new users enter their email and phone number to create a unique User ID.
- The User ID is auto-generated (e.g., UB-XXXXX) and displayed to the user after registration.
- Login page now has two modes: "Login with User ID" and "Register (New User)".
- Backend stores registered users with: userId, email, phone, name, role, createdAt.
- Admin user (Dipak De, phone: +919064934476) is pre-seeded with admin role.
- Regular users have a "user" role with limited read-only access.
- A `getUserByEmail` and `getUserByPhone` backend query to validate login.
- A `registerUser` backend function to create a new user account.
- A `loginUser` backend function that returns user info if credentials match.

### Modify
- Login page: replace username/password form with email + phone login form.
- Auth utility: store userId, email, phone, and role in localStorage after login.
- App.tsx: pass user info to authenticated pages.
- Admin-only pages (Students, Teachers, Payments) still require admin role.

### Remove
- Hardcoded `dipak` / `manager123` credential check.

## Implementation Plan
1. Add `User` type and user storage to backend (`main.mo`).
2. Add `registerUser(email, phone, name)` -> returns generated userId.
3. Add `loginUser(email, phone)` -> returns User or error.
4. Seed admin user for Dipak De (+919064934476) on first call or via a setupAdmin function.
5. Update frontend `auth.ts` to store/retrieve userId, email, phone, role.
6. Update `LoginPage.tsx` to show two tabs: Login (email + phone) and Register (name + email + phone).
7. On successful registration, show the generated User ID to the user.
8. On login, validate email + phone, get user role, store in localStorage.
9. Restrict admin pages to admin-role users; show access denied for regular users.
