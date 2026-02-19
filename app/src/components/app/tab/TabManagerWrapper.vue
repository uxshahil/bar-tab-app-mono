<template>
  <div v-if="canManageTabs">
    <TabManager />
  </div>
  <div v-else class="p-4 text-center">
    <p class="text-muted-foreground">Access denied. Only bar staff and managers can manage tabs.</p>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'
import TabManager from './TabManager.vue'

const authStore = useAuthStore()
const { profile } = storeToRefs(authStore)

const canManageTabs = computed(() => {
  const userRole = profile.value?.user_role
  return userRole === 'bar-staff' || userRole === 'bar-manager'
})
</script>