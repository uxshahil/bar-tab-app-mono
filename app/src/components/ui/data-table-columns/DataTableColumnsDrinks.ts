import type { ColumnDef } from '@tanstack/vue-table'
import type { Drinks } from '@/services/supabase/types/drinkTypes'
import { RouterLink } from 'vue-router'
import { h } from 'vue'
import DropdownAction from '@/components/ui/data-table-drop-down/DataTableDropDown.vue'
import EditablePriceCell from '@/components/ui/data-table-cells/EditablePriceCell.vue'
import { Button } from '@/components/ui/button'
import { useDrinksStore } from '@/stores/loaders/drinks'

const { updateDrink, deleteDrink } = useDrinksStore()

export const columns: ColumnDef<Drinks[0]>[] = [
  {
    accessorKey: 'menu',
    header: () => h('div', { class: 'text-left' }, 'Menu'),
    cell: ({ row }) =>
      h('div', { class: 'text-left' }, row.getValue<Drinks[0]['category']>('category')?.menu?.name),
  },
  {
    accessorKey: 'category',
    header: () => h('div', { class: 'text-left' }, 'Category'),
    cell: ({ row }) =>
      h('div', { class: 'text-left' }, row.getValue<Drinks[0]['category']>('category')?.name),
  },
  {
    accessorKey: 'name',
    header: () => h('div', { class: 'text-left' }, 'Name'),
    cell: ({ row }) => {
      return h(
        RouterLink,
        {
          to: `/drinks/${row.original.slug}`,
          class: 'text-left font-medium hover:bg-muted block w-full',
        },
        () => row.getValue('name'),
      )
    },
  },
  {
    accessorKey: 'price',
    header: () => h('div', { class: 'text-right' }, 'Price'),
    cell: ({ row }) => {
      return h(EditablePriceCell, {
        value: Number(row.getValue('price')),
        id: row.original.id,
        onUpdate: (id: number, val: number) => updateDrink(id, { price: val }),
      })
    },
  },
  {
    id: 'actions',
    header: () => h('div', { class: 'text-left' }, 'Actions'),
    enableHiding: false,
    cell: ({ row, table }) => {
      const drink = row.original

      return h('div', { class: 'flex items-center gap-2' }, [
        // @ts-expect-error - Custom meta property
        ['bar-staff', 'bar-manager'].includes(table.options.meta?.userRole)
          ? h(
              Button,
              {
                variant: 'outline',
                size: 'sm',
                class: 'h-8 px-2 lg:px-3',
                onClick: () => {
                  // @ts-expect-error - Custom meta property
                  table.options.meta?.onAddToTab?.(drink)
                },
              },
              () => [h('iconify-icon', { icon: 'lucide:plus', class: 'mr-2 h-4 w-4' }), 'Add'],
            )
          : null,
        // @ts-expect-error - Custom meta property
        table.options.meta?.hideActionsMenu
          ? null
          : h(DropdownAction, {
              object: {
                id: drink.id,
                name: drink.name,
                editFn: () => {
                  // @ts-expect-error - Custom meta property
                  table.options.meta?.onEditDrink?.(drink)
                },
                deleteFn: deleteDrink,
              },
            }),
      ])
    },
  },
]
