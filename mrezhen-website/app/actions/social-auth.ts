'use server'

import { signIn } from "@/app/auth"

const ALLOWED_PROVIDERS = ["github", "google"]

export async function doSocialLogin(provider: string) {
  if (!ALLOWED_PROVIDERS.includes(provider)) {
    throw new Error("Invalid provider")
  }
  await signIn(provider, { 
    redirectTo: "/community"
  })
}