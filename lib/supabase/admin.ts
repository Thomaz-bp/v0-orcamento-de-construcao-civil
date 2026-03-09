import { createClient } from '@supabase/supabase-js'

/**
 * Admin client with service role key for server-side operations
 * that need to bypass RLS or perform admin tasks.
 * Only use in API routes, never in client components.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
