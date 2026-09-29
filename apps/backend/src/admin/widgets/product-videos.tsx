import { defineWidgetConfig } from "@medusajs/admin-sdk"
import type { AdminProduct, DetailWidgetProps } from "@medusajs/framework/types"
import { ArrowDownMini, ArrowUpMini, ArrowUpTray, Trash } from "@medusajs/icons"
import {
  Button,
  Container,
  Heading,
  IconButton,
  Input,
  Text,
  toast,
} from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRef } from "react"
import { sdk } from "../lib/sdk"

// Product videos live in `product.metadata.videos` (the storefront gallery
// reads the same key). Medusa's own media section only takes images, so they
// are managed here.
const VIDEOS_KEY = "videos"
const ACCEPT = ["video/mp4", "video/webm", "video/quicktime"]
const MAX_BYTES = 50 * 1024 * 1024

type ProductVideo = { url: string; alt?: string }

const readVideos = (metadata: Record<string, unknown> | null | undefined): ProductVideo[] => {
  const value = metadata?.[VIDEOS_KEY]
  return Array.isArray(value)
    ? value.filter(
        (entry): entry is ProductVideo =>
          !!entry && typeof entry === "object" && typeof (entry as ProductVideo).url === "string"
      )
    : []
}

const ProductVideosWidget = ({ data }: DetailWidgetProps<AdminProduct>) => {
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const queryKey = ["product-videos", data.id]

  const { data: product } = useQuery({
    queryKey,
    queryFn: () =>
      sdk.admin.product.retrieve(data.id, { fields: "id,metadata" }).then((res) => res.product),
  })
  const metadata = (product?.metadata ?? {}) as Record<string, unknown>
  const videos = readVideos(metadata)

  // The whole metadata object is sent back so other keys are kept.
  const save = useMutation({
    mutationFn: (next: ProductVideo[]) =>
      sdk.admin.product.update(data.id, { metadata: { ...metadata, [VIDEOS_KEY]: next } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    onError: (error: Error) => toast.error("Could not save videos", { description: error.message }),
  })

  const upload = useMutation({
    mutationFn: async (files: File[]) => {
      const { files: uploaded } = await sdk.admin.upload.create({ files })
      return uploaded.map((file) => ({ url: file.url, alt: "" }))
    },
    onSuccess: (added) => {
      save.mutate([...videos, ...added])
      toast.success(added.length > 1 ? `${added.length} videos uploaded` : "Video uploaded")
    },
    onError: (error: Error) => toast.error("Upload failed", { description: error.message }),
  })

  const pick = (list: FileList | null) => {
    const files = Array.from(list ?? [])
    const rejected = files.filter((file) => !ACCEPT.includes(file.type) || file.size > MAX_BYTES)
    if (rejected.length) {
      toast.error("Some files were skipped", {
        description: "Use MP4, WebM or MOV files up to 50 MB.",
      })
    }
    const accepted = files.filter((file) => !rejected.includes(file))
    if (accepted.length) {
      upload.mutate(accepted)
    }
  }

  const move = (index: number, step: number) => {
    const next = [...videos]
    const [item] = next.splice(index, 1)
    next.splice(index + step, 0, item)
    save.mutate(next)
  }

  const busy = upload.isPending || save.isPending

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">Videos</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Shown in the storefront gallery after the first image. MP4, WebM or
            MOV, up to 50 MB.
          </Text>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT.join(",")}
          multiple
          className="hidden"
          onChange={(event) => {
            pick(event.target.files)
            event.target.value = ""
          }}
        />
        <Button
          size="small"
          variant="secondary"
          isLoading={upload.isPending}
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          <ArrowUpTray />
          Upload video
        </Button>
      </div>

      {videos.length === 0 ? (
        <div className="px-6 py-6">
          <Text size="small" className="text-ui-fg-muted">
            No videos yet.
          </Text>
        </div>
      ) : (
        <div className="flex flex-col divide-y">
          {videos.map((video, index) => (
            <div key={`${video.url}-${index}`} className="flex items-center gap-x-4 px-6 py-3">
              <video
                src={video.url}
                muted
                playsInline
                preload="metadata"
                controls
                className="h-20 w-32 shrink-0 rounded-md bg-ui-bg-subtle object-cover"
              />
              <div className="flex min-w-0 flex-1 flex-col gap-y-1">
                <Input
                  size="small"
                  placeholder="Description (for screen readers)"
                  defaultValue={video.alt ?? ""}
                  onBlur={(event) => {
                    const alt = event.target.value.trim()
                    if (alt !== (video.alt ?? "")) {
                      save.mutate(videos.map((entry, i) => (i === index ? { ...entry, alt } : entry)))
                    }
                  }}
                />
                <Text size="xsmall" className="truncate text-ui-fg-subtle">
                  {video.url.split("/").pop()}
                </Text>
              </div>
              <div className="flex shrink-0 items-center gap-x-1">
                <IconButton
                  size="small"
                  variant="transparent"
                  aria-label="Move up"
                  disabled={busy || index === 0}
                  onClick={() => move(index, -1)}
                >
                  <ArrowUpMini />
                </IconButton>
                <IconButton
                  size="small"
                  variant="transparent"
                  aria-label="Move down"
                  disabled={busy || index === videos.length - 1}
                  onClick={() => move(index, 1)}
                >
                  <ArrowDownMini />
                </IconButton>
                <IconButton
                  size="small"
                  variant="transparent"
                  aria-label="Remove"
                  disabled={busy}
                  onClick={() => save.mutate(videos.filter((_, i) => i !== index))}
                >
                  <Trash />
                </IconButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default ProductVideosWidget
