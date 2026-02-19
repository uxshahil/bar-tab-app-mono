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
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

import { storeToRefs } from 'pinia'
import { formatCurrency } from '@/utils/currency'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import * as z from 'zod'

interface Props {
  tabId: number
}

type Emits = (e: 'payment-processed') => void

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const tabsStore = useTabsStore()
const { tab } = storeToRefs(tabsStore)

const formSchema = toTypedSchema(
  z.object({
    amountPaid: z.number().min(0.01, 'Amount paid must be greater than 0'),
    tipAmount: z.number().min(0, 'Tip amount cannot be negative').default(0),
    paymentMethod: z.enum(['cash', 'card', 'mobile', 'mixed']),
  }),
)

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    amountPaid: 0,
    tipAmount: 0,
    paymentMethod: 'cash',
  },
})

const amountPaid = computed(() => form.values.amountPaid || 0)
const tipAmount = computed(() => form.values.tipAmount || 0)

const totalAmountPaid = computed(() => {
  return amountPaid.value + tipAmount.value
})

const balanceRemaining = computed(() => {
  return tab.value?.total_owed ? tab.value.total_owed - amountPaid.value : 0
})

const isOverpaid = computed(() => {
  return balanceRemaining.value < 0
})

const onSubmit = form.handleSubmit(async (values) => {
  try {
    // Record the payment
    await tabsStore.createPayment({
      tab_id: props.tabId,
      amount_paid: values.amountPaid,
      tip_added: values.tipAmount,
      payment_method: values.paymentMethod,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    // Update tab with new tip amount
    const newTip = (tab.value?.tip_amount || 0) + values.tipAmount
    const newTotal = (tab.value?.total_before_tip || 0) + newTip

    await tabsStore.updateTab(props.tabId, {
      tip_amount: newTip,
      total_owed: newTotal,
      status: balanceRemaining.value <= 0 ? 'settled' : 'open',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    // If overpaid, the overflow becomes tip implicitly via balance calculations

    emit('payment-processed')
  } catch (error) {
    console.error('Error processing payment:', error)
  }
})
</script>

<template>
  <Dialog open @update:open="!$event && $emit('payment-processed')">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Process Payment</DialogTitle>
      </DialogHeader>

      <form @submit="onSubmit" class="space-y-4 py-4">
        <!-- Total Owed Display -->
        <div class="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
          <p class="text-xs text-muted-foreground">Total Owed</p>
          <p class="text-2xl font-bold">{{ formatCurrency(tab?.total_owed || 0) }}</p>
        </div>

        <!-- Amount Paid -->
        <FormField v-slot="{ componentField }" name="amountPaid">
          <FormItem>
            <FormLabel>Amount Paid</FormLabel>
            <FormControl>
              <Input type="number" step="0.01" placeholder="0.00" v-bind="componentField" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <!-- Balance Info -->
        <div
          class="p-3 rounded-lg text-sm"
          :class="
            balanceRemaining >= 0
              ? 'bg-yellow-50 dark:bg-yellow-950'
              : 'bg-green-50 dark:bg-green-950'
          "
        >
          <p class="text-xs text-muted-foreground">Balance Remaining</p>
          <p class="font-bold text-lg">{{ formatCurrency(balanceRemaining) }}</p>
          <p v-if="isOverpaid" class="text-xs mt-1 text-green-600">
            ✓ Overpaid by {{ formatCurrency(Math.abs(balanceRemaining)) }} (becomes tip)
          </p>
        </div>

        <!-- Tip Amount -->
        <FormField v-slot="{ componentField }" name="tipAmount">
          <FormItem>
            <FormLabel>Tip Amount (Optional)</FormLabel>
            <FormControl>
              <Input type="number" step="0.01" placeholder="0.00" v-bind="componentField" />
            </FormControl>
            <p class="text-xs text-muted-foreground">Adding tip separately from payment</p>
            <FormMessage />
          </FormItem>
        </FormField>

        <!-- Payment Method -->
        <FormField v-slot="{ componentField }" name="paymentMethod">
          <FormItem>
            <FormLabel>Payment Method</FormLabel>
            <Select v-bind="componentField">
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a payment method" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="mobile">Mobile</SelectItem>
                <SelectItem value="mixed">Mixed</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        </FormField>

        <!-- Summary -->
        <div class="bg-muted p-3 rounded-lg space-y-1 text-sm">
          <div class="flex justify-between">
            <span>Amount Paid:</span>
            <span>{{ formatCurrency(amountPaid) }}</span>
          </div>
          <div class="flex justify-between">
            <span>Tip:</span>
            <span>{{ formatCurrency(tipAmount) }}</span>
          </div>
          <div class="flex justify-between font-bold border-t pt-1">
            <span>Total Payment:</span>
            <span>{{ formatCurrency(totalAmountPaid) }}</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-2 pt-4">
          <Button type="submit" class="flex-1"> Process Payment </Button>
          <DialogClose as-child>
            <Button variant="outline" class="flex-1">Cancel</Button>
          </DialogClose>
        </div>
      </form>
    </DialogContent>
  </Dialog>
</template>
