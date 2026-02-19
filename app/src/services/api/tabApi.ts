import type { Tab, TabItem, TabSplit } from '@/services/supabase/types/tabTypes'
import axios from 'axios'

// Create a new tab
const createTab = async (tabData: {
  user_id: string
  tab_number: string
  subtotal?: number
  tax_amount?: number
  total_before_tip?: number
  tip_amount?: number
  total_owed?: number
  special_notes?: string
}) => {
  try {
    const response = await axios.post(`${import.meta.env.VITE_API_URL}/tabs`, tabData, {
      headers: {
        apiKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
    })
    return response.data
  } catch (error) {
    console.error('Error creating tab:', error)
    throw error
  }
}

// Update a tab
const updateTab = async (tabId: string | number, updateData: Partial<Tab>) => {
  try {
    const response = await axios.put(`${import.meta.env.VITE_API_URL}/tabs/${tabId}`, updateData, {
      headers: {
        apiKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
    })
    return response.data
  } catch (error) {
    console.error('Error updating tab:', error)
    throw error
  }
}

// Add item to tab
const addTabItem = async (itemData: {
  tab_id: number
  menu_item_id: number
  quantity: number
  unit_price: number
  item_total: number
  special_instructions?: string
}) => {
  try {
    const response = await axios.post(`${import.meta.env.VITE_API_URL}/tabs/items`, itemData, {
      headers: {
        apiKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
    })
    return response.data
  } catch (error) {
    console.error('Error adding tab item:', error)
    throw error
  }
}

// Update tab item
const updateTabItem = async (itemId: string | number, updateData: Partial<TabItem>) => {
  try {
    const response = await axios.put(`${import.meta.env.VITE_API_URL}/tabs/items/${itemId}`, updateData, {
      headers: {
        apiKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
    })
    return response.data
  } catch (error) {
    console.error('Error updating tab item:', error)
    throw error
  }
}

// Delete tab item
const deleteTabItem = async (itemId: string | number) => {
  try {
    const response = await axios.delete(`${import.meta.env.VITE_API_URL}/tabs/items/${itemId}`, {
      headers: {
        apiKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
    })
    return response.data
  } catch (error) {
    console.error('Error deleting tab item:', error)
    throw error
  }
}

// Create tab split
const createTabSplit = async (splitData: {
  tab_id: number
  split_number: number
  items_included: string[]
  subtotal: number
  tax_on_split: number
  total_owed: number
}) => {
  try {
    const response = await axios.post(`${import.meta.env.VITE_API_URL}/tabs/splits`, splitData, {
      headers: {
        apiKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
    })
    return response.data
  } catch (error) {
    console.error('Error creating tab split:', error)
    throw error
  }
}

// Update tab split (for payment processing)
const updateTabSplit = async (splitId: string | number, updateData: Partial<TabSplit>) => {
  try {
    const response = await axios.put(`${import.meta.env.VITE_API_URL}/tabs/splits/${splitId}`, updateData, {
      headers: {
        apiKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
    })
    return response.data
  } catch (error) {
    console.error('Error updating tab split:', error)
    throw error
  }
}

// Create payment
const createPayment = async (paymentData: {
  tab_id: number
  split_id?: number
  amount_paid: number
  tip_added?: number
  payment_method: 'cash' | 'card' | 'mobile' | 'mixed'
}) => {
  try {
    const response = await axios.post(`${import.meta.env.VITE_API_URL}/tabs/payments`, paymentData, {
      headers: {
        apiKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
    })
    return response.data
  } catch (error) {
    console.error('Error creating payment:', error)
    throw error
  }
}

// Close/settle tab
const settleTab = async (tabId: string | number) => {
  try {
    const response = await axios.post(`${import.meta.env.VITE_API_URL}/tabs/${tabId}/settle`, {}, {
      headers: {
        apiKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
    })
    return response.data
  } catch (error) {
    console.error('Error settling tab:', error)
    throw error
  }
}

export default {
  createTab,
  updateTab,
  addTabItem,
  updateTabItem,
  deleteTabItem,
  createTabSplit,
  updateTabSplit,
  createPayment,
  settleTab
}
