<script setup lang="ts">
import { computed } from 'vue'
import type { Tab, TabItem } from '@/services/supabase/types/tabTypes'
import { formatCurrency } from '@/utils/currency'

interface Props {
  tab: Tab
  items: TabItem[]
  merchantName?: string
  merchantAddress?: string[]
  vatNumber?: string
}

import QrcodeVue from 'qrcode.vue'

const props = withDefaults(defineProps<Props>(), {
  merchantName: 'BAR TAB LIQUORS',
  merchantAddress: () => ['34 Melrose Blvd', 'Melrose Arch, 2196', 'Tel: 011 771 6000'],
  vatNumber: '4090105588'
})

const groupedItems = computed(() => {
  return props.items
})

const totalTax = computed(() => props.tab.tax_amount || 0)
const subtotal = computed(() => props.tab.subtotal || 0)
const total = computed(() => props.tab.total_owed || 0)
const tip = computed(() => {
    // Prefer the tip from payments if available, as that's what was actually paid
    const paymentTips = props.tab.tab_payment?.reduce((sum, p) => sum + (p.tip_added || 0), 0) || 0
    return Math.max(props.tab.tip_amount || 0, paymentTips)
})

const totalBeforeTip = computed(() => {
    if (props.tab.remaining_balance !== undefined) {
         // If remaining balance logic was used, we still want the full bill value for the receipt
         // So we should try to sum subtotal + tax
         return (props.tab.subtotal || 0) + (props.tab.tax_amount || 0)
    }
    return props.tab.total_before_tip || 0
})

const grossTotal = computed(() => totalBeforeTip.value + tip.value)

// Calculate paid amount from payments array
const amountPaid = computed(() => {
    return props.tab.tab_payment?.reduce((sum, p) => sum + (p.amount_paid || 0), 0) || 0
})

const today = new Date()
const dateStr = today.toLocaleDateString('en-ZA').replace(/\//g, '.')
const timeStr = today.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', hour12: false })

const vat = Number(import.meta.env.VITE_VAT) || 0.15
const vatPercentage = (vat * 100).toFixed(1) + '%'

const paymentUrl = computed(() => {
    return `${window.location.protocol}//${window.location.host}/pay/${props.tab.id}`
})
</script>

<template>
  <div class="bg-white text-black p-4 font-mono text-xs max-w-[300px] mx-auto shadow-lg leading-tight select-none">
    <!-- Header -->
    <div class="text-center space-y-1 mb-3">
      <h1 class="font-bold text-lg mb-2">{{ merchantName }}</h1>
      <p class="text-[10px] uppercase">******ELECTRONIC TAX INVOICE******</p>
      <div v-for="(line, i) in merchantAddress" :key="i">
        {{ line }}
      </div>
      <p>VAT No. {{ vatNumber }}</p>
    </div>

    <!-- Top QR Code -->
    <a :href="paymentUrl" target="_blank" class="flex justify-center my-2 cursor-pointer hover:opacity-80 transition-opacity" title="Scan or Click to Pay">
       <QrcodeVue :value="paymentUrl" :size="80" level="L" render-as="svg" />
    </a>

    <!-- Separator -->
    <div class="text-center my-2 text-[10px] tracking-widest">
      ----------------------------------------
      <br>TAX INVOICE<br>
      ----------------------------------------
    </div>

    <!-- Items -->
    <div class="space-y-1 mb-2">
      <div v-for="item in groupedItems" :key="item.id" class="flex justify-between">
        <div class="uppercase truncate pr-2">
          {{ item.quantity }} x {{ item.menu_item?.name || 'ITEM' }}
        </div>
        <div>{{ formatCurrency(item.item_total).replace('R', '').trim() }}</div>
      </div>
    </div>
    
    <!-- Totals -->
    <div class="border-t border-dashed border-black pt-2 mt-2 space-y-1">
      <div class="flex justify-between font-bold">
        <span>TOTAL ({{ items.length }} items)</span>
        <span>{{ formatCurrency(totalBeforeTip).replace('R', '').trim() }}</span>
      </div>
       <div v-if="tip > 0" class="flex justify-between">
        <span>TIP</span>
        <span>{{ formatCurrency(tip).replace('R', '').trim() }}</span>
      </div>
      <!-- Combined Total removed to distinguish Owed vs Tipped -->
      
      <div class="flex justify-between font-bold text-sm mt-1 border-t border-dashed border-black pt-1">
        <span>PAID</span>
        <span>{{ formatCurrency(amountPaid).replace('R', '').trim() }}</span>
      </div>
      
       <div v-if="amountPaid >= grossTotal" class="flex justify-between text-xs mt-1">
        <span>CHANGE</span>
        <span>{{ formatCurrency(amountPaid - grossTotal).replace('R', '').trim() }}</span>
      </div>
    </div>

    <!-- Tax Breakdown -->
    <div class="mt-4 mb-2">
      <div class="flex justify-between text-[10px] mb-1">
        <span class="w-10">Rate</span>
        <span class="w-16 text-right">Gross</span>
        <span class="w-16 text-right">VAT</span>
        <span class="w-16 text-right">Net</span>
      </div>
      <div class="flex justify-between text-[10px]">
        <span class="w-10">{{ vatPercentage }}</span>
        <span class="w-16 text-right">{{ formatCurrency(totalBeforeTip).replace('R', '').trim() }}</span>
        <span class="w-16 text-right">{{ formatCurrency(totalTax).replace('R', '').trim() }}</span>
        <span class="w-16 text-right">{{ formatCurrency(subtotal).replace('R', '').trim() }}</span>
      </div>
    </div>

    <!-- Smart Shopper Mock -->
    <div class="text-center my-2 text-[10px] tracking-widest">
      ----------------------------------------
      <br>LOYALTY PROGRAM<br>
      ----------------------------------------
    </div>
    <div class="text-[10px] mb-2 text-center">
      <p>Hi VALUED CUSTOMER</p>
      <div class="flex justify-between px-2 mt-1">
        <span>Points earned:</span>
        <span>{{ Math.floor(total / 10) }}</span>
      </div>
    </div>

    <!-- Footer -->
    <div class="text-center my-3 space-y-1 text-[10px]">
      <p>----------------------------------------</p>
      <p class="uppercase font-bold">Thank you for visiting</p>
      <p>Keep your slip as proof of purchase</p>
      <p>CUSTOMER CARE: 0860 00 00 00</p>
      <p>----------------------------------------</p>
    </div>

    <!-- Metadata -->
    <div class="flex justify-between text-[10px] px-2 mb-4">
      <div class="text-center">
        <div>TXN</div>
        <div>{{ tab.id }}</div>
      </div>
      <div class="text-center">
        <div>Till</div>
        <div>1</div>
      </div>
       <div class="text-center">
        <div>Date</div>
        <div>{{ dateStr }}</div>
      </div>
      <div class="text-center">
        <div>Time</div>
        <div>{{ timeStr }}</div>
      </div>
    </div>

    <!-- Barcode -->
     <a :href="paymentUrl" target="_blank" class="flex justify-center cursor-pointer hover:opacity-75 transition-opacity" title="Click to Pay Tab">
        <!-- CSS Barcode Simulation -->
        <div class="h-12 flex items-end gap-[1px]">
          <div v-for="i in 40" :key="i" 
            class="bg-black" 
            :class="[
              Math.random() > 0.5 ? 'w-[2px]' : 'w-[1px]',
              Math.random() > 0.7 ? 'h-full' : 'h-[90%]'
            ]"
          ></div>
        </div>
    </a>
    <div class="text-center text-xs tracking-[0.2em] mt-1 font-bold">
      910{{ tab.id.toString().padStart(6, '0') }}4
    </div>

  </div>
</template>
