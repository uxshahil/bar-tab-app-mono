<script setup lang="ts">
const tabsStore = useTabsStore()
const { tab, tabItems, tabSplits, tabPayments } = storeToRefs(tabsStore)

interface Props {
  tabId: string | number
}

const props = defineProps<Props>()
const staffProfile = ref<Profile | null>(null)
const barName = ref<string>('BAR TAB LIQUORS')

// Editing State
const editingItemId = ref<number | null>(null)

const startEditing = (item: TabItem) => {
  editingItemId.value = item.id
}

const cancelEditing = () => {
  editingItemId.value = null
}

const saveEdit = async (item: TabItem, form: { quantity: number; specialInstructions: string }) => {
  console.log('saveEdit called for item:', item.id, 'with form:', form)
  const success = await tabsStore.updateDrinkInTab({
    tabId: Number(props.tabId),
    itemId: item.id,
    updates: {
      quantity: Number(form.quantity), // Ensure number
      specialInstructions: form.specialInstructions,
    },
  })

  if (success) {
    editingItemId.value = null
    // Force re-fetch to ensure UI updates
    await tabsStore.getTabItems(props.tabId.toString())
  } else {
    console.error('Failed to save edit')
    // Optional: Show error toast
  }
}

// Watch for changes to debug reactivity
watch(
  () => tabItems.value,
  (newItems) => {
    console.log('tabItems updated in component:', newItems)
  },
  { deep: true },
)

// Description Editing
const isEditingDescription = ref(false)
const descriptionForm = ref('')

const startEditingDescription = () => {
  descriptionForm.value = tab.value?.special_notes || ''
  isEditingDescription.value = true
}

const cancelEditingDescription = () => {
  isEditingDescription.value = false
}

const saveDescription = async () => {
  if (!tab.value) return

  const success = await tabsStore.updateTab(tab.value.id, {
    special_notes: descriptionForm.value,
  })

  if (success) {
    isEditingDescription.value = false
  }
}

// Expandable Notes Logic
const expandedNoteId = ref<number | null>(null)

const toggleNote = (itemId: number) => {
  if (expandedNoteId.value === itemId) {
    expandedNoteId.value = null
  } else {
    expandedNoteId.value = itemId
  }
}

const handleScroll = () => {
  if (expandedNoteId.value) {
    expandedNoteId.value = null
  }
}

const totalPaid = computed(() => {
  return tabPayments.value?.reduce((sum, p) => sum + (Number(p.amount_paid) || 0), 0) || 0
})

const handleCheckout = async () => {
  if (!tab.value) return

  if (selectedSplitId.value) {
    // Handle Split Payment
    // For now, just log or show toast as this logic might need a payment flow
    console.log('Pay Split:', selectedSplitId.value, currentViewTotals.value)
    alert(
      'Split payment flow to be implemented. Total: ' +
        formatCurrency(currentViewTotals.value.totalOwed),
    )
    return
  }

  // Enforce Payment Validation
  const totalDue = currentViewTotals.value.totalBeforeTip
  const paid = totalPaid.value

  if (paid < totalDue) {
    alert(
      `Cannot close tab. Payment incomplete.\nPaid: ${formatCurrency(paid)}\nDue: ${formatCurrency(totalDue)}\nremaining: ${formatCurrency(totalDue - paid)}`,
    )
    return
  }

  // Calculate final tip and total owed
  // If paid > due, difference is tip
  const finalTip = paid > totalDue ? paid - totalDue : 0
  const finalTotalOwed = paid

  // Confirm closure
  if (
    !confirm(
      `Closing tab with:\nTotal: ${formatCurrency(totalDue)}\nTips: ${formatCurrency(finalTip)}\nTotal Paid: ${formatCurrency(paid)}`,
    )
  ) {
    return
  }

  const success = await tabsStore.checkoutTab(tab.value.id, {
    subtotal: currentViewTotals.value.subtotal,
    tax_amount: currentViewTotals.value.tax,
    total_before_tip: currentViewTotals.value.totalBeforeTip,
    total_owed: finalTotalOwed,
    tip_amount: finalTip,
  })

  if (success) {
    // Optional: Redirect or show success message
    // For now, the UI will update to show "Tab is closed"
  }
}

// Format currency
import { formatCurrency } from '@/utils/currency'

import { useNow } from '@vueuse/core'
const now = useNow()

const loadStaffProfile = async (userId: string) => {
  const { data } = await profileQuery({ column: 'id', value: userId })
  if (data) staffProfile.value = data
}

onMounted(async () => {
  await tabsStore.getTab(props.tabId.toString())
  if (tab.value?.user_id) {
    await loadStaffProfile(tab.value.user_id)
  }

  if (tab.value?.bar_id) {
    const { data: barData } = await barByIdQuery(tab.value.bar_id)
    if (barData?.name) {
      barName.value = barData.name
    }
  }

  await tabsStore.getTabItems(props.tabId.toString())
  await tabsStore.getTabSplits(props.tabId.toString())
  await tabsStore.getTabPayments(props.tabId.toString())
})

const getTabDuration = (dateString: string) => {
  const startDate = new Date(dateString)

  let endDate = now.value
  if (tab.value?.status === 'closed' || tab.value?.status === 'settled') {
    // If settled_at exists, use it. Otherwise fall back to updated_at.
    if (tab.value.settled_at) {
      endDate = new Date(tab.value.settled_at)
    } else if (tab.value.updated_at) {
      endDate = new Date(tab.value.updated_at)
    }
  }

  const diffInSeconds = Math.floor((endDate.getTime() - startDate.getTime()) / 1000)

  const hours = Math.floor(diffInSeconds / 3600)
  const minutes = Math.floor((diffInSeconds % 3600) / 60)
  const seconds = diffInSeconds % 60

  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
}

const splitBillSheetStore = useSplitBillSheetStore()

// Split Logic
const selectedSplitId = ref<number | null>(null)

const getSplitItems = (splitId: number | null) => {
  if (!tabItems.value) return []
  if (!splitId) return tabItems.value

  const split = tabSplits.value?.find((s) => s.id === splitId)
  if (!split) return []

  // Filter items that are in the split's items_included array
  // items_included is an array of string IDs
  return tabItems.value.filter((item) => split.items_included?.includes(item.id.toString()))
}

const getUnassignedItems = () => {
  if (!tabItems.value) return []

  // Get all item IDs that are assigned to any split
  const assignedItemIds = new Set<string>()
  tabSplits.value?.forEach((split) => {
    split.items_included?.forEach((id) => assignedItemIds.add(id))
  })

  // Return items whose IDs are NOT in the assigned set
  return tabItems.value.filter((item) => !assignedItemIds.has(item.id.toString()))
}

import { calculateTabTotals } from '@/utils/tabCalculations'

// Computed Totals based on View
const currentViewTotals = computed(() => {
  let itemsToSum = []

  if (selectedSplitId.value) {
    itemsToSum = getSplitItems(selectedSplitId.value)
  } else {
    itemsToSum = tabItems.value || []
  }

  const totals = calculateTabTotals(itemsToSum, Number(tab.value?.tip_amount) || 0)

  // Override totalOwed for Split View logic currently in component
  // The util returns simple totalOwed = total + tip.
  // The component had logic: if split, totalOwed = totalBeforeTip (no tip).
  // If main view, totalOwed = totalBeforeTip + tip.
  // Let's preserve that logic manually or adjust util usage.

  // Actually, let's stick to the util but handle the split-specific tip logic here if needed.
  // In the split view, tip shouldn't be included unless split has its own tip?
  // For now, let's replicate the old logic:

  const totalOwed =
    totals.totalBeforeTip +
    (selectedSplitId.value === null ? Number(tab.value?.tip_amount) || 0 : 0)

  return {
    subtotal: totals.subtotal,
    tax: totals.tax,
    totalBeforeTip: totals.totalBeforeTip,
    totalOwed,
  }
})

// Watch for tab changes to reload profile
watch(
  () => tab.value?.user_id,
  async (newUserId) => {
    if (newUserId) {
      await loadStaffProfile(newUserId)
    }
  },
)

// Update quantity helper
const updateQuantity = async (item: TabItem, change: number) => {
  const newQuantity = Math.max(1, item.quantity + change)
  if (newQuantity === item.quantity) return

  await tabsStore.updateDrinkInTab({
    tabId: Number(props.tabId),
    itemId: item.id,
    updates: { quantity: newQuantity },
  })
}

import AppReceipt from './AppReceipt.vue'
import ItemRow from './ItemRow.vue'

const showReceipt = ref(false)

const handleEmailReceipt = () => {
  // In a real app, this would send an API request
  // For now, we simulate a successful send after seeing the preview
  // We could use window.print() here on the receipt element
  showReceipt.value = true
}

const sendEmail = () => {
  alert(`Receipt sent to user@example.com (Simulated)`)
  showReceipt.value = false
}

// Receipt Computed Data
const receiptItems = computed(() => {
  if (selectedSplitId.value) {
    return getSplitItems(selectedSplitId.value)
  }
  return tabItems.value || []
})

const receiptTab = computed(() => {
  if (!tab.value) return null

  // Always use the calculated view totals to ensure Receipt matches UI exactly
  return {
    ...tab.value,
    subtotal: currentViewTotals.value.subtotal,
    tax_amount: currentViewTotals.value.tax,
    total_before_tip: currentViewTotals.value.totalBeforeTip,
    total_owed: currentViewTotals.value.totalOwed,
    tip_amount: selectedSplitId.value === null ? tab.value.tip_amount || 0 : 0,
    tab_payment: selectedSplitId.value
      ? tab.value.tab_payment?.filter((p) => p.split_id === selectedSplitId.value)
      : tab.value.tab_payment,
  }
})
</script>

<template>
  <div v-if="tab" class="space-y-6 p-4">
    <!-- Tab Header -->
    <div class="border-b pb-4">
      <div class="flex justify-between items-start flex-col">
        <div class="text-right space-y-2 mb-4">
          <div class="flex justify-end gap-2">
            <Button variant="outline" size="sm" @click="handleEmailReceipt">
              <iconify-icon icon="lucide:mail" class="mr-2 h-4 w-4" />
              Email Receipt
            </Button>
            <Button variant="outline" size="sm" @click="splitBillSheetStore.openSheet(tab.id)">
              <iconify-icon icon="lucide:split" class="mr-2 h-4 w-4" />
              Split Bill
            </Button>
          </div>
        </div>
        <div>
          <h2 class="text-2xl font-bold">{{ tab.tab_number }}</h2>
          <div class="flex items-center gap-2 mt-1">
            <span class="text-sm text-muted-foreground">Status:</span>
            <span class="capitalize font-medium text-sm">{{ tab.status }}</span>
            <span class="text-muted-foreground mx-1">•</span>
            <iconify-icon icon="lucide:clock" class="text-muted-foreground text-xs" />
            <span class="font-mono text-sm font-medium">{{ getTabDuration(tab.created_at) }}</span>
          </div>
        </div>
      </div>

      <AppSplitBillSheet />

      <!-- Staff Indicator -->
      <div v-if="staffProfile" class="mt-3 flex items-center gap-2 text-sm bg-muted/50 p-2 rounded">
        <iconify-icon icon="lucide:user" class="text-muted-foreground" />
        <span class="text-muted-foreground">Opened by:</span>
        <span class="font-medium">{{
          staffProfile.full_name || staffProfile.username || 'Unknown'
        }}</span>
        <Badge variant="outline" class="text-[10px] h-5 ml-1 capitalize">
          {{ staffProfile.user_role?.replace('_', ' ') || 'Staff' }}
        </Badge>
      </div>

      <div class="text-xs text-muted-foreground flex flex-col mt-4">
        <p>Created: {{ new Date(tab.created_at).toLocaleDateString() }}</p>
        <p>Tab ID: {{ tab.id }}</p>
      </div>

      <div class="mt-4">
        <div v-if="!isEditingDescription" class="group flex items-start gap-2">
          <div class="flex-1">
            <span class="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
              >Description / Location</span
            >
            <p class="text-sm mt-1">
              {{ tab.special_notes || 'No description set' }}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            class="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            @click="startEditingDescription"
          >
            <iconify-icon icon="lucide:pencil" class="text-xs" />
          </Button>
        </div>

        <div v-else class="space-y-2">
          <span class="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
            >Description / Location</span
          >
          <div class="flex gap-2">
            <textarea
              v-model="descriptionForm"
              class="flex-1 min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="e.g., Table 5, Bar Seat"
            ></textarea>
            <div class="flex flex-col gap-1">
              <Button size="icon" class="h-8 w-8" @click="saveDescription">
                <iconify-icon icon="lucide:check" class="text-sm" />
              </Button>
              <Button variant="ghost" size="icon" class="h-8 w-8" @click="cancelEditingDescription">
                <iconify-icon icon="lucide:x" class="text-sm" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Split Selector -->
    <div
      v-if="tabSplits?.length"
      class="flex items-center gap-1 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide"
    >
      <Button
        variant="outline"
        size="sm"
        class="h-7 px-2 text-xs font-bold min-w-[3rem] text-muted-foreground cursor-pointer"
        :class="{ 'text-secondary-foreground hover:bg-primary/90': selectedSplitId === null }"
        @click="selectedSplitId = null"
      >
        ALL
      </Button>
      <Button
        v-for="split in tabSplits"
        :key="split.id"
        variant="outline"
        size="sm"
        class="h-7 px-2 text-xs font-bold min-w-[2.5rem] text-muted-foreground cursor-pointer"
        :class="{ 'text-secondary-foreground hover:bg-primary/90': selectedSplitId === split.id }"
        @click="selectedSplitId = split.id"
      >
        S{{ split.split_number }}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        class="h-7 w-7 shrink-0"
        @click="splitBillSheetStore.openSheet(tab.id)"
      >
        <iconify-icon icon="lucide:plus" class="text-base" />
      </Button>
    </div>

    <!-- Items Section -->
    <div class="space-y-3">
      <div class="flex justify-between items-center">
        <h3 class="font-semibold">
          {{
            selectedSplitId
              ? `Split ${tabSplits?.find((s) => s.id === selectedSplitId)?.split_number} Items`
              : 'All Items'
          }}
        </h3>
      </div>

      <div
        v-if="tabItems?.length"
        class="space-y-4 max-h-[60vh] overflow-y-auto pr-1"
        @scroll="handleScroll"
      >
        <!-- Grouped View (All) -->
        <template v-if="selectedSplitId === null">
          <!-- Unassigned Items -->
          <div v-if="getUnassignedItems().length > 0">
            <h4
              class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 sticky top-0 bg-background z-10 py-1"
            >
              Unassigned / Main Bill
            </h4>
            <div class="space-y-1">
              <div
                v-for="item in getUnassignedItems()"
                :key="item.id"
                class="group relative text-sm py-2 px-1 border-b border-dashed border-muted-foreground/20 last:border-0 hover:bg-muted/30 transition-colors"
              >
                <ItemRow
                  :item="item"
                  :editing-item-id="editingItemId"
                  :expanded-note-id="expandedNoteId"
                  @start-editing="startEditing"
                  @cancel-editing="cancelEditing"
                  @save-edit="saveEdit"
                  @toggle-note="toggleNote"
                  @update-quantity="updateQuantity"
                />
              </div>
            </div>
          </div>

          <!-- Split Groups -->
          <div v-for="split in tabSplits" :key="split.id">
            <h4
              class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 sticky top-0 bg-background z-10 py-1 mt-4"
            >
              Split {{ split.split_number }}
            </h4>
            <div class="space-y-1">
              <div
                v-for="item in getSplitItems(split.id)"
                :key="item.id"
                class="group relative text-sm py-2 px-1 border-b border-dashed border-muted-foreground/20 last:border-0 hover:bg-muted/30 transition-colors"
              >
                <ItemRow
                  :item="item"
                  :editing-item-id="editingItemId"
                  :expanded-note-id="expandedNoteId"
                  @start-editing="startEditing"
                  @cancel-editing="cancelEditing"
                  @save-edit="saveEdit"
                  @toggle-note="toggleNote"
                  @update-quantity="updateQuantity"
                />
              </div>
              <div
                v-if="getSplitItems(split.id).length === 0"
                class="text-xs text-muted-foreground italic py-2"
              >
                No items in this split
              </div>
            </div>
          </div>
        </template>

        <!-- Filtered View (Specific Split) -->
        <template v-else>
          <div class="space-y-1">
            <div
              v-for="item in getSplitItems(selectedSplitId)"
              :key="item.id"
              class="group relative text-sm py-2 px-1 border-b border-dashed border-muted-foreground/20 last:border-0 hover:bg-muted/30 transition-colors"
            >
              <ItemRow
                :item="item"
                :editing-item-id="editingItemId"
                :expanded-note-id="expandedNoteId"
                @start-editing="startEditing"
                @cancel-editing="cancelEditing"
                @save-edit="saveEdit"
                @toggle-note="toggleNote"
                @update-quantity="updateQuantity"
              />
            </div>
            <div
              v-if="getSplitItems(selectedSplitId).length === 0"
              class="text-center py-8 text-muted-foreground"
            >
              <p>No items assigned to this split</p>
              <Button variant="link" size="sm" @click="splitBillSheetStore.openSheet(tab.id)"
                >Manage Splits</Button
              >
            </div>
          </div>
        </template>
      </div>
      <div
        v-else
        class="flex flex-col items-center justify-center py-8 text-muted-foreground opacity-50"
      >
        <iconify-icon icon="lucide:receipt" class="text-3xl mb-2" />
        <p class="text-sm">No items yet</p>
      </div>
    </div>

    <!-- Totals Section -->
    <div class="border-t pt-4 space-y-2">
      <div class="flex justify-between text-sm">
        <span>Subtotal:</span>
        <span class="font-medium">{{ formatCurrency(currentViewTotals.subtotal) }}</span>
      </div>
      <div class="flex justify-between text-sm">
        <span>Tax (15%):</span>
        <span class="font-medium">{{ formatCurrency(currentViewTotals.tax) }}</span>
      </div>
      <div class="flex justify-between text-sm">
        <span>Total Before Tip:</span>
        <span class="font-medium">{{ formatCurrency(currentViewTotals.totalBeforeTip) }}</span>
      </div>
      <div
        v-if="(tab.tip_amount ?? 0) > 0 && selectedSplitId === null"
        class="flex justify-between text-sm border-t pt-2 mt-2"
      >
        <span>Tip:</span>
        <span class="font-medium text-green-600">+{{ formatCurrency(tab.tip_amount ?? 0) }}</span>
      </div>
      <div class="flex justify-between font-bold text-lg border-t pt-2 mt-2">
        <span>Bill Total:</span>
        <span>{{ formatCurrency(currentViewTotals.totalOwed) }}</span>
      </div>

      <div
        v-if="selectedSplitId === null && (tab.total_paid || 0) > 0"
        class="flex justify-between text-muted-foreground text-sm mt-1"
      >
        <span>Paid:</span>
        <span>-{{ formatCurrency(tab.total_paid || 0) }}</span>
      </div>

      <div
        v-if="selectedSplitId === null && (tab.total_paid || 0) > 0"
        class="flex justify-between font-bold text-lg text-primary mt-1 border-t border-dashed pt-2"
      >
        <span>Remaining Due:</span>
        <span>{{ formatCurrency(tab.remaining_balance ?? currentViewTotals.totalOwed) }}</span>
      </div>

      <div class="pt-4">
        <Button
          v-if="tab.status === 'open'"
          class="w-full"
          size="lg"
          @click="handleCheckout"
          :disabled="currentViewTotals.totalOwed === 0.0"
        >
          <iconify-icon icon="lucide:check-circle" class="mr-2" />
          {{
            selectedSplitId
              ? `Pay Split ${tabSplits?.find((s) => s.id === selectedSplitId)?.split_number}`
              : 'Checkout & Close Tab'
          }}
        </Button>
        <div
          v-else
          class="text-center p-2 bg-muted rounded text-sm font-medium text-muted-foreground"
        >
          Tab is {{ tab.status }}
        </div>
      </div>
    </div>

    <!-- Payments Section -->
    <div v-if="tabPayments?.length" class="border-t pt-4 space-y-3">
      <h3 class="font-semibold">Payment History</h3>
      <div class="space-y-2 max-h-32 overflow-y-auto">
        <div v-for="payment in tabPayments" :key="payment.id" class="p-2 bg-muted rounded text-xs">
          <div class="flex justify-between">
            <span>{{ formatCurrency(payment.amount_paid) }} via {{ payment.payment_method }}</span>
            <span class="text-muted-foreground">
              {{ new Date(payment.created_at).toLocaleTimeString() }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Receipt Dialog -->
  <Dialog v-model:open="showReceipt">
    <DialogContent class="max-w-[360px] p-0 bg-transparent border-0 shadow-none">
      <div class="relative">
        <AppReceipt
          v-if="receiptTab && receiptItems"
          :tab="receiptTab"
          :items="receiptItems"
          :merchant-name="barName"
        />
        <div class="absolute -bottom-12 left-0 right-0 flex justify-center gap-2">
          <Button @click="sendEmail" class="shadow-lg">
            <iconify-icon icon="lucide:send" class="mr-2" />
            Send
          </Button>
          <Button variant="secondary" @click="showReceipt = false" class="shadow-lg">
            Close
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
