import type { QueryData } from "@supabase/supabase-js"
import type { barsQuery, barQuery } from "../queries/barQueries"

export type Bars = QueryData<typeof barsQuery>
export type Bar = QueryData<ReturnType<typeof barQuery>>

export type BarMenus = {
  'menu_id': number
  'bar_id': number
  'menu_name': string
}