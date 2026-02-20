<script setup lang="ts">
import { columns } from '@/components/ui/data-table-columns/DataTableColumnsBars'

const barsStore = useBarsStore()
const { bars } = storeToRefs(barsStore)

await barsStore.getBars()
</script>

<template>
  <AppResourcePage title="Bars" :data="bars" :columns="columns" :loading="!bars" :options="{}" />
</template>
