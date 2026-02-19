<script setup lang="ts" generic="TData, TValue">
import { usePageStore } from '@/stores/page'
import type { ColumnDef, PaginationState } from '@tanstack/vue-table'
import { watch } from 'vue'
import DataTable from '@/components/ui/data-table/DataTable.vue'
import DataTableSkeleton from '@/components/ui/data-table/DataTableSkeleton.vue'

const props = defineProps<{
  title: string
  data: TData[] | null
  columns: ColumnDef<TData, TValue>[]
  loading?: boolean
  emptyText?: string
  options?: any
  paginationKey?: string
}>()

const emit = defineEmits<{
  (e: 'pagination-change', pagination: PaginationState): void
}>()

const pageStore = usePageStore()

// Set title immediately
pageStore.pageData.title = props.title

// Watch for title changes just in case
watch(() => props.title, (newTitle) => {
    pageStore.pageData.title = newTitle
})

</script>

<template>
  <div class="relative w-full h-full space-y-4">
    <div v-if="$slots.actions" class="flex justify-end mb-4">
        <slot name="actions"></slot>
    </div>

    <DataTableSkeleton 
      v-if="loading || !data" 
      :column-count="columns.length"
      :row-count="10"
    />

    <DataTable
      v-else
      :data="data"
      :columns="columns"
      :loading="loading"
      class="w-full"
      :empty-text="emptyText || `No ${title.toLowerCase()} found`"
      :options="options"
      :pagination-key="paginationKey"
      @pagination-change="(val) => emit('pagination-change', val)"
    />
    
    <!-- Slot for Sheets/Modals that live alongside the table -->
    <slot name="sheet"></slot>
  </div>
</template>
