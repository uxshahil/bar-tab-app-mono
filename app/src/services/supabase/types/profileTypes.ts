import type { QueryData } from "@supabase/supabase-js"
import type { profileQuery, profilesQuery } from "../queries/profileQueries"

export type Profile = QueryData<ReturnType<typeof profileQuery>>
export type Profiles = QueryData<ReturnType<typeof profilesQuery>>