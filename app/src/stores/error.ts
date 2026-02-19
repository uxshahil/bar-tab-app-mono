import type { CustomError, ExtendedPostgrestError } from '@/types/TypesError'
import type { PostgrestError } from '@supabase/supabase-js'

const activeError = ref<null | CustomError | ExtendedPostgrestError>(null)
const isCustomError = ref(false)

export const useErrorStore = defineStore('error-store', () => {
  const setError = ({
    error,
    customCode
  }: {
    error: string | PostgrestError | Error
    customCode?: number
  }) => {
    if (typeof error === 'string') {
      activeError.value = { 
         message: error, 
         code: customCode?.toString() || 'UNKNOWN',
         details: '',
         hint: '',
         statusCode: customCode
      } as ExtendedPostgrestError
      isCustomError.value = true
      return
    }

    if (error instanceof Error) {
        const customError = error as CustomError
        customError.customCode = customCode
        activeError.value = customError
        return
    }

    const extendedPostgrestError = error as ExtendedPostgrestError
    extendedPostgrestError.statusCode = customCode
    activeError.value = extendedPostgrestError
  }

  const clearError = () => {
    activeError.value = null
    isCustomError.value = false
  }

  return {
    activeError,
    setError,
    clearError,
    isCustomError
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useErrorStore, import.meta.hot))
}
