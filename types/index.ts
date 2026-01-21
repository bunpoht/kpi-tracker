export type UserRole = "ADMIN" | "USER"
export type UserStatus = "PENDING" | "APPROVED" | "REJECTED"

export interface User {
  id: number
  email: string
  name: string
  role: UserRole
  status?: UserStatus
  profilePicture?: string // Added profile picture field
  createdAt: Date
}

export interface Goal {
  id: number
  title: string
  description?: string
  target: number
  unit?: string
  startDate: Date
  endDate: Date
  createdById: number
  createdAt: Date
  updatedAt: Date
  subMetrics?: SubMetric[]
  assignedUsers?: {
    id: number
    name: string
    email: string
    assignedTarget: number
  }[]
}

export interface GoalAssignment {
  id: number
  goalId: number
  userId: number
  assignedTarget: number
  createdAt: Date
}

export interface WorkLog {
  id: number
  goalId: number
  userId: number
  completedWork: number
  description?: string
  date: Date
  createdAt: Date
  updatedAt: Date
  subMetricId?: number
  subMetric?: SubMetric
  subMetricValues?: Record<string, number> // {"subMetricId": completedWork, ...}
}

export interface Image {
  id: number
  workLogId: number
  url: string
  publicId?: string
  createdAt: Date
}

export interface WorkLogWithDetails extends WorkLog {
  goal?: Goal
  user?: User
  images?: Image[]
}

export interface Setting {
  id: number
  key: string
  value: string
  description?: string
  updatedAt: Date
}

export interface SubMetric {
  id: number
  goalId: number
  name: string
  color: string
  displayOrder: number
  createdAt: Date
}
