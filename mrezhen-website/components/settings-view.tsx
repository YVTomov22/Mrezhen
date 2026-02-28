'use client'

import { useState, useRef, useTransition, useEffect } from "react"
import { useFormStatus } from "react-dom"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import {
  updateUsername,
  updateEmail,
  updatePassword,
  updateDetails,
  updateAvatar,
  updatePhone,
  updateAccountType,
  deactivateAccount,
  deleteAccount,
} from "@/app/actions/profile"
import {
  updatePrivacyToggle,
  updatePrivacySelect,
  updatePrivacyList,
} from "@/app/actions/privacy"
import {
  updateAppearanceToggle,
  updateAppearanceSelect,
} from "@/app/actions/appearance"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Camera,
  Loader2,
  User,
  AtSign,
  FileText,
  ImageIcon,
  Mail,
  Phone,
  Lock,
  PowerOff,
  Trash2,
  ShieldCheck,
  Briefcase,
  Heart,
  Home,
  BookOpen,
  Activity,
  Eye,
  MessageCircle,
  Share2,
  Search,
  EyeOff,
  Users,
  Globe,
  Sun,
  Moon,
  Monitor,
  Languages,
  Wifi,
  Play,
  Accessibility,
  Type,
  Palette,
  Newspaper,
  Bookmark,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"
import { signOut } from "next-auth/react"

/* Sidebar menu items */
type SectionId = "username" | "displayname" | "bio" | "photo" | "email" | "phone" | "password" | "deactivate" | "delete" | "logout" | "verification" | "accounttype" | "region" | "demographics" | "household" | "health" | "education" | "interests" | "profileprivacy" | "interactions" | "contentcontrols" | "discovery" | "theme" | "language" | "datasaver" | "accessibility" | "myposts" | "likedposts" | "savedposts"

/* Root component */

export function SettingsView({ user }: { user: any }) {
  const [active, setActive] = useState<SectionId>("username")
  const t = useTranslations("settings")
  const tCommon = useTranslations("common")

  // Ref to the scrollable right panel — used for manual scrolling so
  // we never call window-level scrollIntoView which scrolls the page.
  const scrollPaneRef = useRef<HTMLElement>(null)

  // Prevent the window from ever scrolling while on the settings page.
  // Without this, a broken height chain (e.g. margin instead of gap)
  // or a browser auto-scroll-to-focus event would scroll the page body.
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = prev }
  }, [])

  const sections = [
    {
      group: t("groupAccount"),
      description: t("groupAccountDesc"),
      items: [
        { id: "username" as SectionId,    label: t("menuUsername"),           icon: AtSign },
        { id: "displayname" as SectionId, label: t("menuDisplayName"),       icon: User },
        { id: "bio" as SectionId,         label: t("menuBio"),                icon: FileText },
        { id: "photo" as SectionId,       label: t("menuProfilePhoto"),      icon: ImageIcon },
        { id: "email" as SectionId,       label: t("menuEmail"),              icon: Mail },
        { id: "phone" as SectionId,       label: t("menuPhoneNumber"),       icon: Phone },
        { id: "password" as SectionId,    label: t("menuChangePassword"),    icon: Lock },
        { id: "deactivate" as SectionId,  label: t("menuDeactivateAccount"), icon: PowerOff },
        { id: "delete" as SectionId,      label: t("menuDeleteAccount"),     icon: Trash2 },
        { id: "logout" as SectionId,      label: "Log Out",                  icon: LogOut },
      ],
    },
    {
      group: t("groupAccountOptions"),
      description: t("groupAccountOptionsDesc"),
      items: [
        { id: "verification" as SectionId, label: t("menuVerificationStatus"), icon: ShieldCheck },
        { id: "accounttype" as SectionId,  label: t("menuAccountType"),        icon: Briefcase },
        { id: "region" as SectionId,       label: t("menuRegion") ?? "Region",  icon: Globe },
      ],
    },
    {
      group: t("groupPrivacy"),
      description: t("groupPrivacyDesc"),
      items: [
        { id: "profileprivacy" as SectionId,  label: t("menuProfilePrivacy"),  icon: Eye },
        { id: "interactions" as SectionId,    label: t("menuInteractions"),    icon: MessageCircle },
        { id: "contentcontrols" as SectionId, label: t("menuStoryContent"),    icon: EyeOff },
        { id: "discovery" as SectionId,       label: t("menuDiscovery"),       icon: Search },
      ],
    },
    {
      group: t("groupAppearance"),
      description: t("groupAppearanceDesc"),
      items: [
        { id: "theme" as SectionId,         label: t("menuTheme"),         icon: Palette },
        { id: "language" as SectionId,      label: t("menuLanguage"),      icon: Languages },
        { id: "datasaver" as SectionId,     label: t("menuDataPlayback"),  icon: Wifi },
        { id: "accessibility" as SectionId, label: t("menuAccessibility"), icon: Accessibility },
      ],
    },
    {
      group: t("groupProfileDetails"),
      description: t("groupProfileDetailsDesc"),
      items: [
        { id: "demographics" as SectionId, label: t("menuDemographics"),    icon: User },
        { id: "household" as SectionId,    label: t("menuHousehold"),       icon: Home },
        { id: "health" as SectionId,       label: t("menuHealthStats"),     icon: Activity },
        { id: "education" as SectionId,    label: t("menuWorkBackground"),  icon: BookOpen },
        { id: "interests" as SectionId,    label: t("menuInterests"),       icon: Heart },
      ],
    },
    {
      group: t("groupPosts"),
      description: t("groupPostsDesc"),
      items: [
        { id: "myposts" as SectionId,    label: t("menuMyPosts"),    icon: Newspaper },
        { id: "likedposts" as SectionId, label: t("menuLikedPosts"), icon: Heart },
        { id: "savedposts" as SectionId, label: t("menuSavedPosts"), icon: Bookmark },
      ],
    },
  ]

  const [activeCategory, setActiveCategory] = useState<number>(0)

  const categoryIcons = [AtSign, ShieldCheck, Eye, Palette, User, Newspaper]

  return (
    <div className="flex gap-2 flex-1 min-h-0">
      {/* Category nav */}
      <aside className="flex flex-col gap-1 w-52 shrink-0">
        {sections.map((section, idx) => {
          const CatIcon = categoryIcons[idx]
          const isActive = activeCategory === idx
          return (
            <button
              key={section.group}
              onClick={() => { setActiveCategory(idx); setActive(section.items[0].id) }}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-full border text-left transition-all duration-150 relative overflow-hidden",
                isActive
                  ? "bg-primary/10 text-primary border-transparent dark:bg-white/5 dark:text-white"
                  : "bg-transparent border-transparent hover:bg-accent text-foreground"
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary dark:bg-[#00A3FF]" />
              )}
              <span className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors duration-150",
                isActive ? "bg-primary/20 dark:bg-white/10" : "bg-muted"
              )}>
                <CatIcon className="h-3.5 w-3.5" />
              </span>
              <span className="flex flex-col min-w-0">
                <span className="text-xs font-semibold leading-tight truncate">{section.group}</span>
                <span className={cn(
                  "text-[10px] leading-tight truncate mt-0.5 transition-colors",
                  isActive ? "text-primary/70 dark:text-white/60" : "text-muted-foreground"
                )}>
                  {section.description}
                </span>
              </span>
            </button>
          )
        })}
      </aside>

      {/* Sub-nav */}
      <aside className="flex flex-col gap-0.5 w-44 shrink-0 border-l border-border pl-2">
        {sections[activeCategory].items.map((item) => {
          const Icon = item.icon
          const isActive = active === item.id
          const isDanger = item.id === "delete" || item.id === "deactivate" || item.id === "logout"
          return (
            <button
              key={item.id}
              onClick={() => {
                setActive(item.id)
                // Scroll within the right panel only — never the window.
                // scrollIntoView() without a contained scroll ancestor targets
                // the window, which moves the entire page.
                const pane = scrollPaneRef.current
                const target = document.getElementById(`section-${item.id}`)
                if (pane && target) {
                  pane.scrollTo({ top: target.offsetTop - pane.offsetTop, behavior: 'smooth' })
                }
              }}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-full text-sm font-medium transition-colors text-left relative overflow-hidden",
                isActive
                  ? isDanger
                    ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                    : "bg-primary/10 text-primary dark:bg-white/5 dark:text-white"
                  : isDanger
                  ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              {isActive && !isDanger && (
                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary dark:bg-[#00A3FF]" />
              )}
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </button>
          )
        })}
      </aside>

      {/* Panels */}
      <main ref={scrollPaneRef} className="flex-1 min-w-0 border-l border-border pl-6 overflow-y-auto pr-1 no-scrollbar divide-y divide-border/40">
        {sections[activeCategory].items.map((item) => (
          <div key={item.id} id={`section-${item.id}`} className="scroll-mt-4 py-8 first:pt-0 last:pb-0">
            <SectionPanel id={item.id} user={user} />
          </div>
        ))}
      </main>
    </div>
  )
}

/* Panel Router */

function SectionPanel({ id, user }: { id: SectionId; user: any }) {
  switch (id) {
    case "username":
      return <UsernameSection user={user} />
    case "displayname":
      return <DisplayNameSection user={user} />
    case "bio":
      return <BioSection user={user} />
    case "photo":
      return <PhotoSection user={user} />
    case "email":
      return <EmailSection user={user} />
    case "phone":
      return <PhoneSection user={user} />
    case "password":
      return <PasswordSection user={user} />
    case "deactivate":
      return <DeactivateSection />
    case "delete":
      return <DeleteSection />
    case "logout":
      return <LogoutSection />
    case "verification":
      return <VerificationSection user={user} />
    case "accounttype":
      return <AccountTypeSection user={user} />
    case "region":
      return <RegionSection user={user} />
    case "demographics":
      return <DemographicsSection user={user} />
    case "household":
      return <HouseholdSection user={user} />
    case "health":
      return <HealthSection user={user} />
    case "education":
      return <EducationSection user={user} />
    case "interests":
      return <InterestsSection user={user} />
    case "profileprivacy":
      return <ProfilePrivacySection user={user} />
    case "interactions":
      return <InteractionsPrivacySection user={user} />
    case "contentcontrols":
      return <ContentControlsSection user={user} />
    case "discovery":
      return <DiscoverySection user={user} />
    case "theme":
      return <ThemeSection user={user} />
    case "language":
      return <LanguageSection user={user} />
    case "datasaver":
      return <DataSaverSection user={user} />
    case "accessibility":
      return <AccessibilitySection user={user} />
    case "myposts":
      return <MyPostsSection user={user} />
    case "likedposts":
      return <LikedPostsSection user={user} />
    case "savedposts":
      return <SavedPostsSection user={user} />
    default:
      return null
  }
}

/* ACCOUNT SECTIONS */

/* Username */
function UsernameSection({ user }: { user: any }) {
  const t = useTranslations("settings")
  const tCommon = useTranslations("common")
  const [msg, setMsg] = useState("")
  async function action(data: FormData) {
    const res = await updateUsername(null, data)
    setMsg(res?.error || res?.success || "")
  }
  return (
    <SettingsCard title={t("usernameTitle")} description={t("usernameDescription")}>
      <form action={action}>
        <div className="flex gap-4 items-end">
          <div className="grid w-full gap-3">
            <Label htmlFor="name" className="text-muted-foreground">{t("usernameLabel")}</Label>
            <Input id="name" name="name" defaultValue={user.name || ""} placeholder={t("usernamePlaceholder")} className="settings-input" />
          </div>
          <SubmitBtn />
        </div>
        <Feedback msg={msg} />
      </form>
    </SettingsCard>
  )
}

/* Display Name */
function DisplayNameSection({ user }: { user: any }) {
  const t = useTranslations("settings")
  const tCommon = useTranslations("common")
  const [msg, setMsg] = useState("")
  async function action(data: FormData) {
    const res = await updateUsername(null, data)
    setMsg(res?.error || res?.success || "")
  }
  return (
    <SettingsCard title={t("displayNameTitle")} description={t("displayNameDescription")}>
      <form action={action}>
        <div className="flex gap-4 items-end">
          <div className="grid w-full gap-3">
            <Label htmlFor="displayName" className="text-muted-foreground">{t("displayNameLabel")}</Label>
            <Input id="displayName" name="name" defaultValue={user.name || ""} placeholder={t("displayNamePlaceholder")} className="settings-input" />
          </div>
          <SubmitBtn />
        </div>
        <Feedback msg={msg} />
      </form>
    </SettingsCard>
  )
}

/* Bio */
function BioSection({ user }: { user: any }) {
  const t = useTranslations("settings")
  const tCommon = useTranslations("common")
  const [msg, setMsg] = useState("")
  async function action(data: FormData) {
    const res = await updateDetails(null, data)
    setMsg(res?.error ? `Error: ${res.error}` : t("bioSuccess"))
  }
  return (
    <SettingsCard title={t("bioTitle")} description={t("bioDescription")}>
      <form action={action} className="space-y-4">
        <Textarea name="bio" placeholder={t("bioPlaceholder")} defaultValue={user.bio || ""} className="settings-input resize-none h-28" />
        {/* hidden fields so updateDetails doesn't clear other values */}
        <input type="hidden" name="interests" defaultValue={user.interests?.join(", ") || ""} />
        <HiddenDetailsFields user={user} />
        <div className="flex justify-end">
          <SubmitBtn label={t("saveBio")} />
        </div>
        <Feedback msg={msg} />
      </form>
    </SettingsCard>
  )
}

/* Profile Photo */
function PhotoSection({ user }: { user: any }) {
  const t = useTranslations("settings")
  return (
    <SettingsCard title={t("photoTitle")} description={t("photoDescription")}>
      <div className="flex items-center gap-6">
        <AvatarUpload user={user} size="lg" />
        <div className="text-sm text-muted-foreground">
          <p>{t("photoRecommendation")}</p>
          <p className="text-xs mt-1 text-muted-foreground">{t("photoFormats")}</p>
        </div>
      </div>
    </SettingsCard>
  )
}

/* Email */
function EmailSection({ user }: { user: any }) {
  const t = useTranslations("settings")
  const [msg, setMsg] = useState("")
  async function action(data: FormData) {
    const res = await updateEmail(null, data)
    setMsg(res?.error || res?.success || "")
  }
  return (
    <SettingsCard title={t("emailTitle")} description={t("emailDescription")}>
      <form action={action}>
        <div className="flex gap-4 items-end">
          <div className="grid w-full gap-3">
            <Label htmlFor="email" className="text-muted-foreground">{t("emailLabel")}</Label>
            <Input id="email" name="email" type="email" defaultValue={user.email || ""} className="settings-input" />
          </div>
          <SubmitBtn />
        </div>
        <Feedback msg={msg} />
      </form>
    </SettingsCard>
  )
}

/* Phone Number */
function PhoneSection({ user }: { user: any }) {
  const t = useTranslations("settings")
  const [msg, setMsg] = useState("")
  async function action(data: FormData) {
    const res = await updatePhone(null, data)
    setMsg(res?.error || res?.success || "")
  }
  return (
    <SettingsCard title={t("phoneTitle")} description={t("phoneDescription")}>
      <form action={action}>
        <div className="flex gap-4 items-end">
          <div className="grid w-full gap-3">
            <Label htmlFor="phone" className="text-muted-foreground">{t("phoneLabel")}</Label>
            <Input id="phone" name="phone" type="tel" placeholder={t("phonePlaceholder")} defaultValue={user.phone || ""} className="settings-input" />
          </div>
          <SubmitBtn />
        </div>
        <Feedback msg={msg} />
      </form>
    </SettingsCard>
  )
}

/* Change Password */
function PasswordSection({ user }: { user: any }) {
  const t = useTranslations("settings")
  const tCommon = useTranslations("common")
  const [msg, setMsg] = useState("")
  const ref = useRef<HTMLFormElement>(null)

  const hasPassword = !!user.password
  const providers = user.accounts?.map((a: any) => a.provider) || []

  async function action(data: FormData) {
    const res = await updatePassword(null, data)
    if (res?.success) { setMsg(t("passwordSuccess")); ref.current?.reset() }
    else setMsg(res?.error || tCommon("somethingWentWrong"))
  }

  if (!hasPassword && providers.length > 0) {
    return (
      <SettingsCard title={t("passwordTitle")} description={t("passwordDescOAuth")}>
        <div className="text-sm text-muted-foreground space-y-2">
          <p>{t("passwordOAuthWith")}<span className="font-semibold capitalize">{providers.join(", ")}</span>.</p>
          <p>{t("passwordOAuthNoPassword")}</p>
        </div>
      </SettingsCard>
    )
  }

  return (
    <SettingsCard title={t("passwordTitle")} description={t("passwordDescription")}>
      <form ref={ref} action={action} className="space-y-4">
        <div className="grid gap-3">
          <Label htmlFor="current" className="text-muted-foreground">{t("currentPassword")}</Label>
          <Input id="current" name="currentPassword" type="password" required className="settings-input" />
        </div>
        <div className="grid gap-3">
          <Label htmlFor="new" className="text-muted-foreground">{t("newPassword")}</Label>
          <Input id="new" name="password" type="password" required className="settings-input" />
        </div>
        <div className="flex justify-between items-center pt-2">
          <Feedback msg={msg} />
          <SubmitBtn label={t("updatePassword")} />
        </div>
      </form>
    </SettingsCard>
  )
}

/* Deactivate Account */
function DeactivateSection() {
  const t = useTranslations("settings")
  const tCommon = useTranslations("common")
  const [confirmed, setConfirmed] = useState(false)

  return (
    <SettingsCard title={t("deactivateTitle")} description={t("deactivateDescription")} danger>
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {t("deactivateWarning")}
        </p>
        {!confirmed ? (
          <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => setConfirmed(true)}>
            {t("deactivateInitiate")}
          </Button>
        ) : (
          <form action={async () => { await deactivateAccount() }}>
            <p className="text-sm font-medium text-red-500 mb-3">{t("deactivateConfirmPrompt")}</p>
            <div className="flex gap-2">
              <Button type="submit" variant="destructive">{t("deactivateConfirm")}</Button>
              <Button type="button" variant="ghost" onClick={() => setConfirmed(false)}>{tCommon("cancel")}</Button>
            </div>
          </form>
        )}
      </div>
    </SettingsCard>
  )
}

/* Delete Account */
function DeleteSection() {
  const t = useTranslations("settings")
  const [msg, setMsg] = useState("")

  async function action(data: FormData) {
    const res = await deleteAccount(null, data)
    if (res?.error) setMsg(res.error)
  }

  return (
    <SettingsCard title={t("deleteTitle")} description={t("deleteDescription")} danger>
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {t("deleteWarning")}
        </p>
        <form action={action} className="space-y-3">
          <div className="grid gap-3">
            <Label htmlFor="confirm" className="text-red-600 font-medium">
              {t("deleteTypeToConfirm")}
            </Label>
            <Input id="confirm" name="confirmation" placeholder={t("deletePlaceholder")} className="settings-input border-red-200 focus-visible:ring-red-400" />
          </div>
          <div className="flex justify-between items-center">
            <Feedback msg={msg} />
            <Button type="submit" variant="destructive">{t("deleteConfirm")}</Button>
          </div>
        </form>
      </div>
    </SettingsCard>
  )
}

/* Log Out */
function LogoutSection() {
  return (
    <SettingsCard title="Log Out" description="Sign out of your account on this device.">
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          You will be redirected to the login page after signing out.
        </p>
        <Button
          variant="outline"
          className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
          onClick={() => signOut({ callbackUrl: "/auth/login" })}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Log Out
        </Button>
      </div>
    </SettingsCard>
  )
}

/* Verification Status */
function VerificationSection({ user }: { user: any }) {
  const t = useTranslations("settings")
  const isVerified = !!user.emailVerified

  return (
    <SettingsCard title={t("verificationTitle")} description={t("verificationDescription")}>
      <div className="flex items-center gap-3">
        {isVerified ? (
          <>
            <Badge className="bg-green-100 text-green-700 border-green-200 gap-1">
              <ShieldCheck className="h-3.5 w-3.5" /> {t("verificationVerified")}
            </Badge>
            <span className="text-sm text-muted-foreground">{t("verificationVerifiedDesc")}</span>
          </>
        ) : (
          <>
            <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200 gap-1">
              {t("verificationUnverified")}
            </Badge>
            <span className="text-sm text-muted-foreground">{t("verificationUnverifiedDesc")}</span>
          </>
        )}
      </div>
    </SettingsCard>
  )
}

/* Account Type */
function AccountTypeSection({ user }: { user: any }) {
  const t = useTranslations("settings")
  const [msg, setMsg] = useState("")
  async function action(data: FormData) {
    const res = await updateAccountType(null, data)
    setMsg(res?.error || res?.success || "")
  }
  return (
    <SettingsCard title={t("accountTypeTitle")} description={t("accountTypeDescription")}>
      <form action={action} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {([
            { value: "personal",  label: t("accountTypePersonal"),  desc: t("accountTypePersonalDesc") },
            { value: "creator",   label: t("accountTypeCreator"),   desc: t("accountTypeCreatorDesc") },
            { value: "business",  label: t("accountTypeBusiness"),  desc: t("accountTypeBusinessDesc") },
          ]).map((opt) => {
            const isCurrent = (user.accountType || "personal") === opt.value
            return (
              <label
                key={opt.value}
                className={cn(
                  "flex flex-col gap-1 p-4 rounded-lg border-2 cursor-pointer transition-colors",
                  isCurrent
                    ? "border-foreground bg-accent"
                    : "border-border hover:border-muted-foreground"
                )}
              >
                <input type="radio" name="accountType" value={opt.value} defaultChecked={isCurrent} className="sr-only" />
                <span className="font-semibold text-sm">{opt.label}</span>
                <span className="text-xs text-muted-foreground">{opt.desc}</span>
                {isCurrent && <Badge className="w-fit mt-1 text-[10px]">{t("accountTypeCurrent")}</Badge>}
              </label>
            )
          })}
        </div>
        <div className="flex justify-end items-center gap-3">
          <Feedback msg={msg} />
          <SubmitBtn label={t("accountTypeSwitch")} />
        </div>
      </form>
    </SettingsCard>
  )
}

/* Profile Detail Sections */

/* Region */
function RegionSection({ user }: { user: any }) {
  const t = useTranslations("settings")
  const [msg, setMsg] = useState("")
  const [isPending, startTransition] = useTransition()

  const regions = [
    { value: "global",  label: "🌍 Global" },
    { value: "na",      label: "🇺🇸 North America" },
    { value: "eu",      label: "🇪🇺 Europe" },
    { value: "asia",    label: "🌏 Asia" },
    { value: "sa",      label: "🌎 South America" },
    { value: "africa",  label: "🌍 Africa" },
    { value: "oceania", label: "🌊 Oceania" },
    { value: "mena",    label: "🏜️ Middle East & North Africa" },
  ]

  async function handleChange(value: string) {
    startTransition(async () => {
      const { updateUserRegion } = await import("@/app/actions/leaderboard")
      const res = await updateUserRegion(value)
      setMsg(res?.error || res?.success || "")
    })
  }

  return (
    <SettingsCard title={t("regionTitle") ?? "Region"} description={t("regionDescription") ?? "Choose your region for regional leaderboard rankings."}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {regions.map((r) => {
            const isCurrent = (user.region || "global") === r.value
            return (
              <button
                key={r.value}
                type="button"
                disabled={isPending}
                onClick={() => handleChange(r.value)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors text-left",
                  isCurrent
                    ? "border-foreground bg-accent"
                    : "border-border hover:border-muted-foreground",
                  isPending && "opacity-50 pointer-events-none"
                )}
              >
                <span className="text-lg">{r.label.split(" ")[0]}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium">{r.label.slice(r.label.indexOf(" ") + 1)}</span>
                  {isCurrent && <Badge className="ml-2 text-[10px]">Current</Badge>}
                </div>
              </button>
            )
          })}
        </div>
        <Feedback msg={msg} />
      </div>
    </SettingsCard>
  )
}

function formatDate(date: string | Date | null) {
  if (!date) return ""
  return new Date(date).toISOString().split("T")[0]
}

/** Hidden fields to prevent updateDetails from clearing unrelated data */
function HiddenDetailsFields({ user }: { user: any }) {
  return (
    <>
      <input type="hidden" name="dateOfBirth" defaultValue={formatDate(user.dateOfBirth)} />
      <input type="hidden" name="gender" defaultValue={user.gender || ""} />
      <input type="hidden" name="maritalStatus" defaultValue={user.maritalStatus || ""} />
      <input type="hidden" name="householdSize" defaultValue={user.householdSize ?? ""} />
      <input type="hidden" name="childrenCount" defaultValue={user.childrenCount ?? ""} />
      <input type="hidden" name="socialSupportLevel" defaultValue={user.socialSupportLevel || ""} />
      <input type="hidden" name="childhoodMathSkill" defaultValue={user.childhoodMathSkill ?? ""} />
      <input type="hidden" name="booksInHome" defaultValue={user.booksInHome || ""} />
      <input type="hidden" name="bmi" defaultValue={user.bmi ?? ""} />
      <input type="hidden" name="smoking" defaultValue={user.smoking || ""} />
      <input type="hidden" name="alcoholConsumption" defaultValue={user.alcoholConsumption || ""} />
      <input type="hidden" name="mentalHealthScore" defaultValue={user.mentalHealthScore ?? ""} />
      <input type="hidden" name="employmentStatus" defaultValue={user.employmentStatus || ""} />
      <input type="hidden" name="incomePercentile" defaultValue={user.incomePercentile ?? ""} />
      <input type="hidden" name="education" defaultValue={user.education || ""} />
    </>
  )
}

/* Demographics */
function DemographicsSection({ user }: { user: any }) {
  const t = useTranslations("settings")
  const tCommon = useTranslations("common")
  const [msg, setMsg] = useState("")
  async function action(data: FormData) {
    const res = await updateDetails(null, data)
    setMsg(res?.error ? `Error: ${res.error}` : t("updateSuccess"))
  }
  return (
    <SettingsCard title={t("demographicsTitle")} description={t("demographicsDescription")}>
      <form action={action} className="space-y-4">
        <input type="hidden" name="bio" defaultValue={user.bio || ""} />
        <input type="hidden" name="interests" defaultValue={user.interests?.join(", ") || ""} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <Label className="text-muted-foreground">{t("dateOfBirth")}</Label>
            {/* tabIndex={-1} stops Chromium auto-scrolling to this input
                 on render, which was the unique reason Profile Details
                 caused page scroll while other categories did not. */}
            <Input name="dateOfBirth" type="date" defaultValue={formatDate(user.dateOfBirth)} tabIndex={-1} className="settings-input" />
          </div>
          <div className="space-y-3">
            <Label className="text-muted-foreground">{t("gender")}</Label>
            <Select name="gender" defaultValue={user.gender || undefined}>
              <SelectTrigger className="settings-input"><SelectValue placeholder={tCommon("select")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">{t("male")}</SelectItem>
                <SelectItem value="female">{t("female")}</SelectItem>
                <SelectItem value="non-binary">{t("nonBinary")}</SelectItem>
                <SelectItem value="other">{t("other")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3">
            <Label className="text-muted-foreground">{t("maritalStatus")}</Label>
            <Select name="maritalStatus" defaultValue={user.maritalStatus || undefined}>
              <SelectTrigger className="settings-input"><SelectValue placeholder={tCommon("select")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="single">{t("single")}</SelectItem>
                <SelectItem value="married">{t("married")}</SelectItem>
                <SelectItem value="divorced">{t("divorced")}</SelectItem>
                <SelectItem value="widowed">{t("widowed")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {/* preserve other fields */}
        <input type="hidden" name="householdSize" defaultValue={user.householdSize ?? ""} />
        <input type="hidden" name="childrenCount" defaultValue={user.childrenCount ?? ""} />
        <input type="hidden" name="socialSupportLevel" defaultValue={user.socialSupportLevel || ""} />
        <input type="hidden" name="childhoodMathSkill" defaultValue={user.childhoodMathSkill ?? ""} />
        <input type="hidden" name="booksInHome" defaultValue={user.booksInHome || ""} />
        <input type="hidden" name="bmi" defaultValue={user.bmi ?? ""} />
        <input type="hidden" name="smoking" defaultValue={user.smoking || ""} />
        <input type="hidden" name="alcoholConsumption" defaultValue={user.alcoholConsumption || ""} />
        <input type="hidden" name="mentalHealthScore" defaultValue={user.mentalHealthScore ?? ""} />
        <input type="hidden" name="employmentStatus" defaultValue={user.employmentStatus || ""} />
        <input type="hidden" name="incomePercentile" defaultValue={user.incomePercentile ?? ""} />
        <input type="hidden" name="education" defaultValue={user.education || ""} />
        <div className="flex justify-end items-center gap-3 pt-2">
          <Feedback msg={msg} />
          <SubmitBtn />
        </div>
      </form>
    </SettingsCard>
  )
}

/* Household */
function HouseholdSection({ user }: { user: any }) {
  const t = useTranslations("settings")
  const tCommon = useTranslations("common")
  const [msg, setMsg] = useState("")
  async function action(data: FormData) {
    const res = await updateDetails(null, data)
    setMsg(res?.error ? `Error: ${res.error}` : t("updateSuccess"))
  }
  return (
    <SettingsCard title={t("householdTitle")} description={t("householdDescription")}>
      <form action={action} className="space-y-4">
        <input type="hidden" name="bio" defaultValue={user.bio || ""} />
        <input type="hidden" name="interests" defaultValue={user.interests?.join(", ") || ""} />
        <input type="hidden" name="dateOfBirth" defaultValue={formatDate(user.dateOfBirth)} />
        <input type="hidden" name="gender" defaultValue={user.gender || ""} />
        <input type="hidden" name="maritalStatus" defaultValue={user.maritalStatus || ""} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-3">
            <Label className="text-muted-foreground">{t("householdSize")}</Label>
            <Input name="householdSize" type="number" min="1" defaultValue={user.householdSize} className="settings-input" />
          </div>
          <div className="space-y-3">
            <Label className="text-muted-foreground">{t("children")}</Label>
            <Input name="childrenCount" type="number" min="0" defaultValue={user.childrenCount} className="settings-input" />
          </div>
          <div className="space-y-3">
            <Label className="text-muted-foreground">{t("socialSupport")}</Label>
            <Select name="socialSupportLevel" defaultValue={user.socialSupportLevel || undefined}>
              <SelectTrigger className="settings-input"><SelectValue placeholder={tCommon("select")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">{t("supportLow")}</SelectItem>
                <SelectItem value="medium">{t("supportMedium")}</SelectItem>
                <SelectItem value="high">{t("supportHigh")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <input type="hidden" name="childhoodMathSkill" defaultValue={user.childhoodMathSkill ?? ""} />
        <input type="hidden" name="booksInHome" defaultValue={user.booksInHome || ""} />
        <input type="hidden" name="bmi" defaultValue={user.bmi ?? ""} />
        <input type="hidden" name="smoking" defaultValue={user.smoking || ""} />
        <input type="hidden" name="alcoholConsumption" defaultValue={user.alcoholConsumption || ""} />
        <input type="hidden" name="mentalHealthScore" defaultValue={user.mentalHealthScore ?? ""} />
        <input type="hidden" name="employmentStatus" defaultValue={user.employmentStatus || ""} />
        <input type="hidden" name="incomePercentile" defaultValue={user.incomePercentile ?? ""} />
        <input type="hidden" name="education" defaultValue={user.education || ""} />
        <div className="flex justify-end items-center gap-3 pt-2">
          <Feedback msg={msg} />
          <SubmitBtn />
        </div>
      </form>
    </SettingsCard>
  )
}

/* Health & Stats */
function HealthSection({ user }: { user: any }) {
  const t = useTranslations("settings")
  const tCommon = useTranslations("common")
  const [msg, setMsg] = useState("")
  async function action(data: FormData) {
    const res = await updateDetails(null, data)
    setMsg(res?.error ? `Error: ${res.error}` : t("updateSuccess"))
  }
  return (
    <SettingsCard title={t("healthTitle")} description={t("healthDescription")}>
      <form action={action} className="space-y-4">
        <input type="hidden" name="bio" defaultValue={user.bio || ""} />
        <input type="hidden" name="interests" defaultValue={user.interests?.join(", ") || ""} />
        <input type="hidden" name="dateOfBirth" defaultValue={formatDate(user.dateOfBirth)} />
        <input type="hidden" name="gender" defaultValue={user.gender || ""} />
        <input type="hidden" name="maritalStatus" defaultValue={user.maritalStatus || ""} />
        <input type="hidden" name="householdSize" defaultValue={user.householdSize ?? ""} />
        <input type="hidden" name="childrenCount" defaultValue={user.childrenCount ?? ""} />
        <input type="hidden" name="socialSupportLevel" defaultValue={user.socialSupportLevel || ""} />
        <input type="hidden" name="childhoodMathSkill" defaultValue={user.childhoodMathSkill ?? ""} />
        <input type="hidden" name="booksInHome" defaultValue={user.booksInHome || ""} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <Label className="text-muted-foreground">{t("bmi")}</Label>
            <Input name="bmi" type="number" step="0.1" placeholder="24.5" defaultValue={user.bmi} className="settings-input" />
          </div>
          <div className="space-y-3">
            <Label className="text-muted-foreground">{t("mentalHealth")}</Label>
            <Input name="mentalHealthScore" type="number" min="0" max="10" defaultValue={user.mentalHealthScore} className="settings-input" />
          </div>
          <div className="space-y-3">
            <Label className="text-muted-foreground">{t("smoking")}</Label>
            <Select name="smoking" defaultValue={user.smoking || undefined}>
              <SelectTrigger className="settings-input"><SelectValue placeholder={tCommon("select")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="never">{t("never")}</SelectItem>
                <SelectItem value="former">{t("former")}</SelectItem>
                <SelectItem value="current">{t("current")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("alcohol")}</Label>
            <Select name="alcoholConsumption" defaultValue={user.alcoholConsumption || undefined}>
              <SelectTrigger><SelectValue placeholder={tCommon("select")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("none")}</SelectItem>
                <SelectItem value="social">{t("social")}</SelectItem>
                <SelectItem value="regular">{t("regular")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <input type="hidden" name="employmentStatus" defaultValue={user.employmentStatus || ""} />
        <input type="hidden" name="incomePercentile" defaultValue={user.incomePercentile ?? ""} />
        <input type="hidden" name="education" defaultValue={user.education || ""} />
        <div className="flex justify-end items-center gap-3 pt-2">
          <Feedback msg={msg} />
          <SubmitBtn />
        </div>
      </form>
    </SettingsCard>
  )
}

/* Work & Background */
function EducationSection({ user }: { user: any }) {
  const t = useTranslations("settings")
  const tCommon = useTranslations("common")
  const [msg, setMsg] = useState("")
  async function action(data: FormData) {
    const res = await updateDetails(null, data)
    setMsg(res?.error ? `Error: ${res.error}` : t("updateSuccess"))
  }
  return (
    <SettingsCard title={t("workBackgroundTitle")} description={t("workBackgroundDescription")}>
      <form action={action} className="space-y-4">
        <input type="hidden" name="bio" defaultValue={user.bio || ""} />
        <input type="hidden" name="interests" defaultValue={user.interests?.join(", ") || ""} />
        <input type="hidden" name="dateOfBirth" defaultValue={formatDate(user.dateOfBirth)} />
        <input type="hidden" name="gender" defaultValue={user.gender || ""} />
        <input type="hidden" name="maritalStatus" defaultValue={user.maritalStatus || ""} />
        <input type="hidden" name="householdSize" defaultValue={user.householdSize ?? ""} />
        <input type="hidden" name="childrenCount" defaultValue={user.childrenCount ?? ""} />
        <input type="hidden" name="socialSupportLevel" defaultValue={user.socialSupportLevel || ""} />
        <input type="hidden" name="bmi" defaultValue={user.bmi ?? ""} />
        <input type="hidden" name="smoking" defaultValue={user.smoking || ""} />
        <input type="hidden" name="alcoholConsumption" defaultValue={user.alcoholConsumption || ""} />
        <input type="hidden" name="mentalHealthScore" defaultValue={user.mentalHealthScore ?? ""} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <Label className="text-muted-foreground">{t("education")}</Label>
            <Select name="education" defaultValue={user.education || undefined}>
              <SelectTrigger className="settings-input"><SelectValue placeholder={tCommon("select")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="high_school">{t("highSchool")}</SelectItem>
                <SelectItem value="bachelors">{t("bachelors")}</SelectItem>
                <SelectItem value="masters">{t("masters")}</SelectItem>
                <SelectItem value="phd">{t("phd")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3">
            <Label className="text-muted-foreground">{t("employment")}</Label>
            <Select name="employmentStatus" defaultValue={user.employmentStatus || undefined}>
              <SelectTrigger className="settings-input"><SelectValue placeholder={tCommon("select")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="employed">{t("employed")}</SelectItem>
                <SelectItem value="part_time">{t("partTime")}</SelectItem>
                <SelectItem value="self_employed">{t("selfEmployed")}</SelectItem>
                <SelectItem value="retired">{t("retired")}</SelectItem>
                <SelectItem value="unemployed">{t("unemployed")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3">
            <Label className="text-muted-foreground">{t("incomePercentile")}</Label>
            <Input name="incomePercentile" type="number" min="0" max="100" defaultValue={user.incomePercentile} className="settings-input" />
          </div>
          <div className="space-y-3">
            <Label className="text-muted-foreground">{t("booksInHome")}</Label>
            <Select name="booksInHome" defaultValue={user.booksInHome || undefined}>
              <SelectTrigger className="settings-input"><SelectValue placeholder={tCommon("select")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0-10">0-10</SelectItem>
                <SelectItem value="11-25">11-25</SelectItem>
                <SelectItem value="26-100">26-100</SelectItem>
                <SelectItem value="100+">100+</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3">
            <Label className="text-muted-foreground">{t("mathSkill")}</Label>
            <Input name="childhoodMathSkill" type="number" min="1" max="10" defaultValue={user.childhoodMathSkill} className="settings-input" />
          </div>
        </div>
        <div className="flex justify-end items-center gap-3 pt-2">
          <Feedback msg={msg} />
          <SubmitBtn />
        </div>
      </form>
    </SettingsCard>
  )
}

/* Interests */
function InterestsSection({ user }: { user: any }) {
  const t = useTranslations("settings")
  const [msg, setMsg] = useState("")
  async function action(data: FormData) {
    const res = await updateDetails(null, data)
    setMsg(res?.error ? `Error: ${res.error}` : t("updateSuccess"))
  }
  return (
    <SettingsCard title={t("interestsTitle")} description={t("interestsDescription")}>
      <form action={action} className="space-y-4">
        <input type="hidden" name="bio" defaultValue={user.bio || ""} />
        <HiddenDetailsFields user={user} />
        <div className="space-y-3">
          <Label className="text-muted-foreground">{t("interestsLabel")}</Label>
          <Input name="interests" placeholder={t("interestsPlaceholder")} defaultValue={user.interests?.join(", ") || ""} className="settings-input" />
          <p className="text-[10px] text-muted-foreground">{t("interestsHint")}</p>
        </div>
        {user.interests?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {user.interests.map((i: string) => (
              <Badge key={i} variant="secondary" className="text-xs">{i}</Badge>
            ))}
          </div>
        )}
        <div className="flex justify-end items-center gap-3 pt-2">
          <Feedback msg={msg} />
          <SubmitBtn />
        </div>
      </form>
    </SettingsCard>
  )
}

/* Privacy Sections */

/* Reusable toggle row */
function PrivacyToggleRow({
  label,
  description,
  field,
  defaultValue,
}: {
  label: string
  description: string
  field: string
  defaultValue: boolean
}) {
  const [value, setValue] = useState(defaultValue)
  const [isPending, startTransition] = useTransition()

  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-border last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {isPending && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
        <Switch
          checked={value}
          onCheckedChange={(checked: boolean) => {
            setValue(checked)
            startTransition(async () => {
              await updatePrivacyToggle(field, checked)
            })
          }}
        />
      </div>
    </div>
  )
}

/* Reusable "who can" select row */
function PrivacySelectRow({
  label,
  description,
  field,
  defaultValue,
}: {
  label: string
  description: string
  field: string
  defaultValue: string
}) {
  const t = useTranslations("settings")
  const [isPending, startTransition] = useTransition()

  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-border last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {isPending && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
        <Select
          defaultValue={defaultValue}
          onValueChange={(val) => {
            startTransition(async () => {
              await updatePrivacySelect(field, val)
            })
          }}
        >
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="everyone">{t("everyone")}</SelectItem>
            <SelectItem value="followers">{t("followers")}</SelectItem>
            <SelectItem value="nobody">{t("nobody")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

/* Profile Privacy */
function ProfilePrivacySection({ user }: { user: any }) {
  const t = useTranslations("settings")
  return (
    <SettingsCard title={t("profilePrivacyTitle")} description={t("profilePrivacyDescription")}>
      <div className="divide-y divide-border">
        <PrivacyToggleRow
          label={t("privateAccount")}
          description={t("privateAccountDesc")}
          field="isPrivate"
          defaultValue={user.isPrivate ?? false}
        />
        <PrivacySelectRow
          label={t("whoCanSeePosts")}
          description={t("whoCanSeePostsDesc")}
          field="whoCanSeePosts"
          defaultValue={user.whoCanSeePosts ?? "everyone"}
        />
        <PrivacySelectRow
          label={t("whoCanSeeFollowers")}
          description={t("whoCanSeeFollowersDesc")}
          field="whoCanSeeFollowers"
          defaultValue={user.whoCanSeeFollowers ?? "everyone"}
        />
      </div>
    </SettingsCard>
  )
}

/* Interactions */
function InteractionsPrivacySection({ user }: { user: any }) {
  const t = useTranslations("settings")
  return (
    <SettingsCard title={t("interactionsTitle")} description={t("interactionsDescription")}>
      <div className="divide-y divide-border">
        <PrivacySelectRow
          label={t("whoCanComment")}
          description={t("whoCanCommentDesc")}
          field="whoCanComment"
          defaultValue={user.whoCanComment ?? "everyone"}
        />
        <PrivacySelectRow
          label={t("whoCanRemix")}
          description={t("whoCanRemixDesc")}
          field="whoCanRemix"
          defaultValue={user.whoCanRemix ?? "everyone"}
        />
        <PrivacySelectRow
          label={t("whoCanTag")}
          description={t("whoCanTagDesc")}
          field="whoCanTagMe"
          defaultValue={user.whoCanTagMe ?? "everyone"}
        />
        <PrivacySelectRow
          label={t("whoCanMessage")}
          description={t("whoCanMessageDesc")}
          field="whoCanMessage"
          defaultValue={user.whoCanMessage ?? "everyone"}
        />
      </div>
    </SettingsCard>
  )
}

/* Story / Content Controls */
function ContentControlsSection({ user }: { user: any }) {
  const t = useTranslations("settings")
  const tCommon = useTranslations("common")
  const [hiddenInput, setHiddenInput] = useState((user.hiddenFromStory ?? []).join(", "))
  const [closeFriendsInput, setCloseFriendsInput] = useState((user.closeFriends ?? []).join(", "))
  const [msg, setMsg] = useState("")

  async function saveHidden() {
    const ids = hiddenInput.split(",").map((s: string) => s.trim()).filter(Boolean)
    const res = await updatePrivacyList("hiddenFromStory", ids)
    setMsg(res?.error || res?.success || "")
  }

  async function saveCloseFriends() {
    const ids = closeFriendsInput.split(",").map((s: string) => s.trim()).filter(Boolean)
    const res = await updatePrivacyList("closeFriends", ids)
    setMsg(res?.error || res?.success || "")
  }

  return (
    <SettingsCard title={t("contentControlsTitle")} description={t("contentControlsDescription")}>
      <div className="space-y-5">
        <PrivacyToggleRow
          label={t("allowResharing")}
          description={t("allowResharingDesc")}
          field="allowResharing"
          defaultValue={user.allowResharing ?? true}
        />

        <div className="space-y-3 pt-2">
          <Label className="text-sm font-medium text-muted-foreground">{t("hideStoryLabel")}</Label>
          <p className="text-xs text-muted-foreground">{t("hideStoryDesc")}</p>
          <div className="flex gap-2">
            <Input
              value={hiddenInput}
              onChange={(e) => setHiddenInput(e.target.value)}
              placeholder={t("hideStoryPlaceholder")}
              className="flex-1 settings-input"
            />
            <Button size="sm" onClick={saveHidden} className="settings-btn">{tCommon("save")}</Button>
          </div>
          {(user.hiddenFromStory ?? []).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {(user.hiddenFromStory as string[]).map((id: string) => (
                <Badge key={id} variant="secondary" className="text-[10px]">
                  <EyeOff className="h-2.5 w-2.5 mr-1" />{id}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3 pt-2">
          <Label className="text-sm font-medium text-muted-foreground">{t("closeFriendsLabel")}</Label>
          <p className="text-xs text-muted-foreground">{t("closeFriendsDesc")}</p>
          <div className="flex gap-2">
            <Input
              value={closeFriendsInput}
              onChange={(e) => setCloseFriendsInput(e.target.value)}
              placeholder={t("closeFriendsPlaceholder")}
              className="flex-1 settings-input"
            />
            <Button size="sm" onClick={saveCloseFriends} className="settings-btn">{tCommon("save")}</Button>
          </div>
          {(user.closeFriends ?? []).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {(user.closeFriends as string[]).map((id: string) => (
                <Badge key={id} variant="secondary" className="text-[10px] bg-green-50 text-green-700 border-green-200">
                  <Users className="h-2.5 w-2.5 mr-1" />{id}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <Feedback msg={msg} />
      </div>
    </SettingsCard>
  )
}

/* Discovery */
function DiscoverySection({ user }: { user: any }) {
  const t = useTranslations("settings")
  return (
    <SettingsCard title={t("discoveryTitle")} description={t("discoveryDescription")}>
      <div className="divide-y divide-border">
        <PrivacyToggleRow
          label={t("findByEmail")}
          description={t("findByEmailDesc")}
          field="findableByEmail"
          defaultValue={user.findableByEmail ?? true}
        />
        <PrivacyToggleRow
          label={t("findByPhone")}
          description={t("findByPhoneDesc")}
          field="findableByPhone"
          defaultValue={user.findableByPhone ?? true}
        />
        <PrivacyToggleRow
          label={t("searchEngine")}
          description={t("searchEngineDesc")}
          field="searchEngineIndexing"
          defaultValue={user.searchEngineIndexing ?? true}
        />
      </div>
    </SettingsCard>
  )
}

/* Appearance Sections */

/* Reusable appearance toggle row */

/** Map toggle field names to their HTML data-attribute on <html> */
const TOGGLE_ATTR_MAP: Record<string, string> = {
  highContrast: "data-high-contrast",
  screenReader: "data-screen-reader",
  reduceMotion: "data-reduce-motion",
}

function AppearanceToggleRow({
  label,
  description,
  field,
  defaultValue,
}: {
  label: string
  description: string
  field: string
  defaultValue: boolean
}) {
  const [value, setValue] = useState(defaultValue)
  const [isPending, startTransition] = useTransition()

  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-border last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {isPending && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
        <Switch
          checked={value}
          onCheckedChange={(checked: boolean) => {
            setValue(checked)
            // Apply immediately to the DOM so user sees the effect
            const attr = TOGGLE_ATTR_MAP[field]
            if (attr) {
              if (checked) document.documentElement.setAttribute(attr, "")
              else document.documentElement.removeAttribute(attr)
            }
            startTransition(async () => {
              await updateAppearanceToggle(field, checked)
            })
          }}
        />
      </div>
    </div>
  )
}

/* Theme */
function ThemeSection({ user }: { user: any }) {
  const t = useTranslations("settings")
  const tCommon = useTranslations("common")
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Avoid hydration mismatch — only render active state after mount
  useEffect(() => setMounted(true), [])

  const themes = [
    { value: "light",  label: t("themeLight"),  icon: Sun,     desc: t("themeLightDesc") },
    { value: "dark",   label: t("themeDark"),   icon: Moon,    desc: t("themeDarkDesc") },
    { value: "system", label: t("themeSystem"), icon: Monitor,  desc: t("themeSystemDesc") },
  ]

  const current = mounted ? (theme ?? "system") : (user.theme ?? "system")

  return (
    <SettingsCard title={t("themeTitle")} description={t("themeDescription")}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {themes.map((th) => {
          const Icon = th.icon
          const isActive = current === th.value
          return (
            <button
              key={th.value}
              onClick={() => {
                setTheme(th.value)  // apply immediately client-side
                startTransition(async () => {
                  await updateAppearanceSelect("theme", th.value)  // persist to DB
                })
              }}
              className={cn(
                "flex flex-col items-center gap-2 p-5 rounded-xl border-2 transition-all",
                isActive
                  ? "border-primary bg-accent shadow-sm"
                  : "border-border hover:border-muted-foreground/30"
              )}
            >
              <Icon className={cn("h-8 w-8", isActive ? "text-foreground" : "text-muted-foreground")} />
              <span className={cn("text-sm font-semibold", isActive ? "text-foreground" : "text-muted-foreground")}>{th.label}</span>
              <span className="text-[10px] text-muted-foreground">{th.desc}</span>
              {isActive && <Badge className="text-[10px] mt-1">{t("themeActive")}</Badge>}
            </button>
          )
        })}
      </div>
      {isPending && <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> {tCommon("saving")}</p>}
    </SettingsCard>
  )
}

/* Language */
function LanguageSection({ user }: { user: any }) {
  const t = useTranslations("settings")
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const languages = [
    { code: "en",  label: "English" },
    { code: "es",  label: "Español" },
    { code: "fr",  label: "Français" },
    { code: "de",  label: "Deutsch" },
    { code: "pt",  label: "Português" },
    { code: "it",  label: "Italiano" },
    { code: "nl",  label: "Nederlands" },
    { code: "ru",  label: "Русский" },
    { code: "zh",  label: "中文" },
    { code: "ja",  label: "日本語" },
    { code: "ko",  label: "한국어" },
    { code: "ar",  label: "العربية" },
    { code: "hi",  label: "हिन्दी" },
    { code: "tr",  label: "Türkçe" },
    { code: "pl",  label: "Polski" },
    { code: "sv",  label: "Svenska" },
    { code: "da",  label: "Dansk" },
    { code: "fi",  label: "Suomi" },
    { code: "no",  label: "Norsk" },
  ]

  return (
    <SettingsCard title={t("languageTitle")} description={t("languageDescription")}>
      <div className="flex items-center gap-4">
        {isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        <Select
          defaultValue={user.language ?? "en"}
          onValueChange={(val) => {
            startTransition(async () => {
              await updateAppearanceSelect("language", val)
              document.cookie = `NEXT_LOCALE=${val};path=/;max-age=31536000`
              document.documentElement.lang = val
              window.location.reload()
            })
          }}
        >
          <SelectTrigger className="w-full max-w-xs settings-input">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {languages.map((l) => (
              <SelectItem key={l.code} value={l.code}>
                {l.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <p className="text-[10px] text-muted-foreground mt-2">{t("languageDisclaimer")}</p>
    </SettingsCard>
  )
}

/* Data Saver & Autoplay */
function DataSaverSection({ user }: { user: any }) {
  const t = useTranslations("settings")
  return (
    <SettingsCard title={t("dataSaverTitle")} description={t("dataSaverDescription")}>
      <div className="divide-y divide-border">
        <AppearanceToggleRow
          label={t("dataSaverMode")}
          description={t("dataSaverModeDesc")}
          field="dataSaver"
          defaultValue={user.dataSaver ?? false}
        />
        <AppearanceToggleRow
          label={t("autoplayVideos")}
          description={t("autoplayVideosDesc")}
          field="autoplayVideos"
          defaultValue={user.autoplayVideos ?? true}
        />
      </div>
    </SettingsCard>
  )
}

/* Accessibility */
function AccessibilitySection({ user }: { user: any }) {
  const t = useTranslations("settings")
  const [isPending, startTransition] = useTransition()

  const fontSizes = [
    { value: "small",  label: t("fontSmall"),   sample: "text-xs" },
    { value: "medium", label: t("fontMedium"),  sample: "text-sm" },
    { value: "large",  label: t("fontLarge"),   sample: "text-base" },
    { value: "xlarge", label: t("fontXlarge"), sample: "text-lg" },
  ]

  const [activeFont, setActiveFont] = useState(user.fontSize ?? "medium")

  return (
    <SettingsCard title={t("accessibilityTitle")} description={t("accessibilityDescription")}>
      <div className="divide-y divide-border">
        <AppearanceToggleRow
          label={t("reduceMotion")}
          description={t("reduceMotionDesc")}
          field="reduceMotion"
          defaultValue={user.reduceMotion ?? false}
        />
        <AppearanceToggleRow
          label={t("highContrast")}
          description={t("highContrastDesc")}
          field="highContrast"
          defaultValue={user.highContrast ?? false}
        />
        <AppearanceToggleRow
          label={t("screenReader")}
          description={t("screenReaderDesc")}
          field="screenReader"
          defaultValue={user.screenReader ?? false}
        />

        {/* Font size selector */}
        <div className="py-4">
          <p className="text-sm font-medium mb-1">{t("fontSize")}</p>
          <p className="text-xs text-muted-foreground mb-3">{t("fontSizeDesc")}</p>
          <div className="flex items-center gap-3">
            {isPending && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
            <div className="grid grid-cols-4 gap-2 w-full max-w-sm">
              {fontSizes.map((fs) => {
                const isActive = activeFont === fs.value
                return (
                  <button
                    key={fs.value}
                    onClick={() => {
                      setActiveFont(fs.value)
                      // Apply immediately so user sees the change
                      document.documentElement.setAttribute("data-font-size", fs.value)
                      startTransition(async () => {
                        await updateAppearanceSelect("fontSize", fs.value)
                      })
                    }}
                    className={cn(
                      "flex flex-col items-center gap-1 p-2.5 rounded-lg border-2 transition-all",
                      isActive
                        ? "border-foreground bg-accent"
                        : "border-border hover:border-muted-foreground/30"
                    )}
                  >
                    <Type className={cn("shrink-0", fs.sample, isActive ? "text-foreground" : "text-muted-foreground")} />
                    <span className={cn("text-[10px] font-medium", isActive ? "text-foreground" : "text-muted-foreground")}>{fs.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </SettingsCard>
  )
}

/* Shared Primitives */

function SettingsCard({
  title,
  description,
  children,
  danger = false,
}: {
  title: string
  description: string
  children: React.ReactNode
  danger?: boolean
}) {
  return (
    <div className={cn("space-y-5", danger && "text-red-600")}>
      <div className="space-y-1.5">
        <h3 className={cn("editorial-subhead text-2xl", danger && "text-red-600")}>{title}</h3>
        <p className="editorial-body text-muted-foreground">{description}</p>
      </div>
      <div>{children}</div>
    </div>
  )
}

function Feedback({ msg }: { msg: string }) {
  if (!msg) return null
  const isError = msg.toLowerCase().includes("error") || msg.toLowerCase().includes("must") || msg.toLowerCase().includes("invalid") || msg.toLowerCase().includes("incorrect")
  return (
    <p className={cn("text-xs font-medium", isError ? "text-red-500" : "text-green-600")}>{msg}</p>
  )
}

function AvatarUpload({ user, size = "md" }: { user: any; size?: "sm" | "md" | "lg" }) {
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  const sizeClass = size === "sm" ? "h-12 w-12" : size === "lg" ? "h-28 w-28" : "h-20 w-20"
  const iconSize = size === "sm" ? "w-4 h-4" : "w-6 h-6"

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      startTransition(async () => {
        const base64 = reader.result as string
        await updateAvatar(base64)
      })
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="relative group cursor-pointer shrink-0" onClick={() => inputRef.current?.click()}>
      <Avatar className={cn(sizeClass, "border-2 border-border")}>
        <AvatarImage src={user.image || ""} className={isPending ? "opacity-50" : ""} />
        <AvatarFallback className="text-xl font-bold">{user.name?.[0]}</AvatarFallback>
      </Avatar>
      <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        {isPending ? <Loader2 className={cn(iconSize, "text-white animate-spin")} /> : <Camera className={cn(iconSize, "text-white")} />}
      </div>
      <input type="file" ref={inputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
    </div>
  )
}

function SubmitBtn({ label }: { label?: string }) {
  const { pending } = useFormStatus()
  const tCommon = useTranslations("common")
  return (
    <Button disabled={pending} type="submit" className="settings-btn min-w-[100px] shrink-0">
      {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : (label || tCommon("save"))}
    </Button>
  )
}

/* Posts Sections */

function PostMiniCard({ post }: { post: { id: string; content: string | null; createdAt: string; images: { url: string }[]; _count: { likes: number; comments: number } } }) {
  const t = useTranslations("settings")
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-2">
      {post.content && <p className="text-sm leading-relaxed line-clamp-3">{post.content}</p>}
      {post.images.length > 0 && (
        <div className="flex gap-1 overflow-hidden rounded-lg">
          {post.images.slice(0, 3).map((img, i) => (
            <img key={i} src={img.url} alt="" className="h-20 w-20 object-cover rounded-md bg-muted" />
          ))}
          {post.images.length > 3 && (
            <span className="flex h-20 w-20 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground font-medium">+{post.images.length - 3}</span>
          )}
        </div>
      )}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span suppressHydrationWarning>{new Date(post.createdAt).toLocaleDateString()}</span>
        <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{post._count.likes}</span>
        <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />{post._count.comments}</span>
      </div>
    </div>
  )
}

function MyPostsSection({ user }: { user: any }) {
  const t = useTranslations("settings")
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/posts/mine`)
      .then(r => r.json())
      .then(data => { setPosts(data.posts ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <h3 className="editorial-subhead text-2xl flex items-center gap-2"><Newspaper className="h-5 w-5" /> {t("myPostsTitle")}</h3>
        <p className="editorial-body text-muted-foreground">{t("myPostsDescription")}</p>
      </div>
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : posts.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">{t("myPostsEmpty")}</p>
        ) : (
          posts.map((p: any) => <PostMiniCard key={p.id} post={p} />)
        )}
      </div>
    </div>
  )
}

function LikedPostsSection({ user }: { user: any }) {
  const t = useTranslations("settings")
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/posts/liked`)
      .then(r => r.json())
      .then(data => { setPosts(data.posts ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <h3 className="editorial-subhead text-2xl flex items-center gap-2"><Heart className="h-5 w-5 text-rose-500" /> {t("likedPostsTitle")}</h3>
        <p className="editorial-body text-muted-foreground">{t("likedPostsDescription")}</p>
      </div>
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : posts.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">{t("likedPostsEmpty")}</p>
        ) : (
          posts.map((p: any) => <PostMiniCard key={p.id} post={p} />)
        )}
      </div>
    </div>
  )
}

function SavedPostsSection({ user }: { user: any }) {
  const t = useTranslations("settings")
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/posts/saved`)
      .then(r => r.json())
      .then(data => { setPosts(data.posts ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <h3 className="editorial-subhead text-2xl flex items-center gap-2"><Bookmark className="h-5 w-5 text-amber-500 dark:text-sky-400" /> {t("savedPostsTitle")}</h3>
        <p className="editorial-body text-muted-foreground">{t("savedPostsDescription")}</p>
      </div>
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : posts.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">{t("savedPostsEmpty")}</p>
        ) : (
          posts.map((p: any) => <PostMiniCard key={p.id} post={p} />)
        )}
      </div>
    </div>
  )
}
