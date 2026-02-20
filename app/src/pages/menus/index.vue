<script setup lang="ts">
import { columns } from '@/components/ui/data-table-columns/DataTableColumnsMenus'

const menusStore = useMenusStore()
const { menus } = storeToRefs(menusStore)

await menusStore.getMenus()
</script>

<template>
  <AppResourcePage title="Menus" :data="menus" :columns="columns" :loading="!menus" :options="{}" />
</template>
