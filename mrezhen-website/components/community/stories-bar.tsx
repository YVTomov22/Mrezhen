'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Plus } from 'lucide-react'

type StoryUser = {
  id: string
  name: string | null
  username: string | null
  image: string | null
}

type StoriesBarProps = {
  currentUser: StoryUser
  users: StoryUser[]
}

export function StoriesBar({ currentUser, users }: StoriesBarProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-4 h-full overflow-y-auto no-scrollbar">
      {/* Your Story */}
      <button className="flex flex-col items-center gap-1 group" type="button">
        <div className="relative">
          <Avatar className="h-[52px] w-[52px] border-2 border-border">
            <AvatarImage src={currentUser.image || ''} />
            <AvatarFallback className="text-xs font-bold bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
              {currentUser.name?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-0.5 -right-0.5 bg-blue-500 text-white rounded-full p-[3px] shadow-sm">
            <Plus className="h-3 w-3" strokeWidth={3} />
          </div>
        </div>
        <span className="text-[10px] text-muted-foreground group-hover:text-foreground transition-colors truncate w-14 text-center leading-tight">
          Your story
        </span>
      </button>

      <div className="w-8 h-px bg-border" />

      {/* Other users' stories */}
      {users.map((user) => (
        <button key={user.id} className="flex flex-col items-center gap-1 group" type="button">
          <div className="story-ring rounded-full p-[2.5px]">
            <Avatar className="h-[52px] w-[52px] border-[2.5px] border-background">
              <AvatarImage src={user.image || ''} />
              <AvatarFallback className="text-xs font-bold bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400">
                {user.name?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          </div>
          <span className="text-[10px] text-muted-foreground group-hover:text-foreground transition-colors truncate w-14 text-center leading-tight">
            {user.username || user.name?.split(' ')[0] || 'User'}
          </span>
        </button>
      ))}
    </div>
  )
}
