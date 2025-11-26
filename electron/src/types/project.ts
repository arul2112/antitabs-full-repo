import type { WindowState } from './window'

export interface Project {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  windows: WindowState[]
  canvasState: {
    zoom: number
    panX: number
    panY: number
  }
}

export interface ProjectsState {
  projects: Project[]
  currentProjectId: string | null
  dashboardVisible: boolean
}
