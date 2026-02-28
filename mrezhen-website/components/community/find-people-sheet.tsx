'use client'

import { useState, useTransition, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Search, Users, X, Loader2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FollowButton } from '@/components/follow-button'
import { searchPeople, type SearchPerson } from '@/app/actions/search-people'

type Props = {
  open: boolean
  onClose: () => void
}

export function FindPeopleSheet({ open, onClose }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchPerson[]>([])
  const [isPending, startTransition] = useTransition()
  const [hasSearched, setHasSearched] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Focus input on open
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300)
      // Load initial (top) results
      startTransition(async () => {
        const data = await searchPeople('')
        setResults(data)
        setHasSearched(true)
      })
    } else {
      setQuery('')
      setResults([])
      setHasSearched(false)
    }
  }, [open])

  const doSearch = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const data = await searchPeople(q)
        setResults(data)
        setHasSearched(true)
      })
    }, 250)
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    setQuery(v)
    doSearch(v)
  }

  // Close on ESC
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-full max-w-md flex flex-col bg-background border-r border-border shadow-2xl transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
            <Users className="h-5 w-5" /> Find People
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Search by name or username..."
              value={query}
              onChange={handleChange}
              className="pl-10 pr-10 h-11 rounded-xl bg-muted/50 border-border focus-visible:ring-primary"
            />
            {isPending && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-5">
          {!hasSearched ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <Search className="h-10 w-10 mx-auto text-muted-foreground/50" />
              <p className="font-semibold text-foreground">No results</p>
              <p className="text-sm text-muted-foreground">
                We couldn't find anyone matching &quot;{query}&quot;
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {results.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors group"
                >
                  <Link href={`/profile/${user.username ?? user.id}`} onClick={onClose}>
                    <Avatar className="h-11 w-11 ring-2 ring-background shadow-sm">
                      <AvatarImage src={user.image || ''} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                        {user.name?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/profile/${user.username ?? user.id}`}
                      onClick={onClose}
                      className="text-sm font-semibold tracking-tight truncate block group-hover:underline underline-offset-2"
                    >
                      {user.name || user.username || 'User'}
                    </Link>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span>Lvl {user.level}</span>
                      <span className="text-border">·</span>
                      <span>{user.followerCount} followers</span>
                      <span className="text-border">·</span>
                      <span>{user.goalCount} goals</span>
                    </div>
                  </div>
                  <FollowButton
                    targetUserId={user.id}
                    initialIsFollowing={user.isFollowing}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
