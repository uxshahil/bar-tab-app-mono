<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { useNow } from '@vueuse/core'
import { formatCurrency } from '@/utils/currency'

const props = defineProps<{
  item: any
  editingItemId: number | null
  expandedNoteId: number | null
  editForm: {
    quantity: number
    specialInstructions: string
  }
}>()

const emit = defineEmits<{
  (e: 'startEditing', item: any): void
  (e: 'cancelEditing'): void
  (e: 'saveEdit', item: any): void
  (e: 'toggleNote', itemId: number): void
  (e: 'updateQuantity', item: any, change: number): void
}>()



const now = useNow()

const getRelativeTime = (dateString: string) => {
  const date = new Date(dateString)
  const diffInSeconds = Math.floor((now.value.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'Just now'
  
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    if (diffInHours === 0) return 'Less than an hour ago'
    return `${diffInHours} h ago`
  }
  
  return date.toLocaleDateString()
}

const truncateNote = (text: string, length = 20) => {
  if (!text) return ''
  if (text.length <= length) return text
  return text.substring(0, length) + '...'
}
</script>

<template>
  <!-- View Mode -->
  <div v-if="editingItemId !== item.id" class="flex justify-between items-start cursor-pointer" @click="emit('startEditing', item)">
    <div class="flex gap-2 flex-1">
      <span class="font-bold min-w-[1.5rem]">{{ item.quantity }}x</span>
      <div class="flex">        
        <!-- Expandable Notes -->
        <div v-if="item.special_instructions" class="mt-0.5">
          <span 
            v-if="expandedNoteId !== item.id"
            class="text-xs text-muted-foreground italic cursor-pointer hover:text-primary hover:underline decoration-dotted underline-offset-2 transition-colors"
            @click.stop="emit('toggleNote', item.id)"
          >
            -- {{ truncateNote(item.special_instructions) }}
          </span>
          <span 
            v-else
            class="text-xs text-foreground bg-muted/50 px-1.5 py-0.5 rounded cursor-pointer block mt-1 animate-in fade-in zoom-in-95 duration-200"
            @click.stop="emit('toggleNote', item.id)"
          >
            {{ item.special_instructions }}
          </span>
        </div>
        <div class="flex items-left justify-center gap-2 flex-col pt-0.5">
          <span class="font-medium leading-none">{{ item.menu_item?.name || `Item ${item.id}` }}</span>
          <span class="text-[10px] text-muted-foreground font-mono whitespace-nowrap text-left ">
            {{ getRelativeTime(item.created_at) }}
          </span>
        </div>
      </div>
    </div>
    <div class="text-right font-mono font-medium tabular-nums">
      {{ formatCurrency(item.item_total) }}
    </div>
  </div>

  <!-- Edit Mode -->
  <div v-else class="bg-muted/50 -mx-1 px-2 py-2 rounded-md space-y-2">
    <div class="flex items-center justify-between mb-2">
      <span class="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Edit Item</span>
      <div class="flex gap-1">
        <Button variant="ghost" size="icon" class="h-6 w-6" @click.stop="emit('cancelEditing')">
          <iconify-icon icon="lucide:x" class="text-xs" />
        </Button>
        <Button size="icon" class="h-6 w-6" @click.stop="emit('saveEdit', item)">
          <iconify-icon icon="lucide:check" class="text-xs" />
        </Button>
      </div>
    </div>
    
    <div class="flex items-center gap-2">
      <div class="flex items-center border rounded-md bg-background h-8">
        <button class="px-2 hover:bg-muted h-full border-r" @click.stop="editForm.quantity = Math.max(1, editForm.quantity - 1)">-</button>
        <span class="w-8 text-center font-bold text-sm">{{ editForm.quantity }}</span>
        <button class="px-2 hover:bg-muted h-full border-l" @click.stop="editForm.quantity++">+</button>
      </div>
      <input 
        v-model="editForm.specialInstructions"
        class="flex-1 h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
        placeholder="Add notes..."
        @keydown.enter="emit('saveEdit', item)"
        @click.stop
      />
    </div>
  </div>
</template>
