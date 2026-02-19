import type { CreateNewDrink, EditDrink, DeleteDrink } from '@/interfaces/DrinkInterfaces'
import axios from 'axios'

const createDrink = async (drinkData: Partial<CreateNewDrink>) => {
  try {
    const response = await axios.post(`${import.meta.env.VITE_API_URL}/create-drink`, drinkData, {
      headers: {
        apiKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
    })
    return response.data
  } catch (error) {
    console.error('Error creating drink:', error)
    throw error
  }
}

const editDrink = async (drinkData: EditDrink) => {
  try {
    const response = await axios.put(`${import.meta.env.VITE_API_URL}/update-drink/${drinkData.id}`, drinkData.data, {
      headers: {
        apiKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
    })
    return response.data
  } catch (error) {
    console.error('Error updating drink:', error)
    throw error
  }
}

const deleteDrink = async (drink: DeleteDrink) => {
  try {
    const response = await axios.delete(`${import.meta.env.VITE_API_URL}/delete-drink/${drink.id}`, {
      headers: {
        apiKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
    })
    return response.data
  } catch (error) {
    console.error('Error deleting drink:', error)
    throw error
  }
}


const fetchDrinkById = async (id: string | number) => {
  try {
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/drinks/${id}`, {
      headers: {
        apiKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
    })
    return {
        data: response.data,
        isRevalidating: response.headers['x-cache-revalidating'] === 'true'
    }
  } catch (error) {
    console.error('Error fetching drink:', error)
    throw error
  }
}

export default { createDrink, editDrink, deleteDrink, fetchDrinkById }