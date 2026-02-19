import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL

const headers = {
  apiKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
}

const createBar = async (data: any) => {
  const response = await axios.post(`${API_URL}/bars`, data, { headers })
  return response.data
}

const updateBar = async (id: number | string, data: any) => {
  const response = await axios.put(`${API_URL}/bars/${id}`, data, { headers })
  return response.data
}

const deleteBar = async (id: number | string) => {
  const response = await axios.delete(`${API_URL}/bars/${id}`, { headers })
  return response.data
}

export default { createBar, updateBar, deleteBar }
