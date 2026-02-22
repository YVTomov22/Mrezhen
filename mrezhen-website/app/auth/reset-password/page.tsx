'use client'

import Link from "next/link"
import { useActionState } from "react"
import { useSearchParams } from "next/navigation"
import { resetPassword } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Lock } from "lucide-react"
import { useTranslations } from "next-intl"

export default function ResetPasswordPage() {
  const t = useTranslations("auth")
  const searchParams = useSearchParams()
  const token = searchParams.get("token") || ""
  const [state, action, isPending] = useActionState(resetPassword, undefined)

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:6rem_4rem]" />

      <Card className="w-full max-w-md shadow-2xl border-border bg-card/80 backdrop-blur-xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-extrabold tracking-tight">{t("resetTitle")}</CardTitle>
          <CardDescription className="text-muted-foreground">{t("resetDescription")}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {!token ? (
            <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-100 rounded-md">
              ⚠️ {t("missingResetToken")}
            </div>
          ) : (
            <form action={action} className="space-y-4">
              <input type="hidden" name="token" value={token} />

              <div className="space-y-2">
                <Label htmlFor="password">{t("newPassword")}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    minLength={8}
                    className="pl-10 bg-muted/50 border-border focus:bg-card transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    minLength={8}
                    className="pl-10 bg-muted/50 border-border focus:bg-card transition-all"
                  />
                </div>
              </div>

              {state?.error && (
                <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-100 rounded-md">
                  ⚠️ {state.error}
                </div>
              )}

              {state?.success && (
                <div className="p-3 text-sm text-green-700 bg-green-50 border border-green-100 rounded-md">
                  ✅ {state.success}
                </div>
              )}

              <Button type="submit" className="w-full font-bold" disabled={isPending}>
                {isPending ? t("resettingPassword") : t("resetPassword")}
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter className="justify-center border-t p-6">
          <p className="text-sm text-muted-foreground">
            <Link href="/auth/login" className="font-semibold text-foreground hover:underline">
              {t("backToSignIn")}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
