import { ArrowUpTray, Trash } from "@medusajs/icons"
import { Button, clx, Text, toast } from "@medusajs/ui"
import { useMutation } from "@tanstack/react-query"
import { useRef, useState } from "react"
import { sdk } from "../../lib/sdk"

const ACCEPT = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]
const MAX_BYTES = 10 * 1024 * 1024

/**
 * Uploads one image through the configured File Module (the same endpoint the
 * product media uploader uses) and stores the returned URL on the field.
 */
export const ImageUpload = ({
  value,
  onChange,
  alt,
  aspectClassName = "aspect-[16/10]",
  hint,
}: {
  value: string
  onChange: (url: string) => void
  alt?: string
  /** Preview shape, e.g. the ratio the image is shown at on the storefront. */
  aspectClassName?: string
  /** Replaces the default format line in the empty drop zone. */
  hint?: string
}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const { files } = await sdk.admin.upload.create({ files: [file] })
      const url = files[0]?.url
      if (!url) {
        throw new Error("The upload returned no URL.")
      }
      return url
    },
    onSuccess: (url) => onChange(url),
    onError: (error: Error) =>
      toast.error("Gagal mengunggah gambar", { description: error.message }),
  })

  const pick = (file: File | undefined) => {
    if (!file) {
      return
    }
    if (!ACCEPT.includes(file.type)) {
      toast.error("Format tidak didukung", {
        description: "Gunakan JPG, PNG, WebP, GIF, atau AVIF.",
      })
      return
    }
    if (file.size > MAX_BYTES) {
      toast.error("File terlalu besar", { description: "Maksimal 10 MB." })
      return
    }
    upload.mutate(file)
  }

  const openPicker = () => inputRef.current?.click()

  const input = (
    <input
      ref={inputRef}
      type="file"
      accept={ACCEPT.join(",")}
      className="hidden"
      onChange={(event) => {
        pick(event.target.files?.[0])
        // Reset so choosing the same file again still fires onChange.
        event.target.value = ""
      }}
    />
  )

  if (value) {
    return (
      <div className="flex flex-col gap-y-2">
        {input}
        <div className="bg-ui-bg-subtle overflow-hidden rounded-lg border border-ui-border-base">
          <img
            src={value}
            alt={alt ?? ""}
            className={clx("w-full object-cover", aspectClassName)}
          />
        </div>
        <div className="flex items-center gap-x-2">
          <Button
            size="small"
            variant="secondary"
            type="button"
            isLoading={upload.isPending}
            onClick={openPicker}
          >
            <ArrowUpTray />
            Ganti gambar
          </Button>
          <Button
            size="small"
            variant="transparent"
            type="button"
            disabled={upload.isPending}
            onClick={() => onChange("")}
          >
            <Trash />
            Hapus
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      {input}
      <button
        type="button"
        disabled={upload.isPending}
        onClick={openPicker}
        onDragOver={(event) => {
          event.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setIsDragging(false)
          pick(event.dataTransfer.files?.[0])
        }}
        className={clx(
          "bg-ui-bg-component hover:bg-ui-bg-component-hover text-ui-fg-subtle flex w-full flex-col items-center gap-y-2 rounded-lg border border-dashed border-ui-border-strong px-6 py-8 transition-fg",
          "focus-visible:shadow-borders-focus outline-none",
          isDragging && "border-ui-border-interactive bg-ui-bg-highlight"
        )}
      >
        <ArrowUpTray />
        <Text size="small" weight="plus">
          {upload.isPending ? "Mengunggah..." : "Unggah gambar"}
        </Text>
        <Text size="xsmall" className="text-ui-fg-muted">
          {hint ??
            "Seret dan lepas, atau klik untuk memilih. JPG, PNG, WebP, maks. 10 MB."}
        </Text>
      </button>
    </>
  )
}
