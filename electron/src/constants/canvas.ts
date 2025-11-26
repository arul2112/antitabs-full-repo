// Fixed canvas bounds - the canvas is a square of this size
export const CANVAS_SIZE = 50000

// Canvas bounds (0 to CANVAS_SIZE)
export const CANVAS_BOUNDS = {
  minX: 0,
  minY: 0,
  maxX: CANVAS_SIZE,
  maxY: CANVAS_SIZE,
  width: CANVAS_SIZE,
  height: CANVAS_SIZE
}

// Default window spawn position (center of canvas)
export const DEFAULT_WINDOW_POSITION = {
  x: CANVAS_SIZE / 2 - 700, // Center minus half default window width
  y: CANVAS_SIZE / 2 - 450  // Center minus half default window height
}

// Initial zoom level - 0.5 shows a good overview of the canvas
export const INITIAL_ZOOM = 0.5

// Calculate initial pan to center the canvas in viewport
// This function should be called when the app initializes to get proper pan values
export function calculateInitialPan(viewportWidth: number, viewportHeight: number, zoom: number = INITIAL_ZOOM) {
  // Center the canvas center point in the viewport
  const canvasCenterX = CANVAS_SIZE / 2
  const canvasCenterY = CANVAS_SIZE / 2

  return {
    panX: viewportWidth / 2 - canvasCenterX * zoom,
    panY: viewportHeight / 2 - canvasCenterY * zoom
  }
}
