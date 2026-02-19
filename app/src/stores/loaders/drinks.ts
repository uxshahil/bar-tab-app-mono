import {
  drinksByCategoryQuery,
  updateDrinkQuery,
  deleteDrinkQuery,
  fetchDrinks as fetchDrinksQuery, // Rename to avoid conflict if needed, or just use fetchDrinks
} from '@/services/supabase/queries/drinkQueries'
import drinkApi from '@/services/api/drinkApi'
import { useMemoize } from '@vueuse/core'
import type { Drink, Drinks } from '@/services/supabase/types/drinkTypes'
import { socket } from '@/services/socket/socket'

export const useDrinksStore = defineStore('drinks-store', () => {
  const drinks = ref<Drinks | null>(null)
  const categoryDrinks = ref<Drinks | null>(null)
  const drink = ref<Drink | null>(null)
  const currentSearch = ref('')

  const loadDrinks = useMemoize(async (search: string = '') => await fetchDrinksQuery(search))
  const loadDrinksByCategory = useMemoize(
    async (categorySlug: string) => await drinksByCategoryQuery(categorySlug),
  )

  type DrinkCacheRef = Ref<Drinks | Drink | null>
  interface ValidateCacheParams {
    ref: DrinkCacheRef
    query: unknown
    key: string
    loaderFn: { delete: (key: string) => void }
  }

  const validateCache = ({ ref, query, key, loaderFn }: ValidateCacheParams) => {
    if (ref.value) {
      const finalQuery =
        typeof query === 'function'
          ? (query as (k: string) => Promise<{ data: Drinks | Drink | null; error: unknown }>)(key)
          : query

      ;(finalQuery as Promise<{ data: Drinks | Drink | null; error: unknown }>).then(
        ({ data, error }) => {
          if (JSON.stringify(ref.value) === JSON.stringify(data)) {
            return
          } else {
            loaderFn.delete(key)
            if (!error && data) ref.value = data
          }
        },
      )
    }
  }

  const getDrinks = async (search: string = '') => {
    // drinks.value = null // Removed to prevent UI flashing during updates
    currentSearch.value = search

    const { data, error, status } = await loadDrinks(search)

    if (error) useErrorStore().setError({ error, customCode: status })
    if (data) drinks.value = data

    validateCache({
      ref: drinks,
      query: (s: string) => fetchDrinksQuery(s),
      key: search,
      loaderFn: loadDrinks,
    })
  }

  const getDrinksByCategory = async (categorySlug: string) => {
    // categoryDrinks.value = null // Removed to prevent UI flashing

    const { data, error, status } = await loadDrinksByCategory(categorySlug)

    if (error) useErrorStore().setError({ error, customCode: status })
    if (data) categoryDrinks.value = data

    validateCache({
      ref: categoryDrinks,
      query: (key: string) => drinksByCategoryQuery(key),
      key: categorySlug,
      loaderFn: loadDrinksByCategory,
    })
  }

  const isRevalidating = ref(false)

  const getDrink = async (id: string) => {
    // drink.value = null // Don't clear, just overwrite when data comes to avoid UI flicker

    try {
      // Use the SWR API endpoint instead of direct DB query
      const { data, isRevalidating: remoteRevalidating } = await drinkApi.fetchDrinkById(id)

      if (data) {
        drink.value = data
      }

      // If remote is revalidating, set state to true
      // We rely on socket 'drink:updated' to tell us when it's done
      if (remoteRevalidating) {
        isRevalidating.value = true
      } else {
        isRevalidating.value = false
      }
    } catch (error: unknown) {
      const e = error as { message?: string; response?: { status?: number } }
      useErrorStore().setError({
        error: e.message || 'Failed to fetch drink',
        customCode: e.response?.status || 500,
      })
      isRevalidating.value = false
    }
  }

  const clearDrink = () => {
    drink.value = null
    isRevalidating.value = false
  }

  const updateDrink = async (id: number, updates: Partial<Drink>) => {
    const { error, status } = await updateDrinkQuery(id, updates)

    if (error) {
      useErrorStore().setError({ error, customCode: status })
      return false
    }

    // 1. Optimistic Update (Immediate Feedback)
    if (drinks.value) {
      const index = drinks.value.findIndex((d) => d.id === id)
      if (index !== -1) {
        drinks.value[index] = { ...drinks.value[index], ...updates } as Drinks[0]
      }
    }

    // 2. Refresh detail view if open
    if (drink.value?.id === id) {
      await getDrink(id.toString())
    }

    // 3. Invalidate Cache & Refresh using CURRENT SEARCH
    loadDrinks.delete(currentSearch.value) // Force fresh fetch for current view
    await getDrinks(currentSearch.value)

    return true
  }

  const deleteDrink = async () => {
    if (!drink.value) return

    const { error, status } = await deleteDrinkQuery(drink.value.id)
    if (error) useErrorStore().setError({ error, customCode: status })

    loadDrinks.delete(currentSearch.value)
    getDrinks(currentSearch.value)
  }

  // Real-time updates
  const initSocket = () => {
    socket.on('drink:created', () => {
      getDrinks() // Refresh list
    })

    socket.on('drink:updated', async (payload) => {
      // Always refresh list
      getDrinks()

      // If currently viewing THIS drink, refresh detail to get full data
      // Convert both to strings to ensure match
      if (drink.value && String(drink.value.id) === String(payload.id)) {
        // Re-fetch the drink details
        // This will update the state and naturally set isRevalidating to false if done
        await getDrink(String(payload.id))
      }
    })

    socket.on('drink:deleted', (payload) => {
      getDrinks()
      if (drink.value && String(drink.value.id) === String(payload.id)) {
        drink.value = null // Clear changed data
      }
    })
  }

  // Polling for updates (Healing)
  return {
    drinks,
    categoryDrinks,
    drink,
    isRevalidating,
    getDrinks,
    getDrinksByCategory,
    getDrink,
    updateDrink,
    deleteDrink,
    clearDrink,
    initSocket,
  }
})
