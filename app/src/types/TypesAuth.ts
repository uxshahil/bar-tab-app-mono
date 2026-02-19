export enum UserRole {
  Admin = 'admin',
  BarManager = 'bar-manager',
  BarStaff = 'bar-staff'
}

export interface LoginForm {
  email: string
  password: string
}

export interface PosLoginForm {
  pin: string
}

export interface RoleBasedPosLogin extends PosLoginForm {
  role?: UserRole
}

export interface RegisterForm extends LoginForm {
  confirmPassword: string
  username: string
  firstName: string
  lastName: string
  pin: string
  role: UserRole
}