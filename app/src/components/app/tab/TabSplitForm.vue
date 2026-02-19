<script setup lang="ts">
import { useTabsStore } from '@/stores/loaders/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface Props {
  tabId: number
}

interface Emits {
  (e: 'split-created'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const tabsStore = useTabsStore()
const vat = Number(import.meta.env.VITE_VAT) || 0.15

const formData = ref({
  splitNumber: 2,
  itemsIncluded: [] as string[],
  subtotal: 0,
  taxOnSplit: 0,
  totalOwed: 0,
})

const createSplit = async () => {
  if (formData.value.subtotal <= 0) {
    console.error('Subtotal must be greater than 0')
    return
  }

  try {
    const tax = formData.value.subtotal * 0.15

    await tabsStore.createTabSplit({
      tab_id: props.tabId,
      split_number: formData.value.splitNumber,
      items_included: formData.value.itemsIncluded,
      subtotal: formData.value.subtotal,
      tax_on_split: tax,
      total_owed: formData.value.subtotal + tax,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    // Update tab to mark as split
    await tabsStore.updateTab(props.tabId, {
      is_split: true,
      split_count: formData.value.splitNumber,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    emit('split-created')
  } catch (error) {
    console.error('Error creating split:', error)
  }
}
</script>

<template>
  <Dialog open @update:open="!$event && $emit('split-created')">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Create Bill Split</DialogTitle>
      </DialogHeader>

      <div class="space-y-4 py-4">
        <!-- Split Number -->
        <div class="space-y-2">
          <label class="text-sm font-medium">Split Number</label>
          <input
            v-model.number="formData.splitNumber"
            type="number"
            min="1"
            class="w-full p-2 border rounded-md"
          />
          <p class="text-xs text-muted-foreground">
            Enter the split number (e.g., 1, 2, 3 for 3-way split)
          </p>
        </div>

        <!-- Subtotal for this Split -->
        <div class="space-y-2">
          <label class="text-sm font-medium">Subtotal for this Split</label>
          <input
            v-model.number="formData.subtotal"
            type="number"
            step="0.01"
            class="w-full p-2 border rounded-md"
            placeholder="0.00"
          />
        </div>

        <!-- Tax Calculation -->
        <div class="space-y-2">
          <label class="text-sm font-medium">Tax ({vat}%)</label>
          <input
            :value="(formData.subtotal * vat).toFixed(2)"
            type="text"
            disabled
            class="w-full p-2 border rounded-md bg-muted"
          />
        </div>

        <!-- Total Owed -->
        <div class="space-y-2">
          <label class="text-sm font-medium">Total Owed (including tax)</label>
          <input
            :value="(formData.subtotal * 1.15).toFixed(2)"
            type="text"
            disabled
            class="w-full p-2 border rounded-md bg-muted font-bold"
          />
        </div>

        <!-- Actions -->
        <div class="flex gap-2 pt-4">
          <Button @click="createSplit" class="flex-1">Create Split</Button>
          <DialogClose as-child>
            <Button variant="outline" class="flex-1">Cancel</Button>
          </DialogClose>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
