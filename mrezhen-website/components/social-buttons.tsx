import { doSocialLogin } from "@/app/actions/social-auth"
import { Button } from "@/components/ui/button"
import { getTranslations } from "next-intl/server"

export async function SocialButtons() {
  const t = await getTranslations("auth")
  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            {t("orContinueWith")}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <form action={async () => {
          await doSocialLogin("github")
        }}>
          <Button variant="outline" className="w-full" type="submit">
            GitHub
          </Button>
        </form>

        <form action={async () => {
          await doSocialLogin("google")
        }}>
          <Button variant="outline" className="w-full" type="submit">
            Google
          </Button>
        </form>
      </div>
    </div>
  )
}