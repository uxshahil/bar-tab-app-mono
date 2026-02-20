<script setup lang="ts">
const { activeError } = storeToRefs(useErrorStore())
const errorStore = useErrorStore()

const addToTabStore = useAddToTabStore()

onErrorCaptured((error) => {
  errorStore.setError({ error })
  return false
})

onMounted(() => {
  useAuthStore().trackAuthChanges()
  useDrinksStore().initSocket()
})

const { user, profile } = storeToRefs(useAuthStore())

console.log(profile.value)

const AdminAuthLayout = defineAsyncComponent(
  () => import('./components/layout/main/AdminAuthLayout.vue'),
)

const StaffAuthLayout = defineAsyncComponent(
  () => import('./components/layout/main/StaffAuthLayout.vue'),
)

const GuestLayout = defineAsyncComponent(() => import('./components/layout/main/GuestLayout.vue'))

useMeta({
  title: 'Bar Tab App',
})
</script>

<template>
  <metainfo></metainfo>
  <Transition name="fade" mode="out-in">
    <Component
      :is="
        profile?.user_role === 'admin'
          ? AdminAuthLayout
          : profile?.user_role === 'bar-staff' || profile?.user_role === 'bar-manager'
            ? StaffAuthLayout
            : GuestLayout
      "
      :key="user?.id"
    >
      <AppErrorPage v-if="activeError" />

      <RouterView v-else v-slot="{ Component, route }">
        <Transition name="fade" mode="out-in">
          <div class="w-full" :key="route.path">
            <Suspense v-if="Component" :timeout="0">
              <Component :is="Component" :key="route.name">hi</Component>
              <template #fallback>
                <div
                  class="absolute top-1/2 transform -translate-y-1/2 left-1/2 -translate-x-1/2 flex justify-center items-center w-full h-screen bg-background bg-opacity-90 z-50"
                >
                  <iconify-icon icon="lucide:loader-circle" class="text-6xl animate-spin" />
                </div>
              </template>
            </Suspense>
          </div>
        </Transition>
      </RouterView>
    </Component>
  </Transition>

  <AppAddToTab v-model:open="addToTabStore.isOpen" :drink="addToTabStore.drink" />
</template>
