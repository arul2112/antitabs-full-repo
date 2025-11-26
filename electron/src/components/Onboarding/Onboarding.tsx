import { useState, useEffect, useCallback, useRef } from 'react'
import { useWindowManager } from '@/contexts/WindowManagerContext'
import { useSettings } from '@/contexts/SettingsContext'
import styles from './Onboarding.module.css'

interface OnboardingStep {
  id: number
  title: string
  description: string
  highlight: string | null
  tooltipPosition: 'center' | 'left' | 'right' | 'top' | 'bottom' | 'center-top'
  actions: Array<{
    type: 'primary' | 'secondary'
    label: string
    action: string
  }>
  showBackButton: boolean
  showSkipButton: boolean
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 1,
    title: "Welcome to AntiTabs",
    description: "AntiTabs reimagines web browsing with a spatial canvas where each window exists as an independent entity. This quick tour will show you the essentials.",
    highlight: null,
    tooltipPosition: "center",
    actions: [
      { type: "primary", label: "Let's Start", action: "next" },
      { type: "secondary", label: "Skip Tour", action: "skip" }
    ],
    showBackButton: false,
    showSkipButton: false
  },
  {
    id: 2,
    title: "Create Your First Window",
    description: "Windows are your independent browsers. Click the 'New Window' button or press Cmd+N to create one. Each window can have multiple tabs.",
    highlight: "[data-tour='new-window']",
    tooltipPosition: "right",
    actions: [
      { type: "primary", label: "Try It", action: "createWindow" },
      { type: "secondary", label: "Next", action: "next" }
    ],
    showBackButton: true,
    showSkipButton: true
  },
  {
    id: 3,
    title: "Move Windows Around",
    description: "Drag any window by its title bar to reposition it. Think of the canvas as your infinite desktop. Windows can be placed anywhere.",
    highlight: "[data-tour='window']",
    tooltipPosition: "right",
    actions: [
      { type: "primary", label: "Next", action: "next" }
    ],
    showBackButton: true,
    showSkipButton: true
  },
  {
    id: 4,
    title: "Select Multiple Windows",
    description: "Press 'S' or click the selection button to enter Selection Mode. Draw a box to select multiple windows, or click a window to select it.",
    highlight: "[data-tour='selection-mode']",
    tooltipPosition: "left",
    actions: [
      { type: "primary", label: "Try It", action: "toggleSelection" },
      { type: "secondary", label: "Next", action: "next" }
    ],
    showBackButton: true,
    showSkipButton: true
  },
  {
    id: 5,
    title: "Organize Your Windows",
    description: "Use Cascade to stack windows neatly, or Tile to arrange them in a grid. These tools work on selected windows, or all windows if none are selected.",
    highlight: "[data-tour='cascade']",
    tooltipPosition: "left",
    actions: [
      { type: "primary", label: "Next", action: "next" }
    ],
    showBackButton: true,
    showSkipButton: true
  },
  {
    id: 6,
    title: "Zoom In & Out",
    description: "Navigate large workspaces by zooming. Use the controls or hold Space and scroll. Press Cmd+0 to reset zoom. Zoom range: 10% to 200%.",
    highlight: "[data-tour='zoom-controls']",
    tooltipPosition: "left",
    actions: [
      { type: "primary", label: "Try It", action: "demoZoom" },
      { type: "secondary", label: "Next", action: "next" }
    ],
    showBackButton: true,
    showSkipButton: true
  },
  {
    id: 7,
    title: "Pan Across the Canvas",
    description: "Move around the canvas using two-finger trackpad gestures, or middle-click and drag. This lets you navigate your workspace without moving windows.",
    highlight: null,
    tooltipPosition: "center",
    actions: [
      { type: "primary", label: "Next", action: "next" }
    ],
    showBackButton: true,
    showSkipButton: true
  },
  {
    id: 8,
    title: "Canvas vs. Web Interaction",
    description: "Toggle Window Cursor Mode (Cmd+1) to switch between interacting with the canvas/windows or the web content inside windows.",
    highlight: "[data-tour='cursor-mode']",
    tooltipPosition: "left",
    actions: [
      { type: "primary", label: "Try It", action: "toggleWindowCursor" },
      { type: "secondary", label: "Next", action: "next" }
    ],
    showBackButton: true,
    showSkipButton: true
  },
  {
    id: 9,
    title: "Focus Modes",
    description: "Press Cmd+2 to hide all UI elements for maximum focus. Press ESC four times quickly to toggle. Solo mode (fullscreen icon) hides just the header.",
    highlight: "[data-tour='hide-all']",
    tooltipPosition: "left",
    actions: [
      { type: "primary", label: "Next", action: "next" }
    ],
    showBackButton: true,
    showSkipButton: true
  },
  {
    id: 10,
    title: "Master the Shortcuts",
    description: "Access all keyboard shortcuts anytime by clicking the help button. Common ones: S (Selection Mode), Z (Zoom to Selected), Cmd+Z/Shift+Z (Undo/Redo).",
    highlight: "[data-tour='help']",
    tooltipPosition: "bottom",
    actions: [
      { type: "primary", label: "Next", action: "next" }
    ],
    showBackButton: true,
    showSkipButton: true
  },
  {
    id: 11,
    title: "Window Management Sidebar",
    description: "The sidebar lists all your windows. Click a window name to zoom to it, use the eye icon to show/hide, and double-click to rename.",
    highlight: "[data-tour='sidebar']",
    tooltipPosition: "right",
    actions: [
      { type: "primary", label: "Next", action: "next" }
    ],
    showBackButton: true,
    showSkipButton: true
  },
  {
    id: 12,
    title: "You're All Set!",
    description: "You've learned the essentials of AntiTabs. Explore projects to save your workspaces, customize colors, and discover advanced features. Happy browsing!",
    highlight: null,
    tooltipPosition: "center",
    actions: [
      { type: "primary", label: "Start Browsing", action: "complete" },
      { type: "secondary", label: "Restart Tour", action: "restart" }
    ],
    showBackButton: true,
    showSkipButton: false
  }
]

interface OnboardingProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
}

export default function Onboarding({ isOpen, onClose, onComplete }: OnboardingProps) {
  const { state, dispatch, createWindow, setZoom } = useWindowManager()
  const { setOnboardingCompleted, setOnboardingSkipped } = useSettings()
  const [currentStep, setCurrentStep] = useState(0)
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null)
  const originalStateRef = useRef({
    selectionMode: false,
    windowCursorMode: false,
    zoom: 1,
    panX: 0,
    panY: 0
  })

  const step = onboardingSteps[currentStep]

  // Save original state when onboarding starts
  useEffect(() => {
    if (isOpen) {
      originalStateRef.current = {
        selectionMode: state.modes.selectionMode,
        windowCursorMode: state.modes.windowCursorMode,
        zoom: state.canvas.zoom,
        panX: state.canvas.panX,
        panY: state.canvas.panY
      }
    }
  }, [isOpen])

  // Update spotlight position when step changes
  useEffect(() => {
    if (!isOpen || !step.highlight) {
      setSpotlightRect(null)
      return
    }

    const updateSpotlight = () => {
      const element = document.querySelector(step.highlight!)
      if (element) {
        const rect = element.getBoundingClientRect()
        setSpotlightRect(rect)
      } else {
        setSpotlightRect(null)
      }
    }

    // Initial update
    updateSpotlight()

    // Update on resize
    window.addEventListener('resize', updateSpotlight)

    // Also update periodically in case elements move
    const interval = setInterval(updateSpotlight, 500)

    return () => {
      window.removeEventListener('resize', updateSpotlight)
      clearInterval(interval)
    }
  }, [isOpen, currentStep, step.highlight])

  const restoreOriginalState = useCallback(() => {
    const original = originalStateRef.current

    if (state.modes.selectionMode !== original.selectionMode) {
      dispatch({ type: 'TOGGLE_SELECTION_MODE' })
    }

    if (state.modes.windowCursorMode !== original.windowCursorMode) {
      dispatch({ type: 'TOGGLE_WINDOW_CURSOR_MODE' })
    }

    setZoom(original.zoom, original.panX, original.panY)
  }, [state.modes, dispatch, setZoom])

  const handleSkip = useCallback(() => {
    setOnboardingSkipped(true)
    restoreOriginalState()
    onClose()
  }, [setOnboardingSkipped, restoreOriginalState, onClose])

  const handleComplete = useCallback(() => {
    setOnboardingCompleted(true)
    restoreOriginalState()
    onComplete()
    onClose()
  }, [setOnboardingCompleted, restoreOriginalState, onComplete, onClose])

  const handleNext = useCallback(() => {
    // Exit actions for current step
    if (currentStep === 3 && state.modes.selectionMode) {
      dispatch({ type: 'TOGGLE_SELECTION_MODE' })
    }
    if (currentStep === 5) {
      setZoom(1, 0, 0)
    }
    if (currentStep === 7 && state.modes.windowCursorMode) {
      dispatch({ type: 'TOGGLE_WINDOW_CURSOR_MODE' })
    }

    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(prev => prev + 1)
    }
  }, [currentStep, state.modes, dispatch, setZoom])

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }, [currentStep])

  const handleRestart = useCallback(() => {
    setCurrentStep(0)
  }, [])

  const handleAction = useCallback((action: string) => {
    switch (action) {
      case 'next':
        handleNext()
        break
      case 'skip':
        handleSkip()
        break
      case 'complete':
        handleComplete()
        break
      case 'restart':
        handleRestart()
        break
      case 'createWindow':
        createWindow()
        setTimeout(handleNext, 300)
        break
      case 'toggleSelection':
        dispatch({ type: 'TOGGLE_SELECTION_MODE' })
        setTimeout(handleNext, 300)
        break
      case 'demoZoom':
        setZoom(0.7, state.canvas.panX, state.canvas.panY)
        setTimeout(handleNext, 500)
        break
      case 'toggleWindowCursor':
        dispatch({ type: 'TOGGLE_WINDOW_CURSOR_MODE' })
        setTimeout(handleNext, 300)
        break
    }
  }, [handleNext, handleSkip, handleComplete, handleRestart, createWindow, dispatch, setZoom, state.canvas])

  // Calculate tooltip position
  const getTooltipStyle = useCallback(() => {
    const margin = 20

    if (step.tooltipPosition === 'center' || !spotlightRect) {
      return {
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)'
      }
    }

    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const tooltipWidth = 400
    const tooltipHeight = 250

    let left: number
    let top: number

    switch (step.tooltipPosition) {
      case 'right':
        left = spotlightRect.right + margin
        top = spotlightRect.top
        if (left + tooltipWidth > viewportWidth - margin) {
          left = spotlightRect.left - tooltipWidth - margin
        }
        break
      case 'left':
        left = spotlightRect.left - tooltipWidth - margin
        top = spotlightRect.top
        if (left < margin) {
          left = spotlightRect.right + margin
        }
        break
      case 'bottom':
        left = spotlightRect.left + (spotlightRect.width - tooltipWidth) / 2
        top = spotlightRect.bottom + margin
        if (top + tooltipHeight > viewportHeight - margin) {
          top = spotlightRect.top - tooltipHeight - margin
        }
        break
      case 'top':
      case 'center-top':
        left = spotlightRect.left + (spotlightRect.width - tooltipWidth) / 2
        top = spotlightRect.top - tooltipHeight - margin
        if (top < margin) {
          top = spotlightRect.bottom + margin
        }
        break
      default:
        left = spotlightRect.right + margin
        top = spotlightRect.top
    }

    // Clamp to viewport
    left = Math.max(margin, Math.min(left, viewportWidth - tooltipWidth - margin))
    top = Math.max(margin, Math.min(top, viewportHeight - tooltipHeight - margin))

    return {
      left: `${left}px`,
      top: `${top}px`,
      transform: 'none'
    }
  }, [step.tooltipPosition, spotlightRect])

  if (!isOpen) return null

  return (
    <div className={styles.overlay}>
      {/* Spotlight */}
      {spotlightRect && (
        <div
          className={styles.spotlight}
          style={{
            left: spotlightRect.left - 8,
            top: spotlightRect.top - 8,
            width: spotlightRect.width + 16,
            height: spotlightRect.height + 16
          }}
        />
      )}

      {/* Tooltip */}
      <div className={styles.tooltip} style={getTooltipStyle()}>
        <div className={styles.tooltipHeader}>
          <span className={styles.stepIndicator}>
            Step {step.id} of {onboardingSteps.length}
          </span>
        </div>

        <div className={styles.tooltipContent}>
          <h3 className={styles.tooltipTitle}>{step.title}</h3>
          <p className={styles.tooltipDescription}>{step.description}</p>
        </div>

        <div className={styles.tooltipActions}>
          {step.showSkipButton && (
            <button
              className={`${styles.btn} ${styles.btnSkip}`}
              onClick={handleSkip}
            >
              Skip Tour
            </button>
          )}

          {step.showBackButton && (
            <button
              className={`${styles.btn} ${styles.btnBack}`}
              onClick={handleBack}
            >
              Back
            </button>
          )}

          <div className={styles.actionsRight}>
            {step.actions.map((action, index) => (
              <button
                key={index}
                className={`${styles.btn} ${action.type === 'primary' ? styles.btnPrimary : styles.btnSecondary}`}
                onClick={() => handleAction(action.action)}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
