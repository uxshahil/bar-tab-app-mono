import type { LoginForm, PosLoginForm } from '@/types/TypesAuth'
import type { AuthError, PostgrestError } from '@supabase/supabase-js'

// type FormError<T> = {
//   [K in keyof T]: string[]
// }

export const useFormErrors = () => {
  const serverError = ref('')
  const loginFormErrors = ref<{ email: string[]; password: string[] }>()
  const posLoginFormErrors = ref<{ pin: string[] }>()

  const handleServerError = (error: AuthError | PostgrestError) => {
    serverError.value =
      error?.message === 'Invalid login credentials'
        ? 'Incorrect email or password'
        : error?.message || ''
  }

  const handleLoginForm = async (formData: LoginForm) => {
    loginFormErrors.value = {
      email: [],
      password: []
    }

    posLoginFormErrors.value = undefined // Clear other form errors

    const { validateEmail, validatePassword } = await import('@/utils/validations/FormValidations')

    const emailErrors = validateEmail(formData.email)
    if (emailErrors.length) loginFormErrors.value.email = emailErrors

    const passwordErrors = validatePassword(formData.password)
    if (passwordErrors.length) loginFormErrors.value.password = passwordErrors
  }

  const handlePosLoginForm = async (formData: PosLoginForm) => {
    posLoginFormErrors.value = {
      pin: []
    }

    loginFormErrors.value = undefined // Clear other form errors

    const { validatePin } = await import('@/utils/validations/FormValidations')

    const pinErrors = validatePin(formData.pin)
    if (pinErrors.length) posLoginFormErrors.value.pin = pinErrors
  }

  return {
    serverError,
    handleServerError,
    loginFormErrors,
    posLoginFormErrors,
    handleLoginForm,
    handlePosLoginForm
  }
}
