"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  User,
  Bell,
  Shield,
  Palette,
  Lock,
} from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const sections = [
  {
    id: "account",
    icon: User,
    label: "Account",
    description: "Manage your profile and personal details.",
    content: (
      <div className="space-y-4 px-1">
        <div className="space-y-1.5">
          <Label htmlFor="display-name" className="text-xs text-muted-foreground uppercase tracking-wide">
            Display Name
          </Label>
          <Input id="display-name" placeholder="Your name" className="h-9 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bio" className="text-xs text-muted-foreground uppercase tracking-wide">
            Bio
          </Label>
          <Input id="bio" placeholder="A short bio…" className="h-9 text-sm" />
        </div>
        <Button size="sm" className="w-full h-9 text-sm">Save changes</Button>
      </div>
    ),
  },
  {
    id: "notifications",
    icon: Bell,
    label: "Notifications",
    description: "Control what alerts you receive.",
    content: (
      <div className="space-y-3 px-1">
        {[
          { id: "notif-email",  label: "Email notifications" },
          { id: "notif-push",   label: "Push notifications" },
          { id: "notif-digest", label: "Weekly digest" },
        ].map(({ id, label }) => (
          <div key={id} className="flex items-center justify-between">
            <Label htmlFor={id} className="text-sm cursor-pointer">{label}</Label>
            <Switch id={id} />
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "privacy",
    icon: Shield,
    label: "Privacy",
    description: "Choose who can see your content.",
    content: (
      <div className="space-y-3 px-1">
        {[
          { id: "priv-profile",   label: "Private profile" },
          { id: "priv-activity",  label: "Hide activity status" },
          { id: "priv-indexing",  label: "Search engine indexing" },
        ].map(({ id, label }) => (
          <div key={id} className="flex items-center justify-between">
            <Label htmlFor={id} className="text-sm cursor-pointer">{label}</Label>
            <Switch id={id} />
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "appearance",
    icon: Palette,
    label: "Appearance",
    description: "Personalise how Mrezhen looks.",
    content: (
      <div className="space-y-3 px-1">
        <p className="text-xs text-muted-foreground">Theme</p>
        <div className="grid grid-cols-3 gap-2">
          {["System", "Light", "Dark"].map((t) => (
            <button
              key={t}
              className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs font-medium
                         hover:bg-muted transition-colors first:ring-1 first:ring-primary first:border-primary"
            >
              {t}
            </button>
          ))}
        </div>
        <div className="h-px bg-border my-1" />
        <div className="flex items-center justify-between">
          <Label htmlFor="reduce-motion" className="text-sm cursor-pointer">Reduce motion</Label>
          <Switch id="reduce-motion" />
        </div>
      </div>
    ),
  },
  {
    id: "security",
    icon: Lock,
    label: "Security",
    description: "Password and two-factor settings.",
    content: (
      <div className="space-y-4 px-1">
        <div className="space-y-1.5">
          <Label htmlFor="current-pw" className="text-xs text-muted-foreground uppercase tracking-wide">
            Current password
          </Label>
          <Input id="current-pw" type="password" placeholder="••••••••" className="h-9 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="new-pw" className="text-xs text-muted-foreground uppercase tracking-wide">
            New password
          </Label>
          <Input id="new-pw" type="password" placeholder="••••••••" className="h-9 text-sm" />
        </div>
        <div className="h-px bg-border my-1" />
        <div className="flex items-center justify-between">
          <Label htmlFor="2fa" className="text-sm cursor-pointer">Two-factor auth</Label>
          <Switch id="2fa" />
        </div>
        <Button size="sm" variant="outline" className="w-full h-9 text-sm">Update password</Button>
      </div>
    ),
  },
]

export function SettingsPanel() {
  return (
    <div className="w-full max-w-sm space-y-1">
      <Accordion type="multiple" className="space-y-1">
        {sections.map(({ id, icon: Icon, label, description, content }) => (
          <AccordionItem
            key={id}
            value={id}
            className="rounded-xl border border-border bg-card shadow-sm overflow-hidden"
          >
            <AccordionTrigger
              className="
                group flex w-full items-center gap-3 px-4 py-3
                text-sm font-medium text-foreground
                hover:no-underline hover:bg-muted/50
                transition-colors duration-150
                [&>svg:last-child]:ml-auto [&>svg:last-child]:shrink-0
              "
            >
              {/* icon bubble */}
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground group-data-[state=open]:bg-primary/10 group-data-[state=open]:text-primary transition-colors duration-150">
                <Icon className="h-4 w-4" />
              </span>

              {/* label + description */}
              <span className="flex flex-col items-start text-left leading-tight">
                <span className="font-semibold text-sm">{label}</span>
                <span className="text-xs text-muted-foreground font-normal">{description}</span>
              </span>
            </AccordionTrigger>

            <AccordionContent className="px-4 pb-4 pt-1">
              {content}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
