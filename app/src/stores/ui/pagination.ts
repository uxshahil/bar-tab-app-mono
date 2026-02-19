import { defineStore } from 'pinia'

interface PaginationState {
  pageIndex: number
  pageSize: number
}

import { useStorage } from '@vueuse/core'

export const usePaginationStore = defineStore('pagination-ui', () => {
  // State: Map of table keys to their pagination state (Persisted to LocalStorage)
  const tables = useStorage<Record<string, PaginationState>>('pagination-ui-state', {})

  // Actions
  const setPagination = (key: string, state: PaginationState) => {
    tables.value[key] = state
  }

  const getPagination = (key: string): PaginationState | undefined => {
    return tables.value[key]
  }

  const resetPagination = (key: string) => {
    delete tables.value[key]
  }

  return {
    tables,
    setPagination,
    getPagination,
    resetPagination,
  }
})
