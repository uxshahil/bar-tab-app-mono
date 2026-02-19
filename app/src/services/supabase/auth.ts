import { supabase } from '@/providers/supabaseClient'
import type { LoginForm, RegisterForm, PosLoginForm } from '@/types/TypesAuth'
import { fakerAF_ZA as faker } from '@faker-js/faker'
import { UserRole } from '@/types/TypesAuth'

export const register = async (formData: RegisterForm) => {
  const { data, error } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password
  })

  if (error) return console.error(error)

  if (data.user) {
    const generatePin = (role: UserRole) => {
      if (role === UserRole.BarManager) return faker.string.numeric(9)
      if (role === UserRole.BarStaff) return faker.string.numeric(6)
      return faker.string.numeric(6)
    }

    const { error } = await supabase.from('profile').insert({
      id: data.user.id,
      username: formData.username,
      password: formData.password,
      full_name: formData.firstName.concat(' ', formData.lastName),
      user_role: formData.role,
      pin: generatePin(formData.role),
      email: formData.email
    })

    if (error) return console.log('Profiles error', error)
  }

  return true
}

export const posLogin = async (formData: PosLoginForm) => {
  const { data: profileData, error: profileError } = await supabase
    .from('profile')
    .select('id, username, full_name, user_role, email, password')
    .eq('pin', formData?.pin)
    .eq('active', true)
    .single()

  if (profileError) return { error: profileError }

  const { error } = await supabase.auth.signInWithPassword({
    email: profileData.email,
    password: profileData.password
  })

  return { error }
}

export const login = async (formData: LoginForm) => {
  const { error } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password
  })

  return { error }
}

export const logout = async () => {
  const { error } = await supabase.auth.signOut()

  if (error) console.log(error)

  return true
}
