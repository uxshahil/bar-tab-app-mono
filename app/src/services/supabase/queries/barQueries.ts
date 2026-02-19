import { supabase } from '@/providers/supabaseClient'

export const barsQuery = supabase
  .from('bar')
  .select(`*, bar_menu(*)`)

export const barQuery = (slug: string) => supabase
  .from('bar')
  .select(`*, bar_menu (menu_name)`)
  .eq('slug', slug)
  .single()

export const barByIdQuery = (id: number) => supabase
  .from('bar')
  .select(`*, bar_menu (menu_name)`)
  .eq('id', id)
  .single()
