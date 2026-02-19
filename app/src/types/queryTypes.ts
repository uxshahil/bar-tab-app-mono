import type { PostgrestError, PostgrestSingleResponse } from '@supabase/supabase-js'

export type QueryData<T> = PostgrestSingleResponse<T>
export type QueryError = PostgrestError // You might need to import this too