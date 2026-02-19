export const validateEmail = (email: string) => {
  const trimmedEmail = email.trim()
  if (!trimmedEmail) return []

  const errors = []

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const isValidEmailFormat = emailRegex.test(trimmedEmail)

  if (!isValidEmailFormat) {
    errors.push('Not a valid email format')
  }

  return errors
}

export const validatePassword = (password: string) => {
  if (!password) return []

  const errors = []

  if (password.length < 6) {
    errors.push('Password must be at least 6 characters')
  }

  return errors
}

export const validatePin = (pin: string) => {
  if (!pin) return []

  const errors = []

  const pinValidated = /^\d{6}$/.test(pin) ?? /^\d{9}$/.test(pin)

  if (!pinValidated) {
    errors.push(`Invalid pin`)
  }

  return errors
}
