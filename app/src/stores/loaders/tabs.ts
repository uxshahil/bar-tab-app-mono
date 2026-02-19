import {
  tabsQuery,
  tabQuery,
  userTabsQuery,
  openTabsQuery,
  tabItemsQuery,
  tabSplitsQuery,
  tabPaymentsQuery,
  createTabQuery,
  updateTabQuery,
  addTabItemQuery,
  updateTabItemQuery,
  deleteTabItemQuery,
  createTabSplitQuery,
  updateTabSplitQuery,
  deleteTabSplitQuery,
  createTabPaymentQuery
} from '@/services/supabase/queries/tabQueries'
import { useMemoize } from '@vueuse/core'
import type { Tab, Tabs, TabItem, TabItems, TabSplit, TabSplits, TabPayments, TabSplitInsert } from '@/services/supabase/types/tabTypes'
import type { PostgrestSingleResponse } from '@supabase/supabase-js'
import { useErrorStore } from '@/stores/error'
import { socket } from '@/services/socket/socket'
import { supabase } from '@/providers/supabaseClient'

import { calculateTabTotals } from '@/utils/tabCalculations'

import { useAuthStore } from '@/stores/auth'

export const useTabsStore = defineStore('tabs-store', () => {
  const authStore = useAuthStore()
  
  // State
  const tabs = ref<Tabs | null>(null)
  const openTabsList = ref<Tabs | null>(null)
  const tab = ref<Tab | null>(null)
  const tabItems = ref<TabItems | null>(null)
  const tabSplits = ref<TabSplits | null>(null)
  const tabPayments = ref<TabPayments | null>(null)

  // Memoized loaders
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const loadTabs = useMemoize(async (_key: string = 'all-tabs') => {
    const response = await tabsQuery()
    return response
  })

  // Watch for auth changes to clear cache
  watch(() => authStore.user?.id, (newId, oldId) => {
    if (newId !== oldId) {
      console.log('TabsStore: Auth changed, resetting state')
      tabs.value = null
      openTabsList.value = null
      tab.value = null
      tabItems.value = null
      tabSplits.value = null
      tabPayments.value = null
      
      // Memoized loaders cleared automatically as they are now just functions
      loadTab.clear()
      loadTabItems.clear()
      loadTabSplits.clear()
      loadTabPayments.clear()
      loadUserTabs.clear()
      loadTabs.clear()
      loadOpenTabs.clear()
    }
  })

  // Keep ID-based loaders memoized as they are specific to items
  const loadTab = useMemoize(async (id: string) => {
    const response = await tabQuery(id)
    return response
  })

  const loadUserTabs = useMemoize(async (userId: string) => {
    const response = await userTabsQuery(userId)
    return response
  })

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const loadOpenTabs = useMemoize(async (_key: string = 'open-tabs') => {
    const response = await openTabsQuery()
    return response
  })

  const loadTabItems = useMemoize(async (tabId: string) => {
    const response = await tabItemsQuery(tabId)
    return response
  })

  const loadTabSplits = useMemoize(async (tabId: string) => {
    const response = await tabSplitsQuery(tabId)
    return response
  })

  const loadTabPayments = useMemoize(async (tabId: string) => {
    const response = await tabPaymentsQuery(tabId)
    return response
  })

  interface ValidateCacheParams<T> {
    ref: Ref<T | null>
    queryFn: () => Promise<PostgrestSingleResponse<T>>
    key: string
    loaderFn: { delete: (key: string) => void }
  }

  // Validate and refresh cached data if needed
  const validateCache = <T>({ ref, queryFn, key, loaderFn }: ValidateCacheParams<T>) => {
    if (ref.value) {
      queryFn().then((response) => {
        const { data, error } = response
        if (JSON.stringify(ref.value) === JSON.stringify(data)) {
          return
        } else {
          loaderFn.delete(key)
          if (!error && data) ref.value = data
        }
      })
    }
  }

  // Helper to convert query builder to promise
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toPromise = <T>(queryBuilder: any): Promise<PostgrestSingleResponse<T>> => {
    return queryBuilder
  }

  // Get all tabs
  const getTabs = async () => {
    tabs.value = null

    const response = await loadTabs('all-tabs')
    const { data, error, status } = response

    if (error) useErrorStore().setError({ error, customCode: status })

    if (data) tabs.value = data

    validateCache({ 
      ref: tabs, 
      queryFn: () => toPromise(tabsQuery()),
      key: 'all-tabs', 
      loaderFn: loadTabs 
    })
  }

  // Get single tab with all details
  const getTab = async (id: string) => {
    tab.value = null

    const response = await loadTab(id)
    const { data, error, status } = response

    if (error) useErrorStore().setError({ error, customCode: status })

    if (data) tab.value = data

    validateCache({ 
      ref: tab, 
      queryFn: () => toPromise(tabQuery(id)),
      key: id, 
      loaderFn: loadTab 
    })
  }

  // Get tabs for current user
  const getUserTabs = async (userId: string) => {
    tabs.value = null

    const response = await loadUserTabs(userId)
    const { data, error, status } = response

    if (error) useErrorStore().setError({ error, customCode: status })

    if (data) tabs.value = data

    validateCache({ 
      ref: tabs, 
      queryFn: () => toPromise(userTabsQuery(userId)),
      key: userId, 
      loaderFn: loadUserTabs 
    })
  }

  // Get all open tabs
  const getOpenTabs = async (force = false) => {
    // If we already have tabs, don't re-fetch (User request: only hydrate once)
    // Use the new state variable
    if (!force && openTabsList.value && openTabsList.value.length > 0) {
      return
    }

    const response = await loadOpenTabs('open-tabs')
    const { data, error, status } = response

    if (error) useErrorStore().setError({ error, customCode: status })

    if (data) {
      // Helper to merge totals by manually summing items
      const mergeTotals = async (rawTabs: any[]) => {
        if (!rawTabs || rawTabs.length === 0) return rawTabs
        
        const tabIds = rawTabs.map(t => t.id)
        
        const { data: allItems } = await supabase
            .from('tab_item')
            .select('tab_id, item_total')
            .in('tab_id', tabIds)


        const { data: allPayments } = await supabase
            .from('tab_payment')
            .select('tab_id, amount_paid, split_id, status, tip_added')
            .in('tab_id', tabIds)
            .eq('status', 'completed')

        if (!allItems) return rawTabs

        return rawTabs.map(t => {
            const tabItems = allItems.filter(i => i.tab_id === t.id)
            const tabPayments = allPayments ? allPayments.filter(p => p.tab_id === t.id) : []
            
            const totalPaidPrincipal = tabPayments.reduce((sum, p) => {
                const tip = p.tip_added || 0
                const principal = (p.amount_paid || 0) - tip
                return sum + principal
            }, 0)

            const totals = calculateTabTotals(tabItems, Number(t.tip_amount) || 0)

            const remainingBalance = Math.max(0, totals.totalOwed - totalPaidPrincipal)

            return {
              ...t,
              subtotal: totals.subtotal,
              tax_amount: totals.tax,
              total_before_tip: totals.totalBeforeTip,
              total_owed: totals.totalOwed,
              total_paid: totalPaidPrincipal,
              remaining_balance: remainingBalance
            }
        })
      }

      // Update the NEW state variable
      openTabsList.value = await mergeTotals(data) as any
    }
  }

  // Get tab items
  const getTabItems = async (tabId: string) => {
    // Don't clear state to avoid flashing
    // tabItems.value = null

    const response = await loadTabItems(tabId)
    const { data, error, status } = response

    if (error) useErrorStore().setError({ error, customCode: status })

    if (data) tabItems.value = data

    validateCache({ 
      ref: tabItems, 
      queryFn: () => toPromise(tabItemsQuery(tabId)),
      key: tabId, 
      loaderFn: loadTabItems 
    })
  }

  // Get tab splits
  const getTabSplits = async (tabId: string) => {
    tabSplits.value = null

    const response = await loadTabSplits(tabId)
    const { data, error, status } = response

    if (error) useErrorStore().setError({ error, customCode: status })

    if (data) {
      // Type assertion to handle potential type mismatches from Supabase
      tabSplits.value = data as TabSplits
    }

    validateCache({ 
      ref: tabSplits, 
      queryFn: () => toPromise(tabSplitsQuery(tabId)),
      key: tabId, 
      loaderFn: loadTabSplits 
    })
  }

  // Get tab payments
  const getTabPayments = async (tabId: string) => {
    tabPayments.value = null

    const response = await loadTabPayments(tabId)
    const { data, error, status } = response

    if (error) useErrorStore().setError({ error, customCode: status })

    if (data) {
      // Type assertion to handle potential type mismatches from Supabase
      tabPayments.value = data as TabPayments
    }

    validateCache({ 
      ref: tabPayments, 
      queryFn: () => toPromise(tabPaymentsQuery(tabId)),
      key: tabId, 
      loaderFn: loadTabPayments 
    })
  }

  // Create new tab
  const createTab = async (tabData: { user_id: string; bar_id: number; tab_number: string; special_notes?: string | null; status?: string; subtotal?: number; tax_amount?: number; total_before_tip?: number; tip_amount?: number; total_owed?: number }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error, status } = await createTabQuery(tabData as any)

    if (error) {
      useErrorStore().setError({ error, customCode: status })
      return null
    }

    // Clear cache to refetch
    loadTabs.delete('all-tabs')
    loadOpenTabs.delete('open-tabs')
    await getTabs()
    await getOpenTabs(true)

    return data?.[0]?.id || null
  }

  // Update tab
  const updateTab = async (tabId: string | number, updates: Partial<Tab>) => {
    const { error, status } = await updateTabQuery(tabId, updates)

    if (error) {
      useErrorStore().setError({ error, customCode: status })
      return false
    }

    if (tab.value?.id === tabId) {
      await getTab(tabId.toString())
    }

    return true
  }

  // Add item to tab
  const addTabItem = async (itemData: { tab_id: number; menu_item_id: number; quantity: number; unit_price: number; item_total: number; special_instructions?: string | null }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error, status } = await addTabItemQuery(itemData as any)

    if (error) {
      useErrorStore().setError({ error, customCode: status })
      return null
    }

    if (itemData.tab_id) {
      loadTabItems.delete(itemData.tab_id.toString())
      await getTabItems(itemData.tab_id.toString())
    }

    return data?.[0]?.id || null
  }

  // Update tab item
  const updateTabItem = async (itemId: string | number, updates: Partial<TabItem>) => {
    const { error, status } = await updateTabItemQuery(itemId, updates)

    if (error) {
      useErrorStore().setError({ error, customCode: status })
      return false
    }

    // Refresh items
    if (tabItems.value && tabItems.value.length > 0) {
      const tabId = tabItems.value[0]?.tab_id
      if (tabId) {
        loadTabItems.delete(tabId.toString())
        await getTabItems(tabId.toString())
      }
    }

    return true
  }

  // Delete tab item
  const deleteTabItem = async (itemId: string | number, tabId: string | number) => {
    const { error, status } = await deleteTabItemQuery(itemId)

    if (error) {
      useErrorStore().setError({ error, customCode: status })
      return false
    }

    loadTabItems.delete(tabId.toString())
    await getTabItems(tabId.toString())

    // Refresh open tabs to update totals
    // loadOpenTabs.delete('open-tabs')
    // await getOpenTabs()
    // TODO: Update local total instead of refetching

    return true
  }

  // Create tab split
  const createTabSplit = async (splitData: TabSplitInsert) => {
    const { data, error, status } = await createTabSplitQuery(splitData)

    if (error) {
      useErrorStore().setError({ error, customCode: status })
      return null
    }

    if (splitData.tab_id) {
      loadTabSplits.delete(splitData.tab_id.toString())
      await getTabSplits(splitData.tab_id.toString())
    }

    return data?.[0]?.id || null
  }

  // Update tab split
  const updateTabSplit = async (splitId: string | number, updates: Partial<TabSplit>) => {
    const { error, status } = await updateTabSplitQuery(splitId, updates)

    if (error) {
      useErrorStore().setError({ error, customCode: status })
      return false
    }

    // Refresh splits if we have them loaded
    if (tabSplits.value && tabSplits.value.length > 0) {
      const tabId = tabSplits.value[0]?.tab_id
      if (tabId) {
        loadTabSplits.delete(tabId.toString())
        await getTabSplits(tabId.toString())
      }
    }

    return true
  }

  // Delete tab split
  const deleteTabSplit = async (splitId: string | number, tabId: string | number) => {
    const { error, status } = await deleteTabSplitQuery(splitId)

    if (error) {
      useErrorStore().setError({ error, customCode: status })
      return false
    }

    // Refresh splits
    loadTabSplits.delete(tabId.toString())
    await getTabSplits(tabId.toString())
    
    return true
  }

  // Create payment
  const createPayment = async (paymentData: { tab_id: number; amount_paid: number; payment_method: string; status?: string; split_id?: number | null; tip_added?: number | null }) => {
    const { data, error, status } = await createTabPaymentQuery(paymentData as any)

    if (error) {
      useErrorStore().setError({ error, customCode: status })
      return null
    }

    if (paymentData.tab_id) {
      loadTabPayments.delete(paymentData.tab_id.toString())
      await getTabPayments(paymentData.tab_id.toString())
    }

    return data?.[0]?.id || null
  }

  // Helper: Update Local Tab Total
  const updateLocalTabTotal = (tabId: number, diff: number) => {
    if (!tabs.value) return

    const tabIndex = tabs.value.findIndex(t => t.id === tabId)
    if (tabIndex !== -1) {
      const t = tabs.value[tabIndex]
      if (!t) return

      const newTotalBeforeTip = (t.total_before_tip || 0) + diff
      
      // Re-calculate using the utility logic relative to the new total
      // Since we don't have all items here, we can derive:
      // Tax = Total * VAT
      // Subtotal = Total - Tax
      
      const newTax = newTotalBeforeTip * (Number(import.meta.env.VITE_VAT) || 0.15)
      const newSubtotal = newTotalBeforeTip - newTax
      const newTotalOwed = newTotalBeforeTip + (t.tip_amount || 0)

      tabs.value[tabIndex] = {
        ...t,
        subtotal: newSubtotal,
        tax_amount: newTax,
        total_before_tip: newTotalBeforeTip,
        total_owed: newTotalOwed
      }
    }
  }

  // Helper: Update Drink Logic
  const _updateDrinkInTab = async (params: {
    tabId: number,
    itemId: number,
    updates: { quantity?: number, specialInstructions?: string }
  }) => {
    console.log('_updateDrinkInTab called with params:', params)
    const { tabId, itemId, updates } = params

    // 1. Get current item to calculate differences
    // Ensure we have the latest items
    if (!tabItems.value || tabItems.value[0]?.tab_id !== tabId) {
      await getTabItems(tabId.toString())
    }
    
    const currentItem = tabItems.value?.find(i => i.id === itemId)
    if (!currentItem) {
      console.error('tabsStore: Item not found', itemId)
      return false
    }

    // 2. Optimistic Update
    // Update local state immediately
    const originalItem = { ...currentItem }
    const originalTab = tab.value ? { ...tab.value } : null
    
    const oldItemTotal = currentItem.item_total
    let newItemTotal = oldItemTotal
    let quantityChanged = false

    // Apply updates locally
    if (updates.specialInstructions !== undefined) {
      currentItem.special_instructions = updates.specialInstructions
    }

    if (updates.quantity !== undefined && updates.quantity !== currentItem.quantity) {
      currentItem.quantity = updates.quantity
      currentItem.item_total = updates.quantity * currentItem.unit_price
      newItemTotal = currentItem.item_total
      quantityChanged = true
    }

    // Update Tab Totals locally if quantity changed
    if (quantityChanged && tab.value && tab.value.id === tabId) {
      const diff = newItemTotal - oldItemTotal
      tab.value.total_before_tip = (tab.value.total_before_tip || 0) + diff
      // Recalculate based on new logic: Tax = Total * 0.15
      tab.value.tax_amount = tab.value.total_before_tip * (Number(import.meta.env.VITE_VAT) || 0.15)
      tab.value.subtotal = tab.value.total_before_tip - tab.value.tax_amount
      tab.value.total_owed = tab.value.total_before_tip + (tab.value.tip_amount || 0)
    }

    // 3. Perform DB Update
    const itemUpdates: Partial<TabItem> = {}
    
    if (updates.specialInstructions !== undefined) {
      itemUpdates.special_instructions = updates.specialInstructions
    }

    if (updates.quantity !== undefined) {
      itemUpdates.quantity = updates.quantity
      itemUpdates.item_total = newItemTotal
    }

    if (Object.keys(itemUpdates).length === 0) {
      return true
    }

    try {
      console.log('Calling updateTabItem with:', itemId, itemUpdates)
      const success = await updateTabItem(itemId, itemUpdates)
      console.log('updateTabItem result:', success)
      
      if (!success) {
        console.warn('Update failed, reverting optimistic update')
        // Revert optimistic update on failure
        Object.assign(currentItem, originalItem)
        if (originalTab && tab.value) {
          Object.assign(tab.value, originalTab)
        }
        return false
      }

      // Force refresh items to ensure UI consistency
      console.log('Refreshing tab items for tab:', tabId)
      // Bypass memoization for this refresh to ensure we get the latest DB state
      loadTabItems.delete(tabId.toString())
      const { data: freshItems } = await tabItemsQuery(tabId.toString())
      if (freshItems) {
        console.log('Fresh items fetched:', freshItems.length)
        tabItems.value = freshItems
        // Update the memoized cache too
        loadTabItems.delete(tabId.toString())
        // We don't need to re-populate loadTabItems here, next call will fetch
      }
      
      // Update local open tabs list totals without refetching
      if (quantityChanged) {
        const diff = newItemTotal - oldItemTotal
        updateLocalTabTotal(tabId, diff)
      }
      
      return true
    } catch (e) {
      console.error('Exception in _updateDrinkInTab:', e)
      // Revert on error
      Object.assign(currentItem, originalItem)
      if (originalTab && tab.value) {
        Object.assign(tab.value, originalTab)
      }
      return false
    }
  }

  // Socket Listeners
  socket.on('tab:created', ({ id }) => {
      console.log('Socket: tab:created', id)
      loadTabs.delete('all-tabs')
      loadOpenTabs.delete('open-tabs')
      if (tabs.value) getTabs()
      if (openTabsList.value) getOpenTabs(true)
  })

  socket.on('tab:updated', ({ id }) => {
      console.log('Socket: tab:updated', id)
      const strId = String(id)
      loadTab.delete(strId)
      
      if (tab.value && String(tab.value.id) === strId) {
          getTab(strId)
      }

      // Refresh lists
      loadTabs.delete('all-tabs')
      loadOpenTabs.delete('open-tabs')
      if (tabs.value) getTabs()
      if (openTabsList.value) getOpenTabs(true)
  })
  
  // Item events - Refresh BOTH lists
  const handleItemUpdate = (tabId: number) => {
      console.log('Socket: item update for tab', tabId)
      const strId = String(tabId)
      loadTabItems.delete(strId)
      loadTabSplits.delete(strId)
      loadTabPayments.delete(strId)

      if (tab.value && String(tab.value.id) === strId) {
          getTabItems(strId)
          getTabSplits(strId)
          getTabPayments(strId)
          getTab(strId) 
      }
      
      // Refresh lists
      loadTabs.delete('all-tabs')
      loadOpenTabs.delete('open-tabs')
      if (tabs.value) getTabs()
      if (openTabsList.value) getOpenTabs(true)
  }

  socket.on('tab:item:added', ({ tab_id }) => handleItemUpdate(tab_id))
  socket.on('tab:item:updated', ({ tab_id }) => { 
      if (tab_id) handleItemUpdate(tab_id) 
      else console.warn('Socket: tab:item:updated missing tab_id')
  })
  socket.on('tab:item:deleted', ({ tab_id }) => {
      if (tab_id) handleItemUpdate(tab_id)
      else console.warn('Socket: tab:item:deleted missing tab_id')
  })
  socket.on('tab:payment:added', ({ tab_id }) => {
      if (tab_id) handleItemUpdate(tab_id)
      else console.warn('Socket: tab:payment:added missing tab_id')
  })

  return {
    // State
    tabs,
    openTabsList, // Export new state
    tab,
    tabItems,
    tabSplits,
    tabPayments,

    // Getters
    getTabs,
    getTab,
    getUserTabs,
    getOpenTabs,
    getTabItems,
    getTabSplits,
    getTabPayments,

    // Actions
    createTab,
    updateTab,
    addTabItem,
    updateTabItem,
    deleteTabItem,
    createTabSplit,
    updateTabSplit,
    deleteTabSplit,
    createPayment,
    
    // Composite Action: Add Drink to Tab (handles item, split, tax, totals)
    addDrinkToTab: async (params: { 
      tabId: number, 
      drink: { id: number, price: number, name: string }, 
      quantity: number, 
      specialInstructions?: string, 
      splitId?: number | null 
    }) => {
      const { tabId, drink, quantity, specialInstructions, splitId } = params
      
      // Get current tab state to ensure we have latest totals
      // We can rely on the store state if we assume it's up to date, 
      // but fetching fresh might be safer. For now, let's use what's in store if it matches.
      let currentTabState = tab.value
      if (!currentTabState || currentTabState.id !== tabId) {
        const { data } = await loadTab(tabId.toString())
        currentTabState = data
      }
      
      if (!currentTabState) return false

      // Ensure we have the latest items to check for duplicates
      if (!tabItems.value || tabItems.value.length === 0 || tabItems.value[0]?.tab_id !== tabId) {
        await getTabItems(tabId.toString())
      }

      const itemTotal = quantity * (drink.price || 0)

      // 1. Add item to tab
      const itemId = await addTabItem({
        tab_id: tabId,
        menu_item_id: drink.id,
        quantity: quantity,
        unit_price: drink.price || 0,
        item_total: itemTotal,
        special_instructions: specialInstructions || null
      })

      if (!itemId) return false

      // Force refresh items to ensure UI updates
      loadTabItems.delete(tabId.toString())
      await getTabItems(tabId.toString())

      // 2. Assign to split if selected
      if (splitId) {
        // We need to find the split. If it's not in store, we might need to fetch it.
        // Assuming splits are loaded for the active tab.
        let split = tabSplits.value?.find(s => s.id === splitId)
        
        // If not found in current store state, try to fetch splits
        if (!split) {
           await getTabSplits(tabId.toString())
           split = tabSplits.value?.find(s => s.id === splitId)
        }

        if (split) {
          const currentItems = split.items_included || []
          const newItems = [...currentItems, itemId.toString()]
          
          await updateTabSplit(split.id, {
            items_included: newItems,
            subtotal: (split.subtotal || 0) + itemTotal,
            total_owed: (split.total_owed || 0) + itemTotal
          })
        }
      }

      // Update local open tabs list totals without refetching
      updateLocalTabTotal(tabId, itemTotal)

      return true
    },

    // Composite Action: Update Drink in Tab
    updateDrinkInTab: _updateDrinkInTab,

    // Checkout Tab
    checkoutTab: async (tabId: number, totals: { subtotal: number, tax_amount: number, total_before_tip: number, total_owed: number, tip_amount: number }) => {
      const { subtotal, tax_amount, total_before_tip, total_owed, tip_amount } = totals
      
      const success = await updateTab(tabId, {
        subtotal,
        tax_amount,
        total_before_tip,
        total_owed,
        tip_amount,
        status: 'closed',
        settled_at: new Date().toISOString()
      })

      if (success) {
        // Refresh lists
        loadTabs.delete('all-tabs')
        loadOpenTabs.delete('open-tabs')
        await getTabs()
        await getOpenTabs(true)
      }

      return success
    }
  }
})