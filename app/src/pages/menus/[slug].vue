<script setup lang="ts">
import { menuQuery } from '@/services/supabase/queries/menuQueries'
import type { Menu } from '@/services/supabase/types/menuTypes'

const userRouteWithIdParam = useRoute('/menus/[slug]')

const menu = ref<Menu | null>(null)

watch(
  () => menu.value?.name,
  () => {
    usePageStore().pageData.title = `Menu: ${menu.value?.name || ''}`
  },
)

const getMenu = async () => {
  const { data, error, status } = await menuQuery(userRouteWithIdParam.params?.slug)

  if (error) useErrorStore().setError({ error, customCode: status })

  menu.value = data
}

await getMenu()
</script>

<template>
  <!-- prettier-ignore -->
  <Table v-if="menu"> <!-- NOSONAR -->
    <TableRow>
      <TableHead> Name </TableHead>
      <TableCell> {{ menu.name }} </TableCell>
    </TableRow>
    <TableRow>
      <TableHead> Categories </TableHead>
    </TableRow>
  </Table>
</template>

<style>
th {
  width: 100px;
}

h2 {
  margin-bottom: 16px;
  font-size: 1.125rem;
  font-weight: 600;
  width: fit-content;
}

.table-container {
  overflow: hidden;
  overflow-y: auto;
  border-radius: 0.375rem;
  background-color: #0f172a;
  height: 20rem;
}
</style>
