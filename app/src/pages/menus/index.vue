<script setup lang="ts">
import { columns } from '@/components/ui/data-table-columns/DataTableColumnsMenus'
import { storeToRefs } from 'pinia'
import { useMenusStore } from '@/stores/loaders/menus'

const menusStore = useMenusStore()
const { menus } = storeToRefs(menusStore)

await menusStore.getMenus()
</script>

<template>
  <AppResourcePage
    title="Menus"
    :data="menus"
    :columns="columns"
    :loading="!menus"
    :options="{}"
  />
</template>
