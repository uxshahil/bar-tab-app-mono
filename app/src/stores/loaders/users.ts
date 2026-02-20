import type { CreateNewUser, DeleteUser, EditUser } from '@/interfaces/UserInterfaces'
import {
  profileQuery as userQuery,
  profilesQuery as usersQuery,
} from '@/services/supabase/queries/profileQueries'
import type { Profile as User, Profiles as Users } from '@/services/supabase/types/profileTypes'
// Change the import to use named exports
import profileApi from '@/services/api/profileApi'
import { socket } from '@/services/socket/socket'

export const useUsersStore = defineStore('users-store', () => {
  // State
  const users = ref<Users | null>(null)
  const user = ref<User | null>(null)

  // Convert CreateNewUser to Profile format
  const convertCreateUserToProfile = (userData: CreateNewUser): Partial<User> => {
    return {
      full_name: `${userData.firstName} ${userData.lastName}`,
      username: userData.username,
      email: userData.email,
      password: userData.password,
      user_role: userData.user_role,
      pin: userData.pin,
      bio: userData.bio,
      avatar_url: userData.avatar_url,
      active: true,
      mode: 'light',
    }
  }

  // Simple cache implementation without complex validation
  const getUsers = async (search?: string) => {
    users.value = null
    const response = await usersQuery(search)
    const { data, error, status } = response

    if (error) {
      useErrorStore().setError({ error, customCode: status })
      return
    }

    users.value = data
  }

  const getUser = async (column: string, value: string) => {
    user.value = null
    const response = await userQuery({ column, value })
    const { data, error, status } = response

    if (error) {
      useErrorStore().setError({ error, customCode: status })
      return
    }

    user.value = data
  }

  const createUser = async (userData: CreateNewUser) => {
    try {
      // Convert CreateNewUser to Profile format
      const profileData = convertCreateUserToProfile(userData)

      // Use the createProfile function which should return a Promise
      // Add type assertion to ensure profileData matches the expected type
      const userId = await profileApi.createProfile(profileData as CreateNewUser)
      // Refresh users list
      await getUsers()

      return userId
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      useErrorStore().setError({
        error: error.message || 'Failed to create user',
        customCode: error.status || 500,
      })
      return null
    }
  }

  const updateUser = async (userId: string | number, updates: Partial<CreateNewUser>) => {
    try {
      // Convert updates to Profile format
      const profileUpdates: Partial<User> = {}

      if (updates.firstName && updates.lastName) {
        profileUpdates.full_name = `${updates.firstName} ${updates.lastName}`
      }

      if (updates.username !== undefined) profileUpdates.username = updates.username
      if (updates.email !== undefined) profileUpdates.email = updates.email
      if (updates.password !== undefined) profileUpdates.password = updates.password
      if (updates.user_role !== undefined) profileUpdates.user_role = updates.user_role
      if (updates.pin !== undefined) profileUpdates.pin = updates.pin
      if (updates.bio !== undefined) profileUpdates.bio = updates.bio
      if (updates.avatar_url !== undefined) profileUpdates.avatar_url = updates.avatar_url

      const editUserData: EditUser = {
        id: String(userId),
        data: updates,
      }

      const result = await profileApi.editProfile(editUserData)

      // Check if the update was successful
      if (result.error) {
        throw new Error(result.error)
      }

      // Refresh current user if it's the one being updated
      if (user.value?.id === userId) {
        await getUser('id', userId.toString())
      }

      return true
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      useErrorStore().setError({
        error: error.message || 'Failed to update user',
        customCode: error.status || 500,
      })
      return false
    }
  }

  const deleteUser = async (userId: string) => {
    try {
      const deleteData: DeleteUser = {
        id: userId,
      }

      await profileApi.deleteProfile(deleteData)

      // Refresh users list
      await getUsers()

      return true
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      useErrorStore().setError({
        error: error.message || 'Failed to delete user',
        customCode: error.status || 500,
      })
      return false
    }
  }

  // Socket Listeners
  socket.on('user:created', () => {
    getUsers()
  })

  socket.on('user:updated', ({ id }) => {
    if (user.value && String(user.value.id) === String(id)) {
      getUser('id', String(id))
    }
    getUsers()
  })

  socket.on('user:deleted', () => {
    getUsers()
  })

  return {
    // State
    users,
    user,

    // Getters
    getUsers,
    getUser,

    // Actions
    createUser,
    updateUser,
    deleteUser,
  }
})
