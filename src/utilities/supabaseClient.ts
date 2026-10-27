/**
 * Supabase client configuration for the project - Database Connection and Auth
 */
// import { createClient } from "@refinedev/supabase"

// const SUPABASE_URL = "https://ivhwpsslmoojlqxrsxih.supabase.co"

// const SUPABASE_KEY =
//   "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2aHdwc3NsbW9vamxxeHJzeGloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUwOTYxOTksImV4cCI6MjA1MDY3MjE5OX0.vu2yYQgMJryt7Hpbboz8gFEjRSODYpyEZoeOfO_TMpY"

// export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
//   db: {
//     schema: "public",
//   },
//   auth: {
//     persistSession: true,
//   },
// })

/**
 * - Supabase client configuration for the project - Database Connection and Auth
 */
import { createClient } from "@refinedev/supabase"

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Optional: Safeguard check so you notice quickly if variables are missing
if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error("Missing Supabase environment variables!");
}

export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
  db: {
    schema: "public",
  },
  auth: {
    persistSession: true,
  },
})