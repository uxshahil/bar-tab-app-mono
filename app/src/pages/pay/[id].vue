<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useTabsStore } from '@/stores/loaders/tabs'
import { storeToRefs } from 'pinia'
import { formatCurrency } from '@/utils/currency'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const route = useRoute()
const tabsStore = useTabsStore()
const { tab, tabSplits, tabItems } = storeToRefs(tabsStore)

const tabId = computed(() => {
    const queryId = route.query.tabId as string
    const paramId = (route.params as any).id as string
    return queryId || paramId
})

// Update URL if query ID differs from param ID
watchEffect(() => {
    const paramId = (route.params as any).id
    if (route.query.tabId && route.query.tabId !== paramId) {
        // Optional logic: Redirect or just accept it.
        // For now, the computed tabId handles fetching the right data.
    }
})

const loading = ref(true)
const processing = ref(false)
const success = ref(false)

// Split State
const selectedSplitId = ref<number | null>(null)

// Tip State
const tipPercentage = ref(15)
const customTipAmount = ref<number | undefined>()
const isCustomTip = ref(false)

// Load Tab & Splits & Items & Payments
onMounted(async () => {
    if (tabId.value) {
        await Promise.all([
            tabsStore.getTab(tabId.value),
            tabsStore.getTabSplits(tabId.value),
            tabsStore.getTabItems(tabId.value),
            tabsStore.getTabPayments(tabId.value)
        ])
        loading.value = false
    }
})

// Available Splits (only show open/unsettled ones)
const availableSplits = computed(() => {
    return tabSplits.value?.filter(s => s.status !== 'settled') || []
})

// Calculations - DYNAMIC (Don't trust DB totals)

const getItemsForCurrentView = () => {
    // If split selected, filter items
    if (selectedSplitId.value && tabSplits.value && tabItems.value) {
        const split = tabSplits.value.find(s => s.id === selectedSplitId.value)
        if (split && split.items_included) {
            return tabItems.value.filter(i => split.items_included.includes(String(i.id)))
        }
    }
    // Otherwise return all items
    return tabItems.value || []
}

import { calculateTabTotals } from '@/utils/tabCalculations'

const totals = computed(() => {
    const items = getItemsForCurrentView()
    return calculateTabTotals(items)
})

const subtotal = computed(() => totals.value.subtotal)
const tax = computed(() => totals.value.tax)
const totalBeforeTip = computed(() => totals.value.totalBeforeTip)

const allPayments = computed(() => tabsStore.tabPayments || [])

const totalPaid = computed(() => {
    // Only count payments for the current view
    // If split selected, only payments for that split? 
    // Usually payments are linked to split_id.
    if (selectedSplitId.value) {
        return allPayments.value
            .filter(p => p.split_id === selectedSplitId.value && p.status === 'completed')
            .reduce((sum, p) => sum + ((p.amount_paid || 0) - (p.tip_added || 0)), 0)
    }
    
    // Main Bill: All payments (excluding tips)
    return allPayments.value
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + ((p.amount_paid || 0) - (p.tip_added || 0)), 0)
})

const remainingToPay = computed(() => {
    return Math.max(0, totalBeforeTip.value - totalPaid.value)
})

const tipAmount = computed(() => {
    if (isCustomTip.value) return customTipAmount.value || 0
    return Number((totalBeforeTip.value * (tipPercentage.value / 100)).toFixed(2))
})

const totalToPay = computed(() => Number((remainingToPay.value + tipAmount.value).toFixed(2)))

// Actions
const selectTip = (pct: number) => {
    isCustomTip.value = false
    tipPercentage.value = pct
}

const toggleCustomTip = () => {
    isCustomTip.value = true
    customTipAmount.value = Number((totalBeforeTip.value * 0.15).toFixed(2))
}

const lastPaidAmount = ref(0) // Snapshot for success screen

const handlePay = async (method: 'apple' | 'google' | 'card') => {
    if (!tab.value) return
    processing.value = true
    
    // simulate delay
    await new Promise(resolve => setTimeout(resolve, 1500))

    const paymentAmount = totalToPay.value
    
    const successPayment = await tabsStore.createPayment({
        tab_id: tab.value.id,
        split_id: selectedSplitId.value, // Pass split ID if selected
        amount_paid: paymentAmount,
        payment_method: method === 'card' ? 'card' : 'mobile',
        tip_added: tipAmount.value,
        status: 'completed'
    })
    
    if (successPayment) {
        lastPaidAmount.value = paymentAmount
        success.value = true
        // Also settle the tab if fully paid? 
        // For simplicity, let's just record payment. 
        // The backend/POS logic we added earlier handles the rest (remaining balance).
    }
    
    processing.value = false
}

// Select Split logic
const selectSplit = (id: number | null) => {
    selectedSplitId.value = id
    // Reset custom tip when switching context
    isCustomTip.value = false
    customTipAmount.value = undefined
}
</script>

<template>
<div class="min-h-screen bg-background flex flex-col items-center p-4 md:p-8">
    
    <!-- Loading State -->
    <div v-if="loading" class="flex-1 flex flex-col justify-center items-center space-y-4">
        <iconify-icon icon="lucide:loader-2" class="animate-spin text-4xl text-primary" />
        <p class="text-muted-foreground">Loading your tab...</p>
    </div>

    <!-- Success State -->
    <div v-else-if="success" class="flex-1 flex flex-col justify-center items-center space-y-6 text-center animate-in fade-in zoom-in duration-500 max-w-md w-full">
        <div class="h-24 w-24 rounded-full bg-green-100 flex items-center justify-center text-green-600">
            <iconify-icon icon="lucide:check" class="text-5xl" />
        </div>
        <div>
            <h1 class="text-3xl font-bold">Payment Successful!</h1>
            <p class="text-muted-foreground mt-2">Thanks for visiting!</p>
        </div>
        <div class="w-full bg-muted/30 p-6 rounded-xl space-y-2">
            <div class="flex justify-between">
                <span>Total Paid</span>
                <span class="font-bold">{{ formatCurrency(lastPaidAmount) }}</span>
            </div>
            <p class="text-xs text-muted-foreground pt-4">A receipt has been sent to your email.</p>
        </div>
    </div>

    <!-- Payment View -->
    <div v-else-if="tab" class="w-full max-w-5xl flex-1 flex flex-col md:justify-center">     
        <div class="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16">
            
            <!-- Left Column: Bill Details -->
            <div class="md:col-span-7 space-y-6 flex flex-col justify-center mb-8">
                <!-- Header -->
                <div class="text-center md:text-left">
                    <h2 class="text-xl md:text-3xl font-serif font-bold">{{ tab.tab_number }}</h2>
                    <p class="text-muted-foreground text-sm">Review & Pay</p>
                </div>

                <!-- Split Selection Chips -->
                <div v-if="availableSplits.length > 0" class="flex flex-wrap gap-2 justify-center md:justify-start">
                    <button 
                        @click="selectSplit(null)"
                        class="px-4 py-2 rounded-full text-sm font-medium transition-all border"
                        :class="selectedSplitId === null 
                            ? 'bg-black text-white border-black shadow-sm' 
                            : 'bg-white text-gray-700 hover:bg-gray-50'"
                    >
                        Full Bill
                    </button>
                    <button 
                        v-for="split in availableSplits" 
                        :key="split.id"
                        @click="selectSplit(split.id)"
                        class="px-4 py-2 rounded-full text-sm font-medium transition-all border"
                        :class="selectedSplitId === split.id
                            ? 'bg-black text-white border-black shadow-sm' 
                            : 'bg-white text-gray-700 hover:bg-gray-50'"
                    >
                        {{ split.split_type === 'equal' ? 'Equal Split' : `Split #${split.split_number}` }} 
                        ({{ formatCurrency((split.total_owed || 0) - (split.amount_paid || 0)) }})
                    </button>
                </div>

                <!-- Bill Card -->
                <div class="bg-card border rounded-xl p-6 shadow-sm space-y-4">
                    <h3 class="font-semibold text-lg border-b pb-3 flex justify-between">
                        <span>{{ selectedSplitId ? 'Split Details' : 'Bill Details' }}</span>
                        <span v-if="selectedSplitId" class="text-xs font-normal text-muted-foreground bg-secondary px-2 py-1 rounded-md">
                            Part of {{ tab.tab_number }}
                        </span>
                    </h3>
                    
                    <div class="space-y-3">
                        <div class="flex justify-between text-sm">
                            <span class="text-muted-foreground">Subtotal</span>
                            <span>{{ formatCurrency(subtotal) }}</span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span class="text-muted-foreground">Tax</span>
                            <span>{{ formatCurrency(tax) }}</span>
                        </div>

                        <!-- Show Breakdown if partially paid and paying full bill -->
                        <div v-if="!selectedSplitId && (totalPaid || 0) > 0" class="pt-2 mt-2 border-t border-dashed">
                            <div class="flex justify-between text-sm">
                                <span class="text-muted-foreground">Bill Total</span>
                                <span>{{ formatCurrency(totalBeforeTip) }}</span>
                            </div>
                            <div class="flex justify-between text-sm text-green-600">
                                <span>Less Paid</span>
                                <span>-{{ formatCurrency(totalPaid || 0) }}</span>
                            </div>
                        </div>
                    </div>

                    <div class="h-px bg-border my-2"></div>
                    
                    <div class="flex justify-between font-semibold text-lg text-primary">
                        <span>{{ selectedSplitId ? 'Split Total' : 'Remaining Due' }}</span>
                        <span>{{ formatCurrency(remainingToPay) }}</span>
                    </div>
                </div>
            </div>
            </div>

            <!-- Right Column: Payment Actions -->
            <div class="md:col-span-7 space-y-6 flex flex-col justify-center">
                
                <div class="space-y-6 bg-card/50 md:p-8 md:border md:rounded-xl md:shadow-sm">
                    <!-- Tip Selection -->
                    <div class="space-y-4">
                        <label class="font-medium text-sm flex items-center justify-between">
                            Add Gratuity
                            <span class="text-primary font-bold">{{ formatCurrency(tipAmount) }}</span>
                        </label>
                        
                        <!-- Quick Chips -->
                        <div class="grid grid-cols-5 gap-2">
                            <button 
                                v-for="amt in [0, 10, 15, 20, 25]" 
                                :key="amt"
                                @click="selectTip(amt)"
                                class="h-10 rounded-md text-sm font-medium transition-all border hover:border-primary/50"
                                :class="(!isCustomTip && tipPercentage === amt) 
                                    ? 'bg-primary text-primary-foreground border-primary shadow-sm' 
                                    : 'bg-background hover:bg-muted text-foreground'"
                            >
                                {{ amt }}%
                            </button>
                        </div>

                        <div class="pt-2">
                            <button 
                                @click="toggleCustomTip"
                                class="w-full text-xs text-muted-foreground hover:text-primary transition-colors underline text-right"
                            >
                                Enter custom amount
                            </button>
                            
                            <div v-if="isCustomTip" class="mt-2 animate-in slide-in-from-top-2">
                               <div class="relative">
                                    <span class="absolute left-3 top-2.5 text-muted-foreground">R</span>
                                    <Input 
                                        type="number" 
                                        v-model.number="customTipAmount"
                                        class="pl-7" 
                                        placeholder="0.00"
                                    />
                               </div>
                            </div>
                        </div>
                    </div>

                    <!-- Payment Summary -->
                    <div>
                         <div class="flex justify-between items-end mb-4 px-2">
                            <span class="text-lg font-semibold">Total to pay</span>
                            <span class="text-3xl font-bold text-primary">{{ formatCurrency(totalToPay) }}</span>
                        </div>

                        <div class="space-y-3">
                            <!-- Desktop Preferred: Credit Card -->
                            <Button 
                                class="w-full h-12 text-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg shadow-md transform transition active:scale-[0.98]"
                                @click="handlePay('card')"
                                :disabled="processing"
                            >
                                <iconify-icon v-if="processing" icon="lucide:loader-2" class="animate-spin mr-2" />
                                <iconify-icon v-else icon="lucide:credit-card" class="mr-2 mb-1" />
                                Pay with Credit/Debit
                            </Button>

                            <!-- Digital Wallets -->
                            <div class="grid grid-cols-2 gap-3">
                                <Button 
                                    class="w-full h-12 text-lg font-semibold bg-black hover:bg-gray-800 text-white rounded-lg shadow-lg transform transition active:scale-[0.98]"
                                    @click="handlePay('apple')"
                                    :disabled="processing"
                                >
                                    <iconify-icon v-if="processing" icon="lucide:loader-2" class="animate-spin mr-2" />
                                    <iconify-icon v-else icon="simple-icons:apple" class="mr-2 mb-1" />
                                    Apple Pay
                                </Button>
                                
                                <Button 
                                    class="w-full h-12 text-lg font-semibold bg-white border hover:bg-gray-50 text-black rounded-lg transform transition active:scale-[0.98]"
                                    @click="handlePay('google')"
                                    :disabled="processing"
                                >
                                    <iconify-icon v-if="processing" icon="lucide:loader-2" class="animate-spin mr-2" />
                                    <iconify-icon v-else icon="simple-icons:google" class="mr-2 text-blue-500" />
                                    GPay
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
