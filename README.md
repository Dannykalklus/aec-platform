# AEC Thesis & Assignment Platform

Website for Academic Experts Consults: public site, WhatsApp consultation, and (from Week 3) orders, previews and MoMo payment confirmation. Built from the PRD "AEC Thesis & Assignment Platform: Product Requirements Document".

## What is in Week 1

| Part | Where |
| --- | --- |
| Public site: home, services, how it works, pricing, FAQs, contact, terms, privacy, refunds | `src/pages` |
| Consultation form that saves a lead and opens WhatsApp with a prefilled message | `src/components/Consultation.jsx` |
| Business settings (WhatsApp, MoMo, deposit, preview %) in one place | `src/lib/config.js` |
| AEC brand palette and fonts (PRD section 15) | `tailwind.config.js`, `src/index.css` |
| Logo, emblem and favicon cut from the logo file | `public/brand`, `public/favicon.png` |
| Full database: tables, security rules, guest orders, deposit and payment functions, private storage | `supabase/schema.sql` |
| Netlify build, SPA routing and security headers | `netlify.toml` |

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
3. **Site configuration > Environment variables**: add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` with the values from step 2.3.
4. Deploy. Change the site name to something like `aec-consults` for a cleaner address.

### 4. Make yourself admin (after the login pages arrive in Week 2)
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

## Next
- Week 2: sign-up and login, guest order links.
- Week 3: order form with uploads, admin dashboard, quotes, email notices.
- Week 4: watermarked previews, "I have paid" flow, payment queue, signed downloads.
