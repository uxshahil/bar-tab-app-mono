<script setup lang="ts" generic="TData, TValue">
const props = defineProps<{
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  options?: Partial<TableOptions<TData>> & { meta?: TableMeta<TData> }
  paginationKey?: string
}>()

const emit = defineEmits<{
  'pagination-change': [pagination: PaginationState]
}>()

const paginationStore = usePaginationStore()

// Local fallback state (if no key provided)
const localPagination = ref({
  pageIndex: 0,
  pageSize: 10,
})

// Computed source of truth
const pagination = computed(() => {
  if (props.paginationKey) {
    // If store has state, use it. Else default to 0.
    return paginationStore.getPagination(props.paginationKey) || { pageIndex: 0, pageSize: 10 }
  }
  return localPagination.value
})

const table = useVueTable({
  ...props.options,
  autoResetPageIndex: false,
  get data() {
    return props.data
  },
  get columns() {
    return props.columns
  },
  get meta() {
    return props.options?.meta as TableMeta<TData> | undefined
  },
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  // Controlled State
  state: {
    get pagination() {
      return pagination.value
    },
  },
  // Update Handler
  onPaginationChange: (updaterOrValue) => {
    // Resolve updater
    const old = pagination.value
    const next = typeof updaterOrValue === 'function' ? updaterOrValue(old) : updaterOrValue

    // SAFEGUARD: If asking to reset to 0, but we were on a higher page...
    if (next.pageIndex === 0 && old.pageIndex > 0) {
      // ...and we suspect it's because of missing data
      if (table.getFilteredRowModel().rows.length === 0) {
        return // REJECT the update. Keep the store as is.
      }
    }

    if (props.paginationKey) {
      paginationStore.setPagination(props.paginationKey, next)
    } else {
      localPagination.value = next
    }
    emit('pagination-change', next)
  },
})
</script>

<template>
  <div class="space-y-4">
    <div class="border rounded-md">
      <!-- prettier-ignore -->
      <Table> <!-- NOSONAR -->
        <TableHeader>
          <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
            <TableHead v-for="header in headerGroup.headers" :key="header.id">
              <FlexRender
                v-if="!header.isPlaceholder"
                :render="header.column.columnDef.header"
                :props="header.getContext()"
              />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <template v-if="table.getRowModel().rows?.length">
            <TableRow
              v-for="row in table.getRowModel().rows"
              :key="row.id"
              :data-state="row.getIsSelected() ? 'selected' : undefined"
            >
              <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
                <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
              </TableCell>
            </TableRow>
          </template>
          <template v-else>
            <TableRow>
              <TableCell :colspan="columns.length" class="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          </template>
        </TableBody>
      </Table>
    </div>

    <div class="flex items-center justify-between pl-4 pr-2 pb-4">
      <div class="flex-1 text-sm text-muted-foreground">
        Showing
        {{ table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1 }} to
        {{
          Math.min(
            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
            table.getFilteredRowModel().rows.length,
          )
        }}
        of {{ table.getFilteredRowModel().rows.length }} entries
      </div>
      <div class="flex items-center space-x-6 lg:space-x-8">
        <Pagination
          v-if="table.getPageCount() > 1"
          :total="table.getFilteredRowModel().rows.length"
          :items-per-page="table.getState().pagination.pageSize"
          :sibling-count="1"
          show-edges
          :default-page="1"
          :page="table.getState().pagination.pageIndex + 1"
          @update:page="(p) => table.setPageIndex(p - 1)"
        >
          <PaginationContent>
            <PaginationFirst
              href="#"
              @click.prevent="table.setPageIndex(0)"
              :class="{ 'pointer-events-none opacity-50': !table.getCanPreviousPage() }"
            />
            <PaginationPrevious
              href="#"
              @click.prevent="table.previousPage()"
              :class="{ 'pointer-events-none opacity-50': !table.getCanPreviousPage() }"
            />

            <template v-for="(_, index) in table.getPageCount()" :key="index">
              <PaginationItem
                v-if="
                  index === 0 ||
                  index === table.getPageCount() - 1 ||
                  (index >= table.getState().pagination.pageIndex - 1 &&
                    index <= table.getState().pagination.pageIndex + 1)
                "
                :value="index + 1"
                :is-active="table.getState().pagination.pageIndex === index"
              >
                {{ index + 1 }}
              </PaginationItem>
              <PaginationEllipsis
                v-else-if="
                  (index === 1 && table.getState().pagination.pageIndex > 2) ||
                  (index === table.getPageCount() - 2 &&
                    table.getState().pagination.pageIndex < table.getPageCount() - 3)
                "
              />
            </template>

            <PaginationNext
              href="#"
              @click.prevent="table.nextPage()"
              :class="{ 'pointer-events-none opacity-50': !table.getCanNextPage() }"
            />
            <PaginationLast
              href="#"
              @click.prevent="table.setPageIndex(table.getPageCount() - 1)"
              :class="{ 'pointer-events-none opacity-50': !table.getCanNextPage() }"
            />
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  </div>
</template>

<style scoped>
td {
  padding: 0;
}

td > * {
  padding: 16px;
}
</style>
