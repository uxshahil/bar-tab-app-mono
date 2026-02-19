import type { QueryData } from "@supabase/supabase-js"
import type { drinksQuery, drinkQuery } from "../queries/drinkQueries"

export type Drinks = QueryData<typeof drinksQuery>
// Manually extending to include description if missing from inference
export type Drink = QueryData<ReturnType<typeof drinkQuery>> & { description?: string }