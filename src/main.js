import './style.css'
import {
  mergeActionConnectorCells,
  planConnectorCells,
} from './table-layout.js'
import {
  createRecipeArchive,
  createRecipeFile,
  mergeRecipeIntoLibrary,
  parseRecipeFile,
  recipeFileStem,
} from './recipe-backup.js'
import { createRecipeSubmissionIssueUrl } from './recipe-submission.js'
import { seedBuiltInRecipes } from './built-in-recipes.js'
import { createRecipePrintFiles } from './recipe-stl.js'
import { captureRecipeTableRaster } from './table-raster.js'
import { captureRecipeTablePng } from './table-png.js'

const STORAGE_KEY = 'recipe-table-studio'
const LIBRARY_KEY = 'recipe-table-studio-library'
const BUILT_IN_LIBRARY_VERSION_KEY = 'recipe-table-studio-built-in-version'
const MAX_BACKUP_BYTES = 5 * 1024 * 1024

const demo = {
  title: 'Banana Bread',
  note: 'Preheat oven to 325 degrees',
  ingredients: `1/4 cup butter
1 cup sugar
3 eggs
3 mashed bananas
1 teaspoon vanilla
1 teaspoon baking soda
2 teaspoons baking powder
2 cups flour
1/2 cup chocolate chips`,
  actions: [
    {
      id: 'cream',
      text: 'Cream until light',
      groupName: 'Creamed butter and sugar',
      ingredientLines: [1, 2],
      sourceIds: [],
    },
    {
      id: 'add',
      text: 'Add',
      groupName: 'Wet mixture',
      ingredientLines: [3, 4, 5],
      sourceIds: ['cream'],
    },
    {
      id: 'dry',
      text: 'Stir together',
      groupName: 'Dry ingredients',
      ingredientLines: [6, 7, 8],
      sourceIds: [],
    },
    {
      id: 'combine',
      text: 'Mix until just combined',
      groupName: 'Banana bread batter',
      ingredientLines: [],
      sourceIds: ['add', 'dry'],
    },
    {
      id: 'finish',
      text: 'Stir in',
      groupName: 'Finished batter',
      ingredientLines: [9],
      sourceIds: ['combine'],
    },
    {
      id: 'bake',
      text: 'Bake 1 hour at 325 degrees in greased loaf pan',
      groupName: 'Baked banana bread',
      ingredientLines: [],
      sourceIds: ['finish'],
    },
  ],
}

const app = document.querySelector('#app')

app.innerHTML = `
  <main id="top">
    <section class="workspace-header" aria-labelledby="workspace-title">
      <div class="workspace-title">
        <h1 id="workspace-title">Recipe Table Studio</h1>
      </div>
    </section>

    <div class="workspace-shell">
      <section class="library-section" aria-label="Recipe index">
        <div class="library-heading">
          <div class="library-title">
            <h2>Recipes</h2>
            <span class="badge badge-neutral badge-sm library-count" id="library-count">0</span>
            <button class="btn btn-ghost btn-xs mobile-library-sheet-close" type="button" data-mobile-library-command="close-library">
              Done
            </button>
          </div>
          <button class="btn btn-outline btn-sm section-action new-recipe-action" id="new-recipe" type="button">
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M12 5v14M5 12h14"></path>
            </svg>
            New Recipe
          </button>
          <label class="library-search">
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="6"></circle>
              <path d="m16 16 4 4"></path>
            </svg>
            <input class="input input-sm" id="library-search" type="search" placeholder="Find a recipe" autocomplete="off" />
          </label>
          <button class="btn btn-ghost btn-xs mobile-library-tools-toggle" type="button" data-mobile-library-command="toggle-tools" aria-expanded="false">
            Import &amp; export
          </button>
          <div class="library-tools">
            <button class="btn btn-outline btn-xs section-action backup-action" id="import-recipe" type="button">
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M12 16V4M7 9l5-5 5 5"></path>
                <path d="M5 14v6h14v-6"></path>
              </svg>
              Import Recipe
            </button>
            <button class="btn btn-outline btn-xs section-action backup-action" id="export-all-recipes" type="button">
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M12 4v12M7 11l5 5 5-5"></path>
                <path d="M5 14v6h14v-6"></path>
              </svg>
              Export All
            </button>
            <span class="backup-status" id="backup-status" role="status" aria-live="polite"></span>
            <input class="file-input file-input-xs backup-file-input" id="recipe-import-file" type="file" accept=".json,application/json" hidden />
          </div>
        </div>
        <div class="mobile-library-nav">
          <button class="btn btn-outline mobile-my-recipes-button" type="button" data-mobile-library-command="toggle-library" aria-expanded="false">
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M5 5h14v14H5z"></path>
              <path d="M8 3v4M16 3v4M8 11h8M8 15h5"></path>
            </svg>
            <span>My Recipes</span>
            <span class="badge badge-neutral badge-sm" id="mobile-my-recipes-count">0</span>
            <span class="mobile-my-recipes-arrow" aria-hidden="true">›</span>
          </button>
          <button class="btn mobile-nav-new-recipe" type="button" data-mobile-library-command="new-recipe">
            <span aria-hidden="true">＋</span>
            New Recipe
          </button>
        </div>
        <div id="recipe-cards" class="recipe-cards list"></div>
      </section>

      <section class="studio-grid">
        <aside class="editor-panel">
        <div class="panel-heading">
          <div class="panel-title">
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"></path>
            </svg>
            <h2>Edit Recipe</h2>
          </div>
          <div class="mobile-editor-controls">
            <button class="btn btn-outline mobile-editor-toggle" type="button" data-mobile-editor-command="toggle-editor" aria-expanded="false">
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"></path>
              </svg>
              <span>
                <strong id="mobile-editor-toggle-label">Edit recipe</strong>
                <small id="mobile-editor-toggle-description">Change ingredients and actions</small>
              </span>
              <span class="mobile-editor-caret" aria-hidden="true">›</span>
            </button>
            <button class="btn btn-neutral mobile-editor-save" type="submit" form="recipe-form">
              Save
            </button>
          </div>
        </div>
        <form id="recipe-form">
          <label>Recipe name<input id="title" name="title" value="${demo.title}" /></label>
          <div class="recipe-field">
            <label class="recipe-field-label" for="note">Opening note <span class="optional">optional</span></label>
            <input id="note" name="note" value="${demo.note}" aria-describedby="opening-note-help" />
            <p class="opening-note-help" id="opening-note-help">
              <strong>Good for:</strong>
              “Preheat oven to 350 degrees” · “Makes 2 loaves”
            </p>
          </div>
          <label>Ingredients <span class="hint">one ingredient per numbered line</span><div class="numbered-input"><div id="ingredient-line-numbers" class="line-numbers" aria-hidden="true"></div><textarea id="ingredients" name="ingredients" rows="10" wrap="off">${demo.ingredients}</textarea></div></label>

          <section class="action-builder" aria-labelledby="action-builder-title">
            <div class="action-builder-heading">
              <h3 id="action-builder-title">Actions</h3>
              <button class="btn btn-neutral btn-sm add-action-button" id="add-action" type="button">
                <span aria-hidden="true">＋</span> Add action
              </button>
            </div>
            <div id="action-list" class="action-list list"></div>
          </section>

        </form>
        </aside>

        <section class="preview-panel">
        <div class="preview-heading">
          <div><h2>Preview</h2></div>
          <div class="preview-actions">
            <button class="btn btn-outline btn-xs section-action save-action" type="submit" form="recipe-form">
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M5 3h12l2 2v16H5z"></path>
                <path d="M8 3v6h8V3M8 21v-7h8v7"></path>
              </svg>
              Save Recipe
            </button>
            <button class="btn btn-outline btn-xs section-action fullscreen-action" id="fullscreen-button" type="button" aria-pressed="false">
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M9 4H4v5M15 4h5v5M20 15v5h-5M4 15v5h5"></path>
              </svg>
              Full Screen
            </button>
            <button class="btn btn-outline btn-xs section-action copy-png-action" id="copy-table-png" type="button">
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <rect x="4" y="5" width="16" height="14" rx="1"></rect>
                <circle cx="9" cy="10" r="1.5"></circle>
                <path d="m6 17 4-4 3 3 2-2 3 3"></path>
              </svg>
              <span id="copy-table-png-label" aria-live="polite">Copy Image</span>
            </button>
            <button class="btn btn-outline btn-xs section-action submit-recipe-action" id="submit-recipe" type="button">
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9"></circle>
                <path d="M12 8v5M12 16h.01"></path>
              </svg>
              Submit Recipe
            </button>
            <button class="btn btn-outline btn-xs section-action export-action" id="export-current-recipe" type="button">
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M12 4v12M7 11l5 5 5-5"></path>
                <path d="M5 14v6h14v-6"></path>
              </svg>
              Export
            </button>
            <button class="btn btn-outline btn-xs section-action print3d-action" id="print3d-button" type="button">
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z"></path>
                <path d="m4 7.5 8 4.5 8-4.5M12 12v9"></path>
              </svg>
              3D Print
            </button>
            <button class="btn btn-outline btn-xs section-action print-action" id="print-button" type="button">
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M7 9V3h10v6M7 18H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                <path d="M7 14h10v7H7z"></path>
                <path d="M17 12h.01"></path>
              </svg>
              Print
            </button>
          </div>
        </div>
        <div id="table-wrap" class="table-wrap"></div>
        </section>
      </section>
    </div>
  </main>

  <dialog id="print3d-dialog" class="modal modal-middle" aria-labelledby="print3d-title">
    <div class="modal-box print3d-dialog-box">
      <div class="print3d-dialog-heading">
        <div>
          <span class="print3d-eyebrow">Exact table replica</span>
          <h2 id="print3d-title">3D Print</h2>
        </div>
        <span class="badge badge-outline badge-sm print3d-format-badge">2-color 3MF</span>
        <form method="dialog" class="print3d-close-form">
          <button class="btn btn-ghost btn-sm btn-square print3d-close" type="submit" aria-label="Close 3D print preview">×</button>
        </form>
      </div>

      <div class="print3d-preview-stage" id="print3d-preview-stage">
        <div class="print3d-status" id="print3d-status" role="status" aria-live="polite">
          <span class="loading loading-spinner loading-md" aria-hidden="true"></span>
          <span>Building your printable card…</span>
        </div>
      </div>

      <div class="print3d-details">
        <div>
          <span>Model</span>
          <strong id="print3d-model-name">Recipe card</strong>
        </div>
        <div>
          <span>Size</span>
          <strong id="print3d-model-size">—</strong>
        </div>
        <div>
          <span>Colors</span>
          <strong><i class="material-dot is-white"></i> White PLA <i class="material-dot is-black"></i> Black PLA</strong>
        </div>
        <div>
          <span>Print setup</span>
          <strong id="print3d-type-size">P1S · 0.4 mm nozzle · face up</strong>
        </div>
      </div>

      <div class="modal-action print3d-actions">
        <form method="dialog">
          <button class="btn btn-outline btn-sm section-action" type="submit">Close</button>
        </form>
        <a class="btn btn-outline btn-sm section-action download-model is-disabled" id="download-stl" aria-disabled="true">
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M12 4v12M7 11l5 5 5-5"></path>
            <path d="M5 14v6h14v-6"></path>
          </svg>
          Download STL
        </a>
        <a class="btn btn-sm section-action download-model download-3mf is-disabled" id="download-3mf" aria-disabled="true">
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M12 4v12M7 11l5 5 5-5"></path>
            <path d="M5 14v6h14v-6"></path>
          </svg>
          Download Bambu 3MF
        </a>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop"><button type="submit">Close preview</button></form>
  </dialog>
`

const $ = (id) => document.getElementById(id)
const updatedAtFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})
let activeRecipeId = null
let actions = cloneActions(demo.actions)
let expandedActionId = null
let stlPreviewCleanup = null
let modelDownloadUrls = []
let stlGenerationToken = 0
let stlLibrariesPromise = null
let mobileLibraryOpen = false
let mobileLibraryToolsOpen = false
let mobileEditorOpen = false

function cloneActions(items) {
  return items.map((action) => ({
    ...action,
    ingredientLines: [...(action.ingredientLines || [])],
    sourceIds: [...(action.sourceIds || [])],
  }))
}

function makeAction(index = actions.length) {
  const stamp = Date.now().toString(36)
  return {
    id: `action-${stamp}-${Math.random().toString(36).slice(2, 6)}`,
    text: '',
    groupName: `Result group ${index + 1}`,
    ingredientLines: [],
    sourceIds: [],
  }
}

function getIngredients() {
  return parseIngredients($('ingredients').value)
}

function parseIngredients(value) {
  return String(value).split('\n')
    .map((text, index) => ({ line: index + 1, text: text.trim() }))
    .filter((ingredient) => ingredient.text)
}

function sanitizeActions(items, ingredients = getIngredients()) {
  const validLines = new Set(ingredients.map((ingredient) => ingredient.line))
  const seen = new Set()
  return items.map((action, index) => {
    const id = action.id || `migrated-${index}-${Date.now().toString(36)}`
    const normalized = {
      id,
      text: String(action.text || ''),
      groupName: String(action.groupName || action.text || `Result group ${index + 1}`),
      ingredientLines: [...new Set((action.ingredientLines || []).map(Number))]
        .filter((line) => validLines.has(line))
        .sort((a, b) => a - b),
      sourceIds: [...new Set(action.sourceIds || [])].filter((sourceId) => seen.has(sourceId)),
    }
    seen.add(id)
    return normalized
  })
}

function migrateLegacySteps(recipe) {
  if (recipe.title === 'Banana Bread') return cloneActions(demo.actions)
  const ingredientCount = String(recipe.ingredients || '').split('\n').filter((line) => line.trim()).length
  const legacy = String(recipe.steps || '').split('\n').map((line) => line.trim()).filter(Boolean)
  return legacy.map((line, index) => {
    const match = line.match(/^(\d+)\s*(?:-\s*(\d+))?\s*:\s*(.+)$/)
    const start = Math.max(1, Math.min(ingredientCount, Number(match?.[1] || 1)))
    const end = Math.max(start, Math.min(ingredientCount, Number(match?.[2] || match?.[1] || ingredientCount)))
    return {
      id: `legacy-${index + 1}`,
      text: match?.[3] || line,
      groupName: match?.[3] || `Result group ${index + 1}`,
      ingredientLines: Array.from({ length: end - start + 1 }, (_, offset) => start + offset),
      sourceIds: [],
    }
  })
}

function normalizeRecipe(recipe) {
  const normalized = {
    ...recipe,
    title: recipe.title || 'Untitled recipe',
    note: recipe.note || '',
    ingredients: recipe.ingredients || '',
    actions: Array.isArray(recipe.actions) ? cloneActions(recipe.actions) : migrateLegacySteps(recipe),
  }
  delete normalized.steps
  return normalized
}

function recipeFromFields() {
  return {
    title: $('title').value.trim() || 'Untitled recipe',
    note: $('note').value.trim(),
    ingredients: $('ingredients').value,
    actions: sanitizeActions(actions),
  }
}

function loadRecipeIntoEditor(recipe) {
  const normalized = normalizeRecipe(recipe)
  $('title').value = normalized.title
  $('note').value = normalized.note
  $('ingredients').value = normalized.ingredients
  actions = sanitizeActions(normalized.actions)
  expandedActionId = null
  updateIngredientLineNumbers()
  renderActionBuilder()
  renderTable()
}

function saveDraft() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    ...recipeFromFields(),
    activeRecipeId,
  }))
}

function getLibrary() {
  try {
    const recipes = JSON.parse(localStorage.getItem(LIBRARY_KEY) || '[]')
    return Array.isArray(recipes) ? recipes.map(normalizeRecipe) : []
  } catch {
    return []
  }
}

function saveLibrary(recipes) {
  localStorage.setItem(LIBRARY_KEY, JSON.stringify(recipes))
}

function seedLibraryWithBuiltIns(recipes) {
  const result = seedBuiltInRecipes(
    recipes,
    localStorage.getItem(BUILT_IN_LIBRARY_VERSION_KEY),
  )
  if (!result.changed) return result.recipes

  saveLibrary(result.recipes)
  localStorage.setItem(BUILT_IN_LIBRARY_VERSION_KEY, String(result.version))
  return result.recipes
}

function formatUpdatedAt(value) {
  const timestamp = Number(value)
  if (!Number.isFinite(timestamp) || timestamp <= 0) return 'Updated date unavailable'
  return `Updated ${updatedAtFormatter.format(new Date(timestamp))}`
}

function setBackupStatus(message, type = 'success') {
  const status = $('backup-status')
  status.textContent = message
  status.classList.toggle('is-error', type === 'error')
}

function downloadFile(contents, type, filename) {
  const downloadUrl = URL.createObjectURL(new Blob([contents], { type }))
  const link = document.createElement('a')
  link.href = downloadUrl
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(downloadUrl), 0)
}

async function copyRecipeTablePng() {
  const button = $('copy-table-png')
  const label = $('copy-table-png-label')
  button.disabled = true
  label.textContent = 'Copying…'

  try {
    if (!navigator.clipboard?.write || !window.ClipboardItem) {
      throw new Error('PNG copying is not supported in this browser.')
    }
    const blob = await captureRecipeTablePng($('table-wrap'))
    await navigator.clipboard.write([
      new window.ClipboardItem({ 'image/png': blob }),
    ])
    label.textContent = 'Image Copied'
    button.classList.add('is-success')
  } catch (error) {
    label.textContent = 'Copy failed'
    setBackupStatus(error.message || 'The recipe PNG could not be copied.', 'error')
  } finally {
    window.setTimeout(() => {
      label.textContent = 'Copy Image'
      button.classList.remove('is-success')
      button.disabled = false
    }, 3000)
  }
}

function clearModelDownloads() {
  modelDownloadUrls.forEach((url) => URL.revokeObjectURL(url))
  modelDownloadUrls = []
  ;['download-stl', 'download-3mf'].forEach((id) => {
    const download = $(id)
    download.removeAttribute('href')
    download.removeAttribute('download')
    download.setAttribute('aria-disabled', 'true')
    download.setAttribute('tabindex', '-1')
    download.classList.add('is-disabled')
  })
}

function setStlPreviewStatus(message, state = 'loading') {
  const status = $('print3d-status')
  status.className = `print3d-status is-${state}`
  status.innerHTML = state === 'loading'
    ? '<span class="loading loading-spinner loading-md" aria-hidden="true"></span><span></span>'
    : '<span></span>'
  status.querySelector('span:last-child').textContent = message
}

function disposeStlPreview() {
  stlPreviewCleanup?.()
  stlPreviewCleanup = null
  $('print3d-preview-stage').querySelector('canvas')?.remove()
}

function loadStlLibraries() {
  if (!stlLibrariesPromise) {
    stlLibrariesPromise = Promise.all([
      import('three'),
      import('three/examples/jsm/controls/OrbitControls.js'),
      import('three/examples/jsm/loaders/STLLoader.js'),
      import('three/examples/jsm/loaders/FontLoader.js'),
      import('three/examples/jsm/geometries/TextGeometry.js'),
      import('./opentype-to-three-font.js'),
      import('./assets/ArchivoCondensed-ExtraBold.ttf?url'),
    ]).then(([
      THREE,
      { OrbitControls },
      { STLLoader },
      { FontLoader },
      { TextGeometry },
      { loadOpenTypeAsThreeFontJson },
      fontAsset,
    ]) => loadOpenTypeAsThreeFontJson(fontAsset.default).then((fontJson) => ({
        THREE,
        OrbitControls,
        STLLoader,
        TextGeometry,
        font: new FontLoader().parse(fontJson),
      })))
  }
  return stlLibrariesPromise
}

function renderStlPreview(baseBuffer, detailBuffer, libraries) {
  disposeStlPreview()
  const { THREE, OrbitControls, STLLoader } = libraries
  const stage = $('print3d-preview-stage')
  const baseGeometry = new STLLoader().parse(baseBuffer)
  const detailGeometry = new STLLoader().parse(detailBuffer)
  baseGeometry.computeVertexNormals()
  detailGeometry.computeVertexNormals()

  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#eef2e8')
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 1000)
  camera.up.set(0, 0, 1)
  camera.position.set(0, -72, 210)

  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap
  stage.prepend(renderer.domElement)

  const baseMaterial = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    roughness: 0.82,
    metalness: 0.02,
  })
  const detailMaterial = new THREE.MeshStandardMaterial({
    color: '#050505',
    roughness: 0.74,
    metalness: 0.01,
  })
  const base = new THREE.Mesh(baseGeometry, baseMaterial)
  const details = new THREE.Mesh(detailGeometry, detailMaterial)
  base.castShadow = true
  base.receiveShadow = true
  details.castShadow = true
  details.receiveShadow = true
  scene.add(base, details)

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(320, 240),
    new THREE.ShadowMaterial({ color: '#19342c', opacity: 0.13 }),
  )
  ground.position.z = -0.3
  ground.receiveShadow = true
  scene.add(ground)

  scene.add(new THREE.HemisphereLight('#ffffff', '#a7b1aa', 2))
  const keyLight = new THREE.DirectionalLight('#fffdf7', 3)
  keyLight.position.set(-90, -90, 170)
  keyLight.castShadow = true
  keyLight.shadow.mapSize.set(1024, 1024)
  scene.add(keyLight)
  const fillLight = new THREE.DirectionalLight('#cfe1ff', 1.4)
  fillLight.position.set(110, 40, 90)
  scene.add(fillLight)

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.target.set(0, 0, 1.6)
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.minDistance = 125
  controls.maxDistance = 380
  controls.update()

  function resizePreview() {
    const width = Math.max(320, stage.clientWidth)
    const height = Math.max(260, stage.clientHeight)
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
  }

  let animationFrame = 0
  function renderFrame() {
    controls.update()
    renderer.render(scene, camera)
    animationFrame = requestAnimationFrame(renderFrame)
  }

  const resizeObserver = new ResizeObserver(resizePreview)
  resizeObserver.observe(stage)
  resizePreview()
  renderFrame()

  stlPreviewCleanup = () => {
    cancelAnimationFrame(animationFrame)
    resizeObserver.disconnect()
    controls.dispose()
    baseGeometry.dispose()
    detailGeometry.dispose()
    baseMaterial.dispose()
    detailMaterial.dispose()
    ground.geometry.dispose()
    ground.material.dispose()
    renderer.dispose()
  }
}

async function openStlPreview() {
  const recipe = recipeFromFields()
  const dialog = $('print3d-dialog')
  const token = ++stlGenerationToken

  clearModelDownloads()
  disposeStlPreview()
  $('print3d-title').textContent = `${recipe.title} · 3D Print`
  $('print3d-model-name').textContent = recipe.title
  $('print3d-model-size').textContent = '—'
  $('print3d-type-size').textContent = 'P1S · 0.4 mm nozzle · face up'
  setStlPreviewStatus('Building your printable card…')
  dialog.showModal()

  await new Promise((resolve) => requestAnimationFrame(resolve))
  if (token !== stlGenerationToken || !dialog.open) return

  try {
    const librariesPromise = loadStlLibraries()
    await document.fonts.ready
    const capturedRaster = captureRecipeTableRaster($('table-wrap'))
    const libraries = await librariesPromise
    const {
      baseBuffer,
      detailBuffer,
      stlBuffer,
      threeMfBuffer,
      metadata,
    } = createRecipePrintFiles(recipe, capturedRaster, libraries)
    if (token !== stlGenerationToken || !dialog.open) return
    const stem = `${recipeFileStem(recipe.title)}-recipe-card`
    const downloads = [
      {
        id: 'download-stl',
        url: URL.createObjectURL(new Blob([stlBuffer], { type: 'model/stl' })),
        filename: `${stem}.stl`,
      },
      {
        id: 'download-3mf',
        url: URL.createObjectURL(new Blob([threeMfBuffer], { type: 'model/3mf' })),
        filename: `${stem}-p1s-0.4-white-black-pla.3mf`,
      },
    ]
    modelDownloadUrls = downloads.map(({ url }) => url)
    downloads.forEach(({ id, url, filename }) => {
      const download = $(id)
      download.href = url
      download.download = filename
      download.setAttribute('aria-disabled', 'false')
      download.removeAttribute('tabindex')
      download.classList.remove('is-disabled')
    })
    $('print3d-model-size').textContent = `${metadata.widthMm.toFixed(0)} × ${metadata.heightMm.toFixed(0)} × ${metadata.depthMm.toFixed(1)} mm`
    const typeSize = $('print3d-type-size')
    typeSize.textContent = `P1S · 0.4 mm nozzle · type ≥ ${metadata.minimumFontSizeMm.toFixed(1)} mm`
    typeSize.dataset.minimumHorizontalScale = metadata.minimumHorizontalScale.toFixed(3)
    renderStlPreview(baseBuffer, detailBuffer, libraries)
    setStlPreviewStatus('Exact table geometry · drag to rotate · scroll to zoom', 'ready')
  } catch (error) {
    setStlPreviewStatus(error.message || 'The 3D model could not be generated.', 'error')
  }
}

function recipeWithExportIdentity(recipe) {
  return {
    ...recipe,
    id: activeRecipeId || `exported-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    updatedAt: Date.now(),
  }
}

function exportCurrentRecipe() {
  const recipe = recipeWithExportIdentity(recipeFromFields())
  try {
    downloadFile(
      createRecipeFile(recipe),
      'application/json',
      `${recipeFileStem(recipe.title)}.recipe.json`,
    )
    setBackupStatus(`Exported "${recipe.title}".`)
  } catch (error) {
    setBackupStatus(error.message || 'That recipe could not be exported.', 'error')
  }
}

function submitRecipeForInclusion() {
  const recipe = recipeWithExportIdentity(recipeFromFields())
  window.open(
    createRecipeSubmissionIssueUrl(recipe),
    '_blank',
    'noopener,noreferrer',
  )
  setBackupStatus(`Opened a GitHub preset submission for "${recipe.title}".`)
}

function exportAllRecipes() {
  const recipes = getLibrary()
  if (!recipes.length) {
    setBackupStatus('Save a recipe before exporting all.', 'error')
    return
  }

  try {
    const archive = createRecipeArchive(recipes)
    downloadFile(
      archive,
      'application/zip',
      `recipe-table-studio-${new Date().toISOString().slice(0, 10)}.zip`,
    )
    setBackupStatus(`Exported ${recipes.length} recipe${recipes.length === 1 ? '' : 's'} in one ZIP.`)
  } catch (error) {
    setBackupStatus(error.message || 'Recipes could not be exported.', 'error')
  }
}

async function importRecipeFile(file) {
  if (!file) return
  if (file.size > MAX_BACKUP_BYTES) {
    setBackupStatus('That recipe file is larger than 5 MB.', 'error')
    return
  }

  try {
    const importedRecipe = parseRecipeFile(await file.text())
    const result = mergeRecipeIntoLibrary(getLibrary(), importedRecipe)
    saveLibrary(result.recipes)
    renderRecipeCards()
    setBackupStatus(`Imported "${importedRecipe.title}" · ${result.addedCount ? 'new recipe' : 'updated recipe'}.`)
  } catch (error) {
    setBackupStatus(error.message || 'That recipe file could not be imported.', 'error')
  }
}

function renderRecipeCards() {
  const allRecipes = getLibrary()
  const query = $('library-search').value.trim().toLocaleLowerCase()
  const recipes = query
    ? allRecipes.filter((recipe) => {
      const haystack = `${recipe.title}\n${recipe.ingredients}`.toLocaleLowerCase()
      return haystack.includes(query)
    })
    : allRecipes
  $('library-count').textContent = allRecipes.length
  $('export-all-recipes').disabled = allRecipes.length === 0
  $('recipe-cards').innerHTML = recipes.length ? recipes.map((recipe) => {
    const ingredientItems = parseIngredients(recipe.ingredients)
    return `<article class="recipe-card recipe-index-row list-row ${recipe.id === activeRecipeId ? 'is-active' : ''}" data-id="${recipe.id}" role="button" tabindex="0" aria-label="Open ${escapeHtml(recipe.title)}">
      <span class="recipe-index-copy">
        <strong>${escapeHtml(recipe.title)}</strong>
        <small>${ingredientItems.length} ingredients · ${escapeHtml(formatUpdatedAt(recipe.updatedAt).replace('Updated ', ''))}</small>
      </span>
      <button class="delete-card" data-action="delete" data-id="${recipe.id}" aria-label="Delete ${escapeHtml(recipe.title)}">×</button>
    </article>`
  }).join('') : `<div class="empty-library"><span>✦</span><p>${query ? 'No recipes match that search.' : 'Your saved recipes will live here.'}</p>${query ? '' : '<small>Build a table, then save it to come back later.</small>'}</div>`
  updateMobileLibrary()
}

function updateMobileLibrary() {
  const librarySection = document.querySelector('.library-section')
  if (!librarySection) return

  const recipes = getLibrary()
  librarySection.classList.toggle('is-mobile-library-open', mobileLibraryOpen)
  librarySection.classList.toggle('is-mobile-tools-open', mobileLibraryToolsOpen)
  $('mobile-my-recipes-count').textContent = recipes.length

  librarySection.querySelector('.mobile-my-recipes-button')
    .setAttribute('aria-expanded', String(mobileLibraryOpen))

  const toolsButton = librarySection.querySelector('.mobile-library-tools-toggle')
  toolsButton.textContent = mobileLibraryToolsOpen ? 'Hide file tools' : 'Import & export'
  toolsButton.setAttribute('aria-expanded', String(mobileLibraryToolsOpen))
}

function updateMobileEditor() {
  const studioGrid = document.querySelector('.studio-grid')
  if (!studioGrid) return

  studioGrid.dataset.mobileEditor = ''
  studioGrid.classList.toggle('is-mobile-editor-open', mobileEditorOpen)
  const toggleButton = studioGrid.querySelector('.mobile-editor-toggle')
  toggleButton.setAttribute('aria-expanded', String(mobileEditorOpen))
  $('mobile-editor-toggle-label').textContent = mobileEditorOpen ? 'Hide editor' : 'Edit recipe'
  $('mobile-editor-toggle-description').textContent = mobileEditorOpen
    ? 'Changes update the preview live'
    : 'Change ingredients and actions'
}

function setMobileEditorOpen(isOpen, shouldScroll = false) {
  mobileEditorOpen = isOpen
  updateMobileEditor()
  if (isOpen && shouldScroll) {
    requestAnimationFrame(() => {
      document.querySelector('.editor-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }
}

function closeMobileLibrary() {
  mobileLibraryOpen = false
  mobileLibraryToolsOpen = false
  updateMobileLibrary()
}

function setupMobileLayout() {
  document.addEventListener('click', (event) => {
    const editorCommand = event.target.closest('[data-mobile-editor-command]')?.dataset.mobileEditorCommand
    if (editorCommand === 'toggle-editor') {
      setMobileEditorOpen(!mobileEditorOpen, !mobileEditorOpen)
      return
    }

    const command = event.target.closest('[data-mobile-library-command]')?.dataset.mobileLibraryCommand
    if (!command) return
    if (command === 'toggle-library') {
      mobileLibraryOpen = !mobileLibraryOpen
      if (!mobileLibraryOpen) mobileLibraryToolsOpen = false
      updateMobileLibrary()
    }
    if (command === 'close-library') closeMobileLibrary()
    if (command === 'toggle-tools') {
      mobileLibraryToolsOpen = !mobileLibraryToolsOpen
      updateMobileLibrary()
    }
    if (command === 'new-recipe') {
      $('new-recipe').click()
      closeMobileLibrary()
    }
  })

  document.addEventListener('keydown', (event) => {
    if (['INPUT', 'TEXTAREA'].includes(event.target.tagName) || event.target.isContentEditable) return
    if (event.key === 'Escape' && mobileLibraryOpen) closeMobileLibrary()
    else if (event.key === 'Escape' && mobileEditorOpen) setMobileEditorOpen(false)
  })

  updateMobileLibrary()
  updateMobileEditor()
}

function saveToLibrary() {
  const recipe = recipeFromFields()
  const recipes = getLibrary()
  const now = Date.now()
  if (activeRecipeId && recipes.some((saved) => saved.id === activeRecipeId)) {
    const index = recipes.findIndex((saved) => saved.id === activeRecipeId)
    recipes[index] = { ...recipes[index], ...recipe, updatedAt: now }
  } else {
    activeRecipeId = `${now}-${Math.random().toString(36).slice(2, 7)}`
    recipes.unshift({ ...recipe, id: activeRecipeId, updatedAt: now })
  }
  saveLibrary(recipes)
  saveDraft()
  renderRecipeCards()
}

function startNewRecipe() {
  activeRecipeId = null
  expandedActionId = null
  actions = []
  $('title').value = ''
  $('note').value = ''
  $('ingredients').value = ''
  $('library-search').value = ''
  updateIngredientLineNumbers()
  renderActionBuilder()
  renderTable()
  renderRecipeCards()
  saveDraft()
  setBackupStatus('New recipe ready.')
  closeMobileLibrary()
  setMobileEditorOpen(true, true)
}

function actionSourceSummary(action) {
  const ingredientCount = action.ingredientLines.length
  const groupCount = action.sourceIds.length
  const parts = []
  if (ingredientCount) parts.push(`${ingredientCount} ingredient${ingredientCount === 1 ? '' : 's'}`)
  if (groupCount) parts.push(`${groupCount} group${groupCount === 1 ? '' : 's'}`)
  return parts.join(' + ') || 'Choose inputs'
}

function renderActionBuilder() {
  actions = sanitizeActions(actions)
  if (!actions.some((action) => action.id === expandedActionId)) expandedActionId = null
  const ingredients = getIngredients()
  $('action-list').innerHTML = actions.length ? actions.map((action, index) => {
    const previousActions = actions.slice(0, index)
    const ingredientChoices = ingredients.map((ingredient) => {
      const checked = action.ingredientLines.includes(ingredient.line)
      return `<label class="source-option ingredient-option ${checked ? 'is-selected' : ''}">
        <input class="checkbox checkbox-xs action-ingredient" type="checkbox" data-action-id="${action.id}" data-line="${ingredient.line}" ${checked ? 'checked' : ''} />
        <span class="source-number">${ingredient.line}</span>
        <span>${escapeHtml(ingredient.text)}</span>
      </label>`
    }).join('')
    const groupChoices = previousActions.length ? previousActions.map((source, sourceIndex) => {
      const checked = action.sourceIds.includes(source.id)
      const sourceName = source.groupName.trim() || source.text.trim() || `Result group ${sourceIndex + 1}`
      return `<label class="source-option group-option ${checked ? 'is-selected' : ''}">
        <input class="checkbox checkbox-xs action-source" type="checkbox" data-action-id="${action.id}" data-source-id="${source.id}" ${checked ? 'checked' : ''} />
        <span class="group-icon">G${sourceIndex + 1}</span>
        <span>${escapeHtml(sourceName)}</span>
      </label>`
    }).join('') : '<p class="empty-source">No earlier groups yet. Select ingredients to begin this branch.</p>'

    const resultName = action.groupName.trim() || `Result group ${index + 1}`
    return `<details class="action-card card card-border collapse" data-action-card="${action.id}" ${expandedActionId === action.id ? 'open' : ''}>
      <summary class="collapse-title action-card-head">
        <span class="action-caret" aria-hidden="true">›</span>
        <div class="action-index"><span>${index + 1}</span></div>
        <div class="action-card-title">
          <strong>${escapeHtml(action.text.trim() || 'Untitled action')}</strong>
          <small>${escapeHtml(actionSourceSummary(action))} → ${escapeHtml(resultName)}</small>
        </div>
        <div class="action-card-controls">
          <button class="btn btn-ghost btn-xs btn-square action-control" type="button" data-command="move-up" data-action-id="${action.id}" aria-label="Move action up" ${index === 0 ? 'disabled' : ''}>↑</button>
          <button class="btn btn-ghost btn-xs btn-square action-control" type="button" data-command="move-down" data-action-id="${action.id}" aria-label="Move action down" ${index === actions.length - 1 ? 'disabled' : ''}>↓</button>
          <button class="btn btn-ghost btn-xs btn-square action-control remove-action" type="button" data-command="remove" data-action-id="${action.id}" aria-label="Remove action">×</button>
        </div>
      </summary>
      <div class="collapse-content">
       <div class="action-card-body">
        <fieldset class="fieldset action-fieldset">
          <legend class="fieldset-legend">Action</legend>
          <input class="input input-sm action-text-input" data-action-id="${action.id}" data-field="text" value="${escapeHtml(action.text)}" placeholder="e.g. Cream until light" />
        </fieldset>
        <fieldset class="fieldset action-fieldset">
          <legend class="fieldset-legend">Ingredients</legend>
          <div class="source-grid ingredient-source-grid">${ingredientChoices || '<p class="empty-source">Add ingredients above first.</p>'}</div>
        </fieldset>
        <fieldset class="fieldset action-fieldset">
          <legend class="fieldset-legend">Earlier groups</legend>
          <div class="source-grid group-source-grid">${groupChoices}</div>
        </fieldset>
        <fieldset class="fieldset action-fieldset result-fieldset">
          <legend class="fieldset-legend">Result group</legend>
          <div class="result-input-row">
            <span class="result-arrow" aria-hidden="true">→</span>
            <input class="input input-sm action-group-input" data-action-id="${action.id}" data-field="groupName" value="${escapeHtml(action.groupName)}" placeholder="e.g. Wet mixture" />
          </div>
        </fieldset>
       </div>
      </div>
    </details>`
  }).join('') : `<div class="empty-actions card card-border">
    <span>01</span>
    <h4>Start with the first transformation</h4>
    <p>Add an action, select its ingredient lines, and name the result so later actions can use it.</p>
    <button class="btn btn-neutral btn-sm" type="button" data-command="add-empty-action">＋ Add first action</button>
  </div>`
}

function buildActionGraph(ingredients, actionItems = actions) {
  const rowByLine = new Map(ingredients.map((ingredient, index) => [ingredient.line, index + 1]))
  const graphById = new Map()
  const columns = []

  actionItems.forEach((action) => {
    const sourceNodes = action.sourceIds.map((sourceId) => graphById.get(sourceId)).filter(Boolean)
    const rows = new Set(action.ingredientLines.map((line) => rowByLine.get(line)).filter(Boolean))
    sourceNodes.forEach((source) => source.rows.forEach((row) => rows.add(row)))
    if (!rows.size || !action.text.trim()) return

    const start = Math.min(...rows)
    const end = Math.max(...rows)
    let column = sourceNodes.length ? Math.max(...sourceNodes.map((source) => source.column)) + 1 : 0
    while ((columns[column] || []).some((existing) => !(existing.end < start || existing.start > end))) column += 1

    const node = { ...action, rows, start, end, column }
    if (!columns[column]) columns[column] = []
    columns[column].push(node)
    graphById.set(action.id, node)
  })

  return { nodes: [...graphById.values()], columns }
}

function buildTableRows(ingredients, actionItems, compact = false) {
  const { columns: sparseColumns } = buildActionGraph(ingredients, actionItems)
  const columnCount = sparseColumns.length
  const actionColumns = Array.from({ length: columnCount }, (_, index) => sparseColumns[index] || [])
  const coverage = Array.from({ length: ingredients.length }, () => Array(columnCount).fill(false))
  actionColumns.forEach((columnNodes, column) => {
    columnNodes.forEach((node) => {
      for (let row = node.start - 1; row < node.end; row += 1) coverage[row][column] = true
    })
  })
  const plannedConnectorCells = planConnectorCells({
    ingredientCount: ingredients.length,
    columnCount,
    coverage,
    actionColumns,
  })
  const {
    actionCells,
    connectorCells,
  } = mergeActionConnectorCells(actionColumns, plannedConnectorCells)
  const actionCellByStart = new Map(actionCells.map((cell) => [
    `${cell.row}:${cell.column}`,
    cell,
  ]))
  const connectorByStart = new Map(connectorCells.map((cell) => [
    `${cell.row}:${cell.column}`,
    cell,
  ]))

  const totalActionColumns = Math.max(columnCount, 1)
  const colgroup = `<colgroup><col style="width:26%">${Array.from({ length: totalActionColumns }, () => '<col>').join('')}</colgroup>`
  const rows = ingredients.map((ingredient, row) => {
    let cells = `<td class="ingredient-cell">${compact ? '' : escapeHtml(ingredient.text)}</td>`
    if (!columnCount) return `<tr>${cells}<td class="blank-cell"></td></tr>`

    let column = 0
    while (column < columnCount) {
      const columnNodes = actionColumns[column]
      const node = columnNodes.find((candidate) => candidate.start - 1 === row)
      if (node) {
        const actionCell = actionCellByStart.get(`${row}:${column}`)
        cells += `<td class="action-cell join-left" rowspan="${actionCell.rowSpan}" colspan="${actionCell.colSpan}">${compact ? '' : escapeHtml(node.text)}</td>`
        column += actionCell.colSpan
      } else if (connectorByStart.has(`${row}:${column}`)) {
        const connector = connectorByStart.get(`${row}:${column}`)
        cells += `<td class="blank-cell${connector.joinsActionOnRight ? ' righthide' : ''}" rowspan="${connector.rowSpan}" colspan="${connector.colSpan}"></td>`
        column += connector.colSpan
      } else {
        column += 1
      }
    }
    return `<tr>${cells}</tr>`
  }).join('')

  return { colgroup, rows, totalActionColumns }
}

function renderTable() {
  const title = $('title').value.trim() || 'Untitled recipe'
  const note = $('note').value.trim()
  const ingredients = getIngredients()
  $('fullscreen-button').disabled = !ingredients.length
  if (!ingredients.length) {
    $('table-wrap').innerHTML = '<div class="empty-preview">Add ingredients to begin your recipe table.</div>'
    return
  }
  const { colgroup, rows, totalActionColumns } = buildTableRows(ingredients, actions)
  $('table-wrap').innerHTML = `
    <button class="btn btn-neutral recipe-fullscreen-exit" type="button" data-fullscreen-command="exit" aria-label="Exit full screen">
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M9 9H4V4M15 9h5V4M20 20v-5h-5M4 20v-5h5"></path>
      </svg>
      Exit Full Screen
    </button>
    <table class="recipe-table">
      ${colgroup}
      <tbody>
        <tr><th class="table-title" colspan="${totalActionColumns + 1}">${escapeHtml(title)}</th></tr>
        ${note ? `<tr><td class="table-note" colspan="${totalActionColumns + 1}">${escapeHtml(note)}</td></tr>` : ''}
        ${rows}
      </tbody>
    </table>
  `
}

function fullscreenElement() {
  return document.fullscreenElement || document.webkitFullscreenElement || null
}

function updateRecipeFullscreenState() {
  const tableWrap = $('table-wrap')
  const isOpen = fullscreenElement() === tableWrap || tableWrap.classList.contains('is-fullscreen-fallback')
  $('fullscreen-button').setAttribute('aria-pressed', String(isOpen))
  document.body.classList.toggle('recipe-fullscreen-open', isOpen)
}

function openRecipeFullscreen() {
  const tableWrap = $('table-wrap')
  if (!tableWrap.querySelector('.recipe-table')) return

  const requestFullscreen = tableWrap.requestFullscreen || tableWrap.webkitRequestFullscreen
  if (!requestFullscreen) {
    tableWrap.classList.add('is-fullscreen-fallback')
    updateRecipeFullscreenState()
    return
  }

  try {
    const request = requestFullscreen.call(tableWrap)
    if (request?.catch) {
      request.catch(() => {
        tableWrap.classList.add('is-fullscreen-fallback')
        updateRecipeFullscreenState()
      })
    }
  } catch {
    tableWrap.classList.add('is-fullscreen-fallback')
    updateRecipeFullscreenState()
  }
}

function closeRecipeFullscreen() {
  const tableWrap = $('table-wrap')
  tableWrap.classList.remove('is-fullscreen-fallback')

  if (fullscreenElement() === tableWrap) {
    const exitFullscreen = document.exitFullscreen || document.webkitExitFullscreen
    exitFullscreen?.call(document)
  }
  updateRecipeFullscreenState()
}

function updateAction(id, updater) {
  const action = actions.find((candidate) => candidate.id === id)
  if (!action) return
  updater(action)
  actions = sanitizeActions(actions)
  saveDraft()
  renderTable()
}

function moveAction(id, direction) {
  const index = actions.findIndex((action) => action.id === id)
  const nextIndex = index + direction
  if (index < 0 || nextIndex < 0 || nextIndex >= actions.length) return
  ;[actions[index], actions[nextIndex]] = [actions[nextIndex], actions[index]]
  actions = sanitizeActions(actions)
  renderActionBuilder()
  saveDraft()
  renderTable()
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]))
}

function updateIngredientLineNumbers() {
  const lineCount = Math.max(1, $('ingredients').value.split('\n').length)
  $('ingredient-line-numbers').innerHTML = Array.from({ length: lineCount }, (_, index) => `<span>${index + 1}</span>`).join('')
  syncIngredientScroll()
}

function syncIngredientScroll() {
  $('ingredient-line-numbers').style.transform = `translateY(-${$('ingredients').scrollTop}px)`
}

$('recipe-form').addEventListener('submit', (event) => {
  event.preventDefault()
  saveToLibrary()
  renderTable()
  setMobileEditorOpen(false)
})

;['title', 'note'].forEach((id) => $(id).addEventListener('input', () => {
  saveDraft()
  renderTable()
}))

$('ingredients').addEventListener('input', () => {
  actions = sanitizeActions(actions)
  updateIngredientLineNumbers()
  renderActionBuilder()
  saveDraft()
  renderTable()
})
$('ingredients').addEventListener('scroll', syncIngredientScroll)

$('add-action').addEventListener('click', () => {
  const action = makeAction()
  actions.push(action)
  expandedActionId = action.id
  renderActionBuilder()
  saveDraft()
  requestAnimationFrame(() => {
    const card = document.querySelector(`[data-action-card="${actions.at(-1).id}"]`)
    card?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    card?.querySelector('.action-text-input')?.focus()
  })
})

$('action-list').addEventListener('input', (event) => {
  const field = event.target.dataset.field
  const actionId = event.target.dataset.actionId
  if (!field || !actionId) return
  updateAction(actionId, (action) => { action[field] = event.target.value })
})

$('action-list').addEventListener('change', (event) => {
  const actionId = event.target.dataset.actionId
  if (!actionId) return
  if (event.target.matches('.action-ingredient')) {
    const line = Number(event.target.dataset.line)
    updateAction(actionId, (action) => {
      action.ingredientLines = event.target.checked
        ? [...action.ingredientLines, line]
        : action.ingredientLines.filter((candidate) => candidate !== line)
    })
    renderActionBuilder()
  }
  if (event.target.matches('.action-source')) {
    const sourceId = event.target.dataset.sourceId
    updateAction(actionId, (action) => {
      action.sourceIds = event.target.checked
        ? [...action.sourceIds, sourceId]
        : action.sourceIds.filter((candidate) => candidate !== sourceId)
    })
    renderActionBuilder()
  }
  if (event.target.dataset.field === 'groupName' || event.target.dataset.field === 'text') renderActionBuilder()
})

$('action-list').addEventListener('click', (event) => {
  const button = event.target.closest('button[data-command]')
  if (!button) return
  event.preventDefault()
  event.stopPropagation()
  const { command, actionId } = button.dataset
  if (command === 'add-empty-action') {
    const action = makeAction()
    actions.push(action)
    expandedActionId = action.id
    renderActionBuilder()
    saveDraft()
  }
  if (command === 'move-up') moveAction(actionId, -1)
  if (command === 'move-down') moveAction(actionId, 1)
  if (command === 'remove') {
    actions = actions.filter((action) => action.id !== actionId)
      .map((action) => ({ ...action, sourceIds: action.sourceIds.filter((sourceId) => sourceId !== actionId) }))
    if (expandedActionId === actionId) expandedActionId = null
    renderActionBuilder()
    saveDraft()
    renderTable()
  }
})

$('action-list').addEventListener('toggle', (event) => {
  const details = event.target.closest('details[data-action-card]')
  if (!details) return
  const actionId = details.dataset.actionCard
  if (details.open) {
    expandedActionId = actionId
    document.querySelectorAll('details[data-action-card]').forEach((candidate) => {
      if (candidate !== details) candidate.open = false
    })
  } else if (expandedActionId === actionId) {
    expandedActionId = null
  }
}, true)

$('print3d-button').addEventListener('click', openStlPreview)
$('print3d-dialog').addEventListener('close', () => {
  stlGenerationToken += 1
  disposeStlPreview()
  clearModelDownloads()
})
;['download-stl', 'download-3mf'].forEach((id) => {
  $(id).addEventListener('click', (event) => {
    if (event.currentTarget.getAttribute('aria-disabled') === 'true') event.preventDefault()
  })
})
$('print-button').addEventListener('click', () => window.print())
$('fullscreen-button').addEventListener('click', openRecipeFullscreen)
$('table-wrap').addEventListener('click', (event) => {
  if (event.target.closest('[data-fullscreen-command="exit"]')) closeRecipeFullscreen()
})
document.addEventListener('fullscreenchange', updateRecipeFullscreenState)
document.addEventListener('webkitfullscreenchange', updateRecipeFullscreenState)
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && $('table-wrap').classList.contains('is-fullscreen-fallback')) {
    closeRecipeFullscreen()
  }
})
$('copy-table-png').addEventListener('click', copyRecipeTablePng)
$('submit-recipe').addEventListener('click', submitRecipeForInclusion)
$('export-current-recipe').addEventListener('click', exportCurrentRecipe)
$('export-all-recipes').addEventListener('click', exportAllRecipes)
$('import-recipe').addEventListener('click', () => $('recipe-import-file').click())
$('new-recipe').addEventListener('click', startNewRecipe)
$('recipe-import-file').addEventListener('change', async (event) => {
  await importRecipeFile(event.target.files?.[0])
  event.target.value = ''
})
$('library-search').addEventListener('input', renderRecipeCards)

function openShelfRecipe(recipeId) {
  const recipe = getLibrary().find((saved) => saved.id === recipeId)
  if (!recipe) return
  activeRecipeId = recipe.id
  loadRecipeIntoEditor(recipe)
  saveDraft()
  renderRecipeCards()
  closeMobileLibrary()
  setMobileEditorOpen(false)
}

$('recipe-cards').addEventListener('click', (event) => {
  const recipes = getLibrary()
  const deleteButton = event.target.closest('button[data-action="delete"]')
  if (deleteButton) {
    const recipe = recipes.find((saved) => saved.id === deleteButton.dataset.id)
    if (!recipe || !window.confirm(`Delete "${recipe.title}"?`)) return
    saveLibrary(recipes.filter((saved) => saved.id !== deleteButton.dataset.id))
    if (activeRecipeId === deleteButton.dataset.id) activeRecipeId = null
    renderRecipeCards()
    return
  }

  const card = event.target.closest('.recipe-card[data-id]')
  if (card) openShelfRecipe(card.dataset.id)
})

$('recipe-cards').addEventListener('keydown', (event) => {
  if (!['Enter', ' '].includes(event.key) || event.target.closest('button')) return
  const card = event.target.closest('.recipe-card[data-id]')
  if (!card) return
  event.preventDefault()
  openShelfRecipe(card.dataset.id)
})

let initialRecipe = demo
let restoredDraftHasIdentity = false
let restoredActiveRecipeId = null
try {
  const savedDraft = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
  if (savedDraft) {
    initialRecipe = normalizeRecipe(savedDraft)
    restoredDraftHasIdentity = Object.prototype.hasOwnProperty.call(savedDraft, 'activeRecipeId')
    restoredActiveRecipeId = savedDraft.activeRecipeId || null
  }
} catch {
  localStorage.removeItem(STORAGE_KEY)
}

let savedLibrary = getLibrary()
const restoredStandaloneDraft = initialRecipe !== demo && savedLibrary.length === 0
if (restoredStandaloneDraft) {
  if (restoredDraftHasIdentity && !restoredActiveRecipeId) {
    activeRecipeId = null
  } else {
    activeRecipeId = restoredActiveRecipeId || `migrated-${Date.now()}`
    savedLibrary = [{ ...initialRecipe, id: activeRecipeId, updatedAt: Date.now() }]
    saveLibrary(savedLibrary)
  }
}

savedLibrary = seedLibraryWithBuiltIns(savedLibrary)
if (!restoredStandaloneDraft && savedLibrary.length) {
  if (restoredDraftHasIdentity) {
    activeRecipeId = savedLibrary.some((recipe) => recipe.id === restoredActiveRecipeId)
      ? restoredActiveRecipeId
      : null
  } else {
    const matchingRecipe = savedLibrary.find((recipe) =>
      recipe.title === initialRecipe.title
      && recipe.ingredients === initialRecipe.ingredients
      && JSON.stringify(recipe.actions) === JSON.stringify(initialRecipe.actions))
    activeRecipeId = matchingRecipe?.id || savedLibrary[0].id
  }
}

loadRecipeIntoEditor(initialRecipe)
saveDraft()
renderRecipeCards()
setupMobileLayout()
