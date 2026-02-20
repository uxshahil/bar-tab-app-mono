<script setup lang="ts">
const route = useRoute()
const drinksStore = useDrinksStore()
const addToTabStore = useAddToTabStore()
const authStore = useAuthStore()
const { categoryDrinks } = storeToRefs(drinksStore)

const categorySlug = computed(() => (route.params as Record<string, string>).category || '')
const categoryTitle = computed(() => {
  const slug = categorySlug.value
  return slug.charAt(0).toUpperCase() + slug.slice(1) + ' Drinks'
})

const onEditDrink = (drink: Drink) => {
  useDrinkSheetStore().openSheet(drink.id)
}

const onAddToTab = (drink: Drink) => {
  addToTabStore.open(drink)
}

// Fetch data
await drinksStore.getDrinksByCategory(categorySlug.value)

// Watch for route changes to refetch if category changes
watch(
  () => (route.params as Record<string, string>).category || '',
  async (newCategory) => {
    if (newCategory) {
      await drinksStore.getDrinksByCategory(newCategory as string)
    }
  },
)
</script>

<template>
  <AppResourcePage
    :title="categoryTitle"
    :data="categoryDrinks"
    :columns="columns"
    :loading="!categoryDrinks"
    :options="{
      meta: {
        onAddToTab,
        onEditDrink,
        userRole: authStore.profile?.user_role,
      },
    }"
  />
</template>
