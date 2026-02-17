'use client'

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { 
  createMilestone, updateMilestone, deleteMilestone,
  createQuest, updateQuest, deleteQuest,
  createTask, updateTask, deleteTask
} from "@/app/actions/game"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Target, Sparkles, PenTool, ExternalLink, 
  Trash2, Plus, ArrowLeft, Loader2, ChevronRight, Pencil 
} from "lucide-react"

import { TaskVerifier } from "@/components/game/task-verifier"
import { useTranslations } from "next-intl"

// --- TYPES ---
type Task = { id: string; content: string; isCompleted: boolean } 
type Quest = { id: string; title: string; description: string | null; difficulty: string; tasks: Task[] }
type Milestone = { id: string; title: string; description: string | null; quests: Quest[] }

interface GoalManagerProps {
  milestones: Milestone[]
}

type ViewState = 
  | { type: 'CHOICE' }
  | { type: 'LIST_MILESTONES' }
  | { type: 'FORM_MILESTONE', editData?: Milestone }
  | { type: 'LIST_QUESTS', milestoneId: string }
  | { type: 'FORM_QUEST', milestoneId: string, editData?: Quest }
  | { type: 'LIST_TASKS', milestoneId: string, questId: string }
  | { type: 'FORM_TASK', milestoneId: string, questId: string, editData?: Task }

export function GoalManager({ milestones, children }: { milestones: Milestone[], children?: React.ReactNode }) {
  const t = useTranslations("goals")
  const tCommon = useTranslations("common")
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<ViewState>({ type: 'CHOICE' })
  const router = useRouter()

  const reset = () => setView({ type: 'CHOICE' })

  const renderContent = () => {
    switch (view.type) {
      case 'CHOICE':
        return <ChoiceView onSelectManual={() => setView({ type: 'LIST_MILESTONES' })} />
      case 'LIST_MILESTONES':
        return <MilestoneListView 
          milestones={milestones} 
          onEdit={(m) => setView({ type: 'FORM_MILESTONE', editData: m })}
          onSelect={(id) => setView({ type: 'LIST_QUESTS', milestoneId: id })}
          onCreate={() => setView({ type: 'FORM_MILESTONE' })}
          onBack={() => setView({ type: 'CHOICE' })}
        />
      case 'FORM_MILESTONE':
        return <MilestoneForm 
          editData={view.editData} 
          onCancel={() => setView({ type: 'LIST_MILESTONES' })}
        />
      case 'LIST_QUESTS':
        const activeMilestone = milestones.find(m => m.id === view.milestoneId)
        return <QuestListView 
          quests={activeMilestone?.quests || []}
          milestoneTitle={activeMilestone?.title}
          onEdit={(q) => setView({ type: 'FORM_QUEST', milestoneId: view.milestoneId, editData: q })}
          onSelect={(qId) => setView({ type: 'LIST_TASKS', milestoneId: view.milestoneId, questId: qId })}
          onCreate={() => setView({ type: 'FORM_QUEST', milestoneId: view.milestoneId })}
          onBack={() => setView({ type: 'LIST_MILESTONES' })}
        />
      case 'FORM_QUEST':
        return <QuestForm 
          milestoneId={view.milestoneId}
          editData={view.editData}
          onCancel={() => setView({ type: 'LIST_QUESTS', milestoneId: view.milestoneId })}
        />
      case 'LIST_TASKS':
        const parentMilestone = milestones.find(m => m.id === view.milestoneId)
        const activeQuest = parentMilestone?.quests.find(q => q.id === view.questId)
        return <TaskListView 
          tasks={activeQuest?.tasks || []}
          questTitle={activeQuest?.title}
          onEdit={(t) => setView({ type: 'FORM_TASK', milestoneId: view.milestoneId, questId: view.questId, editData: t })}
          onCreate={() => setView({ type: 'FORM_TASK', milestoneId: view.milestoneId, questId: view.questId })}
          onBack={() => setView({ type: 'LIST_QUESTS', milestoneId: view.milestoneId })}
        />
      case 'FORM_TASK':
        return <TaskForm 
          questId={view.questId}
          editData={view.editData}
          onCancel={() => setView({ type: 'LIST_TASKS', milestoneId: view.milestoneId, questId: view.questId })}
        />
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => { setOpen(val); if(!val) reset(); }}>
      <DialogTrigger asChild>
        {children || (
            <Button variant="outline" className="gap-2">
                <Target className="w-4 h-4" /> {t("manageGoals")}
            </Button>
        )}
      </DialogTrigger>
      {/* Increased max-width to 600px to accommodate the AI Verifier button better */}
      <DialogContent className="sm:max-w-[600px]">
        {renderContent()}
      </DialogContent>
    </Dialog>
  )
}

// ================= SUB-COMPONENTS =================

function ChoiceView({ onSelectManual }: { onSelectManual: () => void }) {
  const t = useTranslations("goals")
  const router = useRouter()
  return (
    <div className="space-y-6 py-4">
      <DialogHeader>
        <DialogTitle className="text-center text-xl">{t("goalManagement")}</DialogTitle>
      </DialogHeader>
      <div className="grid grid-cols-2 gap-4">
        <button onClick={onSelectManual} className="flex flex-col items-center justify-center p-6 border-2 border-border rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group">
          <div className="p-3 bg-muted rounded-full mb-3 group-hover:bg-blue-200 transition-colors"><PenTool className="w-6 h-6 text-muted-foreground group-hover:text-blue-700" /></div>
          <span className="font-bold text-foreground">{t("manual")}</span>
          <span className="text-xs text-muted-foreground text-center mt-1">{t("fullControl")}</span>
        </button>
        <button onClick={() => router.push('/ai-chat')} className="flex flex-col items-center justify-center p-6 border-2 border-border rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all group">
          <div className="p-3 bg-muted rounded-full mb-3 group-hover:bg-purple-200 transition-colors"><Sparkles className="w-6 h-6 text-muted-foreground group-hover:text-purple-700" /></div>
          <span className="font-bold text-foreground">{t("aiAssistant")}</span>
          <span className="text-xs text-muted-foreground text-center mt-1">{t("autoGenerate")}</span>
        </button>
      </div>
    </div>
  )
}

// --- MILESTONE COMPONENTS ---

interface MilestoneListProps {
  milestones: Milestone[]
  onEdit: (m: Milestone) => void
  onSelect: (id: string) => void
  onCreate: () => void
  onBack: () => void
}

function MilestoneListView({ milestones, onEdit, onSelect, onCreate, onBack }: MilestoneListProps) {
  const t = useTranslations("goals")
  const tCommon = useTranslations("common")
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <div className="space-y-4">
      <DialogHeader className="flex flex-row items-center justify-between pb-2 border-b pr-10">
        <DialogTitle>{t("milestones")}</DialogTitle>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 text-muted-foreground hover:text-foreground" 
          onClick={() => router.push('/goals')}
          title={t("manageGoals")}
        >
          <ExternalLink className="w-4 h-4" />
        </Button>
      </DialogHeader>

      <ScrollArea className="h-[300px] pr-4">
        {milestones.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm py-10 border border-dashed rounded-lg">
                {t("noMilestonesYet")}
            </div>
        ) : (
            <div className="space-y-2">
            {milestones.map((m) => (
                <div key={m.id} className="flex items-center gap-2 p-2 bg-accent rounded-lg group hover:bg-accent/80">
                <div className="flex-1 cursor-pointer min-w-0" onClick={() => onSelect(m.id)}>
                    <p className="font-medium truncate">{m.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{m.quests.length} {t("quests")}</p>
                </div>
                <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => onEdit(m)}>
                    <Pencil className="w-3 h-3 text-muted-foreground" />
                </Button>
                <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-8 w-8 shrink-0 hover:text-red-600 hover:bg-red-50" 
                    disabled={isPending} 
                    onClick={() => { if(confirm(t('confirmDelete'))) startTransition(() => deleteMilestone(m.id)) }}
                >
                    <Trash2 className="w-3 h-3" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => onSelect(m.id)}>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Button>
                </div>
            ))}
            </div>
        )}
      </ScrollArea>
      <div className="flex justify-between pt-2 border-t">
        <Button variant="ghost" onClick={onBack} size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> {tCommon("back")}
        </Button>
        <Button onClick={onCreate} size="sm">
            <Plus className="w-4 h-4 mr-2" /> {t("newMilestone")}
        </Button>
      </div>
    </div>
  )
}

function MilestoneForm({ editData, onCancel }: { editData?: Milestone, onCancel: () => void }) {
  const t = useTranslations("goals")
  const tCommon = useTranslations("common")
  const [isPending, startTransition] = useTransition()
   
  const action = (formData: FormData) => {
    startTransition(async () => {
      if (editData) await updateMilestone(editData.id, formData.get('title') as string, formData.get('description') as string)
      else await createMilestone(formData.get('title') as string, formData.get('description') as string)
      onCancel()
    })
  }

  return (
    <form action={action} className="space-y-4">
      <DialogHeader><DialogTitle>{editData ? t('editMilestone') : t('createMilestone')}</DialogTitle></DialogHeader>
      <div className="space-y-2"><Label>{tCommon("title")}</Label><Input name="title" defaultValue={editData?.title} required /></div>
      <div className="space-y-2"><Label>{tCommon("description")}</Label><Textarea name="description" defaultValue={editData?.description || ""} /></div>
      <div className="flex justify-between pt-2">
        <Button variant="ghost" type="button" onClick={onCancel}>{tCommon("cancel")}</Button>
        <Button type="submit" disabled={isPending}>{isPending ? <Loader2 className="w-4 h-4 animate-spin"/> : tCommon('save')}</Button>
      </div>
    </form>
  )
}

// --- QUEST COMPONENTS ---

interface QuestListProps {
  quests: Quest[]
  milestoneTitle?: string
  onEdit: (q: Quest) => void
  onSelect: (id: string) => void
  onCreate: () => void
  onBack: () => void
}

function QuestListView({ quests, milestoneTitle, onEdit, onSelect, onCreate, onBack }: QuestListProps) {
  const t = useTranslations("goals")
  const tCommon = useTranslations("common")
  const [isPending, startTransition] = useTransition()

  return (
    <div className="space-y-4">
      <DialogHeader className="pb-2 border-b">
        <DialogTitle className="text-sm text-muted-foreground font-normal">{t("questsFor")}</DialogTitle>
        <div className="font-bold text-lg truncate">{milestoneTitle}</div>
      </DialogHeader>
      <ScrollArea className="h-[300px] pr-4">
        <div className="space-y-2">
          {quests.map((q) => (
            <div key={q.id} className="flex items-center gap-2 p-2 bg-accent rounded-lg group hover:bg-accent/80">
              <div className="flex-1 cursor-pointer" onClick={() => onSelect(q.id)}>
                <p className="font-medium truncate">{q.title}</p>
                <p className="text-xs text-muted-foreground">{q.tasks.length} {t("tasks")} • {q.difficulty}</p>
              </div>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onEdit(q)}><Pencil className="w-3 h-3 text-muted-foreground" /></Button>
              <Button size="icon" variant="ghost" className="h-8 w-8 hover:text-red-600" disabled={isPending} onClick={() => { if(confirm(t('confirmDelete'))) startTransition(() => deleteQuest(q.id)) }}><Trash2 className="w-3 h-3" /></Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onSelect(q.id)}><ChevronRight className="w-4 h-4 text-muted-foreground" /></Button>
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-2" /> {tCommon("back")}</Button>
        <Button onClick={onCreate}><Plus className="w-4 h-4 mr-2" /> {t("newQuest")}</Button>
      </div>
    </div>
  )
}

function QuestForm({ milestoneId, editData, onCancel }: { milestoneId: string, editData?: Quest, onCancel: () => void }) {
  const t = useTranslations("goals")
  const tCommon = useTranslations("common")
  const [isPending, startTransition] = useTransition()
   
  const action = (formData: FormData) => {
    startTransition(async () => {
      const title = formData.get('title') as string
      const description = formData.get('description') as string
      const difficulty = formData.get('difficulty') as any
       
      if (editData) {
        await updateQuest(editData.id, title, description, difficulty)
      } else {
        await createQuest(milestoneId, title, description, difficulty)
      }
      onCancel()
    })
  }

  return (
    <form action={action} className="space-y-4">
      <DialogHeader><DialogTitle>{editData ? t('editQuest') : t('createQuest')}</DialogTitle></DialogHeader>
       
      <div className="space-y-2">
        <Label>{tCommon("title")}</Label>
        <Input name="title" defaultValue={editData?.title} required />
      </div>

      <div className="space-y-2">
        <Label>{tCommon("description")}</Label>
        <Textarea 
            name="description" 
            defaultValue={editData?.description || ""} 
            placeholder={t("missionPlaceholder")} 
        />
      </div>

      <div className="space-y-2">
        <Label>{t("difficulty")}</Label>
        <Select name="difficulty" defaultValue={editData?.difficulty || "MEDIUM"}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="EASY">{t("easy")}</SelectItem>
            <SelectItem value="MEDIUM">{t("medium")}</SelectItem>
            <SelectItem value="HARD">{t("hard")}</SelectItem>
            <SelectItem value="EPIC">{t("epic")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
       
      <div className="flex justify-between pt-2">
        <Button variant="ghost" type="button" onClick={onCancel}>{tCommon("cancel")}</Button>
        <Button type="submit" disabled={isPending}>
            {isPending ? <Loader2 className="w-4 h-4 animate-spin"/> : tCommon('save')}
        </Button>
      </div>
    </form>
  )
}

// --- TASK COMPONENTS ---

interface TaskListProps {
  tasks: Task[]
  questTitle?: string
  onEdit: (t: Task) => void
  onCreate: () => void
  onBack: () => void
}

function TaskListView({ tasks, questTitle, onEdit, onCreate, onBack }: TaskListProps) {
  const t = useTranslations("goals")
  const tCommon = useTranslations("common")
  const [isPending, startTransition] = useTransition()

  return (
    <div className="space-y-4">
      <DialogHeader className="pb-2 border-b">
        <DialogTitle className="text-sm text-muted-foreground font-normal">{t("tasksFor")}</DialogTitle>
        <div className="font-bold text-lg truncate">{questTitle}</div>
      </DialogHeader>
      <ScrollArea className="h-[300px] pr-4">
        <div className="space-y-2">
          {tasks.map((task) => (
            // Changed: items-center -> items-start to allow text wrapping
            <div key={task.id} className="flex items-start gap-2 p-3 bg-accent rounded-lg group hover:bg-accent/80 group/task">
              
              {/* Text Container - Allowed to wrap */}
              <div className="flex-1 min-w-0 mr-2 mt-1">
                {/* Removed 'truncate', added 'break-words' and 'whitespace-normal' */}
                <p className="font-medium text-sm text-foreground leading-snug break-words whitespace-normal">
                  {task.content}
                </p>
              </div>

              {/* Actions Container - Fixed Width */}
              <div className="flex items-center gap-1 shrink-0">
                <TaskVerifier 
                    taskId={task.id} 
                    taskContent={task.content} 
                    isCompleted={task.isCompleted} 
                />

                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onEdit(task)}>
                    <Pencil className="w-3 h-3 text-muted-foreground" />
                </Button>
                <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-8 w-8 hover:text-red-600" 
                    disabled={isPending} 
                    onClick={() => { if(confirm(t('confirmDelete'))) startTransition(() => deleteTask(task.id)) }}
                >
                    <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-2" /> {tCommon("back")}</Button>
        <Button onClick={onCreate}><Plus className="w-4 h-4 mr-2" /> {t("newTask")}</Button>
      </div>
    </div>
  )
}

function TaskForm({ questId, editData, onCancel }: { questId: string, editData?: Task, onCancel: () => void }) {
  const t = useTranslations("goals")
  const tCommon = useTranslations("common")
  const [isPending, startTransition] = useTransition()
   
  const action = (formData: FormData) => {
    startTransition(async () => {
      const content = formData.get('content') as string
      if (editData) await updateTask(editData.id, content)
      else await createTask(questId, content)
      onCancel()
    })
  }

  return (
    <form action={action} className="space-y-4">
      <DialogHeader><DialogTitle>{editData ? t('editTask') : t('createTask')}</DialogTitle></DialogHeader>
      <div className="space-y-2"><Label>{t("content")}</Label><Input name="content" defaultValue={editData?.content} required /></div>
      <div className="flex justify-between pt-2">
        <Button variant="ghost" type="button" onClick={onCancel}>{tCommon("cancel")}</Button>
        <Button type="submit" disabled={isPending}>{isPending ? <Loader2 className="w-4 h-4 animate-spin"/> : tCommon('save')}</Button>
      </div>
    </form>
  )
}