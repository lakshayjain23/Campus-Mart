# Campus Mart — Production Audit Report

**Date:** 2026-10-14  
**Project:** Campus Mart — Student-focused Online Marketplace  
**Live Application:** [https://campus-mart-sandy.vercel.app/](https://campus-mart-sandy.vercel.app/)  
**Database Backend:** Supabase (Project ID: `krywmdjbtzhkzkxyjwcp`, Region: `ap-south-1`)  
**Auditor:** Principal Full-Stack & Security Engineer (Antigravity)

---

## 1. Architecture & Framework Discovery

- **Frontend Framework:** React 19 (`react` 19.2.8, `react-dom` 19.2.8) with TypeScript (~6.0.2).
- **Build Tool & Bundler:** Vite 8.3.4 with `@tailwindcss/vite` 4.3.3.
- **Routing:** React Router DOM v7 (`react-router-dom` 7.18.4) client-side SPA routing.
- **Styling:** Tailwind CSS v4 with custom utility tokens and modern green campus palette (`#064E3B`, `#15803D`, `#22C55E`).
- **Icons:** Lucide React (`lucide-react` 1.55.0).
- **Backend & Database:** Supabase (`@supabase/supabase-js` 2.117.3) PostgreSQL 17 on AWS ap-south-1.
- **Hosting & Deployment:** Vercel.

---

## 2. Confirmed Bugs & Security Vulnerabilities

### Critical / High Security Deficiencies
1. **Critical: Permissive RLS Policies on `products` Table (`Allow anon update on products`)**
   - *Evidence:* In Postgres `pg_policies`, `products` has an UPDATE policy with `roles: {anon, authenticated}` and `qual: true`.
   - *Risk:* Any anonymous client with the public anon key can alter prices, titles, or seller details of any listing in the database without authentication or ownership verification.
2. **Critical: Anonymous Read Access on Private Inquiries and Reservations**
   - *Evidence:* `contact_inquiries`, `product_enquiries`, and `reservations` all have `roles: {anon, authenticated}` with `cmd: SELECT` and `qual: true`.
   - *Risk:* Anyone can query all student names, contact email addresses, meetup locations, private chat inquiries, and order items.
3. **High: Unauthenticated Image Uploads Storing Base64 Blobs in PostgreSQL**
   - *Evidence:* `storage.buckets` contains 0 buckets. `SellPage.tsx` converts image files into base64 strings (`FileReader.readAsDataURL`) and writes them directly into `products.images` (`text[]`).
   - *Risk:* Storing megabytes of base64 data in PostgreSQL rows bloats the database, degrades query latency, and risks request timeout failures.
4. **High: Absent Authentication System**
   - *Evidence:* Grep for `supabase.auth` in `src/` yielded 0 results. The navbar renders a mock student account (`demo.student@campus.edu`), and `SellPage.tsx` generates temporary `seller-${Date.now()}` IDs.
   - *Risk:* No genuine user identity, no account verification, no password recovery, and no way to enforce listing ownership.

### Functional & UX Defects
5. **Silent Failure Suppression in Checkout**
   - *Evidence:* In `src/pages/CartPage.tsx`:
     ```typescript
     catch (err: any) {
       console.error('Reservation error:', err);
       setConfirmedModalOpen(true); // Falsely displays confirmation even on failure!
     }
     ```
   - *Risk:* Users believe their order was placed even if network or database insertion fails.
6. **Broken Seller Navigation & Missing Dashboard**
   - *Evidence:* The user dropdown item "My Active Listings" links to `/sell` instead of a seller dashboard. Sellers have no UI to manage, edit, mark sold, or delete their listings.
7. **No Buyer Order / Enquiry Tracking**
   - *Evidence:* Inquiries and reservations are sent to the database, but users have no view to review their pending reservations or sent enquiries.
8. **Impure Renders & Lint Warnings in React 19**
   - *Evidence:* `Footer.tsx` and `SellPage.tsx` call `new Date()` inside render functions. `Navbar.tsx` and `ExplorePage.tsx` trigger cascading renders via `setState` in effects.
9. **Missing Error Boundary & Dedicated 404 Page**
   - *Evidence:* Route `*` redirects to `HomePage` rather than rendering a structured 404 Not Found layout. Uncaught runtime crashes take down the entire tree without a fallback UI.

---

## 3. Existing Features that Work

- **College Discovery & Switching:** Dynamic college selector modal with search and instant campus marketplace filtering; campus persistence in Supabase `campuses` table.
- **Product Exploration & Search:** Keyword searching, category filtering, condition filtering, price slider, and sorting in `ExplorePage`.
- **Product Details:** High-detail view with price discounts, pickup badges, seller response times, specs, similar products, and share link.
- **Product Enquiry Modal:** Submits structured enquiries to Supabase `product_enquiries`.
- **Contact Support:** Submits inquiries to Supabase `contact_inquiries`.
- **Cart & Wishlist Local State:** Cart count badge, line item quantity manipulation, and local storage synchronization.
- **Static Trust & Policy Pages:** Terms of Service, Privacy Policy, Safety Guidelines.

---

## 4. Missing Functionality (To Reach Production Quality)

1. **Supabase Auth & User Profiles:**
   - Sign up / Log in modal or page with email and password.
   - College email validation & student verification indicator.
   - Persistent session restoration and auth state listener in context.
   - Profile table with student details (college, hostel, department, year, phone/contact).
2. **Supabase Storage Bucket (`product-images`):**
   - Dedicated public storage bucket for product pictures.
   - Client-side image upload utility with file type and size validation.
   - Generates unique secure object paths: `{userId}/{timestamp}-{filename}`.
3. **Seller Dashboard & Listing Management:**
   - Dedicated `/dashboard` or `/my-listings` route.
   - List seller's own listings with active/sold status toggle.
   - Edit listing details (price, description, meetup point).
   - Delete / Archive listing.
4. **Orders & Reservations Dashboard:**
   - "My Reservations" tab for buyers.
   - "Incoming Orders" tab for sellers.
   - Status updates (Pending, Confirmed, Completed, Cancelled).
5. **Security & Row Level Security (RLS) Hardening:**
   - Update `products` RLS so only listing owners can UPDATE or DELETE their listings.
   - Restrict `product_enquiries` read access so only the sender or recipient seller can view.
   - Restrict `reservations` read access so only the placing user or involved seller can view.
   - Restrict `contact_inquiries` read access to service role / admin.
6. **Error Boundary & 404 Experience:**
   - React Error Boundary wrapping the route tree with reload/recovery option.
   - Polished 404 Not Found page with return-to-marketplace navigation.

---

## 5. Recommended Implementation Order

- **Phase 2 — Foundation & Stability:**
  - Fix React 19 linter warnings (Date purity, effect setState, exported non-components).
  - Add React Error Boundary and NotFoundPage.
  - Fix silent error handling in `CartPage.tsx` and `SellPage.tsx`.

- **Phase 3 — Supabase Hardening (Auth, Storage, RLS, Schema):**
  - Create Supabase storage bucket `product-images` with appropriate RLS policies.
  - Create database migration for `profiles` table and adjust `products`, `reservations`, `product_enquiries` foreign keys/indexes.
  - Reconfigure strict least-privilege RLS policies.
  - Implement full Supabase Auth (Sign In / Sign Up / Sign Out / Profile management).

- **Phase 4 — Marketplace Feature Completion:**
  - Connect `SellPage` to real Supabase Auth session and Supabase Storage upload.
  - Create Seller Dashboard (`/my-listings`) with Edit, Delete, and Mark as Sold.
  - Create Orders / Reservations view (`/my-orders`).
  - Create Inquiries inbox (`/my-inquiries`).

- **Phase 5 — UI Polish, Mobile Responsiveness & Accessibility:**
  - Ensure mobile drawer, modal viewports (320px–430px), focus rings, and contrast comply with WCAG 2.2 AA.

- **Phase 6 — Testing & Verification:**
  - Unit tests for validation, price calculations, and filters.
  - Integration tests for auth and database operations.
  - Production build verification.
