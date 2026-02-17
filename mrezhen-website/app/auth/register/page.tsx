'use client'

import { useActionState } from "react"
import Link from "next/link"
import { register } from "@/app/actions/auth"
import { doSocialLogin } from "@/app/actions/social-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Lock, User } from "lucide-react"
import { FaGithub } from "react-icons/fa"
import { FcGoogle } from "react-icons/fc"
import { useTranslations } from "next-intl"

export default function RegisterPage() {
  const [state, action, isPending] = useActionState(register, undefined)
  const t = useTranslations("auth")

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:6rem_4rem]"></div>

      <Card className="w-full max-w-md shadow-2xl border-border bg-card/80 backdrop-blur-xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-extrabold tracking-tight">{t("createAccount")}</CardTitle>
          <CardDescription className="text-muted-foreground">
            {t("createAccountDesc")}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form action={action} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("fullName")}</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  name="name" 
                  id="name" 
                  placeholder="John Doe" 
                  required 
                  className="pl-10 bg-muted/50 border-border focus:bg-card transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  name="email" 
                  id="email" 
                  type="email" 
                  placeholder="name@example.com" 
                  required 
                  className="pl-10 bg-muted/50 border-border focus:bg-card transition-all"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">{t("password")}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  name="password" 
                  id="password" 
                  type="password" 
                  placeholder="••••••••"
                  required 
                  className="pl-10 bg-muted/50 border-border focus:bg-card transition-all"
                />
              </div>
            </div>
            
            {state?.error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-100 rounded-md flex items-center gap-2">
                 ⚠️ {state.error}
              </div>
            )}

            {state?.success && (
              <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-100 rounded-md flex items-center gap-2">
                 ✅ {state.success}
              </div>
            )}

            <Button type="submit" className="w-full font-bold shadow-sm" disabled={isPending}>
              {isPending ? t("creating") : t("create")}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground font-medium">
                {t("orContinueWith")}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <form action={() => doSocialLogin("github")}>
              <Button variant="outline" className="w-full relative" type="submit">
                <FaGithub className="mr-2 h-4 w-4 text-foreground" />
                GitHub
              </Button>
            </form>

            <form action={() => doSocialLogin("google")}>
              <Button variant="outline" className="w-full relative" type="submit">
                <FcGoogle className="mr-2 h-4 w-4" />
                Google
              </Button>
            </form>
          </div>
        </CardContent>
        
        <CardFooter className="justify-center border-t p-6">
          <p className="text-sm text-muted-foreground">
            {t("alreadyHaveAccount")}{" "}
            <Link href="/auth/login" className="font-semibold text-foreground hover:underline">
              {t("signInLink")}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}