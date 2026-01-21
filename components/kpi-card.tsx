"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Eye, EyeOff, GripVertical } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import Link from "next/link"
import { useSearchParams } from 'next/navigation'

interface AssignedUser {
  id: number
  name: string
  profilePicture?: string
}

interface KPICardProps {
  id: number
  title: string
  progress: number
  target: number
  unit?: string
  percentage: number
  isVisible: boolean
  isAdmin: boolean
  assignedUsers?: AssignedUser[]
  onToggleVisibility?: (id: number, isVisible: boolean) => void
}

const AVATAR_COLORS = [
  "bg-rose-100 text-rose-700 border-rose-200",
  "bg-blue-100 text-blue-700 border-blue-200",
  "bg-green-100 text-green-700 border-green-200",
  "bg-violet-100 text-violet-700 border-violet-200",
  "bg-orange-100 text-orange-700 border-orange-200",
  "bg-teal-100 text-teal-700 border-teal-200",
  "bg-indigo-100 text-indigo-700 border-indigo-200",
  "bg-pink-100 text-pink-700 border-pink-200",
  "bg-cyan-100 text-cyan-700 border-cyan-200",
  "bg-amber-100 text-amber-700 border-amber-200",
]

export function KPICard({
  id,
  title,
  progress,
  target,
  unit,
  percentage,
  isVisible,
  isAdmin,
  assignedUsers = [],
  onToggleVisibility,
}: KPICardProps) {
  const searchParams = useSearchParams()
  const kpiUrl = `/kpi/${id}?${searchParams.toString()}`

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: id.toString(),
    disabled: !isAdmin,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : isVisible ? 1 : 0.6,
    zIndex: isDragging ? 50 : undefined,
  }

  return (
    <div ref={setNodeRef} style={style} className="h-full group">
      <Card
        className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-none shadow-sm h-full bg-white group-hover:shadow-primary/10 rounded-2xl ${isAdmin ? "cursor-move" : "cursor-pointer"
          } ${!isVisible ? "opacity-60 bg-gray-50" : ""}`}
      >
        {/* Drag Handle for Admin */}
        {isAdmin && (
          <div
            {...listeners}
            {...attributes}
            className="absolute top-3 left-3 z-20 p-1.5 rounded-md text-muted-foreground/40 hover:text-foreground hover:bg-muted transition-colors cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100"
          >
            <GripVertical className="w-4 h-4" />
          </div>
        )}

        {/* Assigned Users */}
        {assignedUsers.length > 0 && (
          <div className="absolute top-3 right-3 z-10">
            <TooltipProvider>
              <div className="flex -space-x-2">
                {assignedUsers.slice(0, 3).map((user) => (
                  <Tooltip key={user.id}>
                    <TooltipTrigger asChild>
                      <Avatar className="w-6 h-6 border border-white shadow-sm transition-transform duration-200 hover:scale-110 hover:z-10">
                        <AvatarImage src={user.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}${user.name === "Chonthicha limpiti" ? "&top[]=longHair&top[]=longHairBob&top[]=longHairCurly&top[]=longHairStraight&facialHairProbability=0" : "&top[]=shortHair&top[]=shortHairTheCaesar&top[]=shortHairShortFlat&top[]=shortHairShortRound&top[]=shortHairShortWaved&facialHairProbability=20"}`} />
                        <AvatarFallback className={`text-[9px] font-bold flex items-center justify-center w-full h-full ${AVATAR_COLORS[user.id % AVATAR_COLORS.length]}`}>
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-prompt text-xs">{user.name}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
                {assignedUsers.length > 3 && (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold border border-white bg-muted text-muted-foreground shadow-sm">
                    +{assignedUsers.length - 3}
                  </div>
                )}
              </div>
            </TooltipProvider>
          </div>
        )}

        <Link href={kpiUrl} className="block h-full">
          <CardContent className="p-5 h-full flex flex-col justify-between">
            {/* Title Section */}
            <div className="mb-4">
              <h3 className={`font-prompt text-xl leading-snug line-clamp-2 text-foreground/90 group-hover:text-primary transition-colors duration-200 pr-8`}>
                {title}
              </h3>

              {isAdmin && onToggleVisibility && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 absolute bottom-3 right-3 z-30 opacity-0 group-hover:opacity-100 transition-opacity bg-white/50 hover:bg-white shadow-sm"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onToggleVisibility(id, !isVisible)
                  }}
                >
                  {isVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
                </Button>
              )}
            </div>

            {!isVisible && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
                <span className="bg-black/10 backdrop-blur-sm text-muted-foreground px-3 py-1 rounded-full text-xs font-medium border border-black/5">
                  Hidden
                </span>
              </div>
            )}


            {/* Progress Section */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-prompt text-primary">
                    {percentage.toFixed(0)}
                  </span>
                  <span className="text-sm text-muted-foreground font-medium">%</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-prompt text-muted-foreground/70 font-light block">
                    เป้า {target.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full w-full flex-1 bg-gradient-to-r from-primary/80 to-primary transition-all duration-500 ease-in-out"
                  style={{ transform: `translateX(-${100 - (Math.min(percentage, 100))}%)` }}
                />
              </div>

              <div className="flex justify-between items-center pt-1">
                <span className="text-xs font-prompt text-muted-foreground/70 font-light">
                  ผลงาน {progress.toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Link>
      </Card>
    </div >
  )
}
