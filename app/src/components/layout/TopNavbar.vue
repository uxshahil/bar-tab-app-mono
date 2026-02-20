<script setup lang="ts">
import type { Tabs } from '@/services/supabase/types/tabTypes'
import { useDark, useToggle } from '@vueuse/core'

const authStore = useAuthStore()
const { profile } = storeToRefs(authStore)
const { profileInitials } = authStore

import { menuKey, type MenuInjectionOptions } from '@/providers/injectionKeys'
const { rightSidebarOpen, toggleRightSidebar } = inject(menuKey) as MenuInjectionOptions

const router = useRouter()
const route = useRoute()
const isDark = useDark()
const toggleDark = useToggle(isDark)

const onTabSelected = (tab: Tabs[0]) => {
  // Always drive the sidebar via query param
  router.push({ query: { ...route.query, tabId: tab.id } })

  // Ensure sidebar is visible
  if (!rightSidebarOpen.value && toggleRightSidebar) {
    toggleRightSidebar()
  }
}
</script>

<template>
  <nav class="h-16 border-b bg-muted/40 flex gap-2 justify-between px-6 items-center">
    <div class="gap-x-2 flex flex col w-full">
      <AppActiveTabs v-if="profile?.user_role !== 'admin'" @tab-selected="onTabSelected" />
      <GlobalSearch />
    </div>

    <div class="flex justify-center items-center gap-1">
      <Button
        v-if="profile?.user_role !== 'admin'"
        @click="toggleRightSidebar"
        variant="outline"
        size="icon"
        class="w-8 h-8 mr-2"
      >
        <Transition name="scale" mode="out-in">
          <iconify-icon v-if="rightSidebarOpen" icon="lucide:panel-right-close" />
          <iconify-icon v-else icon="lucide:panel-right-open" />
        </Transition>
      </Button>

      <Button @click="toggleDark()" class="w-8 h-8">
        <Transition name="scale" mode="out-in">
          <iconify-icon v-if="isDark" icon="lucide:sun" />
          <iconify-icon v-else icon="lucide:moon" />
        </Transition>
      </Button>
      <div class="w-8 h-8">
        <DropdownMenu v-if="profile">
          <DropdownMenuTrigger>
            <Avatar>
              <AvatarImage
                :src="profile?.avatar_url ?? ''"
                :alt="`${profile?.full_name} profile picture`"
              />
              <AvatarFallback>
                {{ profileInitials() }}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <RouterLink :to="`/users/${profile.username}`" class="w-full h-full">
                Profile
              </RouterLink>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  </nav>
</template>
