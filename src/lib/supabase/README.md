# Supabase Database Setup

This directory contains the database schema and configuration for the Portfolio Tracker application.

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new account or sign in
2. Create a new project
3. Wait for the project to be fully provisioned

### 2. Get Your Project Credentials

1. In your Supabase dashboard, go to Settings > API
2. Copy your Project URL and anon/public key
3. Update your `.env.local` file with these values:

```env
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 3. Set Up the Database Schema

1. In your Supabase dashboard, go to the SQL Editor
2. Copy the contents of `schema.sql` and run it in the SQL Editor
3. This will create all the necessary tables, indexes, and Row Level Security policies

### 4. Configure Authentication

1. In your Supabase dashboard, go to Authentication > Settings
2. Configure your site URL (for local development: `http://localhost:5173`)
3. Enable Google OAuth if desired:
   - Go to Authentication > Providers
   - Enable Google provider
   - Add your Google OAuth credentials

## Database Schema Overview

### Tables

- **user_profiles**: Extended user information (linked to Supabase auth.users)
- **portfolios**: User's investment portfolios organized by asset type
- **positions**: Individual investment positions within portfolios
- **transactions**: Historical record of all buy/sell transactions

### Security

- Row Level Security (RLS) is enabled on all tables
- Users can only access their own data
- Policies are in place to prevent unauthorized access

### Performance

- Indexes are created on frequently queried columns
- Foreign key relationships are properly established
- Triggers automatically update `updated_at` timestamps

## File Structure

- `client.ts` - Supabase client configuration
- `types.ts` - TypeScript type definitions for the database schema
- `schema.sql` - Complete database schema with tables, indexes, and RLS policies
- `README.md` - This setup guide
