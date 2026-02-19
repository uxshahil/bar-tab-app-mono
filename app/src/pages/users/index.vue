<script setup lang="ts">
import { columns } from '@/components/ui/data-table-columns/DataTableColumnsUsers'
import { useUsersStore } from '@/stores/loaders/users'
import { storeToRefs } from 'pinia'
import AppUserSheet from '@/components/app/users/AppUserSheet.vue'
import AppResourcePage from '@/components/common/AppResourcePage.vue'
import type { Profile } from '@/services/supabase/types/profileTypes'

import { useRoute } from 'vue-router'
import { watch } from 'vue'

const usersStore = useUsersStore()
const { users } = storeToRefs(usersStore)
const route = useRoute()

// Initial fetch with search
usersStore.getUsers(route.query.search as string)

// Watch search
watch(
  () => route.query.search,
  (newSearch) => {
    usersStore.getUsers(newSearch as string)
  },
)

const isUserSheetOpen = ref(false)
const editingUser = ref<Profile | null>(null)

const onEditUser = (user: Profile) => {
  editingUser.value = user
  isUserSheetOpen.value = true
}

const onRefresh = async () => {
  await usersStore.getUsers(route.query.search as string)
}
</script>

<template>
  <AppResourcePage
    title="Users"
    :data="users"
    :columns="columns"
    :loading="!users"
    pagination-key="users-table"
    :options="{
      meta: {
        onEditUser,
      },
    }"
  >
    <template #sheet>
      <AppUserSheet
        v-model:open="isUserSheetOpen"
        :user-to-edit="editingUser"
        @close="editingUser = null"
        @refresh="onRefresh"
      />
    </template>
  </AppResourcePage>
</template>
