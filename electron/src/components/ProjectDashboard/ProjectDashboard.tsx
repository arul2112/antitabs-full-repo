import { useState, useCallback, useEffect, useRef } from 'react'
import styles from './ProjectDashboard.module.css'

interface Project {
  id: string
  name: string
  created: number
  lastModified: number
  windows: any[]
  canvasState: {
    zoom: number
    panX: number
    panY: number
  }
}

interface ProjectDashboardProps {
  isOpen: boolean
  onClose: () => void
  onOpenProject: (project: Project) => void
}

interface MenuState {
  projectId: string
  x: number
  y: number
}

const STORAGE_KEY = 'antitabs-projects'

export default function ProjectDashboard({ isOpen, onClose, onOpenProject }: ProjectDashboardProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [showPrompt, setShowPrompt] = useState(false)
  const [promptValue, setPromptValue] = useState('')
  const [menuState, setMenuState] = useState<MenuState | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Load projects from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        setProjects(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to load projects:', e)
      }
    }
  }, [isOpen])

  // Save projects to localStorage
  const saveProjects = useCallback((updatedProjects: Project[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProjects))
    setProjects(updatedProjects)
  }, [])

  const handleCreateProject = useCallback(() => {
    setPromptValue(`Project ${projects.length + 1}`)
    setShowPrompt(true)
  }, [projects.length])

  const handlePromptSubmit = useCallback(() => {
    if (!promptValue.trim()) return

    const newProject: Project = {
      id: Date.now().toString(),
      name: promptValue.trim(),
      created: Date.now(),
      lastModified: Date.now(),
      windows: [],
      canvasState: {
        zoom: 1.0,
        panX: 0,
        panY: 0
      }
    }

    const updatedProjects = [...projects, newProject]
    saveProjects(updatedProjects)
    setShowPrompt(false)
    setPromptValue('')

    // Auto-open the new project
    onOpenProject(newProject)
    onClose()
  }, [promptValue, projects, saveProjects, onOpenProject, onClose])

  const handleOpenProject = useCallback((project: Project) => {
    onOpenProject(project)
    onClose()
  }, [onOpenProject, onClose])


  const handleMenuOpen = useCallback((e: React.MouseEvent, projectId: string) => {
    e.stopPropagation()
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    setMenuState({
      projectId,
      x: rect.right - 160,
      y: rect.bottom + 4
    })
  }, [])

  const handleMenuClose = useCallback(() => {
    setMenuState(null)
  }, [])

  const handleDuplicateProject = useCallback((projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    if (!project) return

    const duplicatedProject: Project = {
      ...project,
      id: Date.now().toString(),
      name: `${project.name} (Copy)`,
      created: Date.now(),
      lastModified: Date.now(),
      windows: JSON.parse(JSON.stringify(project.windows)),
      canvasState: { ...project.canvasState }
    }

    const updatedProjects = [...projects, duplicatedProject]
    saveProjects(updatedProjects)
    handleMenuClose()
  }, [projects, saveProjects, handleMenuClose])

  const handleDeleteFromMenu = useCallback((projectId: string) => {
    const updatedProjects = projects.filter(p => p.id !== projectId)
    saveProjects(updatedProjects)
    handleMenuClose()
  }, [projects, saveProjects, handleMenuClose])

  // Close menu when clicking outside
  useEffect(() => {
    if (!menuState) return

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        handleMenuClose()
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleMenuClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [menuState, handleMenuClose])

  if (!isOpen) return null

  return (
    <div className={styles.projectDashboard}>
      <div className={styles.dashboardContainer}>
        <div className={styles.dashboardHeader}>
          <h1 className={styles.dashboardTitle}>AntiTabs Projects</h1>
          <button className={styles.primaryButton} onClick={handleCreateProject}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="10" y1="4" x2="10" y2="16"/>
              <line x1="4" y1="10" x2="16" y2="10"/>
            </svg>
            New Project
          </button>
        </div>

        <div className={styles.projectsGrid}>
          {projects.length === 0 ? (
            <div className={styles.emptyState}>
              {/* <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <line x1="12" y1="8" x2="12" y2="16"/>
                <line x1="8" y1="12" x2="16" y2="12"/>
              </svg> */}
              <h3>No projects yet</h3>
              <p>Create your first project to get started</p>
            </div>
          ) : (
            projects.map(project => {
              const modifiedDate = new Date(project.lastModified).toLocaleDateString()
              const windowCount = project.windows?.length || 0

              return (
                <div
                  key={project.id}
                  className={styles.projectCard}
                  onClick={() => handleOpenProject(project)}
                >
                  <div className={styles.projectThumbnail}>
                    <div className={styles.projectIcon}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2"/>
                        <line x1="9" y1="3" x2="9" y2="21"/>
                        <line x1="3" y1="9" x2="21" y2="9"/>
                      </svg>
                    </div>
                  </div>
                  <div className={styles.projectInfo}>
                    <div className={styles.projectHeader}>
                      <h3 className={styles.projectName}>{project.name}</h3>
                      <button
                        className={styles.menuBtn}
                        onClick={(e) => handleMenuOpen(e, project.id)}
                        title="More options"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="12" cy="5" r="2"/>
                          <circle cx="12" cy="12" r="2"/>
                          <circle cx="12" cy="19" r="2"/>
                        </svg>
                      </button>
                    </div>
                    <p className={styles.projectMeta}>{windowCount} windows • {modifiedDate}</p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Simple Prompt Modal */}
      {showPrompt && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100001
          }}
          onClick={() => setShowPrompt(false)}
        >
          <div
            style={{
              background: 'var(--bg-secondary, #fff)',
              padding: '24px',
              borderRadius: '12px',
              minWidth: '400px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-primary, #333)' }}>
              Enter project name:
            </h3>
            <input
              type="text"
              value={promptValue}
              onChange={e => setPromptValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handlePromptSubmit()}
              autoFocus
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '14px',
                border: '1px solid var(--border-color, #ddd)',
                borderRadius: '6px',
                marginBottom: '16px',
                background: 'var(--bg-tertiary, #f5f5f5)',
                color: 'var(--text-primary, #333)'
              }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowPrompt(false)}
                style={{
                  padding: '8px 16px',
                  border: '1px solid var(--border-color, #ddd)',
                  borderRadius: '6px',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: 'var(--text-primary, #333)'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handlePromptSubmit}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  background: 'var(--accent-color, #667eea)',
                  color: '#fff',
                  cursor: 'pointer'
                }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project context menu */}
      {menuState && (
        <div
          ref={menuRef}
          className={styles.projectMenu}
          style={{ left: menuState.x, top: menuState.y }}
        >
          <button
            className={styles.projectMenuItem}
            onClick={() => handleDuplicateProject(menuState.projectId)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            Duplicate
          </button>
          <div className={styles.menuSeparator} />
          <button
            className={`${styles.projectMenuItem} ${styles.danger}`}
            onClick={() => handleDeleteFromMenu(menuState.projectId)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
            Delete
          </button>
        </div>
      )}
    </div>
  )
}
