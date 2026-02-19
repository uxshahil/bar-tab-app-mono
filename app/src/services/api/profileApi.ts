import type { DeleteUser, EditUser } from '@/interfaces/UserInterfaces'
import axios from 'axios'

const createProfile = async (profileData: {
  firstName: string
  lastName: string
  username: string
  email: string
  password: string
  user_role: string
  pin: string
}) => {
  try {
    const response = await axios.post(`${import.meta.env.VITE_API_URL}/create-user`, profileData, {
      headers: {
        apiKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
    })
    return response.data
  } catch (error) {
    console.error('Error creating profile:', error)
    throw error
  }
}

const editProfile = async (profileData: EditUser) => {
  try {
    const response = await axios.put(`${import.meta.env.VITE_API_URL}/update-user/${profileData.id}`, profileData.data, {
      headers: {
        apiKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
    })
    return response.data
  } catch (error) {
    console.error('Error creating profile:', error)
    throw error
  }
}

const deleteProfile = async (profile: DeleteUser) => {
  const response = await axios.delete(`${import.meta.env.VITE_API_URL}/delete-user/${profile.id}`, {
    headers: {
      apiKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
  })

  return response
}

export default { createProfile, editProfile, deleteProfile }