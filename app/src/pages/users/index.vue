<script setup lang="ts">
import { columns } from '@/components/ui/data-table-columns/DataTableColumnsUsers'
import type { Profile } from '@/services/supabase/types/profileTypes'

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

const onEditUser = (user: Profile) => {
  useUserSheetStore().openSheet(user)
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
  />
</template>
