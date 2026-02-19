import type { QueryData } from "@supabase/supabase-js"
import type { menusQuery, menuQuery, menusWithCategoriesQuery } from "../queries/menuQueries"

export type Menus = QueryData<typeof menusQuery>
export type Menu = QueryData<ReturnType<typeof menuQuery>>
export type MenusWithCategories = QueryData<typeof menusWithCategoriesQuery>