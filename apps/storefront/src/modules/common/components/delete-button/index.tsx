import { deleteLineItem } from "@lib/data/cart"
import { Spinner, Trash } from "@medusajs/icons"
import { clx } from "@modules/common/components/ui"
import { ButtonHTMLAttributes, useState } from "react"

type DeleteButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  id: string
}

const DeleteButton = ({
  id,
  children,
  className,
  ...props
}: DeleteButtonProps) => {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async (id: string) => {
    setIsDeleting(true)
    await deleteLineItem(id).catch((_err) => {
      setIsDeleting(false)
    })
  }

  return (
    <button
      type="button"
      className={clx(
        "flex items-center gap-x-1 text-small-regular text-ui-fg-subtle hover:text-ui-fg-base cursor-pointer transition-colors",
        className
      )}
      onClick={() => handleDelete(id)}
      {...props}
    >
      {isDeleting ? <Spinner className="animate-spin" /> : <Trash />}
      {children && <span>{children}</span>}
    </button>
  )
}

export default DeleteButton
