// interfaces/TabInterfaces.ts

// Interface for creating a new tab with required fields and specific types
export interface CreateNewTab {
  tab_number: string // Auto-generated unique tab number
  user_id: string // ID of the user assigned to the tab
  bar_id?: string // Optional bar ID where tab is opened
  special_notes?: string // Optional special instructions or notes
  status?: 'open' | 'closed' | 'pending' // Tab status, defaults to 'open'
  subtotal?: number // Initial subtotal, defaults to 0
  tax_amount?: number // Tax amount, defaults to 0
  total_before_tip?: number // Total before tip, defaults to 0
  tip_amount?: number // Tip amount, defaults to 0
  total_owed?: number // Total amount owed, defaults to 0
  created_at?: string // Timestamp of tab creation
  updated_at?: string // Timestamp of last update
}

// Interface for tab data retrieved from the database
export interface Tab {
  id: string // Unique identifier for the tab
  tab_number: string // Auto-generated unique tab number
  user_id: string // ID of the user assigned to the tab
  bar_id: string | null // Bar ID where tab is opened (nullable)
  special_notes: string | null // Optional special instructions or notes
  status: 'open' | 'closed' | 'pending' // Current tab status
  subtotal: number // Current subtotal
  tax_amount: number // Tax amount
  total_before_tip: number // Total before tip
  tip_amount: number // Tip amount
  total_owed: number // Total amount owed
  created_at: string // Timestamp of tab creation
  updated_at: string // Timestamp of last update
}

// Interface for editing an existing tab
// Allows partial updates of Tab fields
export interface EditTab {
  id: string // Unique identifier for the tab
  data: Partial<Tab> // Partial allows optional updates to tab fields
}

// Interface for deleting a tab
export interface DeleteTab {
  id: string // ID of tab to delete
}

// Interface for adding items to a tab
export interface AddTabItem {
  tab_id: string // ID of the tab
  menu_item_id: string // ID of the menu item to add
  quantity: number // Quantity of the item
  special_instructions?: string // Optional special instructions for the item
  price_override?: number // Optional price override
}

// Interface for updating tab status
export interface UpdateTabStatus {
  id: string // ID of the tab
  status: 'open' | 'closed' | 'pending' // New status for the tab
}

// Interface for tab summary/analytics
export interface TabSummary {
  total_open_tabs: number
  total_revenue: number
  average_tab_total: number
  most_popular_items: Array<{
    menu_item_id: string
    name: string
    quantity_sold: number
    total_revenue: number
  }>
}