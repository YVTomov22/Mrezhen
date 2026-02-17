'use client'

import { useState } from "react"
import { createMilestone, createQuest } from "@/app/actions/game"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"
import { useTranslations } from "next-intl"

export function CreateMilestoneBtn() {
  const t = useTranslations("goals")
  const tCommon = useTranslations("common")
  const [open, setOpen] = useState(false)

  async function onSubmit(formData: FormData) {
    await createMilestone(
      formData.get("title") as string, 
      formData.get("description") as string
    )
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4"/> {t("newMilestone")}</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{t("createNewMilestone")}</DialogTitle></DialogHeader>
        <form action={onSubmit} className="space-y-4">
          <div><Label>{tCommon("title")}</Label><Input name="title" required /></div>
          <div><Label>{tCommon("description")}</Label><Textarea name="description" /></div>
          <Button type="submit" className="w-full">{tCommon("create")}</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function CreateQuestBtn({ milestoneId }: { milestoneId: string }) {
  const t = useTranslations("goals")
  const tCommon = useTranslations("common")
  const [open, setOpen] = useState(false)

  async function onSubmit(formData: FormData) {
    const tasksRaw = formData.get("tasks") as string
    const tasks = tasksRaw.split(',').map(t => t.trim()).filter(t => t.length > 0)
    
    await createQuest(
      milestoneId,
      formData.get("title") as string,
      formData.get("description") as string,
      formData.get("difficulty") as any,
      tasks
    )
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline" size="sm"><Plus className="h-3 w-3 mr-1"/> {t("addQuest")}</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{t("addQuestToMilestone")}</DialogTitle></DialogHeader>
        <form action={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{tCommon("title")}</Label>
            <Input name="title" required />
          </div>
          
          {/* ADDED DESCRIPTION FIELD */}
          <div className="space-y-2">
            <Label>{tCommon("description")}</Label>
            <Textarea name="description" placeholder={t("missionPlaceholder")} />
          </div>

          <div className="space-y-2">
            <Label>{t("difficulty")}</Label>
            <Select name="difficulty" defaultValue="MEDIUM">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="EASY">{t("easy")}</SelectItem>
                <SelectItem value="MEDIUM">{t("medium")}</SelectItem>
                <SelectItem value="HARD">{t("hard")}</SelectItem>
                <SelectItem value="EPIC">{t("epic")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>{t("tasksCommaSeparated")}</Label>
            <Textarea name="tasks" placeholder={t("tasksPlaceholder")} required />
          </div>
          
          <Button type="submit" className="w-full">{t("createQuest")}</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}