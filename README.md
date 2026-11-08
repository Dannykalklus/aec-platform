# AEC Thesis & Assignment Platform

Website for Academic Experts Consults: public site, WhatsApp consultation, and (from Week 3) orders, previews and MoMo payment confirmation. Built from the PRD "AEC Thesis & Assignment Platform: Product Requirements Document".

## What is built (Weeks 1 to 4)

| Part | Where |
| --- | --- |
| Public site: home, services, how it works, pricing, FAQs, contact, terms, privacy, refunds | `src/pages` |
| Consultation form that saves a lead and opens WhatsApp with a prefilled message | `src/components/Consultation.jsx` |
| Business settings (WhatsApp, MoMo, deposit, preview %) in one place | `src/lib/config.js` |
| AEC brand palette and fonts (PRD section 15) | `tailwind.config.js`, `src/index.css` |
| Logo, emblem and favicon cut from the logo file | `public/brand`, `public/favicon.png` |
| Full database: tables, security rules, guest orders, deposit and payment functions, private storage | `supabase/schema.sql` |
| Netlify build, SPA routing and security headers | `netlify.toml` |
| Sign up, log in, password reset, My orders | `src/pages/Auth.jsx`, `src/pages/Account.jsx` |
| Order form with file uploads (guests or accounts) | `src/pages/Order.jsx` |
| Client order page: quote, MoMo payment, "I have paid", WhatsApp hand-off, preview, download | `src/pages/OrderView.jsx` |
| Admin: dashboard, orders, quotes, payment queue, leads, deliverable upload | `src/pages/Admin.jsx` |
| Watermarked preview builder (first 30% clear, rest blurred) | `src/lib/preview.js` |
| Server functions: order access, signed uploads, 10-minute downloads | `netlify/functions` |

The site works without Supabase. Consultations still open WhatsApp; they are just not saved until Supabase is connected.

## Setup (about 20 minutes)

### 1. GitHub
1. Create an empty repo, for example `Dannykalklus/aec-platform`.
2. In this folder run:
   ```
   git remote add origin https://github.com/Dannykalklus/aec-platform.git
   git push -u origin main
   ```

### 2. Supabase (database, logins, files)
1. Go to supabase.com, create a free project (region: closest to Ghana, for example West EU).
2. Open **SQL Editor > New query**, paste all of `supabase/schema.sql`, and click **Run**.
3. Open **Project Settings > API** and copy the **Project URL** and the **anon public** key.
4. Under **Authentication > Providers**, keep Email on. Google can be added later.

### 3. Netlify (hosting)
1. In Netlify: **Add new site > Import an existing project > GitHub**, pick `aec-platform`.
2. Build command and publish folder are read from `netlify.toml`; leave them.
3. **Site configuration > Environment variables**: add `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` (the service_role key from the same Supabase page; it stays on the server).
4. Deploy. Change the site name to something like `aec-consults` for a cleaner address.

### 4. Make yourself admin
Sign up once on the site, then run in the Supabase SQL Editor:
```sql
update public.profiles set role = 'admin' where email = 'YOUR-EMAIL';
```

## Run locally
```
npm install
cp .env.example .env   # add your Supabase values
npm run dev
```

## Database rules worth knowing
- Visitors cannot read any order, lead or payment directly. Guests reach their order only through its private link (order number plus secret token).
- A MoMo transaction ID can be used once across all orders.
- `confirm_payment` moves a deposit order to In progress, and unlocks downloads only when the full price is paid.
- All storage buckets are private. Files will be shared through 10-minute signed links (Week 4).
- The script can be run again safely; it skips anything that already exists.

## Admin workflow
1. New order arrives: Admin > Dashboard > Orders awaiting a quote.
2. Agree price on WhatsApp if needed, then Quote > Send quote (deposit defaults to 50%).
3. Client accepts and pays the deposit; check MoMo, then Confirm in the payment queue. Status becomes In progress.
4. Upload the finished file plus its PDF export. The preview is built in your browser and the order becomes Ready for preview.
5. Client pays the balance; Confirm it and the download unlocks (10-minute links, 5 downloads per version).

## Still to add
- Email notifications (needs a free Resend account).
- Revision requests (once the revision policy is decided).
- Automatic MoMo confirmation through Paystack or Hubtel (Phase 3).
