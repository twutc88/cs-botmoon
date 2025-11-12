# Setup Instructions

## 1. Local Development

Create `.env.local` file:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## 2. Supabase Setup

1. Go to https://supabase.com and create a new project
2. Go to SQL Editor and run:

```sql
CREATE TABLE customer_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id BIGINT NOT NULL,
  action_type TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_customer_actions_user_id ON customer_actions(user_id);
CREATE INDEX idx_customer_actions_created_at ON customer_actions(created_at DESC);
```

3. Get your API credentials from Settings > API:
   - Project URL (NEXT_PUBLIC_SUPABASE_URL)
   - anon/public key (NEXT_PUBLIC_SUPABASE_ANON_KEY)

## 3. Vercel Deployment

Set environment variables in Vercel:
- Go to your project settings
- Environment Variables section
- Add:
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY

Then redeploy.

## 4. Login

Password: Tothemoon88#
