import { defineRouteConfig } from "@medusajs/admin-sdk"
import { SquaresPlus, PlusMini, Trash } from "@medusajs/icons"
import {
  Button,
  Container,
  Heading,
  IconButton,
  Input,
  Label,
  Select,
  Text,
  Textarea,
  toast,
} from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { sdk } from "../../lib/sdk"

type GuideCard = {
  eyebrow: string
  title: string
  description: string
}

type Storefront = {
  id: string
  name: string
  editorial_eyebrow: string | null
  editorial_heading: string | null
  editorial_body: string | null
  editorial_cta_label: string | null
  guide_cards: GuideCard[] | null
}

type FormValues = {
  editorial_eyebrow: string
  editorial_heading: string
  editorial_body: string
  editorial_cta_label: string
  guide_cards: GuideCard[]
}

const MAX_GUIDE_CARDS = 4
const EMPTY_CARD: GuideCard = { eyebrow: "", title: "", description: "" }

const toForm = (s: Storefront): FormValues => ({
  editorial_eyebrow: s.editorial_eyebrow ?? "",
  editorial_heading: s.editorial_heading ?? "",
  editorial_body: s.editorial_body ?? "",
  editorial_cta_label: s.editorial_cta_label ?? "",
  guide_cards: s.guide_cards ?? [],
})

const blankToNull = (value: string) => (value.trim() === "" ? null : value.trim())

const toPayload = (form: FormValues) => ({
  editorial_eyebrow: blankToNull(form.editorial_eyebrow),
  editorial_heading: blankToNull(form.editorial_heading),
  editorial_body: blankToNull(form.editorial_body),
  editorial_cta_label: blankToNull(form.editorial_cta_label),
  guide_cards: form.guide_cards
    .map((card) => ({
      eyebrow: card.eyebrow.trim(),
      title: card.title.trim(),
      description: card.description.trim(),
    }))
    .filter((card) => card.title || card.description || card.eyebrow),
})

const Field = ({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) => (
  <div className="flex flex-col gap-y-1">
    <Label size="small" weight="plus">
      {label}
    </Label>
    {children}
    {hint && (
      <Text size="small" className="text-ui-fg-subtle">
        {hint}
      </Text>
    )}
  </div>
)

const GuideCardEditor = ({
  card,
  index,
  onChange,
  onRemove,
}: {
  card: GuideCard
  index: number
  onChange: (index: number, card: GuideCard) => void
  onRemove: (index: number) => void
}) => {
  const set = (field: keyof GuideCard) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => onChange(index, { ...card, [field]: event.target.value })

  return (
    <div className="flex flex-col gap-y-3 rounded-lg border border-ui-border-base p-4">
      <div className="flex items-center justify-between">
        <Text size="small" weight="plus" className="text-ui-fg-subtle">
          Card {index + 1}
        </Text>
        <IconButton
          size="small"
          variant="transparent"
          type="button"
          onClick={() => onRemove(index)}
          aria-label="Remove card"
        >
          <Trash />
        </IconButton>
      </div>
      <Field label="Eyebrow" hint="Short label, e.g. Panduan, Perawatan, Ukuran.">
        <Input value={card.eyebrow} onChange={set("eyebrow")} />
      </Field>
      <Field label="Title">
        <Input value={card.title} onChange={set("title")} />
      </Field>
      <Field label="Description">
        <Textarea value={card.description} onChange={set("description")} rows={3} />
      </Field>
    </div>
  )
}

const StorefrontHomepagePage = () => {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ["storefronts"],
    queryFn: () =>
      sdk.client.fetch<{ storefronts: Storefront[] }>("/admin/storefronts"),
  })

  const storefronts = data?.storefronts ?? []
  const [selectedId, setSelectedId] = useState<string>("")
  const selected = storefronts.find((s) => s.id === selectedId) ?? storefronts[0]

  const [form, setForm] = useState<FormValues | null>(null)

  useEffect(() => {
    if (selected && (!form || selected.id !== selectedId)) {
      setSelectedId(selected.id)
      setForm(toForm(selected))
    }
  }, [selected, selectedId, form])

  const set = (field: keyof Omit<FormValues, "guide_cards">) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((current) => current && { ...current, [field]: event.target.value })

  const updateCard = (index: number, card: GuideCard) =>
    setForm(
      (current) =>
        current && {
          ...current,
          guide_cards: current.guide_cards.map((c, i) => (i === index ? card : c)),
        }
    )

  const removeCard = (index: number) =>
    setForm(
      (current) =>
        current && {
          ...current,
          guide_cards: current.guide_cards.filter((_, i) => i !== index),
        }
    )

  const addCard = () =>
    setForm(
      (current) =>
        current && {
          ...current,
          guide_cards: [...current.guide_cards, { ...EMPTY_CARD }],
        }
    )

  const save = useMutation({
    mutationFn: () => {
      if (!selected || !form) {
        throw new Error("Nothing to save")
      }
      return sdk.client.fetch(`/admin/storefronts/${selected.id}`, {
        method: "POST",
        body: toPayload(form),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storefronts"] })
      toast.success("Homepage sections updated", {
        description: "The storefront picks up the change within a minute.",
      })
    },
    onError: (error: Error) => toast.error("Could not save", { description: error.message }),
  })

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading>Storefront Homepage</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            The editorial story and buying-guide cards shown on the homepage,
            below the new arrivals. Leave the story heading empty to hide it;
            remove all cards to hide the guide teaser.
          </Text>
        </div>
      </div>

      {isLoading ? (
        <div className="px-6 py-8">
          <Text size="small" className="text-ui-fg-subtle">
            Loading...
          </Text>
        </div>
      ) : !storefronts.length ? (
        <div className="px-6 py-8">
          <Text size="small" className="text-ui-fg-subtle">
            No storefronts yet. Create one under Storefronts first.
          </Text>
        </div>
      ) : (
        form && (
          <div className="flex flex-col gap-y-6 px-6 py-6 max-w-2xl">
            <Field label="Storefront">
              <Select
                value={selectedId}
                onValueChange={(value) => {
                  setSelectedId(value)
                  const next = storefronts.find((s) => s.id === value)
                  if (next) {
                    setForm(toForm(next))
                  }
                }}
              >
                <Select.Trigger>
                  <Select.Value />
                </Select.Trigger>
                <Select.Content>
                  {storefronts.map((s) => (
                    <Select.Item key={s.id} value={s.id}>
                      {s.name}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </Field>

            <Heading level="h3">Editorial story</Heading>
            <Field label="Eyebrow">
              <Input
                value={form.editorial_eyebrow}
                onChange={set("editorial_eyebrow")}
              />
            </Field>
            <Field
              label="Heading"
              hint="A new line breaks the heading. Wrap words in *asterisks* to color them."
            >
              <Textarea
                value={form.editorial_heading}
                onChange={set("editorial_heading")}
                rows={2}
              />
            </Field>
            <Field label="Body">
              <Textarea
                value={form.editorial_body}
                onChange={set("editorial_body")}
                rows={4}
              />
            </Field>
            <Field label="Button label">
              <Input
                value={form.editorial_cta_label}
                onChange={set("editorial_cta_label")}
              />
            </Field>

            <div className="flex items-center justify-between">
              <Heading level="h3">Buying guide cards</Heading>
              <Button
                size="small"
                variant="secondary"
                type="button"
                onClick={addCard}
                disabled={form.guide_cards.length >= MAX_GUIDE_CARDS}
              >
                <PlusMini />
                Add card
              </Button>
            </div>
            {form.guide_cards.length === 0 && (
              <Text size="small" className="text-ui-fg-subtle">
                No cards - the guide teaser section is hidden on the homepage.
              </Text>
            )}
            {form.guide_cards.map((card, index) => (
              <GuideCardEditor
                key={index}
                card={card}
                index={index}
                onChange={updateCard}
                onRemove={removeCard}
              />
            ))}

            <div className="flex justify-end pt-2">
              <Button onClick={() => save.mutate()} isLoading={save.isPending}>
                Save
              </Button>
            </div>
          </div>
        )
      )}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Storefront Homepage",
  icon: SquaresPlus,
  rank: 101,
})

export default StorefrontHomepagePage
