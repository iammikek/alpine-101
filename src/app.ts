import type { ApiClient } from './api/client'
import { createHttpClient } from './api/client'
import { createMockClient } from './api/mock'
import type { Category, Item, ItemStats, User } from './api/types'

const TOKEN_KEY = 'alpine-101-token'

export type RouteName =
  | 'home'
  | 'items'
  | 'item-create'
  | 'item-detail'
  | 'item-edit'
  | 'categories'
  | 'category-create'
  | 'category-detail'
  | 'category-edit'
  | 'stats'
  | 'login'
  | 'settings'
  | 'not-found'

export interface Route {
  name: RouteName
  id?: number
}

function parseRoute(hash: string): Route {
  const path = hash.replace(/^#/, '') || '/'
  const parts = path.split('/').filter(Boolean)

  if (parts.length === 0) return { name: 'home' }
  if (parts[0] === 'login') return { name: 'login' }
  if (parts[0] === 'settings') return { name: 'settings' }
  if (parts[0] === 'stats') return { name: 'stats' }

  if (parts[0] === 'items') {
    if (parts.length === 1) return { name: 'items' }
    if (parts[1] === 'new') return { name: 'item-create' }
    const id = Number(parts[1])
    if (!Number.isFinite(id)) return { name: 'not-found' }
    if (parts[2] === 'edit') return { name: 'item-edit', id }
    if (parts.length === 2) return { name: 'item-detail', id }
    return { name: 'not-found' }
  }

  if (parts[0] === 'categories') {
    if (parts.length === 1) return { name: 'categories' }
    if (parts[1] === 'new') return { name: 'category-create' }
    const id = Number(parts[1])
    if (!Number.isFinite(id)) return { name: 'not-found' }
    if (parts[2] === 'edit') return { name: 'category-edit', id }
    if (parts.length === 2) return { name: 'category-detail', id }
    return { name: 'not-found' }
  }

  return { name: 'not-found' }
}

function money(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return '—'
  return `$${value.toFixed(2)}`
}

export function app() {
  return {
    route: { name: 'home' } as Route,
    baseUrl: import.meta.env.VITE_BASE_URL ?? 'http://localhost:8000',
    useMock: (import.meta.env.VITE_USE_MOCK ?? 'true') === 'true',
    api: null as ApiClient | null,

    accessToken: null as string | null,
    user: null as User | null,
    authLoading: false,
    authError: null as string | null,
    registerMode: false,
    loginEmail: '',
    loginPassword: '',

    items: [] as Item[],
    itemsTotal: 0,
    itemsSkip: 0,
    itemsLimit: 20,
    itemsLoading: false,
    itemsError: null as string | null,
    nameContains: '',
    categoryFilter: '' as string | number | '',
    minPrice: '',
    maxPrice: '',

    categories: [] as Category[],
    categoriesLoading: false,
    categoriesError: null as string | null,

    currentItem: null as Item | null,
    currentCategory: null as Category | null,
    detailError: null as string | null,
    stats: null as ItemStats | null,

    itemForm: {
      name: '',
      price: '',
      description: '',
      category_id: '' as string | number | '',
    },
    categoryForm: {
      name: '',
      description: '',
    },
    formError: null as string | null,
    formSaving: false,

    get isAuthenticated() {
      return !!this.accessToken
    },
    get canWrite() {
      return this.isAuthenticated || this.useMock
    },
    get hasMoreItems() {
      return this.itemsSkip + this.items.length < this.itemsTotal
    },
    get modeLabel() {
      return this.useMock ? 'Mock' : 'Live'
    },

    money,

    init() {
      const saved = localStorage.getItem(TOKEN_KEY)
      this.accessToken = saved
      this.rebuildClient()
      this.syncRoute()
      window.addEventListener('hashchange', () => this.syncRoute())
      if (!window.location.hash || window.location.hash === '#') {
        window.location.hash = '#/items'
      }
    },

    rebuildClient() {
      this.api = this.useMock
        ? createMockClient(this.baseUrl)
        : createHttpClient(this.baseUrl, this.accessToken)
      this.api.setAccessToken(this.accessToken)
    },

    navigate(path: string) {
      window.location.hash = path.startsWith('#') ? path : `#${path}`
    },

    async syncRoute() {
      this.route = parseRoute(window.location.hash)
      this.formError = null
      this.detailError = null

      if (this.route.name === 'home') {
        this.navigate('/items')
        return
      }

      try {
        switch (this.route.name) {
          case 'items':
            await this.loadCategories()
            await this.refreshItems()
            break
          case 'item-create':
            await this.loadCategories()
            this.resetItemForm()
            break
          case 'item-edit':
            await this.loadCategories()
            await this.loadItemForm(this.route.id!)
            break
          case 'item-detail':
            await this.loadItemDetail(this.route.id!)
            break
          case 'categories':
            await this.loadCategories()
            break
          case 'category-create':
            this.resetCategoryForm()
            break
          case 'category-edit':
            await this.loadCategoryForm(this.route.id!)
            break
          case 'category-detail':
            await this.loadCategoryDetail(this.route.id!)
            break
          case 'stats':
            await this.loadStats()
            break
          default:
            break
        }
      } catch (e) {
        this.detailError = String(e)
      }
    },

    applyToken(token: string | null) {
      this.accessToken = token
      if (token) localStorage.setItem(TOKEN_KEY, token)
      else localStorage.removeItem(TOKEN_KEY)
      this.rebuildClient()
    },

    async login() {
      if (!this.api) return
      this.authLoading = true
      this.authError = null
      try {
        const token = await this.api.login(this.loginEmail.trim(), this.loginPassword)
        this.applyToken(token.access_token)
        this.user = await this.api.getMe()
        this.navigate('/items')
      } catch (e) {
        this.authError = String(e)
      } finally {
        this.authLoading = false
      }
    },

    async register() {
      if (!this.api) return
      this.authLoading = true
      this.authError = null
      try {
        this.user = await this.api.register(this.loginEmail.trim(), this.loginPassword)
        const token = await this.api.login(this.loginEmail.trim(), this.loginPassword)
        this.applyToken(token.access_token)
        this.navigate('/items')
      } catch (e) {
        this.authError = String(e)
      } finally {
        this.authLoading = false
      }
    },

    async submitAuth() {
      if (this.registerMode) await this.register()
      else await this.login()
    },

    logout() {
      this.user = null
      this.applyToken(null)
      this.authError = null
    },

    async loadCategories() {
      if (!this.api) return
      this.categoriesLoading = true
      this.categoriesError = null
      try {
        const page = await this.api.listCategories(0, 100)
        this.categories = page.items
      } catch (e) {
        this.categoriesError = String(e)
        this.categories = []
      } finally {
        this.categoriesLoading = false
      }
    },

    async refreshItems() {
      this.itemsSkip = 0
      await this.loadItems(false)
    },

    async loadMoreItems() {
      if (!this.hasMoreItems || this.itemsLoading) return
      this.itemsSkip += this.itemsLimit
      await this.loadItems(true)
    },

    async loadItems(append: boolean) {
      if (!this.api) return
      this.itemsLoading = true
      if (!append) this.itemsError = null
      try {
        const page = await this.api.listItems({
          skip: this.itemsSkip,
          limit: this.itemsLimit,
          category_id: this.categoryFilter === '' ? null : Number(this.categoryFilter),
          name_contains: this.nameContains.trim() || undefined,
          min_price: this.minPrice === '' ? undefined : Number(this.minPrice),
          max_price: this.maxPrice === '' ? undefined : Number(this.maxPrice),
        })
        this.items = append ? [...this.items, ...page.items] : page.items
        this.itemsTotal = page.total
      } catch (e) {
        this.itemsError = String(e)
        if (!append) this.items = []
      } finally {
        this.itemsLoading = false
      }
    },

    applyItemFilters() {
      this.refreshItems()
    },

    async loadItemDetail(id: number) {
      if (!this.api) return
      this.currentItem = null
      this.detailError = null
      try {
        this.currentItem = await this.api.getItem(id)
      } catch (e) {
        this.detailError = String(e)
      }
    },

    resetItemForm() {
      this.itemForm = { name: '', price: '', description: '', category_id: '' }
      this.formError = null
    },

    async loadItemForm(id: number) {
      if (!this.api) return
      const item = await this.api.getItem(id)
      this.itemForm = {
        name: item.name,
        price: String(item.price),
        description: item.description ?? '',
        category_id: item.category_id ?? '',
      }
    },

    async submitItemForm() {
      if (!this.api) return
      this.formSaving = true
      this.formError = null
      const body = {
        name: this.itemForm.name.trim(),
        price: Number(this.itemForm.price),
        description: this.itemForm.description.trim() || null,
        category_id: this.itemForm.category_id === '' ? null : Number(this.itemForm.category_id),
      }
      try {
        if (this.route.name === 'item-edit' && this.route.id != null) {
          await this.api.updateItem(this.route.id, body)
          this.navigate(`/items/${this.route.id}`)
        } else {
          await this.api.createItem(body)
          this.navigate('/items')
        }
      } catch (e) {
        this.formError = String(e)
      } finally {
        this.formSaving = false
      }
    },

    async deleteItem(id: number) {
      if (!this.api || !confirm('Delete this item?')) return
      try {
        await this.api.deleteItem(id)
        this.navigate('/items')
      } catch (e) {
        this.detailError = String(e)
      }
    },

    async loadCategoryDetail(id: number) {
      if (!this.api) return
      this.currentCategory = null
      this.detailError = null
      try {
        this.currentCategory = await this.api.getCategory(id)
      } catch (e) {
        this.detailError = String(e)
      }
    },

    resetCategoryForm() {
      this.categoryForm = { name: '', description: '' }
      this.formError = null
    },

    async loadCategoryForm(id: number) {
      if (!this.api) return
      const category = await this.api.getCategory(id)
      this.categoryForm = {
        name: category.name,
        description: category.description ?? '',
      }
    },

    async submitCategoryForm() {
      if (!this.api) return
      this.formSaving = true
      this.formError = null
      const name = this.categoryForm.name.trim()
      const description = this.categoryForm.description.trim() || null
      try {
        if (this.route.name === 'category-edit' && this.route.id != null) {
          await this.api.updateCategory(this.route.id, { name, description })
          this.navigate(`/categories/${this.route.id}`)
        } else {
          await this.api.createCategory({ name, description })
          this.navigate('/categories')
        }
      } catch (e) {
        this.formError = String(e)
      } finally {
        this.formSaving = false
      }
    },

    async deleteCategory(id: number) {
      if (!this.api || !confirm('Delete this category?')) return
      try {
        await this.api.deleteCategory(id)
        this.navigate('/categories')
      } catch (e) {
        this.detailError = String(e)
      }
    },

    async loadStats() {
      if (!this.api) return
      this.stats = await this.api.getItemStats()
    },

    onMockToggle(event: Event) {
      const checked = (event.target as HTMLInputElement).checked
      this.useMock = checked
      this.rebuildClient()
    },

    saveSettings() {
      this.rebuildClient()
    },

    isActive(prefix: string) {
      const path = (window.location.hash.replace(/^#/, '') || '/').split('?')[0]
      if (prefix === '/items') return path === '/items' || path.startsWith('/items/')
      if (prefix === '/categories') return path === '/categories' || path.startsWith('/categories/')
      return path === prefix || path.startsWith(`${prefix}/`)
    },
  }
}

export type AppState = ReturnType<typeof app>
