import { supabase } from "../lib/supabase"

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({
    email,
    password
  })
}

export async function signUp(email: string, password: string, name?: string) {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
      }
    }
  })
}

export async function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/despensas`
    }
  })
}

export async function signInWithApple() {
  return supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/despensas`
    }
  })
}

export async function signOut() {
  return supabase.auth.signOut()
}