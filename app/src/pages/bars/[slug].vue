<script setup lang="ts">
import { barQuery } from '@/services/supabase/queries/barQueries'
import type { Bar, BarMenus } from '@/services/supabase/types/barTypes'
import { RouterLink } from 'vue-router'

const userRouteWithIdParam = useRoute('/bars/[slug]')

const bar = ref<Bar | null>(null)
const menus = ref<Partial<BarMenus>[] | null>(null)

watch(
  () => bar.value?.name,
  () => {
    usePageStore().pageData.title = `Bar: ${bar.value?.name || ''}`
  },
)

const getBar = async () => {
  const { data, error, status } = await barQuery(userRouteWithIdParam.params?.slug)

  if (error) useErrorStore().setError({ error, customCode: status })

  bar.value = data
  if (data?.bar_menu) {
    menus.value = data.bar_menu.map((menu) => ({
      ...menu,
      menu_name: menu.menu_name ?? undefined,
    }))
  }

  console.log(menus.value)
}

await getBar()
</script>

<template>
  <Table v-if="bar">
    <TableRow>
      <TableHead> Name </TableHead>
      <TableCell> {{ bar.name }} </TableCell>
    </TableRow>
    <TableRow v-if="menus">
      <TableHead> Menus </TableHead>
      <TableCell v-for="menu in menus" :key="menu.menu_name">
        <RouterLink :to="`/${menu.menu_name?.toLowerCase()}`">
          {{ menu.menu_name }}
        </RouterLink>
        <!-- <div class="flex" :v-for="menu in menus" :key="`${menu}`"> -->
        <!-- <p>{{ JSON.stringify(menus) }}</p> -->
        <!-- <RouterLink :to="`/${(menu?.menu_name || '').toLowerCase()}`" /> -->
        <!-- </div> -->
      </TableCell>
    </TableRow>
  </Table>
</template>

<style></style>
