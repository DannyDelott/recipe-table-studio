import './style.css'
import { getConnectorSpan, getTableBoundaryRows } from './table-layout.js'
import {
  createRecipeArchive,
  createRecipeFile,
  mergeRecipeIntoLibrary,
  parseRecipeFile,
  recipeFileStem,
} from './recipe-backup.js'
import { createRecipeStl } from './recipe-stl.js'

const STORAGE_KEY = 'recipe-table-studio'
const LIBRARY_KEY = 'recipe-table-studio-library'
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
        <div id="recipe-cards" class="recipe-cards list"></div>
      </section>

      <section class="studio-grid">
        <aside class="editor-panel">
        <div class="panel-heading">
          <div><h2>Build</h2></div>
        </div>
        <form id="recipe-form">
          <label>Recipe name<input id="title" name="title" value="${demo.title}" /></label>
          <label>Opening note <span class="optional">optional</span><input id="note" name="note" value="${demo.note}" /></label>
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
          <span class="print3d-eyebrow">Printable recipe card</span>
          <h2 id="print3d-title">3D Print</h2>
        </div>
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
          <span>Print setup</span>
          <strong>Face up · no supports</strong>
        </div>
      </div>

      <div class="modal-action print3d-actions">
        <form method="dialog">
          <button class="btn btn-outline btn-sm section-action" type="submit">Close</button>
        </form>
        <a class="btn btn-sm section-action download-stl is-disabled" id="download-stl" aria-disabled="true">
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M12 4v12M7 11l5 5 5-5"></path>
            <path d="M5 14v6h14v-6"></path>
          </svg>
          Download STL
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
let stlDownloadUrl = null
let stlGenerationToken = 0
let stlLibrariesPromise = null

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

function clearStlDownload() {
  if (stlDownloadUrl) URL.revokeObjectURL(stlDownloadUrl)
  stlDownloadUrl = null
  const download = $('download-stl')
  download.removeAttribute('href')
  download.removeAttribute('download')
  download.setAttribute('aria-disabled', 'true')
  download.classList.add('is-disabled')
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
    ]).then(([THREE, { OrbitControls }, { STLLoader }]) => ({ THREE, OrbitControls, STLLoader }))
  }
  return stlLibrariesPromise
}

function renderStlPreview(buffer, libraries) {
  disposeStlPreview()
  const { THREE, OrbitControls, STLLoader } = libraries
  const stage = $('print3d-preview-stage')
  const geometry = new STLLoader().parse(buffer)
  geometry.computeVertexNormals()
  geometry.computeBoundingBox()

  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#eef2e8')
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 1000)
  camera.up.set(0, 0, 1)
  camera.position.set(0, -190, 155)

  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap
  stage.prepend(renderer.domElement)

  const material = new THREE.MeshStandardMaterial({
    color: '#a9d687',
    roughness: 0.72,
    metalness: 0.02,
  })
  const card = new THREE.Mesh(geometry, material)
  card.castShadow = true
  card.receiveShadow = true
  scene.add(card)

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(320, 240),
    new THREE.ShadowMaterial({ color: '#19342c', opacity: 0.13 }),
  )
  ground.position.z = -0.3
  ground.receiveShadow = true
  scene.add(ground)

  scene.add(new THREE.HemisphereLight('#ffffff', '#b6c3b7', 2.25))
  const keyLight = new THREE.DirectionalLight('#fff8e8', 3.4)
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
  controls.minDistance = 120
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
    geometry.dispose()
    material.dispose()
    ground.geometry.dispose()
    ground.material.dispose()
    renderer.dispose()
  }
}

async function openStlPreview() {
  const recipe = recipeFromFields()
  const dialog = $('print3d-dialog')
  const token = ++stlGenerationToken

  clearStlDownload()
  disposeStlPreview()
  $('print3d-title').textContent = `${recipe.title} · 3D Print`
  $('print3d-model-name').textContent = recipe.title
  $('print3d-model-size').textContent = '—'
  setStlPreviewStatus('Building your printable card…')
  dialog.showModal()

  await new Promise((resolve) => requestAnimationFrame(resolve))
  if (token !== stlGenerationToken || !dialog.open) return

  try {
    const librariesPromise = loadStlLibraries()
    const { buffer, metadata } = createRecipeStl(recipe)
    const libraries = await librariesPromise
    if (token !== stlGenerationToken || !dialog.open) return
    stlDownloadUrl = URL.createObjectURL(new Blob([buffer], { type: 'model/stl' }))
    const download = $('download-stl')
    download.href = stlDownloadUrl
    download.download = `${recipeFileStem(recipe.title)}-recipe-card.stl`
    download.setAttribute('aria-disabled', 'false')
    download.classList.remove('is-disabled')
    $('print3d-model-size').textContent = `${metadata.widthMm.toFixed(0)} × ${metadata.heightMm.toFixed(0)} × ${metadata.depthMm.toFixed(1)} mm`
    renderStlPreview(buffer, libraries)
    setStlPreviewStatus('Drag to rotate · scroll to zoom', 'ready')
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

  const totalActionColumns = Math.max(columnCount, 1)
  const colgroup = `<colgroup><col style="width:26%">${Array.from({ length: totalActionColumns }, () => '<col>').join('')}</colgroup>`
  const boundaryRows = getTableBoundaryRows({ actionColumns, ingredientCount: ingredients.length })
  const rows = ingredients.map((ingredient, row) => {
    let cells = `<td class="ingredient-cell">${compact ? '' : escapeHtml(ingredient.text)}</td>`
    if (!columnCount) return `<tr>${cells}<td class="blank-cell"></td></tr>`

    let column = 0
    while (column < columnCount) {
      const columnNodes = actionColumns[column]
      const node = columnNodes.find((candidate) => candidate.start - 1 === row)
      if (node) {
        cells += `<td class="action-cell join-left" rowspan="${node.end - node.start + 1}">${compact ? '' : escapeHtml(node.text)}</td>`
        column += 1
      } else if (!coverage[row][column] && (row === 0 || coverage[row - 1][column])) {
        const blankSpan = getConnectorSpan({
          row,
          column,
          ingredientCount: ingredients.length,
          columnCount,
          coverage,
          actionColumns,
        })

        let blankColumns = 1
        while (column + blankColumns < columnCount) {
          const nextColumn = column + blankColumns
          if (coverage[row][nextColumn]) break
          const nextBlankSpan = getConnectorSpan({
            row,
            column: nextColumn,
            ingredientCount: ingredients.length,
            columnCount,
            coverage,
            actionColumns,
          })
          if (nextBlankSpan !== blankSpan) break
          blankColumns += 1
        }

        const nextNode = actionColumns[column + blankColumns]?.find((candidate) => candidate.start - 1 <= row && candidate.end > row)
        cells += `<td class="blank-cell${nextNode ? ' righthide' : ''}" rowspan="${blankSpan}" colspan="${blankColumns}"></td>`
        column += blankColumns
      } else {
        column += 1
      }
    }
    return `<tr>${cells}</tr>`
  }).join('')

  return { colgroup, rows, totalActionColumns, boundaryRows }
}

function positionTableBoundaries() {
  const frame = $('table-wrap').querySelector('.table-frame')
  const table = frame?.querySelector('.recipe-table')
  if (!frame || !table) return

  const boundaries = [...frame.querySelectorAll('.table-boundary')]
  const frameTop = frame.getBoundingClientRect().top
  const tableRows = [...table.tBodies[0].rows]
  const headerRowCount = table.querySelector('.table-note') ? 2 : 1

  boundaries.forEach((boundary) => {
    const ingredientRow = tableRows[headerRowCount + Number(boundary.dataset.boundaryRow) - 1]
    if (!ingredientRow) return
    boundary.style.top = `${ingredientRow.getBoundingClientRect().bottom - frameTop - 1}px`
  })
}

function renderTable() {
  const title = $('title').value.trim() || 'Untitled recipe'
  const note = $('note').value.trim()
  const ingredients = getIngredients()
  if (!ingredients.length) {
    $('table-wrap').innerHTML = '<div class="empty-preview">Add ingredients to begin your recipe table.</div>'
    return
  }
  const { colgroup, rows, totalActionColumns, boundaryRows } = buildTableRows(ingredients, actions)
  $('table-wrap').innerHTML = `
    <div class="table-frame">
      <table class="recipe-table">
        ${colgroup}
        <tbody>
          <tr><th class="table-title" colspan="${totalActionColumns + 1}">${escapeHtml(title)}</th></tr>
          ${note ? `<tr><td class="table-note" colspan="${totalActionColumns + 1}">${escapeHtml(note)}</td></tr>` : ''}
          ${rows}
        </tbody>
      </table>
      ${boundaryRows.map((row) => `<span class="table-boundary" data-boundary-row="${row}" aria-hidden="true"></span>`).join('')}
    </div>
  `
  positionTableBoundaries()
}

window.addEventListener('resize', positionTableBoundaries)

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
  clearStlDownload()
})
$('download-stl').addEventListener('click', (event) => {
  if (event.currentTarget.getAttribute('aria-disabled') === 'true') event.preventDefault()
})
$('print-button').addEventListener('click', () => window.print())
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
saveLibrary(savedLibrary)
if (initialRecipe !== demo && savedLibrary.length === 0) {
  if (restoredDraftHasIdentity && !restoredActiveRecipeId) {
    activeRecipeId = null
  } else {
    activeRecipeId = restoredActiveRecipeId || `migrated-${Date.now()}`
    savedLibrary = [{ ...initialRecipe, id: activeRecipeId, updatedAt: Date.now() }]
    saveLibrary(savedLibrary)
  }
} else if (savedLibrary.length) {
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
