<script setup lang="ts">
import { menuKey } from '@/providers/injectionKeys'
import AppRightSidebar from '@/components/layout/AppRightSidebar.vue'

const { pageData } = storeToRefs(usePageStore())

const menuOpen = ref(false)
const toggleMenu = () => (menuOpen.value = !menuOpen.value)

const rightSidebarOpen = ref(true)
const toggleRightSidebar = () => (rightSidebarOpen.value = !rightSidebarOpen.value)

const userSheetStore = useUserSheetStore()
const drinkSheetStore = useDrinkSheetStore()

const userClicked = () => {
  userSheetStore.openSheet()
}

const tabClicked = () => {
  useNewTabSheetStore().openSheet()
}

const drinkClicked = () => {
  drinkSheetStore.openSheet()
}

provide(menuKey, {
  menuOpen,
  toggleMenu,
  rightSidebarOpen,
  toggleRightSidebar,
})
</script>

<template>
  <div>
    <Sidebar @userClicked="userClicked" @tabClicked="tabClicked" @drinkClicked="drinkClicked" />
    <AppUserSheet />
    <AppDrinkSheet />
    <AppAddToTab />
    <AppTabDetailsSheet />

    <div
      class="flex flex-col transition-[margin]"
      :class="{ 'ml-52': menuOpen, 'ml-24': !menuOpen }"
    >
      <TopNavbar />

      <div class="flex h-[calc(100vh-64px)]">
        <main class="flex-1 flex flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-scroll">
          <div class="flex items-center">
            <h1 class="text-lg font-semibold md:text-2xl">{{ pageData.title }}</h1>
          </div>
          <slot />
        </main>

        <AppRightSidebar />
      </div>
    </div>
  </div>
</template>
