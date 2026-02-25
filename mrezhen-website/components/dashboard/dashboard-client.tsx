'use client'

import { useState } from "react"
import Image from "next/image"
import { Play, Activity, Timer, MapPin, TrendingUp, ChevronRight, LayoutDashboard, Settings, Target, Zap, Trophy, Flame, BookOpen, Brain, Code, Coffee, Music, PenTool, Palette, Camera } from "lucide-react"
import { XpChart } from "@/components/dashboard/xp-chart"
import { MilestoneWidget } from "@/components/dashboard/milestone-widget"
import { QuestCard } from "@/components/game/quest-card"
import { GoalManager } from "@/components/dashboard/goal-manager"
import { Button } from "@/components/ui/button"
import Link from "next/link"

type LayoutType = 'consistency' | 'fitness' | 'learning' | 'creative' | 'coding'

export function DashboardClient({ user, activeMilestones, completedMilestones, weekXp, xpProgress, xpForNextLevel }: any) {
  const [layout, setLayout] = useState<LayoutType>('consistency')
  const [isCustomizing, setIsCustomizing] = useState(false)

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-6 md:p-10 font-sans selection:bg-[#FF5722] selection:text-white">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Welcome back, {user.name?.split(' ')[0] || 'User'}
            </h1>
            <p className="text-[#888888] mt-1">Here is your daily overview</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsCustomizing(!isCustomizing)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#1A1A1A] border border-white/10 hover:bg-[#2A2A2A] transition-colors text-sm font-medium"
            >
              <Settings className="w-4 h-4" />
              Customize
            </button>
            <div className="w-12 h-12 rounded-full bg-[#1A1A1A] border border-white/10 flex items-center justify-center overflow-hidden">
              {user.image ? (
                <Image src={user.image} alt="Profile" width={48} height={48} className="object-cover" />
              ) : (
                <span className="text-lg font-bold text-[#FF5722]">{user.name?.charAt(0) || 'U'}</span>
              )}
            </div>
          </div>
        </header>

        {/* Customization Panel */}
        {isCustomizing && (
          <div className="bg-[#121212] rounded-3xl p-6 border border-white/10 animate-in fade-in slide-in-from-top-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <LayoutDashboard className="w-5 h-5 text-[#FF5722]" />
              Choose Dashboard Layout
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <button 
                onClick={() => setLayout('consistency')}
                className={`p-4 rounded-2xl border text-left transition-all ${layout === 'consistency' ? 'border-[#FF5722] bg-[#FF5722]/10' : 'border-white/10 hover:border-white/30 bg-[#1A1A1A]'}`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg ${layout === 'consistency' ? 'bg-[#FF5722]' : 'bg-white/10'}`}>
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-semibold text-white">Consistency (Default)</span>
                </div>
                <p className="text-sm text-[#888888]">Focus on your site activity, XP, quests, and milestones.</p>
              </button>

              <button 
                onClick={() => setLayout('fitness')}
                className={`p-4 rounded-2xl border text-left transition-all ${layout === 'fitness' ? 'border-[#FF5722] bg-[#FF5722]/10' : 'border-white/10 hover:border-white/30 bg-[#1A1A1A]'}`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg ${layout === 'fitness' ? 'bg-[#FF5722]' : 'bg-white/10'}`}>
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-semibold text-white">Fitness Blueprint</span>
                </div>
                <p className="text-sm text-[#888888]">Track your workouts, BPM, distance, and daily physical metrics.</p>
              </button>

              <button 
                onClick={() => setLayout('learning')}
                className={`p-4 rounded-2xl border text-left transition-all ${layout === 'learning' ? 'border-[#FF5722] bg-[#FF5722]/10' : 'border-white/10 hover:border-white/30 bg-[#1A1A1A]'}`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg ${layout === 'learning' ? 'bg-[#FF5722]' : 'bg-white/10'}`}>
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-semibold text-white">Learning Blueprint</span>
                </div>
                <p className="text-sm text-[#888888]">Track study hours, books read, and knowledge retention.</p>
              </button>

              <button 
                onClick={() => setLayout('creative')}
                className={`p-4 rounded-2xl border text-left transition-all ${layout === 'creative' ? 'border-[#FF5722] bg-[#FF5722]/10' : 'border-white/10 hover:border-white/30 bg-[#1A1A1A]'}`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg ${layout === 'creative' ? 'bg-[#FF5722]' : 'bg-white/10'}`}>
                    <Palette className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-semibold text-white">Creative Blueprint</span>
                </div>
                <p className="text-sm text-[#888888]">Monitor your art projects, inspiration, and creative flow.</p>
              </button>

              <button 
                onClick={() => setLayout('coding')}
                className={`p-4 rounded-2xl border text-left transition-all ${layout === 'coding' ? 'border-[#FF5722] bg-[#FF5722]/10' : 'border-white/10 hover:border-white/30 bg-[#1A1A1A]'}`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg ${layout === 'coding' ? 'bg-[#FF5722]' : 'bg-white/10'}`}>
                    <Code className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-semibold text-white">Coding Blueprint</span>
                </div>
                <p className="text-sm text-[#888888]">Track commits, deep work sessions, and project milestones.</p>
              </button>
            </div>
          </div>
        )}

        {/* Layout Content */}
        {layout === 'consistency' ? (
          <ConsistencyLayout 
            user={user} 
            activeMilestones={activeMilestones} 
            completedMilestones={completedMilestones} 
            weekXp={weekXp} 
            xpProgress={xpProgress} 
            xpForNextLevel={xpForNextLevel} 
          />
        ) : layout === 'fitness' ? (
          <FitnessLayout />
        ) : layout === 'learning' ? (
          <LearningLayout />
        ) : layout === 'creative' ? (
          <CreativeLayout />
        ) : (
          <CodingLayout />
        )}

      </div>
    </div>
  )
}

function ConsistencyLayout({ user, activeMilestones, completedMilestones, weekXp, xpProgress, xpForNextLevel }: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
      {/* Left Column */}
      <div className="md:col-span-8 space-y-6">
        
        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-[#121212] rounded-3xl p-6 border border-white/5 flex flex-col items-center justify-center text-center">
            <Trophy className="w-6 h-6 text-[#FFCC00] mb-2" />
            <p className="text-3xl font-bold text-white">{user.level}</p>
            <p className="text-xs text-[#888888] uppercase tracking-wider mt-1">Current Level</p>
          </div>
          <div className="bg-[#121212] rounded-3xl p-6 border border-white/5 flex flex-col items-center justify-center text-center">
            <Zap className="w-6 h-6 text-[#FF5722] mb-2" />
            <p className="text-3xl font-bold text-white">{user.score.toLocaleString()}</p>
            <p className="text-xs text-[#888888] uppercase tracking-wider mt-1">Total XP</p>
          </div>
          <div className="bg-[#121212] rounded-3xl p-6 border border-white/5 flex flex-col items-center justify-center text-center">
            <Flame className="w-6 h-6 text-[#FF3B30] mb-2" />
            <p className="text-3xl font-bold text-white">+{weekXp}</p>
            <p className="text-xs text-[#888888] uppercase tracking-wider mt-1">Weekly XP</p>
          </div>
          <div className="bg-[#121212] rounded-3xl p-6 border border-white/5 flex flex-col items-center justify-center text-center">
            <Target className="w-6 h-6 text-[#34C759] mb-2" />
            <p className="text-3xl font-bold text-white">{completedMilestones}</p>
            <p className="text-xs text-[#888888] uppercase tracking-wider mt-1">Goals Met</p>
          </div>
        </div>

        {/* Level Progress */}
        <div className="bg-[#121212] rounded-3xl p-6 border border-white/5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">Level Progress</h3>
            <span className="text-sm text-[#888888]">{user.score % xpForNextLevel} / {xpForNextLevel} XP to Lvl {user.level + 1}</span>
          </div>
          <div className="h-3 w-full bg-[#1A1A1A] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#FF5722] to-[#FFCC00] rounded-full transition-all duration-1000" style={{ width: `${xpProgress}%` }} />
          </div>
        </div>

        {/* Activity Chart */}
        <div className="bg-[#121212] rounded-3xl p-6 border border-white/5">
          <h3 className="text-lg font-semibold text-white mb-6">Activity History</h3>
          <div className="h-64">
            <XpChart logs={user.activityLogs} />
          </div>
        </div>

      </div>

      {/* Right Column */}
      <div className="md:col-span-4 space-y-6">
        
        {/* Active Quests */}
        <div className="bg-[#121212] rounded-3xl p-6 border border-white/5">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-white">Active Quests</h3>
          </div>
          {user.quests.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[#888888] mb-4">No active quests right now.</p>
              <GoalManager milestones={user.milestones}>
                <Button className="bg-[#FF5722] hover:bg-[#E64A19] text-white border-none">
                  Create One
                </Button>
              </GoalManager>
            </div>
          ) : (
            <div className="space-y-4">
              {user.quests.map((quest: any) => (
                <QuestCard key={quest.id} quest={quest} />
              ))}
            </div>
          )}
        </div>

        {/* Active Goals */}
        <div className="bg-[#121212] rounded-3xl p-6 border border-white/5">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-white">Active Goals</h3>
            <Link href="/goals" className="text-sm text-[#FF5722] hover:text-[#E64A19] transition-colors">
              View All
            </Link>
          </div>
          {activeMilestones.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[#888888]">No active goals.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeMilestones.map((m: any) => (
                <MilestoneWidget key={m.id} milestone={m} />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

function FitnessLayout() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
      {/* Left Column (Main Content) */}
      <div className="md:col-span-8 space-y-6">
        
        {/* Optimize Routine Card */}
        <div className="relative rounded-3xl overflow-hidden h-[300px] group cursor-pointer">
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
          <Image 
            src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070&auto=format&fit=crop" 
            alt="Workout" 
            fill 
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute bottom-0 left-0 p-8 z-20 w-full flex justify-between items-end">
            <div>
              <span className="px-3 py-1 rounded-full bg-[#FF5722]/20 text-[#FF5722] text-xs font-semibold tracking-wider uppercase mb-3 inline-block backdrop-blur-md border border-[#FF5722]/30">
                Featured Workout
              </span>
              <h2 className="text-3xl font-bold text-white mb-2">Optimize Your Routine</h2>
              <p className="text-white/70 text-sm max-w-md">High-intensity interval training designed to maximize calorie burn and improve cardiovascular fitness.</p>
            </div>
            <button className="w-14 h-14 rounded-full bg-[#FF5722] flex items-center justify-center text-white hover:bg-[#E64A19] transition-colors shadow-[0_0_20px_rgba(255,87,34,0.4)] group-hover:scale-110 duration-300">
              <Play className="w-6 h-6 ml-1" fill="currentColor" />
            </button>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          
          {/* BPM Ring */}
          <div className="bg-[#121212] rounded-3xl p-6 border border-white/5 flex flex-col items-center justify-center relative overflow-hidden group hover:border-white/10 transition-colors">
            <div className="absolute top-4 left-4 text-[#888888]">
              <Activity className="w-5 h-5" />
            </div>
            <div className="relative w-32 h-32 mt-4">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="#1A1A1A" strokeWidth="8" fill="none" />
                <circle cx="50" cy="50" r="40" stroke="#FF5722" strokeWidth="8" fill="none" strokeDasharray="251.2" strokeDashoffset="60" className="transition-all duration-1000 ease-out" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-white">112</span>
                <span className="text-xs text-[#888888] uppercase tracking-wider">BPM</span>
              </div>
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm text-[#888888]">Average: <span className="text-white font-medium">84 BPM</span></p>
            </div>
          </div>

          {/* Active Session */}
          <div className="bg-[#121212] rounded-3xl p-6 border border-white/5 flex flex-col justify-between group hover:border-white/10 transition-colors">
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-full bg-[#FF5722]/10 flex items-center justify-center text-[#FF5722]">
                <Timer className="w-5 h-5" />
              </div>
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF5722] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#FF5722]"></span>
              </span>
            </div>
            <div>
              <p className="text-[#888888] text-sm mb-1">Active Session</p>
              <p className="text-3xl font-bold text-white tracking-tight">01:24<span className="text-[#FF5722]">:30</span></p>
            </div>
          </div>

          {/* Distance */}
          <div className="bg-[#121212] rounded-3xl p-6 border border-white/5 flex flex-col justify-between group hover:border-white/10 transition-colors">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[#888888] text-sm mb-1">Distance</p>
              <div className="flex items-baseline gap-1">
                <p className="text-3xl font-bold text-white tracking-tight">3.2</p>
                <span className="text-[#888888] font-medium">km</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Right Column (Sidebar) */}
      <div className="md:col-span-4 space-y-6">
        
        {/* Today's Metrics */}
        <div className="bg-[#121212] rounded-3xl p-6 border border-white/5">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-white">Today's Metrics</h3>
            <button className="text-[#888888] hover:text-white transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-6">
            {/* Steps */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <div>
                  <p className="text-[#888888] text-sm">Steps</p>
                  <p className="text-2xl font-bold text-white">4,234 <span className="text-sm font-normal text-[#888888]">/ 10,000</span></p>
                </div>
                <span className="text-[#FF5722] text-sm font-medium">42%</span>
              </div>
              <div className="h-2 w-full bg-[#1A1A1A] rounded-full overflow-hidden">
                <div className="h-full bg-[#FF5722] rounded-full" style={{ width: '42%' }} />
              </div>
            </div>

            {/* Calories */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <div>
                  <p className="text-[#888888] text-sm">Calories</p>
                  <p className="text-2xl font-bold text-white">1,250 <span className="text-sm font-normal text-[#888888]">/ 2,500</span></p>
                </div>
                <span className="text-white text-sm font-medium">50%</span>
              </div>
              <div className="h-2 w-full bg-[#1A1A1A] rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full" style={{ width: '50%' }} />
              </div>
            </div>

            {/* Sleep */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <div>
                  <p className="text-[#888888] text-sm">Sleep</p>
                  <p className="text-2xl font-bold text-white">6h 20m <span className="text-sm font-normal text-[#888888]">/ 8h</span></p>
                </div>
                <span className="text-white text-sm font-medium">79%</span>
              </div>
              <div className="h-2 w-full bg-[#1A1A1A] rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full" style={{ width: '79%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Target Chart */}
        <div className="bg-[#121212] rounded-3xl p-6 border border-white/5">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#FF5722]" />
              <h3 className="text-lg font-semibold text-white">Weekly Target</h3>
            </div>
            <span className="text-xs font-medium px-2 py-1 rounded-md bg-[#1A1A1A] text-[#888888]">This Week</span>
          </div>
          
          {/* Mock Chart Area */}
          <div className="h-40 relative flex items-end justify-between gap-2 pt-4">
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              <div className="border-b border-white/5 w-full h-0"></div>
              <div className="border-b border-white/5 w-full h-0"></div>
              <div className="border-b border-white/5 w-full h-0"></div>
            </div>
            
            {/* Bars */}
            {[40, 70, 45, 90, 60, 85, 50].map((height, i) => (
              <div key={i} className="w-full flex flex-col items-center gap-2 z-10 group">
                <div className="w-full bg-[#1A1A1A] rounded-t-md relative group-hover:bg-[#2A2A2A] transition-colors" style={{ height: '100%' }}>
                  <div 
                    className={`absolute bottom-0 w-full rounded-t-md transition-all duration-500 ${i === 3 ? 'bg-[#FF5722] shadow-[0_0_15px_rgba(255,87,34,0.3)]' : 'bg-white/20 group-hover:bg-white/30'}`} 
                    style={{ height: `${height}%` }}
                  />
                </div>
                <span className="text-[10px] text-[#888888] uppercase">{['M','T','W','T','F','S','S'][i]}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

function LearningLayout() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
      <div className="md:col-span-8 space-y-6">
        <div className="relative rounded-3xl overflow-hidden h-[300px] group cursor-pointer">
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
          <Image 
            src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=2070&auto=format&fit=crop" 
            alt="Library" 
            fill 
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute bottom-0 left-0 p-8 z-20 w-full flex justify-between items-end">
            <div>
              <span className="px-3 py-1 rounded-full bg-[#FF5722]/20 text-[#FF5722] text-xs font-semibold tracking-wider uppercase mb-3 inline-block backdrop-blur-md border border-[#FF5722]/30">
                Current Focus
              </span>
              <h2 className="text-3xl font-bold text-white mb-2">Advanced Algorithms</h2>
              <p className="text-white/70 text-sm max-w-md">Mastering dynamic programming and graph theory concepts for upcoming technical interviews.</p>
            </div>
            <button className="w-14 h-14 rounded-full bg-[#FF5722] flex items-center justify-center text-white hover:bg-[#E64A19] transition-colors shadow-[0_0_20px_rgba(255,87,34,0.4)] group-hover:scale-110 duration-300">
              <BookOpen className="w-6 h-6" fill="currentColor" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-[#121212] rounded-3xl p-6 border border-white/5 flex flex-col items-center justify-center relative overflow-hidden group hover:border-white/10 transition-colors">
            <div className="absolute top-4 left-4 text-[#888888]">
              <Brain className="w-5 h-5" />
            </div>
            <div className="relative w-32 h-32 mt-4">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="#1A1A1A" strokeWidth="8" fill="none" />
                <circle cx="50" cy="50" r="40" stroke="#FF5722" strokeWidth="8" fill="none" strokeDasharray="251.2" strokeDashoffset="80" className="transition-all duration-1000 ease-out" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-white">68%</span>
                <span className="text-xs text-[#888888] uppercase tracking-wider">Retention</span>
              </div>
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm text-[#888888]">Flashcards: <span className="text-white font-medium">142 Due</span></p>
            </div>
          </div>

          <div className="bg-[#121212] rounded-3xl p-6 border border-white/5 flex flex-col justify-between group hover:border-white/10 transition-colors">
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-full bg-[#FF5722]/10 flex items-center justify-center text-[#FF5722]">
                <Timer className="w-5 h-5" />
              </div>
            </div>
            <div>
              <p className="text-[#888888] text-sm mb-1">Study Session</p>
              <p className="text-3xl font-bold text-white tracking-tight">02:45<span className="text-[#FF5722]">h</span></p>
            </div>
          </div>

          <div className="bg-[#121212] rounded-3xl p-6 border border-white/5 flex flex-col justify-between group hover:border-white/10 transition-colors">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[#888888] text-sm mb-1">Pages Read</p>
              <div className="flex items-baseline gap-1">
                <p className="text-3xl font-bold text-white tracking-tight">124</p>
                <span className="text-[#888888] font-medium">/ 500</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="md:col-span-4 space-y-6">
        <div className="bg-[#121212] rounded-3xl p-6 border border-white/5">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-white">Learning Goals</h3>
          </div>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-end mb-2">
                <div>
                  <p className="text-[#888888] text-sm">Read "Clean Code"</p>
                </div>
                <span className="text-[#FF5722] text-sm font-medium">45%</span>
              </div>
              <div className="h-2 w-full bg-[#1A1A1A] rounded-full overflow-hidden">
                <div className="h-full bg-[#FF5722] rounded-full" style={{ width: '45%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-end mb-2">
                <div>
                  <p className="text-[#888888] text-sm">Complete React Course</p>
                </div>
                <span className="text-white text-sm font-medium">80%</span>
              </div>
              <div className="h-2 w-full bg-[#1A1A1A] rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full" style={{ width: '80%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CreativeLayout() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
      <div className="md:col-span-8 space-y-6">
        <div className="relative rounded-3xl overflow-hidden h-[300px] group cursor-pointer">
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
          <Image 
            src="https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=2071&auto=format&fit=crop" 
            alt="Art" 
            fill 
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute bottom-0 left-0 p-8 z-20 w-full flex justify-between items-end">
            <div>
              <span className="px-3 py-1 rounded-full bg-[#FF5722]/20 text-[#FF5722] text-xs font-semibold tracking-wider uppercase mb-3 inline-block backdrop-blur-md border border-[#FF5722]/30">
                Current Project
              </span>
              <h2 className="text-3xl font-bold text-white mb-2">Cyberpunk Cityscape</h2>
              <p className="text-white/70 text-sm max-w-md">Digital illustration focusing on neon lighting and perspective.</p>
            </div>
            <button className="w-14 h-14 rounded-full bg-[#FF5722] flex items-center justify-center text-white hover:bg-[#E64A19] transition-colors shadow-[0_0_20px_rgba(255,87,34,0.4)] group-hover:scale-110 duration-300">
              <PenTool className="w-6 h-6" fill="currentColor" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-[#121212] rounded-3xl p-6 border border-white/5 flex flex-col justify-between group hover:border-white/10 transition-colors">
            <div className="w-10 h-10 rounded-full bg-[#FF5722]/10 flex items-center justify-center text-[#FF5722]">
              <Palette className="w-5 h-5" />
            </div>
            <div className="mt-4">
              <p className="text-[#888888] text-sm mb-1">Color Palettes</p>
              <p className="text-3xl font-bold text-white tracking-tight">12 <span className="text-sm font-normal text-[#888888]">Saved</span></p>
            </div>
          </div>

          <div className="bg-[#121212] rounded-3xl p-6 border border-white/5 flex flex-col justify-between group hover:border-white/10 transition-colors">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white">
              <Camera className="w-5 h-5" />
            </div>
            <div className="mt-4">
              <p className="text-[#888888] text-sm mb-1">References</p>
              <p className="text-3xl font-bold text-white tracking-tight">48 <span className="text-sm font-normal text-[#888888]">Collected</span></p>
            </div>
          </div>

          <div className="bg-[#121212] rounded-3xl p-6 border border-white/5 flex flex-col justify-between group hover:border-white/10 transition-colors">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white">
              <Music className="w-5 h-5" />
            </div>
            <div className="mt-4">
              <p className="text-[#888888] text-sm mb-1">Flow State</p>
              <p className="text-3xl font-bold text-white tracking-tight">04:20<span className="text-[#FF5722]">h</span></p>
            </div>
          </div>
        </div>
      </div>

      <div className="md:col-span-4 space-y-6">
        <div className="bg-[#121212] rounded-3xl p-6 border border-white/5">
          <h3 className="text-lg font-semibold text-white mb-6">Inspiration Board</h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="h-24 bg-[#1A1A1A] rounded-lg"></div>
            <div className="h-24 bg-[#1A1A1A] rounded-lg"></div>
            <div className="h-24 bg-[#1A1A1A] rounded-lg"></div>
            <div className="h-24 bg-[#1A1A1A] rounded-lg"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CodingLayout() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
      <div className="md:col-span-8 space-y-6">
        <div className="relative rounded-3xl overflow-hidden h-[300px] group cursor-pointer">
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
          <Image 
            src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=2070&auto=format&fit=crop" 
            alt="Code" 
            fill 
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute bottom-0 left-0 p-8 z-20 w-full flex justify-between items-end">
            <div>
              <span className="px-3 py-1 rounded-full bg-[#FF5722]/20 text-[#FF5722] text-xs font-semibold tracking-wider uppercase mb-3 inline-block backdrop-blur-md border border-[#FF5722]/30">
                Active Sprint
              </span>
              <h2 className="text-3xl font-bold text-white mb-2">Mrezhen v2.0 Launch</h2>
              <p className="text-white/70 text-sm max-w-md">Implementing the new dashboard customization features and fixing hydration bugs.</p>
            </div>
            <button className="w-14 h-14 rounded-full bg-[#FF5722] flex items-center justify-center text-white hover:bg-[#E64A19] transition-colors shadow-[0_0_20px_rgba(255,87,34,0.4)] group-hover:scale-110 duration-300">
              <Code className="w-6 h-6" fill="currentColor" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-[#121212] rounded-3xl p-6 border border-white/5 flex flex-col justify-between group hover:border-white/10 transition-colors">
            <div className="w-10 h-10 rounded-full bg-[#FF5722]/10 flex items-center justify-center text-[#FF5722]">
              <Target className="w-5 h-5" />
            </div>
            <div className="mt-4">
              <p className="text-[#888888] text-sm mb-1">Commits Today</p>
              <p className="text-3xl font-bold text-white tracking-tight">14</p>
            </div>
          </div>

          <div className="bg-[#121212] rounded-3xl p-6 border border-white/5 flex flex-col justify-between group hover:border-white/10 transition-colors">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white">
              <Coffee className="w-5 h-5" />
            </div>
            <div className="mt-4">
              <p className="text-[#888888] text-sm mb-1">Deep Work</p>
              <p className="text-3xl font-bold text-white tracking-tight">03:15<span className="text-[#FF5722]">h</span></p>
            </div>
          </div>

          <div className="bg-[#121212] rounded-3xl p-6 border border-white/5 flex flex-col justify-between group hover:border-white/10 transition-colors">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white">
              <Zap className="w-5 h-5" />
            </div>
            <div className="mt-4">
              <p className="text-[#888888] text-sm mb-1">Bugs Squashed</p>
              <p className="text-3xl font-bold text-white tracking-tight">7</p>
            </div>
          </div>
        </div>
      </div>

      <div className="md:col-span-4 space-y-6">
        <div className="bg-[#121212] rounded-3xl p-6 border border-white/5">
          <h3 className="text-lg font-semibold text-white mb-6">Sprint Progress</h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-end mb-2">
                <div>
                  <p className="text-[#888888] text-sm">Frontend Tasks</p>
                </div>
                <span className="text-[#FF5722] text-sm font-medium">90%</span>
              </div>
              <div className="h-2 w-full bg-[#1A1A1A] rounded-full overflow-hidden">
                <div className="h-full bg-[#FF5722] rounded-full" style={{ width: '90%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-end mb-2">
                <div>
                  <p className="text-[#888888] text-sm">Backend API</p>
                </div>
                <span className="text-white text-sm font-medium">60%</span>
              </div>
              <div className="h-2 w-full bg-[#1A1A1A] rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full" style={{ width: '60%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
