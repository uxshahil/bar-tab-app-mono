export const useMenusStore = defineStore('menus-store', () => {
  const menus = ref<MenusWithCategories | null>(null)
  const menu = ref<Menu | null>(null)

  const getMenus = async () => {
    menus.value = null
    const { data, error, status } = await menusQuery

    if (error) {
      useErrorStore().setError({ error, customCode: status })
      return
    }
    menus.value = data
  }

  const getMenu = async (slug: string) => {
    menu.value = null
    const { data, error, status } = await menuQuery(slug)

    if (error) {
      useErrorStore().setError({ error, customCode: status })
      return
    }
    menu.value = data
  }

  const createMenu = async (menuData: Record<string, unknown>) => {
    try {
      const result = await menuApi.createMenu(menuData)
      await getMenus()
      return result
    } catch (error: unknown) {
      const e = error as Error
      useErrorStore().setError({ error: e.message || 'Failed to create menu', customCode: 500 })
      return null
    }
  }

  const updateMenu = async (id: number | string, updates: Record<string, unknown>) => {
    try {
      await menuApi.updateMenu(id, updates)
      // fetch menu by slug? updateMenu takes ID but getMenu takes slug.
      // This might be tricky if slug changes.
      // For now, if we have a loaded menu, and its id matches, we refetch it using its CURRENT slug?
      // Or if slug changed, we might need new slug.
      // Ideally we'd have getMenuById too.
      // For now I'll just refetch the list.
      return true
    } catch (error: unknown) {
      const e = error as Error
      useErrorStore().setError({ error: e.message || 'Failed to update menu', customCode: 500 })
      return false
    }
  }

  const deleteMenu = async (id: number | string) => {
    try {
      await menuApi.deleteMenu(id)
      await getMenus()
      return true
    } catch (error: unknown) {
      const e = error as Error
      useErrorStore().setError({ error: e.message || 'Failed to delete menu', customCode: 500 })
      return false
    }
  }

  // Socket Listeners
  socket.on('menu:created', () => {
    getMenus()
  })

  socket.on('menu:updated', () => {
    // Refetch if needed
    getMenus()
  })

  socket.on('menu:deleted', () => {
    getMenus()
  })

  return {
    menus,
    menu,
    getMenus,
    getMenu,
    createMenu,
    updateMenu,
    deleteMenu,
  }
})
