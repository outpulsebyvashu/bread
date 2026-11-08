import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Server client bound to the signed-in user's session, so RLS still applies.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          try {
            toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Called from a Server Component, where cookies are read-only.
            // Session refresh will be handled by the auth middleware in step 4.
          }
        },
      },
    },
  );
}
