import type {
  AuthToken,
  Category,
  Item,
  ItemListQuery,
  ItemStats,
  Paginated,
  User,
} from './types'

export class ApiError extends Error {
  status: number
  body: string

  constructor(status: number, body: string) {
    super(`ApiError ${status}: ${body}`)
    this.status = status
    this.body = body
  }
}

export interface ApiClient {
  baseUrl: string
  accessToken: string | null
  setAccessToken(token: string | null): void

  getRoot(): Promise<unknown>
  getHealth(): Promise<unknown>
  register(email: string, password: string): Promise<User>
  login(email: string, password: string): Promise<AuthToken>
  getMe(): Promise<User>

  listCategories(skip?: number, limit?: number): Promise<Paginated<Category>>
  getCategory(id: number): Promise<Category>
  createCategory(body: { name: string; description?: string | null }): Promise<Category>
  updateCategory(id: number, body: { name?: string; description?: string | null }): Promise<Category>
  deleteCategory(id: number): Promise<void>

  listItems(query?: ItemListQuery): Promise<Paginated<Item>>
  getItemStats(): Promise<ItemStats>
  getItem(id: number): Promise<Item>
  createItem(body: Record<string, unknown>): Promise<Item>
  updateItem(id: number, body: Record<string, unknown>): Promise<Item>
  deleteItem(id: number): Promise<void>
}

function normalizeBase(baseUrl: string) {
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
}

async function parseJson<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T
  if (!res.ok) throw new ApiError(res.status, await res.text())
  return res.json() as Promise<T>
}

export function createHttpClient(baseUrl: string, accessToken: string | null = null): ApiClient {
  const state = { baseUrl: normalizeBase(baseUrl), accessToken }

  const headers = (auth = false, json = true): HeadersInit => {
    const h: Record<string, string> = { Accept: 'application/json' }
    if (json) h['Content-Type'] = 'application/json'
    if (auth && state.accessToken) h.Authorization = `Bearer ${state.accessToken}`
    return h
  }

  const url = (path: string, query?: Record<string, string | number | undefined>) => {
    const u = new URL(`${state.baseUrl}${path}`)
    if (query) {
      Object.entries(query).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') u.searchParams.set(k, String(v))
      })
    }
    return u.toString()
  }

  return {
    get baseUrl() {
      return state.baseUrl
    },
    get accessToken() {
      return state.accessToken
    },
    setAccessToken(token) {
      state.accessToken = token
    },

    getRoot: () => fetch(url('/'), { headers: headers(false, false) }).then(parseJson),
    getHealth: () => fetch(url('/health'), { headers: headers(false, false) }).then(parseJson),

    register: (email, password) =>
      fetch(url('/auth/register'), {
        method: 'POST',
        headers: headers(false),
        body: JSON.stringify({ email, password }),
      }).then((res) => parseJson<User>(res)),

    login: (email, password) => {
      const body = new URLSearchParams({ username: email, password })
      return fetch(url('/auth/login'), {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      }).then((res) => parseJson<AuthToken>(res))
    },

    getMe: () => fetch(url('/auth/me'), { headers: headers(true, false) }).then((res) => parseJson<User>(res)),

    listCategories: (skip = 0, limit = 50) =>
      fetch(url('/categories', { skip, limit }), { headers: headers(false, false) }).then((res) =>
        parseJson<Paginated<Category>>(res),
      ),

    getCategory: (id) =>
      fetch(url(`/categories/${id}`), { headers: headers(false, false) }).then((res) => parseJson<Category>(res)),

    createCategory: (body) =>
      fetch(url('/categories'), { method: 'POST', headers: headers(true), body: JSON.stringify(body) }).then((res) =>
        parseJson<Category>(res),
      ),

    updateCategory: (id, body) =>
      fetch(url(`/categories/${id}`), { method: 'PATCH', headers: headers(true), body: JSON.stringify(body) }).then(
        (res) => parseJson<Category>(res),
      ),

    deleteCategory: (id) =>
      fetch(url(`/categories/${id}`), { method: 'DELETE', headers: headers(true) }).then(() => undefined),

    listItems: (query = {}) =>
      fetch(
        url('/items', {
          skip: query.skip ?? 0,
          limit: query.limit ?? 20,
          category_id: query.category_id ?? undefined,
          name_contains: query.name_contains,
          min_price: query.min_price,
          max_price: query.max_price,
        }),
        { headers: headers(false, false) },
      ).then((res) => parseJson<Paginated<Item>>(res)),

    getItemStats: () =>
      fetch(url('/items/stats/summary'), { headers: headers(false, false) }).then((res) => parseJson<ItemStats>(res)),

    getItem: (id) => fetch(url(`/items/${id}`), { headers: headers(false, false) }).then((res) => parseJson<Item>(res)),

    createItem: (body) =>
      fetch(url('/items'), { method: 'POST', headers: headers(true), body: JSON.stringify(body) }).then((res) =>
        parseJson<Item>(res),
      ),

    updateItem: (id, body) =>
      fetch(url(`/items/${id}`), { method: 'PATCH', headers: headers(true), body: JSON.stringify(body) }).then((res) =>
        parseJson<Item>(res),
      ),

    deleteItem: (id) => fetch(url(`/items/${id}`), { method: 'DELETE', headers: headers(true) }).then(() => undefined),
  }
}
