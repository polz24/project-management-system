
/**
 * This file contains the authentication provider for Supabase.
 * It uses the Supabase client to authenticate users and store their data in localStorage.
 * It also fetches the user data from the public.users table.
 */
import { supabaseClient } from "@/utilities/supabaseClient"
import { AuthBindings } from "@refinedev/core"

export const authCredentials = {
  email: "admin@example.com", // default demo credentials
  password: "admin", // default demo credentials
}

export const authProvider: AuthBindings = {
  login: async ({ email, password }) => {
    try {
      // First authenticate with Supabase Auth
      const { data: authData, error: authError } =
        await supabaseClient.auth.signInWithPassword({
          email,
          password,
        })

      if (authError) throw authError

      if (!authData.user?.id) throw new Error("User not found")

      // Then fetch the user data from your public.users table
      const { data: userData, error: userError } = await supabaseClient
        .from("users")
        .select("*")
        .eq("id", authData.user.id)
        .single()

      if (userError) throw userError

      // Store auth data in localStorage
      localStorage.setItem("auth", JSON.stringify(authData))
      localStorage.setItem("token", authData.session?.access_token || "")
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...authData.user,
          ...userData,
        })
      )

      return {
        success: true,
        redirectTo: "/",
      }
    } catch (error) {
      return {
        success: false,
        error: {
          message: "Invalid credentials",
          name: "Invalid credentials",
        },
      }
    }
  },

  logout: async () => {
    try {
      const { error } = await supabaseClient.auth.signOut()
      if (error) {
        return {
          success: false,
          error: new Error(error.message), // Convert to Error object
        }
      }
      // Clear localStorage
      localStorage.removeItem("auth")
      localStorage.removeItem("token")
      localStorage.removeItem("user")

      return {
        success: true,
        redirectTo: "/login",
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Logout failed"),
      }
    }
  },

  getIdentity: async () => {
    try {
      // First try to get from localStorage
      const storedUser = localStorage.getItem("user")
      if (storedUser) {
        const userData = JSON.parse(storedUser)
        return {
          ...userData,
          name: userData.user_name, // for compatibility with refine components
        }
      }

      const {
        data: { user },
        error,
      } = await supabaseClient.auth.getUser()
      if (error || !user) throw error || new Error("User not found")

      // Get user data from users table
      const { data: userData, error: userError } = await supabaseClient
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single()

      if (userError || !userData) throw userError || new Error("User not found")

      const fullUser = {
        ...user,
        ...userData,
        name: userData.user_name,
      }

      // Store in localStorage
      localStorage.setItem("user", JSON.stringify(fullUser))

      return fullUser
    } catch (error) {
      return null
    }
  },

  check: async () => {
    try {
      // First check localStorage
      const storedAuth = localStorage.getItem("auth")
      const storedUser = localStorage.getItem("user")

      if (!storedAuth || !storedUser) {
        // If no stored data, check with Supabase
        const {
          data: { session },
          error,
        } = await supabaseClient.auth.getSession()
        if (error || !session) {
          throw new Error("No session found")
        }

        // Get user data and store it
        const { data: userData, error: userError } = await supabaseClient
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single()

        if (userError || !userData) throw new Error("User not found")

        // Store the data
        localStorage.setItem(
          "auth",
          JSON.stringify({ session, user: session.user })
        )
        localStorage.setItem("token", session.access_token)
        localStorage.setItem(
          "user",
          JSON.stringify({
            ...session.user,
            ...userData,
          })
        )
      }

      return {
        authenticated: true,
      }
    } catch (error) {
      // Clear any invalid data
      localStorage.removeItem("auth")
      localStorage.removeItem("token")
      localStorage.removeItem("user")

      return {
        authenticated: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
        logout: true,
        redirectTo: "/login",
      }
    }
  },

  onError: async (error) => {
    console.error(error)
    return { error }
  },
}
