<script setup lang="ts">
import { useTabsStore } from '@/stores/loaders/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import { storeToRefs } from 'pinia'
import { formatCurrency } from '@/utils/currency'

interface Props {
  tabId: number
}

interface Emits {
  (e: 'payment-processed'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const tabsStore = useTabsStore()
const { tab } = storeToRefs(tabsStore)

const formData = ref({
  amountPaid: 0,
  tipAmount: 0,
  paymentMethod: 'cash' as 'cash' | 'card' | 'mobile' | 'mixed',
})

const totalAmountPaid = computed(() => {
  return formData.value.amountPaid + formData.value.tipAmount
})

const balanceRemaining = computed(() => {
  return tab.value?.total_owed ? tab.value.total_owed - formData.value.amountPaid : 0
})

const isOverpaid = computed(() => {
  return balanceRemaining.value < 0
})

const processPayment = async () => {
  if (formData.value.amountPaid <= 0) {
    console.error('Amount paid must be greater than 0')
    return
  }

  try {
    // Record the payment
    await tabsStore.createPayment({
      tab_id: props.tabId,
      amount_paid: formData.value.amountPaid,
      tip_added: formData.value.tipAmount,
      payment_method: formData.value.paymentMethod,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    // Update tab with new tip amount
    const newTip = (tab.value?.tip_amount || 0) + formData.value.tipAmount
    const newTotal = (tab.value?.total_before_tip || 0) + newTip

    await tabsStore.updateTab(props.tabId, {
      tip_amount: newTip,
      total_owed: newTotal,
      status: balanceRemaining.value <= 0 ? 'settled' : 'open',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    // If overpaid, the overflow becomes tip
    if (isOverpaid.value) {
      const tipOverflow = Math.abs(balanceRemaining.value)
      console.log(`Added R${tipOverflow.toFixed(2)} as tip from overpayment`)
    }

    emit('payment-processed')
  } catch (error) {
    console.error('Error processing payment:', error)
  }
}


</script>

<template>
  <Dialog open @update:open="!$event && $emit('payment-processed')">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Process Payment</DialogTitle>
      </DialogHeader>

      <div class="space-y-4 py-4">
        <!-- Total Owed Display -->
        <div class="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
          <p class="text-xs text-muted-foreground">Total Owed</p>
          <p class="text-2xl font-bold">{{ formatCurrency(tab?.total_owed || 0) }}</p>
        </div>

        <!-- Amount Paid -->
        <div class="space-y-2">
          <label class="text-sm font-medium">Amount Paid</label>
          <input
            v-model.number="formData.amountPaid"
            type="number"
            step="0.01"
            class="w-full p-2 border rounded-md"
            placeholder="0.00"
          />
        </div>

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
        <div class="space-y-2">
          <label class="text-sm font-medium">Tip Amount (Optional)</label>
          <input
            v-model.number="formData.tipAmount"
            type="number"
            step="0.01"
            class="w-full p-2 border rounded-md"
            placeholder="0.00"
          />
          <p class="text-xs text-muted-foreground">Adding tip separately from payment</p>
        </div>

        <!-- Payment Method -->
        <div class="space-y-2">
          <label class="text-sm font-medium">Payment Method</label>
          <select v-model="formData.paymentMethod" class="w-full p-2 border rounded-md">
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="mobile">Mobile</option>
            <option value="mixed">Mixed</option>
          </select>
        </div>

        <!-- Summary -->
        <div class="bg-muted p-3 rounded-lg space-y-1 text-sm">
          <div class="flex justify-between">
            <span>Amount Paid:</span>
            <span>{{ formatCurrency(formData.amountPaid) }}</span>
          </div>
          <div class="flex justify-between">
            <span>Tip:</span>
            <span>{{ formatCurrency(formData.tipAmount) }}</span>
          </div>
          <div class="flex justify-between font-bold border-t pt-1">
            <span>Total Payment:</span>
            <span>{{ formatCurrency(totalAmountPaid) }}</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-2 pt-4">
          <Button @click="processPayment" :disabled="formData.amountPaid <= 0" class="flex-1">
            Process Payment
          </Button>
          <DialogClose as-child>
            <Button variant="outline" class="flex-1">Cancel</Button>
          </DialogClose>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
