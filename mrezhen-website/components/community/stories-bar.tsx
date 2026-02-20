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
    <div className="flex flex-row items-start gap-5 py-2 overflow-x-auto no-scrollbar">
      {/* Your Story */}
      <button className="flex flex-col items-center gap-1.5 group shrink-0" type="button">
        <div className="relative">
          <Avatar className="h-[48px] w-[48px] border border-border">
            <AvatarImage src={currentUser.image || ''} />
            <AvatarFallback className="text-xs font-bold bg-foreground text-background">
              {currentUser.name?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-0.5 -right-0.5 bg-amber-500 text-white rounded-full p-[3px] shadow-sm">
            <Plus className="h-2.5 w-2.5" strokeWidth={3} />
          </div>
        </div>
        <span className="editorial-caption text-muted-foreground group-hover:text-foreground transition-colors truncate w-14 text-center !text-[9px]">
          Your story
        </span>
      </button>

      <div className="h-10 w-px self-center bg-border" />

      {/* Other users' stories */}
      {users.map((user) => (
        <button key={user.id} className="flex flex-col items-center gap-1.5 group shrink-0" type="button">
          <div className="bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 rounded-full p-[2.5px] shadow-sm">
            <Avatar className="h-[48px] w-[48px] border-[2px] border-background">
              <AvatarImage src={user.image || ''} />
              <AvatarFallback className="text-xs font-bold bg-foreground text-background">
                {user.name?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          </div>
          <span className="editorial-caption text-muted-foreground group-hover:text-foreground transition-colors truncate w-14 text-center !text-[9px]">
            {user.username || user.name?.split(' ')[0] || 'User'}
          </span>
        </button>
      ))}
    </div>
  )
}
