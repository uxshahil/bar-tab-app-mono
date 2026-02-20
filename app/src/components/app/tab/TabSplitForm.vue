<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import * as z from 'zod'

interface Props {
  tabId: number
}

type Emits = (e: 'split-created') => void

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const tabsStore = useTabsStore()
const vat = Number(import.meta.env.VITE_VAT) || 0.15

const formSchema = toTypedSchema(
  z.object({
    splitNumber: z.number().min(1, 'Split number must be at least 1'),
    subtotal: z.number().min(0.01, 'Subtotal must be greater than 0'),
  }),
)

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    splitNumber: 2,
    subtotal: 0,
  },
})

// Calculations for display
const taxAmount = computed(() => {
  return (form.values.subtotal || 0) * vat
})

const totalOwed = computed(() => {
  return (form.values.subtotal || 0) + taxAmount.value
})

const onSubmit = form.handleSubmit(async (values) => {
  try {
    const tax = values.subtotal * vat

    await tabsStore.createTabSplit({
      tab_id: props.tabId,
      split_number: values.splitNumber,
      items_included: [], // Was empty in original formData default
      subtotal: values.subtotal,
      tax_on_split: tax,
      total_owed: values.subtotal + tax,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    // Update tab to mark as split
    await tabsStore.updateTab(props.tabId, {
      is_split: true,
      split_count: values.splitNumber,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    emit('split-created')
  } catch (error) {
    console.error('Error creating split:', error)
  }
})
</script>

<template>
  <Dialog open @update:open="!$event && $emit('split-created')">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Create Bill Split</DialogTitle>
      </DialogHeader>

      <form @submit="onSubmit" class="space-y-4 py-4">
        <!-- Split Number -->
        <FormField v-slot="{ componentField }" name="splitNumber">
          <FormItem>
            <FormLabel>Split Number</FormLabel>
            <FormControl>
              <Input type="number" v-bind="componentField" />
            </FormControl>
            <FormMessage />
            <p class="text-xs text-muted-foreground">
              Enter the split number (e.g., 1, 2, 3 for 3-way split)
            </p>
          </FormItem>
        </FormField>

        <!-- Subtotal for this Split -->
        <FormField v-slot="{ componentField }" name="subtotal">
          <FormItem>
            <FormLabel>Subtotal for this Split</FormLabel>
            <FormControl>
              <Input type="number" step="0.01" placeholder="0.00" v-bind="componentField" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <!-- Tax Calculation -->
        <div class="space-y-2">
          <FormLabel>Tax ({{ vat * 100 }}%)</FormLabel>
          <Input :value="taxAmount.toFixed(2)" type="text" disabled class="bg-muted" />
        </div>

        <!-- Total Owed -->
        <div class="space-y-2">
          <FormLabel>Total Owed (including tax)</FormLabel>
          <Input :value="totalOwed.toFixed(2)" type="text" disabled class="bg-muted font-bold" />
        </div>

        <!-- Actions -->
        <div class="flex gap-2 pt-4">
          <Button type="submit" class="flex-1">Create Split</Button>
          <DialogClose as-child>
            <Button variant="outline" class="flex-1">Cancel</Button>
          </DialogClose>
        </div>
      </form>
    </DialogContent>
  </Dialog>
</template>
