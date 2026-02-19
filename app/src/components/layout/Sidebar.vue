<script setup lang="ts">
import { menuKey, type MenuInjectionOptions } from '@/providers/injectionKeys'
import { useWindowSize } from '@vueuse/core'
const { profile } = storeToRefs(useAuthStore())

const links = [
  {
    title: 'Dashboard',
    to: '/',
    icon: 'lucide:house',
    isPublic: false,
    role: ['admin', 'bar-staff', 'bar-manager'],
  },
  {
    title: 'Bars',
    to: '/bars',
    icon: 'lucide:beer',
    isPublic: false,
    role: [],
  },
  {
    title: 'Menus',
    to: '/menus',
    icon: 'lucide:square-menu',
    isPublic: false,
    role: [],
  },
  {
    title: 'Drinks',
    to: '/drinks',
    icon: 'lucide:wine',
    isPublic: true,
    role: ['admin', 'bar-staff', 'bar-manager'],
  },
  {
    title: 'Food',
    to: '/food',
    icon: 'lucide:apple',
    isPublic: false,
    role: [],
  },
  {
    title: 'Users',
    to: '/users',
    icon: 'lucide:users',
    isPublic: false,
    role: ['admin', 'bar-manager'],
  },
]

const rbacLinks = links.filter((link) => {
  if (link.role.includes(profile.value?.user_role || '')) {
    return link
  }
  return null
})

const accountLinks = computed(() => {
  return [
    {
      title: 'Profile',
      to: `/users/${profile.value?.username}`,
      icon: 'lucide:user',
    },
    {
      title: 'Sign Out',
      icon: 'lucide:log-out',
    },
  ]
})

const router = useRouter()

const executeAction = async (linkTitle: string) => {
  if (linkTitle === 'Sign Out') {
    const { logout } = await import('@/services/supabase/auth')
    const isLoggedOut = await logout()

    if (isLoggedOut) router.push('/login')
  }
}

defineEmits(['tabClicked', 'userClicked', 'drinkClicked'])

const { menuOpen, toggleMenu } = inject(menuKey) as MenuInjectionOptions
const windowWidth = useWindowSize().width

watchEffect(() => {
  if (windowWidth.value > 1024) {
    menuOpen.value = true
  } else {
    menuOpen.value = false
  }
})
</script>

<template>
  <aside
    class="flex flex-col h-screen gap-2 border-r fixed bg-muted/40 transition-[width]"
    :class="{ 'w-52': menuOpen, 'w-24': !menuOpen }"
  >
    <div class="flex h-16 items-center border-b px-2 lg:px-4 shrink-0 gap-1 justify-between">
      <Button @click="toggleMenu" variant="outline" size="icon" class="w-8 h-8">
        <iconify-icon icon="lucide:menu"></iconify-icon>
      </Button>

      <DropdownMenu v-if="['admin', 'bar-manager'].includes(profile?.user_role || '')">
        <DropdownMenuTrigger>
          <Button variant="outline" size="icon" class="w-8 h-8">
            <iconify-icon icon="lucide:plus"></iconify-icon>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem @click="$emit('drinkClicked')"> Drink </DropdownMenuItem>
          <DropdownMenuItem @click="$emit('userClicked')"> User </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>

    <nav class="flex flex-col gap-2 justify-between h-full relative">
      <div>
        <SidebarLinks :links="rbacLinks" />
      </div>

      <div class="border-y text-center bg-background py-3">
        <SidebarLinks :links="accountLinks" @actionClicked="executeAction" />
      </div>
    </nav>
  </aside>
</template>
