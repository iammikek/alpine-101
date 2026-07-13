import type { ApiClient } from './client'
import type { Category, Item, ItemStats, Paginated, User } from './types'

let nextItemId = 4
let nextCategoryId = 3
let nextUserId = 1

const categories: Category[] = [
  { id: 1, name: 'Tools', description: 'Hand and power tools' },
  { id: 2, name: 'Books', description: 'Paperbacks and hardcovers' },
]

const items: Item[] = [
  { id: 1, name: 'Widget', description: 'A useful widget', price: 9.99, category_id: 1, category: categories[0] },
  { id: 2, name: 'Gadget', description: 'Handy gadget', price: 19.5, category_id: 1, category: categories[0] },
  { id: 3, name: 'Novel', description: 'A good read', price: 3.25, category_id: 2, category: categories[1] },
]

let currentUser: User | null = null

const delay = () => new Promise((r) => setTimeout(r, 120))

function paginate<T>(rows: T[], skip: number, limit: number): Paginated<T> {
  const slice = rows.slice(skip, skip + limit)
  return { items: slice, total: rows.length, skip, limit }
}

function findCategory(id: number | null | undefined) {
  if (id == null) return null
  return categories.find((c) => c.id === id) ?? null
}

export function createMockClient(baseUrl = 'http://localhost:8000'): ApiClient {
  let accessToken: string | null = 'mock-token'

  return {
    baseUrl,
    get accessToken() {
      return accessToken
    },
    setAccessToken(token) {
      accessToken = token
    },

    async getRoot() {
      await delay()
      return { message: 'Hello from mock' }
    },
    async getHealth() {
      await delay()
      return { status: 'ok' }
    },
    async register(email, _password: string) {
      await delay()
      currentUser = { id: nextUserId++, email }
      accessToken = 'mock-token'
      return currentUser
    },
    async login(email, _password: string) {
      await delay()
      currentUser = { id: nextUserId, email }
      accessToken = 'mock-token'
      return { access_token: 'mock-token', token_type: 'bearer' }
    },
    async getMe() {
      await delay()
      if (!currentUser) throw new Error('Not authenticated')
      return currentUser
    },

    async listCategories(skip = 0, limit = 50) {
      await delay()
      return paginate(categories, skip, limit)
    },
    async getCategory(id) {
      await delay()
      return categories.find((c) => c.id === id)!
    },
    async createCategory(body) {
      await delay()
      const created = { id: nextCategoryId++, name: body.name, description: body.description ?? null }
      categories.push(created)
      return created
    },
    async updateCategory(id, body) {
      await delay()
      const idx = categories.findIndex((c) => c.id === id)
      categories[idx] = { ...categories[idx], ...body, name: body.name ?? categories[idx].name }
      return categories[idx]
    },
    async deleteCategory(id) {
      await delay()
      const idx = categories.findIndex((c) => c.id === id)
      if (idx >= 0) categories.splice(idx, 1)
      items.forEach((item, i) => {
        if (item.category_id === id) items[i] = { ...item, category_id: null, category: null }
      })
    },

    async listItems(query = {}) {
      await delay()
      let filtered = [...items]
      if (query.category_id) filtered = filtered.filter((i) => i.category_id === query.category_id)
      if (query.name_contains) {
        const needle = query.name_contains.toLowerCase()
        filtered = filtered.filter((i) => i.name.toLowerCase().includes(needle))
      }
      if (query.min_price != null) filtered = filtered.filter((i) => i.price >= query.min_price!)
      if (query.max_price != null) filtered = filtered.filter((i) => i.price <= query.max_price!)
      return paginate(filtered, query.skip ?? 0, query.limit ?? 20)
    },
    async getItemStats(): Promise<ItemStats> {
      await delay()
      if (!items.length) {
        return { total_items: 0, average_price: 0, min_price: null, max_price: null, uncategorized_count: 0, by_category: [] }
      }
      const prices = items.map((i) => i.price)
      const byCategory = categories
        .map((c) => {
          const inCat = items.filter((i) => i.category_id === c.id)
          if (!inCat.length) return null
          return {
            category_id: c.id,
            category_name: c.name,
            item_count: inCat.length,
            average_price: inCat.reduce((s, i) => s + i.price, 0) / inCat.length,
          }
        })
        .filter(Boolean) as ItemStats['by_category']
      return {
        total_items: items.length,
        average_price: prices.reduce((a, b) => a + b, 0) / prices.length,
        min_price: Math.min(...prices),
        max_price: Math.max(...prices),
        uncategorized_count: items.filter((i) => i.category_id == null).length,
        by_category: byCategory,
      }
    },
    async getItem(id) {
      await delay()
      return items.find((i) => i.id === id)!
    },
    async createItem(body) {
      await delay()
      const categoryId = (body.category_id as number | null | undefined) ?? null
      const created: Item = {
        id: nextItemId++,
        name: String(body.name),
        description: (body.description as string | null | undefined) ?? null,
        price: Number(body.price),
        category_id: categoryId,
        category: findCategory(categoryId),
      }
      items.push(created)
      return created
    },
    async updateItem(id, body) {
      await delay()
      const idx = items.findIndex((i) => i.id === id)
      const categoryId = (body.category_id as number | null | undefined) ?? items[idx].category_id
      items[idx] = {
        ...items[idx],
        name: String(body.name ?? items[idx].name),
        description: (body.description as string | null | undefined) ?? items[idx].description,
        price: Number(body.price ?? items[idx].price),
        category_id: categoryId,
        category: findCategory(categoryId),
      }
      return items[idx]
    },
    async deleteItem(id) {
      await delay()
      const idx = items.findIndex((i) => i.id === id)
      if (idx >= 0) items.splice(idx, 1)
    },
  }
}
