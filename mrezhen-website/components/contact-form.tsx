"use client"

import { useActionState } from "react"
import { submitContactForm } from "@/app/actions/contact"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Mail, Send, Loader2, CheckCircle2, AlertCircle } from "lucide-react"

export function ContactForm() {
  const [state, formAction, isPending] = useActionState(submitContactForm, null)

  return (
    <form action={formAction} className="space-y-5">
      {/* ─── Name ────────────────────────────────────────── */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium">
          Name
        </Label>
        <Input
          id="name"
          name="name"
          placeholder="Your name"
          maxLength={100}
          required
          className="h-10"
        />
      </div>

      {/* ─── Email ───────────────────────────────────────── */}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium">
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          maxLength={254}
          required
          className="h-10"
        />
      </div>

      {/* ─── Message ─────────────────────────────────────── */}
      <div className="space-y-2">
        <Label htmlFor="message" className="text-sm font-medium">
          Message
        </Label>
        <Textarea
          id="message"
          name="message"
          placeholder="How can we help?"
          rows={6}
          minLength={10}
          maxLength={5000}
          required
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground">10 – 5,000 characters.</p>
      </div>

      {/* ─── Feedback ────────────────────────────────────── */}
      {state?.error && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="flex items-center gap-2 text-sm text-teal-600 dark:text-teal-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {state.success}
        </div>
      )}

      {/* ─── Submit ──────────────────────────────────────── */}
      <Button type="submit" disabled={isPending} className="w-full h-10">
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Send className="h-4 w-4 mr-2" />
        )}
        {isPending ? "Sending…" : "Send Message"}
      </Button>
    </form>
  )
}
