import { supabase } from '@/providers/supabaseClient'
import { profileQuery } from '@/services/supabase/queries/profileQueries'
import type { Session, User } from '@supabase/supabase-js'
import type { Tables } from 'database/types'

export const useAuthStore = defineStore('auth-store', () => {
  const user = ref<null | User>(null)
  const profile = ref<null | Tables<'profile'>>(null)
  const isTrackingAuthChanges = ref(false)

  const setProfile = async () => {
    if (!user.value) {
      profile.value = null
      return
    }

    if (!profile.value || profile.value.id !== user.value.id) {
      const { data } = await profileQuery({
        column: 'id',
        value: user.value.id
      })

      profile.value = data || null
    }
  }

  const setAuth = async (userSession: null | Session = null) => {
    if (!userSession) {
      user.value = null
      profile.value = null
      return
    }

    user.value = userSession.user
    await setProfile()
  }

  const getSession = async () => {
    const { data } = await supabase.auth.getSession()
    if (data.session?.user) await setAuth(data.session)
  }

  const trackAuthChanges = () => {
    if (isTrackingAuthChanges.value) return

    isTrackingAuthChanges.value = true
    supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(async () => {
        await setAuth(session)
      }, 0)
    })
  }

  const profileInitials = (fullName: string = profile.value?.full_name ?? '') => {
    const names = fullName.split(' ')
    const initials = names.map(name => name.charAt(0).toUpperCase()).join('')
    return initials ?? 'NA'
  }

  return {
    user,
    profile,
    setAuth,
    getSession,
    trackAuthChanges,
    profileInitials
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAuthStore, import.meta.hot))
}
