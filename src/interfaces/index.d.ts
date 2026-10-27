/** This file contains all the interfaces used in the application */

export interface IProject {
  id: string
  project_name: string
  description: string
  start_date: Date
  due_date: Date
}
export interface IRole {
  id: number
  name: string
}

export interface ITeam {
  id: number
  project_id: number
  user_id: {
    user_name: string
    email: string
  }
  role_id: {
    name: string
  }
}

export interface ITask {
  id: string | number
  title: string
  userId?: number
  project_id?: number
  sprint_id: number
  stageId?: number
  description: string
  due_date?: Date
  completed: boolean
  users?: {
    id: string
    name: string
    avatarUrl?: string
  }[]

  createdAt: Date
  updatedAt: Date
  status?: string
  totalMinutes: number
}

export interface ITaskStage {
  id?: string
  createdAt: number
  updatedAt: number
  title: string
}

export interface IUser {
  id: string
  uid: number
  user_name: string
  role_id: number
  roles?: {
    id: string
    role_name: string
  }
  email: string
}

export interface ISprint {
  id: number
  sprint_name: string
  description: string
  start_date: Date
  due_date: Date
  project_id: number
  milestone_id: number | null
  project?: IProject
  milestone?: IMilestone
}

export interface IMilestone {
  id: number
  milestone_name: string
  createdAt: Date
  project_id: number
  stage: "On Track" | "Delayed" | "Completed"
  project?: IProject
}

export interface TimeLog {
  id?: string | number
  taskId: string
  userId: string
  minutes: number
  logDate: Date
  comments: string
  createdAt: Date
}
