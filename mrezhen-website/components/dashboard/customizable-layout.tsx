'use client'

import { useState, useEffect } from 'react'
import { Reorder } from 'framer-motion'
import {
  Trophy, Zap, Flame, Target, GripVertical, Share2, Check, Pencil,
  Star, Heart, Sparkles, Rocket, Crown, Gem, Skull, Ghost, Bug,
  Swords, Shield, Anchor, Compass, Mountain, Sun, Moon, CloudLightning,
  Dumbbell, Brain, Music, Camera, Coffee, BookOpen, Gamepad2, Palette,
  X, Plus, LayoutDashboard,
} from 'lucide-react'
import { XpChart } from '@/components/dashboard/xp-chart'
import { MilestoneWidget } from '@/components/dashboard/milestone-widget'
import { QuestCard } from '@/components/game/quest-card'
import { GoalManager } from '@/components/dashboard/goal-manager'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import type { LucideIcon } from 'lucide-react'

/* Types */

export type WidgetId = 'stats' | 'level' | 'activity' | 'quests' | 'goals'

export interface StatBox {
  id: string
  icon: string
  label: string
  value: string
  color: string
}

export interface DashboardConfig {
  widgetOrder: WidgetId[]
  widgetColors: Record<string, string>
  statBoxes: StatBox[]
}

/* Constants */

const ICON_MAP: Record<string, LucideIcon> = {
  Trophy, Zap, Flame, Target, Star, Heart, Sparkles, Rocket, Crown, Gem,
  Skull, Ghost, Bug, Swords, Shield, Anchor, Compass, Mountain, Sun, Moon,
  CloudLightning, Dumbbell, Brain, Music, Camera, Coffee, BookOpen, Gamepad2, Palette,
}

const ICON_NAMES = Object.keys(ICON_MAP)

const COLOR_PRESETS = [
  '#121212', '#1A1A1A', '#1E293B', '#1C1917',
  '#FF5722', '#E64A19', '#FF3B30', '#FF9500',
  '#FFCC00', '#34C759', '#00C7BE', '#007AFF',
  '#5856D6', '#AF52DE', '#FF2D55', '#A2845E',
]

const ICON_COLOR_PRESETS = [
  '#FFCC00', '#FF5722', '#FF3B30', '#34C759',
  '#007AFF', '#5856D6', '#AF52DE', '#FF2D55',
  '#00C7BE', '#FF9500', '#A2845E', '#FFFFFF',
]

const DEFAULT_STAT_BOXES: StatBox[] = [
  { id: 'level', icon: 'Trophy', label: 'CURRENT LEVEL', value: '__level__', color: '#FFCC00' },
  { id: 'totalxp', icon: 'Zap', label: 'TOTAL XP', value: '__score__', color: '#FF5722' },
  { id: 'weeklyxp', icon: 'Flame', label: 'WEEKLY XP', value: '__weekxp__', color: '#FF3B30' },
  { id: 'goalsmet', icon: 'Target', label: 'GOALS MET', value: '__completed__', color: '#34C759' },
]

const DEFAULT_CONFIG: DashboardConfig = {
  widgetOrder: ['stats', 'level', 'activity', 'quests', 'goals'],
  widgetColors: {
    stats: '',
    level: '',
    activity: '',
    quests: '',
    goals: '',
  },
  statBoxes: DEFAULT_STAT_BOXES,
}

/* Value presets */
const VALUE_PRESETS = [
  { label: 'Level', value: '__level__' },
  { label: 'Total XP', value: '__score__' },
  { label: 'Weekly XP', value: '__weekxp__' },
  { label: 'Goals Met', value: '__completed__' },
  { label: 'Custom', value: '' },
]

/* Helpers */

function resolveValue(val: string, user: any, weekXp: number, completedMilestones: number): string {
  switch (val) {
    case '__level__': return String(user.level)
    case '__score__': return user.score.toLocaleString()
    case '__weekxp__': return `+${weekXp}`
    case '__completed__': return String(completedMilestones)
    default: return val
  }
}

export function serializeConfig(cfg: DashboardConfig): string {
  return btoa(JSON.stringify(cfg))
}

export function deserializeConfig(str: string): DashboardConfig | null {
  try {
    return JSON.parse(atob(str))
  } catch {
    return null
  }
}

/* Color Picker Popover */

function ColorPicker({ current, onSelect, onClose, presets = COLOR_PRESETS }: {
  current: string
  onSelect: (c: string) => void
  onClose: () => void
  presets?: string[]
}) {
  return (
    <div
      className="absolute top-8 right-0 z-50 bg-popover border border-border rounded-2xl p-3 shadow-2xl min-w-[180px]"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-semibold text-foreground">Pick Color</span>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {presets.map((c) => (
          <button key={c}
            onClick={() => { onSelect(c); onClose() }}
            className="w-8 h-8 rounded-lg border-2 transition-all hover:scale-110"
            style={{ backgroundColor: c, borderColor: current === c ? '#fff' : 'transparent' }}
          />
        ))}
      </div>
    </div>
  )
}

/* Icon Picker Popover */

function IconPicker({ current, onSelect, onClose }: {
  current: string
  onSelect: (name: string) => void
  onClose: () => void
}) {
  return (
    <div
      className="absolute top-8 left-0 z-50 bg-popover border border-border rounded-2xl p-3 shadow-2xl min-w-[220px]"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-semibold text-foreground">Pick Icon</span>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>
      </div>
      <div className="grid grid-cols-6 gap-1.5 max-h-[200px] overflow-y-auto">
        {ICON_NAMES.map((name) => {
          const Icon = ICON_MAP[name]
          return (
            <button key={name}
              onClick={() => { onSelect(name); onClose() }}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-accent ${current === name ? 'bg-accent ring-1 ring-ring' : ''}`}
            >
              <Icon className="w-4 h-4 text-foreground" />
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* Stat Box Editor */

function StatBoxEditor({ box, onChange, onRemove }: {
  box: StatBox
  onChange: (b: StatBox) => void
  onRemove: () => void
}) {
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showIconPicker, setShowIconPicker] = useState(false)
  const Icon = ICON_MAP[box.icon] || Target
  const isPreset = ['__level__', '__score__', '__weekxp__', '__completed__'].includes(box.value)

  return (
    <div className="bg-card rounded-3xl p-6 border border-border flex flex-col items-center justify-center text-center relative group min-h-[140px]">
      {/* Remove button */}
      <button
        onClick={onRemove}
        className="absolute top-2 left-2 w-5 h-5 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center z-20"
      >
        <X className="w-3 h-3 text-foreground" />
      </button>

      {/* Icon color picker trigger */}
      <div className="absolute top-2 right-2 z-20">
        <button
          onClick={() => setShowColorPicker(true)}
          className="w-5 h-5 rounded-full border border-border hover:border-ring transition-colors"
          style={{ backgroundColor: box.color }}
        />
        {showColorPicker && (
          <ColorPicker current={box.color} presets={ICON_COLOR_PRESETS}
            onSelect={(c) => onChange({ ...box, color: c })}
            onClose={() => setShowColorPicker(false)} />
        )}
      </div>

      {/* Icon picker trigger */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20">
        <button
          onClick={() => setShowIconPicker(true)}
          className="w-5 h-5 rounded-full bg-muted hover:bg-accent flex items-center justify-center"
        >
          <Pencil className="w-3 h-3 text-foreground" />
        </button>
        {showIconPicker && (
          <IconPicker current={box.icon}
            onSelect={(name) => onChange({ ...box, icon: name })}
            onClose={() => setShowIconPicker(false)} />
        )}
      </div>

      <Icon className="w-6 h-6 mb-2 mt-4" style={{ color: box.color }} />

      {/* Value preset or custom */}
      <select
        value={isPreset ? box.value : ''}
        onChange={(e) => {
          const v = e.target.value
          const preset = VALUE_PRESETS.find(p => p.value === v)
          onChange({
            ...box,
            value: v,
            label: preset && v ? preset.label.toUpperCase() : box.label,
          })
        }}
        className="text-xs bg-muted border border-border text-foreground rounded-lg px-2 py-1 w-full mt-1 outline-none"
      >
        {VALUE_PRESETS.map((p) => (
          <option key={p.value} value={p.value}>{p.label}</option>
        ))}
      </select>

      {!isPreset && (
        <Input
          value={box.value}
          onChange={(e) => onChange({ ...box, value: e.target.value })}
          placeholder="Value"
          className="text-center text-lg font-bold bg-transparent border-border text-foreground w-full h-8 p-1 mt-1"
        />
      )}

      <Input
        value={box.label}
        onChange={(e) => onChange({ ...box, label: e.target.value })}
        className="text-center text-[10px] bg-transparent border-border text-muted-foreground w-full h-6 p-0.5 mt-1 uppercase"
      />
    </div>
  )
}

/* Main Component */

interface CustomizableLayoutProps {
  user: any
  activeMilestones: any[]
  completedMilestones: number
  weekXp: number
  xpProgress: number
  xpForNextLevel: number
  initialLayout?: string
}

export function CustomizableLayout({
  user, activeMilestones, completedMilestones, weekXp, xpProgress, xpForNextLevel, initialLayout,
}: CustomizableLayoutProps) {
  const router = useRouter()
  const [config, setConfig] = useState<DashboardConfig>(DEFAULT_CONFIG)
  const [isEditing, setIsEditing] = useState(false)
  const [colorPickerWidget, setColorPickerWidget] = useState<string | null>(null)

  // Load config
  useEffect(() => {
    if (initialLayout) {
      const parsed = deserializeConfig(initialLayout)
      if (parsed) { setConfig(parsed); return }
    }
    const saved = localStorage.getItem('dashboard-config')
    if (saved) {
      try { setConfig(JSON.parse(saved)) } catch {}
    }
  }, [initialLayout])

  const handleSave = () => {
    localStorage.setItem('dashboard-config', JSON.stringify(config))
    setIsEditing(false)
    toast.success('Dashboard layout saved!')
  }

  const handleShareAsPost = () => {
    const encoded = serializeConfig(config)
    router.push(`/community?new=1&dashboard=${encoded}`)
  }

  const updateStatBox = (idx: number, box: StatBox) => {
    setConfig((prev) => {
      const boxes = [...prev.statBoxes]
      boxes[idx] = box
      return { ...prev, statBoxes: boxes }
    })
  }

  const removeStatBox = (idx: number) => {
    setConfig((prev) => ({
      ...prev,
      statBoxes: prev.statBoxes.filter((_, i) => i !== idx),
    }))
  }

  const addStatBox = () => {
    if (config.statBoxes.length >= 8) {
      toast.error('Maximum 8 boxes')
      return
    }
    setConfig((prev) => ({
      ...prev,
      statBoxes: [...prev.statBoxes, {
        id: `custom-${Date.now()}`,
        icon: 'Star',
        label: 'CUSTOM',
        value: '0',
        color: '#FFFFFF',
      }],
    }))
  }

  const setWidgetColor = (widgetId: string, color: string) => {
    setConfig((prev) => ({
      ...prev,
      widgetColors: { ...prev.widgetColors, [widgetId]: color },
    }))
  }

  const leftWidgets = config.widgetOrder.filter(id => ['stats', 'level', 'activity'].includes(id))
  const rightWidgets = config.widgetOrder.filter(id => ['quests', 'goals'].includes(id))

  const renderWidget = (id: WidgetId) => {
    const bgColor = config.widgetColors[id] || ''

    switch (id) {
      case 'stats':
        return (
          <div className="relative">
            {isEditing && (
              <div className="absolute -top-2 -right-2 z-30">
                <button
                  onClick={() => setColorPickerWidget(colorPickerWidget === 'stats-bg' ? null : 'stats-bg')}
                  className="w-6 h-6 rounded-full border-2 border-border hover:border-ring transition-colors"
                  style={{ backgroundColor: bgColor }}
                />
                {colorPickerWidget === 'stats-bg' && (
                  <ColorPicker current={bgColor}
                    onSelect={(c) => setWidgetColor('stats', c)}
                    onClose={() => setColorPickerWidget(null)} />
                )}
              </div>
            )}
            <div className={`grid gap-4 ${config.statBoxes.length <= 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-4'}`}>
              {config.statBoxes.map((box, idx) => {
                const resolved = { ...box, value: resolveValue(box.value, user, weekXp, completedMilestones) }
                return isEditing ? (
                  <StatBoxEditor
                    key={box.id}
                    box={box}
                    onChange={(b) => updateStatBox(idx, b)}
                    onRemove={() => removeStatBox(idx)}
                  />
                ) : (
                  <div key={box.id} className="rounded-3xl p-6 border border-border flex flex-col items-center justify-center text-center bg-card"
                    style={{ backgroundColor: bgColor || undefined }}>
                    {(() => { const IC = ICON_MAP[box.icon] || Target; return <IC className="w-6 h-6 mb-2" style={{ color: box.color }} /> })()}
                    <p className="text-3xl font-bold text-foreground">{resolved.value}</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{box.label}</p>
                  </div>
                )
              })}
              {isEditing && config.statBoxes.length < 8 && (
                <button
                  onClick={addStatBox}
                  className="rounded-3xl p-6 border-2 border-dashed border-border hover:border-ring flex flex-col items-center justify-center text-center transition-colors min-h-[140px]"
                >
                  <Plus className="w-6 h-6 text-muted-foreground mb-2" />
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Add Box</p>
                </button>
              )}
            </div>
          </div>
        )
      case 'level':
        return (
          <div className="relative">
            {isEditing && (
              <div className="absolute -top-2 -right-2 z-30">
                <button
                  onClick={() => setColorPickerWidget(colorPickerWidget === 'level' ? null : 'level')}
                  className="w-6 h-6 rounded-full border-2 border-border hover:border-ring transition-colors"
                  style={{ backgroundColor: bgColor }}
                />
                {colorPickerWidget === 'level' && (
                  <ColorPicker current={bgColor}
                    onSelect={(c) => setWidgetColor('level', c)}
                    onClose={() => setColorPickerWidget(null)} />
                )}
              </div>
            )}
            <div className="rounded-3xl p-6 border border-border bg-card" style={{ backgroundColor: bgColor || undefined }}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-foreground">Level Progress</h3>
                <span className="text-sm text-muted-foreground">{user.score % xpForNextLevel} / {xpForNextLevel} XP to Lvl {user.level + 1}</span>
              </div>
              <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#FF5722] to-[#FFCC00] rounded-full transition-all duration-1000" style={{ width: `${xpProgress}%` }} />
              </div>
            </div>
          </div>
        )
      case 'activity':
        return (
          <div className="relative">
            {isEditing && (
              <div className="absolute -top-2 -right-2 z-30">
                <button
                  onClick={() => setColorPickerWidget(colorPickerWidget === 'activity' ? null : 'activity')}
                  className="w-6 h-6 rounded-full border-2 border-border hover:border-ring transition-colors"
                  style={{ backgroundColor: bgColor }}
                />
                {colorPickerWidget === 'activity' && (
                  <ColorPicker current={bgColor}
                    onSelect={(c) => setWidgetColor('activity', c)}
                    onClose={() => setColorPickerWidget(null)} />
                )}
              </div>
            )}
            <div className="rounded-3xl p-6 border border-border bg-card" style={{ backgroundColor: bgColor || undefined }}>
              <h3 className="text-lg font-semibold text-foreground mb-6">Activity History</h3>
              <div className="h-64">
                <XpChart logs={user.activityLogs} />
              </div>
            </div>
          </div>
        )
      case 'quests':
        return (
          <div className="relative">
            {isEditing && (
              <div className="absolute -top-2 -right-2 z-30">
                <button
                  onClick={() => setColorPickerWidget(colorPickerWidget === 'quests' ? null : 'quests')}
                  className="w-6 h-6 rounded-full border-2 border-border hover:border-ring transition-colors"
                  style={{ backgroundColor: bgColor }}
                />
                {colorPickerWidget === 'quests' && (
                  <ColorPicker current={bgColor}
                    onSelect={(c) => setWidgetColor('quests', c)}
                    onClose={() => setColorPickerWidget(null)} />
                )}
              </div>
            )}
            <div className="rounded-3xl p-6 border border-border bg-card" style={{ backgroundColor: bgColor || undefined }}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-foreground">Active Quests</h3>
              </div>
              {user.quests.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No active quests right now.</p>
                  <GoalManager milestones={user.milestones}>
                    <Button className="bg-[#FF5722] hover:bg-[#E64A19] text-white border-none">Create One</Button>
                  </GoalManager>
                </div>
              ) : (
                <div className="space-y-4">
                  {user.quests.map((quest: any) => <QuestCard key={quest.id} quest={quest} />)}
                </div>
              )}
            </div>
          </div>
        )
      case 'goals':
        return (
          <div className="relative">
            {isEditing && (
              <div className="absolute -top-2 -right-2 z-30">
                <button
                  onClick={() => setColorPickerWidget(colorPickerWidget === 'goals' ? null : 'goals')}
                  className="w-6 h-6 rounded-full border-2 border-border hover:border-ring transition-colors"
                  style={{ backgroundColor: bgColor }}
                />
                {colorPickerWidget === 'goals' && (
                  <ColorPicker current={bgColor}
                    onSelect={(c) => setWidgetColor('goals', c)}
                    onClose={() => setColorPickerWidget(null)} />
                )}
              </div>
            )}
            <div className="rounded-3xl p-6 border border-border bg-card" style={{ backgroundColor: bgColor || undefined }}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-foreground">Active Goals</h3>
                <Link href="/goals" className="text-sm text-[#FF5722] hover:text-[#E64A19] transition-colors">View All</Link>
              </div>
              {activeMilestones.length === 0 ? (
                <div className="text-center py-8"><p className="text-muted-foreground">No active goals.</p></div>
              ) : (
                <div className="space-y-4">
                  {activeMilestones.map((m: any) => <MilestoneWidget key={m.id} milestone={m} />)}
                </div>
              )}
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex justify-end gap-2 mb-4">
        <Button
          variant="outline" size="sm"
          onClick={handleShareAsPost}
          className="gap-2 bg-muted border-border hover:bg-accent text-foreground"
        >
          <Share2 className="w-4 h-4" />
          Post Dashboard
        </Button>
        <Button
          variant="outline" size="sm"
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          className="gap-2 bg-muted border-border hover:bg-accent text-foreground"
        >
          {isEditing ? (
            <><Check className="w-4 h-4" /> Save</>
          ) : (
            <><Pencil className="w-4 h-4" /> Edit Layout</>
          )}
        </Button>
      </div>

      {/* Grid */}
      {isEditing ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <Reorder.Group
            axis="y"
            values={leftWidgets}
            onReorder={(newOrder) => {
              setConfig((prev) => ({
                ...prev,
                widgetOrder: [...newOrder, ...rightWidgets],
              }))
            }}
            className="md:col-span-8 space-y-6"
          >
            {leftWidgets.map((id) => (
              <Reorder.Item key={id} value={id} className="relative group cursor-grab active:cursor-grabbing">
                <div className="absolute -left-10 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="w-6 h-6 text-muted-foreground" />
                </div>
                {renderWidget(id)}
              </Reorder.Item>
            ))}
          </Reorder.Group>
          <Reorder.Group
            axis="y"
            values={rightWidgets}
            onReorder={(newOrder) => {
              setConfig((prev) => ({
                ...prev,
                widgetOrder: [...leftWidgets, ...newOrder],
              }))
            }}
            className="md:col-span-4 space-y-6"
          >
            {rightWidgets.map((id) => (
              <Reorder.Item key={id} value={id} className="relative group cursor-grab active:cursor-grabbing">
                <div className="absolute -left-10 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="w-6 h-6 text-muted-foreground" />
                </div>
                {renderWidget(id)}
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-8 space-y-6">
            {leftWidgets.map((id) => <div key={id}>{renderWidget(id)}</div>)}
          </div>
          <div className="md:col-span-4 space-y-6">
            {rightWidgets.map((id) => <div key={id}>{renderWidget(id)}</div>)}
          </div>
        </div>
      )}
    </div>
  )
}
