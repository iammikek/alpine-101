export interface Category {
  id: number
  name: string
  description: string | null
}

export interface Item {
  id: number
  name: string
  description: string | null
  price: number
  category_id: number | null
  category?: Category | null
}

export interface Paginated<T> {
  items: T[]
  total: number
  skip: number
  limit: number
}

export interface User {
  id: number
  email: string
}

export interface AuthToken {
  access_token: string
  token_type: string
}

export interface CategoryItemStats {
  category_id: number
  category_name: string
  item_count: number
  average_price: number
}

export interface ItemStats {
  total_items: number
  average_price: number
  min_price: number | null
  max_price: number | null
  uncategorized_count: number
  by_category: CategoryItemStats[]
}

export interface ItemListQuery {
  skip?: number
  limit?: number
  category_id?: number | null
  name_contains?: string
  min_price?: number
  max_price?: number
}
