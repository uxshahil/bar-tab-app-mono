import { supabase } from '@/providers/supabaseClient'
import { type Profile } from '../types/profileTypes';

export const profileQuery = ({ column, value }: { column: string; value: string }) => supabase
  .from('profile')
  .select('*')
  .eq(column, value)
  .single()

export const profilesQuery = (search?: string) => {
  let query = supabase.from('profile').select('*')
  
  if (search) {
    query = query.or(`full_name.ilike.%${search}%,username.ilike.%${search}%,email.ilike.%${search}%`)
  }
  
  return query
}

export const updateUserQuery = (updatedUser = {} as Partial<Profile>, id: string) => supabase
  .from('profile')
  .update(updatedUser)
  .eq('id', id)
