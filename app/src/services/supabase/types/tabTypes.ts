import type { QueryData } from '@supabase/supabase-js'
import type {
  tabsQuery,
  tabQuery,
  userTabsQuery,
  openTabsQuery,
} from '../queries/tabQueries'

export type Tab = QueryData<ReturnType<typeof tabQuery>> & {
  remaining_balance?: number
  total_paid?: number
}
export type Tabs = (QueryData<ReturnType<typeof tabsQuery>>[number] & {
  remaining_balance?: number
  total_paid?: number
})[]
export type UserTabs = QueryData<ReturnType<typeof userTabsQuery>>
export type OpenTabs = (QueryData<ReturnType<typeof openTabsQuery>>[number] & {
  remaining_balance?: number
  total_paid?: number
})[]

export type TabItem = {
  id: number
  tab_id: number
  menu_item_id: number
  quantity: number
  unit_price: number
  item_total: number
  special_instructions: string | null
  created_at: string
  updated_at: string
  menu_item?: {
    name: string
  }
}

export type TabItems = TabItem[]

export type TabSplit = {
  id: number
  tab_id: number
  split_number: number
  items_included: string[]
  subtotal: number
  tax_on_split: number
  total_owed: number
  amount_paid: number
  tip_amount: number | null
  status: 'pending' | 'settled'
  created_at: string
  updated_at: string
  settled_at: string | null
  split_type?: 'equal' | 'itemized'
}

export type TabSplits = TabSplit[]

// Add these to Tab definition if possible, or extend it
// Since Tab is QueryData, we can't easily extend it without modifying the query or intersection.
// For now, let's just cheat and add them to the interface if we were defining it manually,
// but since it's inferred, we might need a separate type or just use the inferred one and intersection.

// Actually, looking at lines 9-10:
// export type Tab = QueryData<ReturnType<typeof tabQuery>>
// We can intersect it.

export type TabWithTotals = Tab & {
  remaining_balance?: number
  total_paid?: number
}

// ... existing code ...

export type TabPayment = {
  id: number
  tab_id: number
  split_id: number | null
  amount_paid: number
  tip_added: number | null
  payment_method: 'cash' | 'card' | 'mobile' | 'mixed'
  status: 'pending' | 'completed' | 'failed'
  created_at: string
}

export type TabPayments = TabPayment[]

// Add these to tabTypes.ts
export type TabInsert = {
  user_id: string
  bar_id: number
  tab_number: string
  status?: string
  subtotal?: number
  tax_amount?: number
  tip_amount?: number
  total_owed?: number
  // add other table columns here
}

export type TabItemInsert = Omit<TabItem, 'id' | 'created_at' | 'updated_at'>
export type TabSplitInsert = Omit<TabSplit, 'id' | 'created_at' | 'updated_at'>
export type TabPaymentInsert = Omit<TabPayment, 'id' | 'created_at'>

// Enums for status values
export enum TabStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  SETTLED = 'settled',
  SPLIT = 'split'
}

export enum TabSplitStatus {
  PENDING = 'pending',
  SETTLED = 'settled'
}

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  MOBILE = 'mobile',
  MIXED = 'mixed'
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed'
}
