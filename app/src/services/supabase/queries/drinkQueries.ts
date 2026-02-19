import { supabase } from '@/providers/supabaseClient'

export const drinksQuery = supabase
  .from('menu_item')
  .select('*, category (name, slug, menu (name, slug))')
  .order('name', { ascending: true })

// Helper to build a drinks query with optional search filtering
export const fetchDrinks = (search?: string | '*') => {
  let q = supabase
    .from('menu_item')
    .select('*, category (name, slug, menu (name, slug))')

  if (search && String(search).trim().length) {
    const term = `%${String(search).trim()}%`
    // search in name and slug (case-insensitive)
    q = q.or(`name.ilike.${term},slug.ilike.${term}`)
  }

  return q.order('name', { ascending: true })
}

export const drinkQuery = (slug: string) => supabase
  .from('menu_item')
  .select(`*, category (name, slug, menu (name, slug))`)
  .eq('slug', slug)
  .single()

export const drinksByCategoryQuery = (categorySlug: string) => supabase
  .from('menu_item')
  .select('*, category!inner(name, slug, menu (name, slug))')
  .eq('category.slug', categorySlug)
  .order('name', { ascending: true })

export const updateDrinkQuery = (updatedDrink = {}, id: number) => supabase
  .from('menu_item')
  .update(updatedDrink)
  .eq('id', id)

export const deleteDrinkQuery = (id: number) => supabase
  .from('menu_item')
  .delete()
  .eq('id', id)
