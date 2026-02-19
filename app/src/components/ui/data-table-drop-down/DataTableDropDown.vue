<script setup lang="ts">
import { MoreHorizontal } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

defineProps<{
  object: {
    id: string | number
    name?: string
    editFn: Function
    deleteFn: Function
  }
}>()

function copy(id: string | number) {
  navigator.clipboard.writeText(id as string)
}
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" class="w-8 h-8 p-0">
        <span class="sr-only">Open menu</span>
        <MoreHorizontal class="w-4 h-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuLabel>Actions</DropdownMenuLabel>
      <DropdownMenuItem @click="copy(object.id)"> Copy {{ `${object.name}` }} ID </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem @click="object.editFn()">Edit {{ `${object.name}` }}</DropdownMenuItem>
      <DropdownMenuItem @click="object.deleteFn()">Delete {{ `${object.name}` }}</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
