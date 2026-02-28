import { Mail, MapPin, Clock } from "lucide-react"
import { ContactForm } from "@/components/contact-form"

export const dynamic = "force-static"

export default function ContactPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Mail className="h-7 w-7 text-muted-foreground" />
          Contact Us
        </h1>
        <p className="text-sm text-muted-foreground">
          Have a question, suggestion, or found a bug? We&apos;d love to hear from you.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-[1fr_280px]">
        {/* Form */}
        <div className="rounded-xl border border-border bg-card p-6">
          <ContactForm />
        </div>

        {/* Sidebar info */}
        <aside className="space-y-6 text-sm">
          <div className="space-y-3">
            <h2 className="font-semibold text-base">Get in Touch</h2>
            <div className="flex items-start gap-3 text-muted-foreground">
              <Mail className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-foreground">Email</p>
                <p>support@mrezhen.com</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-muted-foreground">
              <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-foreground">Location</p>
                <p>Worldwide — remote-first team</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-muted-foreground">
              <Clock className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-foreground">Response Time</p>
                <p>Usually within 24–48 hours</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
            <p className="font-medium text-foreground">Before you write</p>
            <ul className="list-disc pl-4 text-muted-foreground space-y-1 text-xs">
              <li>Check the <a href="/terms" className="underline underline-offset-2 text-teal-600 dark:text-teal-400">Terms of Service</a> for policy questions.</li>
              <li>Account issues? Try resetting your password first.</li>
              <li>Include your username if reporting a bug.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}
