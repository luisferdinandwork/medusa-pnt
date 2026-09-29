import {
  Button,
  clx,
  DatePicker,
  FocusModal,
  Heading,
  Input,
  Label,
  Select,
  Switch,
  Text,
  Textarea,
  toast,
} from "@medusajs/ui"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { ImageUpload } from "../content/image-upload"
import { blankToNull, Field, SectionCard } from "../content/ui"
import { sdk } from "../../lib/sdk"
import { BannerPreview } from "./banner-preview"
import { LinkPicker } from "./link-picker"
import {
  type Banner,
  type BannerLinkType,
  type BannerPlacement,
  type BannerTextAlign,
  type BannerTextTheme,
  bannersQueryKey,
  PLACEMENT_ORDER,
  PLACEMENTS,
} from "./types"

type FormValues = {
  placement: BannerPlacement
  image_url: string
  mobile_image_url: string
  image_alt: string
  eyebrow: string
  title: string
  subtitle: string
  cta_label: string
  text_align: BannerTextAlign
  text_theme: BannerTextTheme
  link_type: BannerLinkType
  link_value: string
  is_active: boolean
  starts_at: Date | null
  ends_at: Date | null
}

const DEFAULT_CTA: Record<BannerPlacement, string> = {
  hero: "Belanja Sekarang",
  category: "Belanja",
  promo: "Lihat Produk",
  feature: "Belanja Sekarang",
}

const emptyForm = (placement: BannerPlacement): FormValues => ({
  placement,
  image_url: "",
  mobile_image_url: "",
  image_alt: "",
  eyebrow: "",
  title: "",
  subtitle: "",
  cta_label: DEFAULT_CTA[placement],
  text_align: "left",
  text_theme: "light",
  link_type: placement === "promo" ? "product" : "category",
  link_value: "",
  is_active: true,
  starts_at: null,
  ends_at: null,
})

const toForm = (banner: Banner): FormValues => ({
  placement: banner.placement,
  image_url: banner.image_url,
  mobile_image_url: banner.mobile_image_url ?? "",
  image_alt: banner.image_alt ?? "",
  eyebrow: banner.eyebrow ?? "",
  title: banner.title ?? "",
  subtitle: banner.subtitle ?? "",
  cta_label: banner.cta_label ?? "",
  text_align: banner.text_align,
  text_theme: banner.text_theme,
  link_type: banner.link_type,
  link_value: banner.link_value,
  is_active: banner.is_active,
  starts_at: banner.starts_at ? new Date(banner.starts_at) : null,
  ends_at: banner.ends_at ? new Date(banner.ends_at) : null,
})

const toPayload = (form: FormValues) => ({
  placement: form.placement,
  image_url: form.image_url.trim(),
  mobile_image_url: PLACEMENTS[form.placement].mobileSize ? blankToNull(form.mobile_image_url) : null,
  image_alt: blankToNull(form.image_alt),
  eyebrow: blankToNull(form.eyebrow),
  title: blankToNull(form.title),
  subtitle: blankToNull(form.subtitle),
  cta_label: blankToNull(form.cta_label),
  text_align: form.text_align,
  text_theme: form.text_theme,
  link_type: form.link_type,
  link_value: form.link_value.trim(),
  is_active: form.is_active,
  starts_at: form.starts_at ? form.starts_at.toISOString() : null,
  ends_at: form.ends_at ? form.ends_at.toISOString() : null,
})

/** Two or three mutually exclusive options as a segmented control. */
const Segmented = <T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}) => (
  <div className="bg-ui-bg-component border-ui-border-base inline-flex w-fit rounded-md border p-0.5">
    {options.map((option) => (
      <button
        key={option.value}
        type="button"
        onClick={() => onChange(option.value)}
        className={clx(
          "txt-compact-small rounded px-3 py-1 transition-fg",
          option.value === value
            ? "bg-ui-bg-base text-ui-fg-base shadow-elevation-card-rest font-medium"
            : "text-ui-fg-subtle hover:text-ui-fg-base"
        )}
      >
        {option.label}
      </button>
    ))}
  </div>
)

export type EditorTarget =
  | { mode: "create"; placement: BannerPlacement }
  | { mode: "edit"; banner: Banner }

/**
 * Create or edit one banner of a storefront. The preview on the right shows
 * the banner the way the homepage section draws it, on desktop and on a phone.
 */
export const BannerEditor = ({
  storefrontKey,
  storefrontName,
  target,
  onClose,
}: {
  storefrontKey: string
  storefrontName: string
  target: EditorTarget
  onClose: () => void
}) => {
  const queryClient = useQueryClient()
  const isEdit = target.mode === "edit"
  const [form, setForm] = useState<FormValues>(() =>
    target.mode === "edit" ? toForm(target.banner) : emptyForm(target.placement)
  )
  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) =>
    setForm((current) => ({ ...current, [key]: value }))
  const text = (key: keyof FormValues) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => set(key, event.target.value as never)

  const info = PLACEMENTS[form.placement]
  const scheduleInvalid = !!form.starts_at && !!form.ends_at && form.ends_at <= form.starts_at
  const missing = [
    !form.image_url && "an image",
    !form.link_value.trim() && "where it links to",
  ].filter(Boolean)

  const save = useMutation({
    mutationFn: () =>
      isEdit
        ? sdk.client.fetch(`/admin/banners/${target.banner.id}`, {
            method: "POST",
            body: toPayload(form),
          })
        : sdk.client.fetch("/admin/banners", {
            method: "POST",
            body: { storefront_key: storefrontKey, ...toPayload(form) },
          }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bannersQueryKey(storefrontKey) })
      toast.success(isEdit ? "Banner saved" : "Banner added", {
        description: "The homepage shows it within a minute.",
      })
      onClose()
    },
    onError: (error: Error) => toast.error("Could not save the banner", { description: error.message }),
  })

  return (
    <FocusModal open onOpenChange={(open) => !open && onClose()}>
      <FocusModal.Content>
        <FocusModal.Header>
          <div className="flex items-center gap-x-2">
            {missing.length > 0 && (
              <Text size="small" className="text-ui-fg-subtle hidden md:block">
                Add {missing.join(" and ")} to save.
              </Text>
            )}
            <FocusModal.Close asChild>
              <Button size="small" variant="secondary">Cancel</Button>
            </FocusModal.Close>
            <Button
              size="small"
              onClick={() => save.mutate()}
              isLoading={save.isPending}
              disabled={missing.length > 0 || scheduleInvalid}
            >
              {isEdit ? "Save" : "Add banner"}
            </Button>
          </div>
        </FocusModal.Header>
        <FocusModal.Body className="overflow-y-auto">
          <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
            <div className="flex flex-col gap-y-3">
              <div className="px-1">
                <FocusModal.Title asChild>
                  <Heading>{isEdit ? `Edit ${info.noun}` : `New ${info.noun}`}</Heading>
                </FocusModal.Title>
                <FocusModal.Description asChild>
                  <Text size="small" className="text-ui-fg-subtle">
                    {storefrontName} - {info.label}
                  </Text>
                </FocusModal.Description>
              </div>

              <SectionCard
                title="Image"
                description={`Recommended ${info.size}. Keep faces and products away from the edges; the image is cropped to fit.`}
              >
                <Field label="Section">
                  <Select
                    value={form.placement}
                    onValueChange={(value) => set("placement", value as BannerPlacement)}
                  >
                    <Select.Trigger>
                      <Select.Value />
                    </Select.Trigger>
                    <Select.Content>
                      {PLACEMENT_ORDER.map((placement) => (
                        <Select.Item key={placement} value={placement}>
                          {PLACEMENTS[placement].label}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select>
                </Field>
                <Field label="Image">
                  <ImageUpload
                    value={form.image_url}
                    onChange={(url) => set("image_url", url)}
                    alt={form.image_alt}
                    aspectClassName={info.aspect}
                    hint={`Drop an image or click to choose. ${info.size}, JPG, PNG or WebP up to 10 MB.`}
                  />
                </Field>
                {info.mobileSize && (
                  <Field
                    label="Phone image"
                    hint={`Portrait ${info.mobileSize}. Without it, phones show the middle of the image above.`}
                  >
                    <div className="max-w-[220px]">
                      <ImageUpload
                        value={form.mobile_image_url}
                        onChange={(url) => set("mobile_image_url", url)}
                        alt={form.image_alt}
                        aspectClassName="aspect-[4/5]"
                        hint="Portrait image for phones."
                      />
                    </div>
                  </Field>
                )}
                <Field label="Alt text" hint="Describes the image for screen readers and search engines.">
                  <Input
                    value={form.image_alt}
                    onChange={text("image_alt")}
                    placeholder="Pemain memakai sepatu bola merah di stadion"
                  />
                </Field>
              </SectionCard>

              <SectionCard
                title="Link"
                description="The whole image is a button. Send shoppers straight to what they can buy."
              >
                <LinkPicker
                  type={form.link_type}
                  value={form.link_value}
                  onChange={(type, value) => setForm((c) => ({ ...c, link_type: type, link_value: value }))}
                />
              </SectionCard>

              <SectionCard
                title="Text on the image"
                description="All optional. Leave it empty when the image already carries its own text."
              >
                {form.placement !== "category" && (
                  <Field label="Eyebrow" hint="Small line above the title, e.g. Drop baru, Diskon 30%.">
                    <Input value={form.eyebrow} onChange={text("eyebrow")} />
                  </Field>
                )}
                <Field label={form.placement === "category" ? "Tile title" : "Title"}>
                  <Input
                    value={form.title}
                    onChange={text("title")}
                    placeholder={form.placement === "category" ? "Sepatu Bola" : ""}
                  />
                </Field>
                {form.placement !== "category" && (
                  <Field label="Subtitle">
                    <Textarea value={form.subtitle} onChange={text("subtitle")} rows={2} />
                  </Field>
                )}
                <Field label="Button label">
                  <Input value={form.cta_label} onChange={text("cta_label")} />
                </Field>
                <div className="flex flex-wrap gap-x-8 gap-y-3">
                  {form.placement !== "category" && (
                    <Field label="Position">
                      <Segmented
                        value={form.text_align}
                        onChange={(value) => set("text_align", value)}
                        options={[
                          { value: "left", label: "Left" },
                          { value: "center", label: "Center" },
                          { value: "right", label: "Right" },
                        ]}
                      />
                    </Field>
                  )}
                  <Field label="Text color">
                    <Segmented
                      value={form.text_theme}
                      onChange={(value) => set("text_theme", value)}
                      options={[
                        { value: "light", label: "White" },
                        { value: "dark", label: "Black" },
                      ]}
                    />
                  </Field>
                </div>
              </SectionCard>

              <SectionCard title="Visibility" description="Schedule a campaign ahead and it switches itself on and off.">
                <div className="flex items-center justify-between gap-x-4">
                  <div>
                    <Label size="small" weight="plus" htmlFor="banner-active">
                      Show on the homepage
                    </Label>
                    <Text size="xsmall" className="text-ui-fg-subtle">
                      Hidden banners stay here for later.
                    </Text>
                  </div>
                  <Switch
                    id="banner-active"
                    checked={form.is_active}
                    onCheckedChange={(checked) => set("is_active", checked)}
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Show from">
                    <DatePicker
                      granularity="minute"
                      value={form.starts_at}
                      onChange={(value) => set("starts_at", value)}
                    />
                  </Field>
                  <Field label="Hide from">
                    <DatePicker
                      granularity="minute"
                      value={form.ends_at}
                      onChange={(value) => set("ends_at", value)}
                    />
                  </Field>
                </div>
                {scheduleInvalid && (
                  <Text size="small" className="text-ui-fg-error">
                    &quot;Hide from&quot; must be after &quot;Show from&quot;.
                  </Text>
                )}
              </SectionCard>
            </div>

            <div className="flex flex-col gap-y-3 lg:sticky lg:top-0 lg:self-start">
              <div className="bg-ui-bg-base shadow-elevation-card-rest flex flex-col gap-y-3 rounded-lg p-4">
                <Text size="small" weight="plus" className="text-ui-fg-subtle">
                  Desktop preview
                </Text>
                <BannerPreview
                  banner={form}
                  className={form.placement === "category" ? "max-w-[260px]" : form.placement === "promo" ? "max-w-[420px]" : undefined}
                />
              </div>
              <div className="bg-ui-bg-base shadow-elevation-card-rest flex flex-col gap-y-3 rounded-lg p-4">
                <Text size="small" weight="plus" className="text-ui-fg-subtle">
                  Phone preview
                </Text>
                <div className="w-[220px]">
                  <BannerPreview banner={form} mobile />
                </div>
              </div>
            </div>
          </div>
        </FocusModal.Body>
      </FocusModal.Content>
    </FocusModal>
  )
}
