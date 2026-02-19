<script setup lang="ts">
import Skeleton from '@/components/ui/skeleton/Skeleton.vue'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Props {
  rowCount?: number
  columnCount?: number
  showPagination?: boolean
}

withDefaults(defineProps<Props>(), {
  rowCount: 2,
  columnCount: 3,
  showPagination: true,
})
</script>

<template>
  <div class="space-y-4">
    <div class="border rounded-md">
      <!-- prettier-ignore -->
      <Table> <!-- NOSONAR -->
        <TableHeader>
          <TableRow>
            <TableHead v-for="i in columnCount" :key="i">
              <Skeleton class="h-6 w-[100px]" />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="i in rowCount" :key="i">
            <TableCell v-for="j in columnCount" :key="j">
              <Skeleton class="h-10 w-full" />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- Pagination Skeleton -->
    <div v-if="showPagination" class="flex items-center justify-between pl-4 pr-2 pb-4">
      <Skeleton class="h-4 w-[250px]" />
      <!-- Showing x of y -->
      <div class="flex items-center space-x-2">
        <Skeleton class="h-8 w-8" />
        <!-- Prev -->
        <Skeleton class="h-8 w-8" />
        <!-- 1 -->
        <Skeleton class="h-8 w-8" />
        <!-- 2 -->
        <Skeleton class="h-8 w-8" />
        <!-- Next -->
      </div>
    </div>
  </div>
</template>
