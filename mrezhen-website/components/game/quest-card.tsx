'use client'

import { useState, useTransition } from "react"
import { completeQuest } from "@/app/actions/game"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trophy, CheckCircle2, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { TaskVerifier } from "@/components/game/task-verifier"
import { useTranslations } from "next-intl"

type Task = { id: string; content: string; isCompleted: boolean; points: number }
type Quest = { 
  id: string; 
  title: string; 
  difficulty: string; 
  status: string; 
  completionPoints: number;
  tasks: Task[] 
}

export function QuestCard({ quest }: { quest: Quest }) {
  const t = useTranslations("goals")
  const [isPending, startTransition] = useTransition()
  // Default to closed if completed, open if active
  const [isOpen, setIsOpen] = useState(quest.status !== 'COMPLETED')
  
  const allTasksCompleted = quest.tasks.every(t => t.isCompleted)
  const isQuestCompleted = quest.status === 'COMPLETED'

  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation() 
    startTransition(async () => {
      await completeQuest(quest.id)
    })
  }

  return (
    <Card className={cn("border-l-4 transition-all bg-card overflow-hidden", 
      isQuestCompleted ? "border-l-amber-300 opacity-75" : "border-l-amber-500"
    )}>
      <CardHeader 
        className="pb-2 cursor-pointer hover:bg-accent/50 transition-colors select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex justify-between items-start">
          <div className="flex gap-3 w-full"> {/* Increased gap, added w-full */}
            
            {/* FIX: 
               1. shrink-0: prevents icon from being squished
               2. w-6 h-6: reserves strict space so text doesn't jump
            */}
            <div className="shrink-0 w-6 h-6 flex items-center justify-center mt-0.5">
                <div className={cn("text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")}>
                    <ChevronDown className="w-5 h-5" />
                </div>
            </div>

            <div className="flex-1">
              <CardTitle className="text-lg flex items-center gap-2 leading-none pt-0.5">
                {quest.title}
                {isQuestCompleted && <CheckCircle2 className="h-5 w-5 text-green-500" />}
              </CardTitle>
              <div className="flex gap-2 mt-2">
                <Badge variant="secondary" className="text-xs font-medium">{quest.difficulty}</Badge>
                <Badge variant="outline" className="text-foreground border-border">
                  +{quest.completionPoints} XP
                </Badge>
              </div>
            </div>
          </div>
          
          {!isQuestCompleted && (
            <Button 
              size="sm" 
              onClick={handleComplete}
              disabled={!allTasksCompleted || isPending}
              className={cn(
                  "transition-all ml-2 shrink-0", 
                  allTasksCompleted ? "bg-foreground hover:bg-foreground/90 text-background" : "bg-muted text-muted-foreground hover:bg-accent"
              )}
            >
              <Trophy className="w-4 h-4 mr-1" />
              {t("claim")}
            </Button>
          )}
        </div>
      </CardHeader>

      {isOpen && (
        <CardContent className="animate-in slide-in-from-top-2 duration-200">
          <div className="space-y-1 pt-2">
            {quest.tasks.map(task => (
              <div key={task.id} className="group/task flex items-center justify-between p-2 rounded hover:bg-accent transition-colors">
                <div className="flex items-center space-x-3 overflow-hidden">
                  <span 
                    className={cn(
                      "text-sm font-medium leading-none truncate max-w-[200px] sm:max-w-xs",
                      task.isCompleted && "line-through text-muted-foreground"
                    )}
                  >
                    {task.content} 
                  </span>
                  <span className="text-xs text-muted-foreground ml-1 shrink-0">(+{task.points}xp)</span>
                </div>

                <TaskVerifier 
                  taskId={task.id} 
                  taskContent={task.content} 
                  isCompleted={task.isCompleted} 
                />
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  )
}