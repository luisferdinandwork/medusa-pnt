"use client"

import { Dialog, Transition } from "@headlessui/react"
import { XMark } from "@medusajs/icons"
import { Fragment } from "react"

import { Button } from "@modules/common/components/ui"

type FilterDrawerProps = {
  open: boolean
  onClose: () => void
  children: React.ReactNode
}

const FilterDrawer = ({ open, onClose, children }: FilterDrawerProps) => {
  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-[80]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-ink/40" />
        </Transition.Child>

        <div className="fixed inset-0 flex items-end justify-center">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="translate-y-full"
            enterTo="translate-y-0"
            leave="ease-in duration-150"
            leaveFrom="translate-y-0"
            leaveTo="translate-y-full"
          >
            <Dialog.Panel className="flex w-full max-h-[85vh] flex-col rounded-t-large bg-white">
              <div className="flex items-center justify-between border-b border-paper-200 px-5 py-4">
                <Dialog.Title className="font-display uppercase text-lg">
                  Filter
                </Dialog.Title>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Tutup"
                  data-testid="close-filter-drawer"
                >
                  <XMark />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-2">
                {children}
              </div>
              <div className="border-t border-paper-200 px-5 py-4">
                <Button onClick={onClose} className="h-12 w-full">
                  Tampilkan Produk
                </Button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  )
}

export default FilterDrawer
