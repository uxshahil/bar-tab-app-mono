import { defineStore } from 'pinia'
import { ref } from 'vue'
import { barsQuery, barByIdQuery } from '@/services/supabase/queries/barQueries'
import barApi from '@/services/api/barApi'
import { useErrorStore } from '@/stores/error'
import { socket } from '@/services/socket/socket'

export const useBarsStore = defineStore('bars-store', () => {
  const bars = ref<any[] | null>(null)
  const bar = ref<any | null>(null)

  const getBars = async () => {
    bars.value = null
    const { data, error, status } = await barsQuery
    
    if (error) {
      useErrorStore().setError({ error, customCode: status })
      return
    }
    bars.value = data
  }

  const getBar = async (id: number) => {
    bar.value = null
    const { data, error, status } = await barByIdQuery(id)

    if (error) {
      useErrorStore().setError({ error, customCode: status })
      return
    }
    bar.value = data
  }

  const createBar = async (barData: any) => {
    try {
      const result = await barApi.createBar(barData)
      await getBars()
      return result
    } catch (error: any) {
       useErrorStore().setError({ error: error.message || 'Failed to create bar', customCode: 500 })
       return null
    }
  }

  const updateBar = async (id: number | string, updates: any) => {
    try {
      await barApi.updateBar(id, updates)
      if (bar.value?.id == id) await getBar(Number(id))
      return true
    } catch (error: any) {
      useErrorStore().setError({ error: error.message || 'Failed to update bar', customCode: 500 })
      return false
    }
  }

  const deleteBar = async (id: number | string) => {
    try {
      await barApi.deleteBar(id)
      await getBars()
      return true
    } catch (error: any) {
      useErrorStore().setError({ error: error.message || 'Failed to delete bar', customCode: 500 })
      return false
    }
  }

  // Socket Listeners
  socket.on('bar:created', () => {
      console.log('Socket: bar:created')
      getBars()
  })

  socket.on('bar:updated', ({ id }) => {
      console.log('Socket: bar:updated', id)
      if (bar.value && String(bar.value.id) === String(id)) {
          getBar(Number(id))
      }
      getBars()
  })

  socket.on('bar:deleted', () => {
      console.log('Socket: bar:deleted')
      getBars()
  })

  return {
    bars,
    bar,
    getBars,
    getBar,
    createBar,
    updateBar,
    deleteBar
  }
})
