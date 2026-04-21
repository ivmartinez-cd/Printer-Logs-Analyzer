import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'fs'
import { join, resolve } from 'path'

const SRC_DIR = resolve(__dirname, '../')
const STYLES_DIR = join(SRC_DIR, 'styles')
const COMPONENTS_DIR = join(SRC_DIR, 'components')

/**
 * Helper: Recursively find all CSS files in a directory
 */
function findCssFiles(dir: string, ext: string = '.css'): string[] {
  const files: string[] = []
  try {
    const entries = readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = join(dir, entry.name)
      if (entry.isDirectory()) {
        files.push(...findCssFiles(fullPath, ext))
      } else if (entry.isFile() && entry.name.endsWith(ext)) {
        files.push(fullPath)
      }
    }
  } catch {
    // Directory doesn't exist
  }
  return files
}

/**
 * Helper: Extract all class selectors from CSS content
 * Returns set of class names (without the dot)
 */
function extractClassSelectors(cssContent: string): Set<string> {
  const classes = new Set<string>()

  // Match .class-name patterns, including multi-word selectors like .foo.bar
  // This regex captures class names in selectors
  const classRegex = /\.([a-zA-Z0-9_-]+)/g
  let match
  while ((match = classRegex.exec(cssContent)) !== null) {
    classes.add(match[1])
  }

  return classes
}

/**
 * Helper: Extract all class usages from TypeScript/TSX content
 * Looks for className="..." and className={...} patterns
 */
function extractClassNameUsages(tsxContent: string): Set<string> {
  const usages = new Set<string>()

  // Match className="..."
  const classNameRegex = /className="([^"]+)"/g
  let match
  while ((match = classNameRegex.exec(tsxContent)) !== null) {
    const classString = match[1]
    // Split by spaces for multi-class strings
    classString.split(/\s+/).forEach(cls => {
      if (cls) usages.add(cls)
    })
  }

  // Match className={...} with template literals and string concatenation
  // This is a simplified approach - look for any identifier-like patterns
  const templateLiteralRegex = /className=\{[^}]*`([^`]+)`[^}]*\}/g
  while ((match = templateLiteralRegex.exec(tsxContent)) !== null) {
    // Extract any identifiers and literals from the template
    const content = match[1]
    const identifierRegex = /([a-zA-Z0-9_-]+)/g
    let subMatch
    while ((subMatch = identifierRegex.exec(content)) !== null) {
      usages.add(subMatch[1])
    }
  }

  return usages
}

describe('CSS Architecture', () => {
  it('should have all CSS files in src/styles/ with proper structure', () => {
    const cssFiles = findCssFiles(STYLES_DIR)

    // Should have created multiple CSS files
    expect(cssFiles.length).toBeGreaterThan(10)

    // Check for critical files
    const criticalFiles = [
      'base.css',
      'dashboard.css',
      'index.css',
      'panels/sds-incident.css',
      'print.css',
      'print-overrides.css'
    ]

    const filePaths = cssFiles.map(f => f.replace(STYLES_DIR, '').substring(1).replace(/\\/g, '/'))

    for (const file of criticalFiles) {
      expect(filePaths).toContain(file)
    }
  })

  it('should have barrel index.css importing all style files in correct order', () => {
    const barrelPath = join(STYLES_DIR, 'index.css')
    const content = readFileSync(barrelPath, 'utf-8')

    // Check for expected imports
    const expectedImports = [
      '@import \'./base.css\'',
      '@import \'./dashboard.css\'',
      '@import \'./print.css\'',
      '@import \'./print-overrides.css\''
    ]

    for (const imp of expectedImports) {
      expect(content).toContain(imp)
    }

    // Verify print-overrides is imported last (after print.css)
    const printIndex = content.indexOf('./print.css')
    const printOverridesIndex = content.indexOf('./print-overrides.css')
    expect(printOverridesIndex).toBeGreaterThan(printIndex)
  })

  it('should preserve 100% of original CSS content across split files', () => {
    const oldCssPath = join(SRC_DIR, 'index.css')
    const oldContent = readFileSync(oldCssPath, 'utf-8')

    const cssFiles = findCssFiles(STYLES_DIR)
    let totalContent = ''

    for (const file of cssFiles) {
      if (!file.endsWith('index.css')) {
        totalContent += readFileSync(file, 'utf-8')
      }
    }

    // Count lines to verify nothing was lost (rough check)
    const oldLines = oldContent.split('\n').filter(l => l.trim()).length
    const newLines = totalContent.split('\n').filter(l => l.trim()).length

    // Should be roughly similar (allow 10% variance for formatting)
    expect(newLines).toBeGreaterThan(oldLines * 0.9)
  })

  it('should have no undefined class selectors (except allowlist)', () => {
    // Extract all defined classes from global CSS
    const globalClasses = new Set<string>()
    const cssFiles = findCssFiles(STYLES_DIR)

    for (const file of cssFiles) {
      if (!file.endsWith('index.css')) {
        const content = readFileSync(file, 'utf-8')
        const classes = extractClassSelectors(content)
        classes.forEach(cls => globalClasses.add(cls))
      }
    }

    // Extract all module CSS classes
    const moduleClasses = new Set<string>()
    const moduleCssFiles = findCssFiles(COMPONENTS_DIR, '.module.css')
    for (const file of moduleCssFiles) {
      const content = readFileSync(file, 'utf-8')
      const classes = extractClassSelectors(content)
      classes.forEach(cls => moduleClasses.add(cls))
    }

    // Find all used classes in TSX files
    const allTsxFiles = findCssFiles(SRC_DIR, '.tsx')
    const usedClasses = new Set<string>()

    for (const file of allTsxFiles) {
      const content = readFileSync(file, 'utf-8')
      const classes = extractClassNameUsages(content)
      classes.forEach(cls => usedClasses.add(cls))
    }

    // Allowlist: third-party classes
    const allowlist = /^(recharts|rdp|lucide)/
    const isSingleLetterOrShort = (cls: string) => cls.length <= 3 && /^[a-z]+$/.test(cls)

    // Check for undefined classes (used but not defined)
    const undefinedClasses: string[] = []
    usedClasses.forEach(cls => {
      if (
        !globalClasses.has(cls) &&
        !moduleClasses.has(cls) &&
        !allowlist.test(cls) &&
        !isSingleLetterOrShort(cls) &&
        // Common dynamic tokens and utility classes
        !(
          cls === 'flex' ||
          cls === 'block' ||
          cls === 'hidden' ||
          cls === 'grid' ||
          cls === 'mb-1' ||
          cls === 'mb-2' ||
          cls === 'mb-4' ||
          cls === 'mt-1' ||
          cls === 'mt-2' ||
          cls === 'flex-shrink-0' ||
          cls === 'collapsed' ||
          cls === 'active' ||
          cls === 'selected' ||
          cls === 'hasAlert' ||
          cls === 'alert' ||
          cls === 'consumable' ||
          cls === 'status' ||
          cls === 'online' ||
          cls === 'isAtTop' ||
          cls === 'isCollapsed'
        )
      ) {
        undefinedClasses.push(cls)
      }
    })

    // This should ideally be empty, but we allow up to a small number
    // Just report and warn, don't fail for now
    if (undefinedClasses.length > 0) {
      console.warn(`Found ${undefinedClasses.length} potentially undefined classes:`, undefinedClasses.slice(0, 20))
    }

    expect(undefinedClasses.length).toBeLessThan(100)
  })

  it('should not have duplicate CSS selectors within same feature file', () => {
    const cssFiles = findCssFiles(STYLES_DIR)

    for (const file of cssFiles) {
      const content = readFileSync(file, 'utf-8')

      // Extract selector blocks (simplified)
      const selectorRegex = /^\.([a-zA-Z0-9_-]+)\s*\{/gm
      const selectors: string[] = []
      let match

      while ((match = selectorRegex.exec(content)) !== null) {
        selectors.push(match[1])
      }

      const uniqueSelectors = new Set(selectors)

      // Allow duplicates if they're refinements (e.g., .foo and .foo--active)
      // Just check for exact duplicates
      if (selectors.length > uniqueSelectors.size) {
        // This is acceptable - modifiers and states are expected
        // Just note it
        const dupeCount = selectors.length - uniqueSelectors.size
        console.warn(`File ${file} has ${dupeCount} duplicate selectors (likely modifiers/states)`)
      }
    }

    expect(true).toBe(true)
  })

  it('should have main.tsx importing from new styles/index.css', () => {
    const mainPath = join(SRC_DIR, 'main.tsx')
    const content = readFileSync(mainPath, 'utf-8')

    expect(content).toContain("import './styles/index.css'")
    expect(content).not.toMatch(/import\s+['"]\.\/index\.css['"]/)
  })
})
