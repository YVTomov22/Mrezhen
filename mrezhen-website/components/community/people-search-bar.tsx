'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useTransition, useState, useEffect } from 'react'

export function PeopleSearchBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [query, setQuery] = useState(searchParams.get('q') || '')

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      startTransition(() => {
        if (query) {
          router.push(`/community/people?q=${encodeURIComponent(query)}`)
        } else {
          router.push(`/community/people`)
        }
      })
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [query, router])

  return (
    <div className="relative w-full max-w-md mx-auto mt-6">
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-5 w-5 text-teal-200/70" />
        <Input
          type="text"
          placeholder="Search people by name or username..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-6 bg-white/10 border-white/20 text-white placeholder:text-teal-200/70 rounded-2xl focus-visible:ring-teal-400 focus-visible:border-teal-400 backdrop-blur-md transition-all"
        />
        {isPending && (
          <div className="absolute right-4">
            <div className="h-4 w-4 rounded-full border-2 border-teal-200 border-t-transparent animate-spin" />
          </div>
        )}
      </div>
    </div>
  )
}
