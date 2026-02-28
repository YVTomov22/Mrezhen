"use client";

import { useState } from "react";
import { 
  Check, X, Edit2, Loader2, ChevronRight, ChevronDown, 
  Target, Shield, CheckCircle2, AlertCircle, Tag, Eye,
  Swords, Flame, Zap, Trophy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { 
  createMilestone, updateMilestone, deleteMilestone,
  createQuest, updateQuest, deleteQuest,
  createTask, updateTask, deleteTask
} from "@/app/actions/game";

// Types matching the AI response structure
type ProposalTask = {
  taskId: string; // 'new-t-X' or real ID
  operation: 'create' | 'update' | 'delete' | 'none';
  title: string;
  desc?: string;
};

type ProposalQuest = {
  questId: string; // 'new-q-X' or real ID
  operation: 'create' | 'update' | 'delete' | 'none';
  title: string;
  desc?: string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'EPIC';
  tasks: ProposalTask[];
};

type ProposalMilestone = {
  milestoneId: string; // 'new-m-X' or real ID
  operation: 'create' | 'update' | 'delete' | 'none';
  title: string;
  desc?: string;
  category?: string;
  quests: ProposalQuest[];
};

// Difficulty config
const DIFFICULTY_CONFIG = {
  EASY: { label: "Easy", color: "bg-green-100 text-green-700 border-green-200", icon: Zap, xp: 20 },
  MEDIUM: { label: "Medium", color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Flame, xp: 50 },
  HARD: { label: "Hard", color: "bg-orange-100 text-orange-700 border-orange-200", icon: Swords, xp: 100 },
  EPIC: { label: "Epic", color: "bg-purple-100 text-purple-700 border-purple-200", icon: Trophy, xp: 500 },
} as const;

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const config = DIFFICULTY_CONFIG[difficulty as keyof typeof DIFFICULTY_CONFIG];
  if (!config) return null;
  const Icon = config.icon;
  return (
    <Badge variant="outline" className={cn("text-[10px] gap-1 px-1.5 py-0", config.color)}>
      <Icon className="w-2.5 h-2.5" /> {config.label} · {config.xp}xp
    </Badge>
  );
}

function CategoryTag({ category }: { category: string }) {
  return (
    <Badge variant="outline" className="text-[10px] gap-1 px-1.5 py-0 bg-blue-50 text-blue-600 border-blue-200">
      <Tag className="w-2.5 h-2.5" /> {category}
    </Badge>
  );
}

// Quest Detail Overlay
function QuestDetailOverlay({ quest, open, onClose }: { quest: ProposalQuest; open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[70vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-500" />
            {quest.title}
          </DialogTitle>
        </DialogHeader>

        {quest.difficulty && (
          <div className="flex items-center gap-2 mt-1">
            <DifficultyBadge difficulty={quest.difficulty} />
          </div>
        )}

        {quest.desc && (
          <p className="text-sm text-muted-foreground mt-2">{quest.desc}</p>
        )}

        {quest.tasks && quest.tasks.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Tasks ({quest.tasks.length})
            </h4>
            {quest.tasks.map((t) => (
              <div key={t.taskId} className="flex items-start gap-2 p-2 rounded border border-border bg-muted/30">
                <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-muted-foreground/60 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{t.title}</p>
                  {t.desc && <p className="text-xs text-muted-foreground mt-0.5">{t.desc}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Goal Detail Overlay
function GoalDetailOverlay({ milestone, open, onClose }: { milestone: ProposalMilestone; open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            {milestone.title}
          </DialogTitle>
        </DialogHeader>

        {milestone.category && (
          <div className="flex items-center gap-2 mt-1">
            <CategoryTag category={milestone.category} />
          </div>
        )}

        {milestone.desc && (
          <p className="text-sm text-muted-foreground mt-2">{milestone.desc}</p>
        )}

        {milestone.quests && milestone.quests.length > 0 && (
          <div className="mt-4 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Quests ({milestone.quests.length})
            </h4>
            {milestone.quests.map((q) => (
              <div key={q.questId} className="border rounded-lg p-3 bg-muted/30 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Shield className="w-3 h-3 text-purple-500" />
                    {q.title}
                  </span>
                  {q.difficulty && <DifficultyBadge difficulty={q.difficulty} />}
                </div>
                {q.desc && <p className="text-xs text-muted-foreground">{q.desc}</p>}
                {q.tasks && q.tasks.length > 0 && (
                  <ul className="pl-4 space-y-1 border-l-2 border-border ml-1">
                    {q.tasks.map((t) => (
                      <li key={t.taskId} className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <CheckCircle2 className="w-2.5 h-2.5 text-muted-foreground/50" />
                        {t.title}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface RoadmapProposalProps {
  data: { milestones: ProposalMilestone[] };
}

export function RoadmapProposal({ data }: RoadmapProposalProps) {
  const t = useTranslations("aiChat")
  const tCommon = useTranslations("common")
  // Local state to manage edits/acceptances before they hit the DB
  const [milestones, setMilestones] = useState<ProposalMilestone[]>(data.milestones || []);

  const handleMilestoneChange = (index: number, updated: ProposalMilestone) => {
    const newM = [...milestones];
    newM[index] = updated;
    setMilestones(newM);
  };

  if (!milestones || milestones.length === 0) return null;

  return (
    <div className="mt-6 space-y-4 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-2 mb-2">
        <Target className="w-4 h-4 text-muted-foreground" />
        <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider">{t("suggestedChanges")}</h3>
      </div>
      
      <div className="space-y-4">
        {milestones.map((m, idx) => (
          <MilestoneCard 
            key={m.milestoneId} 
            milestone={m} 
            onChange={(updated) => handleMilestoneChange(idx, updated)}
          />
        ))}
      </div>
    </div>
  );
}

// Milestone Card
function MilestoneCard({ milestone, onChange }: { milestone: ProposalMilestone, onChange: (m: ProposalMilestone) => void }) {
  const t = useTranslations("aiChat")
  const tCommon = useTranslations("common")
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'ACCEPTED' | 'REJECTED'>('IDLE');
  const [realId, setRealId] = useState<string | null>(milestone.operation === 'create' ? null : milestone.milestoneId);
  const [isExpanded, setIsExpanded] = useState(true);
  const [showOverlay, setShowOverlay] = useState(false);

  const handleAccept = async () => {
    setStatus('LOADING');
    try {
      if (milestone.operation === 'create') {
        const res = await createMilestone(milestone.title, milestone.desc || "", milestone.category);
        if (res?.success && res.data) {
          setRealId(res.data.id);
          setStatus('ACCEPTED');
        }
      } else if (milestone.operation === 'update') {
        await updateMilestone(milestone.milestoneId, milestone.title, milestone.desc || "", milestone.category);
        setRealId(milestone.milestoneId);
        setStatus('ACCEPTED');
      } else if (milestone.operation === 'delete') {
        await deleteMilestone(milestone.milestoneId);
        setStatus('ACCEPTED');
      } else {
        setStatus('ACCEPTED');
        setRealId(milestone.milestoneId);
      }
    } catch (e) {
      console.error(e);
      setStatus('IDLE');
    }
  };

  const handleUpdateChild = (qIdx: number, updatedQuest: ProposalQuest) => {
    const newQuests = [...(milestone.quests || [])];
    newQuests[qIdx] = updatedQuest;
    onChange({ ...milestone, quests: newQuests });
  };

  if (status === 'REJECTED') return null; // Hide if rejected

  // Determine if children are blocked
  // Children blocked if: this is a CREATE op AND we haven't accepted (got a real ID) yet.
  const isChildrenBlocked = milestone.operation === 'create' && !realId;

  return (
    <div className={cn("border rounded-xl bg-card overflow-hidden shadow-sm transition-all", 
        status === 'ACCEPTED' ? "border-green-200 bg-green-50/30" : "border-border"
    )}>
      {/* Goal Detail Overlay */}
      <GoalDetailOverlay milestone={milestone} open={showOverlay} onClose={() => setShowOverlay(false)} />

      {/* Header */}
      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
             {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
             <Badge variant={milestone.operation === 'create' ? 'default' : 'secondary'} className="uppercase text-[10px]">
                {milestone.operation}
             </Badge>
             {isEditing ? (
               <Input value={milestone.title} onChange={e => onChange({...milestone, title: e.target.value})} className="h-7 text-sm" />
             ) : (
               <h4 className="font-semibold text-foreground">{milestone.title}</h4>
             )}
             {milestone.category && !isEditing && <CategoryTag category={milestone.category} />}
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-1">
            {status === 'ACCEPTED' ? (
                <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {t("synced")}
                </Badge>
            ) : (
                <>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setShowOverlay(true); }} title="View goal details">
                        <Eye className="w-3 h-3 text-muted-foreground" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setIsEditing(!isEditing)}>
                        <Edit2 className="w-3 h-3 text-muted-foreground" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 hover:bg-red-100 hover:text-red-600" onClick={() => setStatus('REJECTED')}>
                        <X className="w-3 h-3" />
                    </Button>
                    <Button size="icon" variant="default" className="h-7 w-7 bg-green-600 hover:bg-green-700" onClick={handleAccept} disabled={status === 'LOADING'}>
                        {status === 'LOADING' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                    </Button>
                </>
            )}
          </div>
        </div>
        
        {isEditing && (
             <Textarea 
                value={milestone.desc || ""} 
                onChange={e => onChange({...milestone, desc: e.target.value})} 
                className="text-xs bg-muted mb-2" 
                placeholder={tCommon("descriptionPlaceholder")}
             />
        )}
        {!isEditing && milestone.desc && <p className="text-xs text-muted-foreground ml-6 line-clamp-2">{milestone.desc}</p>}
      </div>

      {/* Children Quests */}
      {isExpanded && milestone.quests && milestone.quests.length > 0 && (
        <div className="bg-muted/50 p-3 pl-8 border-t border-border space-y-3">
          {isChildrenBlocked && (
             <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200 mb-2">
                <AlertCircle className="w-3 h-3" />
                <span>{t("acceptParentFirst")}</span>
             </div>
          )}
          
          {milestone.quests.map((q, idx) => (
             <QuestCard 
                key={q.questId} 
                quest={q} 
                parentRealId={realId} // Pass the real ID so quest can link to it
                isDisabled={isChildrenBlocked}
                onChange={(updated) => handleUpdateChild(idx, updated)}
             />
          ))}
        </div>
      )}
    </div>
  );
}

// Quest Card
function QuestCard({ quest, parentRealId, isDisabled, onChange }: { 
    quest: ProposalQuest, 
    parentRealId: string | null, 
    isDisabled: boolean,
    onChange: (q: ProposalQuest) => void 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'ACCEPTED' | 'REJECTED'>('IDLE');
  const [realId, setRealId] = useState<string | null>(quest.operation === 'create' ? null : quest.questId);

  const handleAccept = async () => {
    if (!parentRealId && quest.operation === 'create') return; // Safety check
    setStatus('LOADING');
    try {
        if (quest.operation === 'create' && parentRealId) {
            const res = await createQuest(parentRealId, quest.title, quest.desc || "", (quest.difficulty as any) || "MEDIUM");
            if (res?.success && res.data) {
                setRealId(res.data.id);
                setStatus('ACCEPTED');
            }
        } else if (quest.operation === 'update') {
            await updateQuest(quest.questId, quest.title, quest.desc || "", (quest.difficulty as any) || "MEDIUM");
            setRealId(quest.questId);
            setStatus('ACCEPTED');
        } else if (quest.operation === 'delete') {
            await deleteQuest(quest.questId);
            setStatus('ACCEPTED');
        } else {
             setStatus('ACCEPTED');
             setRealId(quest.questId);
        }
    } catch (e) {
        console.error(e);
        setStatus('IDLE');
    }
  };
  
  const handleUpdateTask = (tIdx: number, updatedTask: ProposalTask) => {
    const newTasks = [...(quest.tasks || [])];
    newTasks[tIdx] = updatedTask;
    onChange({ ...quest, tasks: newTasks });
  };

  if (status === 'REJECTED') return null;

  const isTasksBlocked = quest.operation === 'create' && !realId;

  return (
    <div className={cn("border rounded-lg bg-card shadow-sm p-3 relative", isDisabled && "opacity-60 grayscale pointer-events-none")}>
       {/* Quest Header */}
       <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 flex-1">
             <Shield className="w-3 h-3 text-purple-500" />
             {isEditing ? (
               <Input value={quest.title} onChange={e => onChange({...quest, title: e.target.value})} className="h-6 text-xs" />
             ) : (
               <span className="text-sm font-medium text-foreground">{quest.title}</span>
             )}
             {quest.difficulty && !isEditing && <DifficultyBadge difficulty={quest.difficulty} />}
          </div>
          
          <div className="flex items-center gap-1">
             {status === 'ACCEPTED' ? (
                 <CheckCircle2 className="w-4 h-4 text-green-600" />
             ) : (
                <>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setIsEditing(!isEditing)}>
                        <Edit2 className="w-3 h-3 text-muted-foreground" />
                    </Button>
                    <Button size="icon" variant="default" className="h-6 w-6 bg-purple-600 hover:bg-purple-700" onClick={handleAccept} disabled={status === 'LOADING' || isDisabled}>
                        {status === 'LOADING' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                    </Button>
                </>
             )}
          </div>
       </div>

       {/* Children Tasks */}
       {quest.tasks && quest.tasks.length > 0 && (
         <div className="pl-6 space-y-2 mt-2 border-l-2 border-border ml-1.5">
            {quest.tasks.map((t, idx) => (
               <TaskCard 
                  key={t.taskId} 
                  task={t} 
                  parentQuest={quest}
                  parentRealId={realId}
                  isDisabled={isTasksBlocked || isDisabled}
                  onChange={(updated) => handleUpdateTask(idx, updated)}
               />
            ))}
         </div>
       )}
    </div>
  );
}

// Task Card
function TaskCard({ task, parentQuest, parentRealId, isDisabled, onChange }: {
    task: ProposalTask,
    parentQuest: ProposalQuest,
    parentRealId: string | null,
    isDisabled: boolean,
    onChange: (t: ProposalTask) => void
}) {
    const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'ACCEPTED' | 'REJECTED'>('IDLE');
    const [showQuest, setShowQuest] = useState(false);

    const handleAccept = async () => {
        if (!parentRealId && task.operation === 'create') return;
        setStatus('LOADING');
        try {
            if (task.operation === 'create' && parentRealId) {
                await createTask(parentRealId, task.title);
                setStatus('ACCEPTED');
            } else if (task.operation === 'update') {
                await updateTask(task.taskId, task.title);
                setStatus('ACCEPTED');
            } else if (task.operation === 'delete') {
                await deleteTask(task.taskId);
                setStatus('ACCEPTED');
            }
        } catch (e) {
            console.error(e);
            setStatus('IDLE');
        }
    };

    if (status === 'REJECTED') return null;

    return (
        <>
            <QuestDetailOverlay quest={parentQuest} open={showQuest} onClose={() => setShowQuest(false)} />
            <div
                className={cn(
                    "flex items-center justify-between text-xs bg-accent p-2 rounded border border-border cursor-pointer hover:bg-accent/80 transition-colors",
                    (isDisabled || status === 'ACCEPTED') && "opacity-75"
                )}
                onClick={() => setShowQuest(true)}
            >
                <span className="truncate flex-1">{task.title}</span>
                <div className="flex gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
                    {status === 'ACCEPTED' ? (
                         <CheckCircle2 className="w-3 h-3 text-green-500" />
                    ) : (
                        <>
                            <button className="text-muted-foreground hover:text-red-500" onClick={() => setStatus('REJECTED')} disabled={isDisabled}>
                                <X className="w-3 h-3" />
                            </button>
                            <button className="text-blue-500 hover:text-blue-700" onClick={handleAccept} disabled={status === 'LOADING' || isDisabled}>
                                 {status === 'LOADING' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </>
    )
}