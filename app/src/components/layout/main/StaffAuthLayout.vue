<script setup lang="ts">
import { menuKey } from '@/providers/injectionKeys'
import AppRightSidebar from '@/components/layout/AppRightSidebar.vue'

const { pageData } = storeToRefs(usePageStore())

const taskSheetOpen = ref({ user: false, tab: false, drink: false })

const menuOpen = ref(false)
const toggleMenu = () => (menuOpen.value = !menuOpen.value)

const rightSidebarOpen = ref(true)
const toggleRightSidebar = () => (rightSidebarOpen.value = !rightSidebarOpen.value)

const userClicked = () => {
  taskSheetOpen.value = { user: true, tab: false, drink: false }
}

const tabClicked = () => {
  taskSheetOpen.value = { user: false, tab: true, drink: false }
}

const drinkClicked = () => {
  taskSheetOpen.value = { user: false, tab: false, drink: true }
}

provide(menuKey, {
  menuOpen,
  toggleMenu,
  rightSidebarOpen,
  toggleRightSidebar
})
</script>

<template>
  <div>
    <Sidebar @userClicked="userClicked" @tabClicked="tabClicked" @drinkClicked="drinkClicked" />
    <AppUserSheet v-model:open="taskSheetOpen.user" />
    <AppDrinkSheet v-model:open="taskSheetOpen.drink" />
    <!-- <AppNewTab v-model="taskSheetOpen.tab" /> -->

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