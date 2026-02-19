import { supabase } from '@/providers/supabaseClient'

export const menusQuery = supabase
  .from('menu')
  .select('*')

export const menuQuery = (slug: string) => supabase
  .from('menu')
  .select(`*`)
  .eq('slug', slug)
  .single()

export const menusWithCategoriesQuery = supabase
  .from('menu')
  .select('*,menu_item_category (id, name, slug)')