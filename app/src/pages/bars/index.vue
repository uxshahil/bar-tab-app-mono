<script setup lang="ts">
import { columns } from '@/components/ui/data-table-columns/DataTableColumnsBars'
import { storeToRefs } from 'pinia'
import { useBarsStore } from '@/stores/loaders/bars'

const barsStore = useBarsStore()
const { bars } = storeToRefs(barsStore)

await barsStore.getBars()
</script>

<template>
  <AppResourcePage
    title="Bars"
    :data="bars"
    :columns="columns"
    :loading="!bars"
    :options="{}"
  />
</template>
