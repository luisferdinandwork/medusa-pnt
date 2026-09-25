import { ArrowLeft, ArrowUpRightOnBox, Trash } from "@medusajs/icons"
import {
  Button,
  DatePicker,
  Heading,
  IconButton,
  Input,
  Prompt,
  Select,
  Text,
  Textarea,
  toast,
} from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  ChipList,
  RecordList,
} from "../../../components/content/list-editors"
import { ProductPicker } from "../../../components/content/product-picker"
import {
  type SeoCheck,
  SeoChecklist,
  SerpPreview,
} from "../../../components/content/seo-panel"
import {
  ALL_STOREFRONTS,
  type Faq,
  type ProductStory,
  type StoryHighlight,
  type StorySection,
} from "../../../components/content/types"
import {
  blankToNull,
  Field,
  PublishBadge,
  SectionCard,
  slugify,
} from "../../../components/content/ui"
import { useStorefronts } from "../../../components/content/use-storefronts"
import { sdk } from "../../../lib/sdk"

const STOREFRONT_URL =
  import.meta.env.VITE_STOREFRONT_URL || "http://localhost:8000"
const STOREFRONT_LOCALE = import.meta.env.VITE_STOREFRONT_LOCALE || "id"

type FormValues = {
  handle: string
  storefront_key: string
  title: string
  subtitle: string
  excerpt: string
  silo: string
  category_handle: string
  product_handles: string[]
  intro: string
  sections: StorySection[]
  highlights: StoryHighlight[]
  faqs: Faq[]
  cover_image_url: string
  cover_image_alt: string
  cta_label: string
  cta_href: string
  status: "draft" | "published"
  published_at: Date | null
  rank: string
  seo_title: string
  seo_description: string
  seo_keywords: string[]
}

const EMPTY: FormValues = {
  handle: "",
  storefront_key: ALL_STOREFRONTS,
  title: "",
  subtitle: "",
  excerpt: "",
  silo: "",
  category_handle: "",
  product_handles: [],
  intro: "",
  sections: [],
  highlights: [],
  faqs: [],
  cover_image_url: "",
  cover_image_alt: "",
  cta_label: "",
  cta_href: "",
  status: "draft",
  published_at: null,
  rank: "0",
  seo_title: "",
  seo_description: "",
  seo_keywords: [],
}

const toForm = (story: ProductStory): FormValues => ({
  handle: story.handle,
  storefront_key: story.storefront_key ?? ALL_STOREFRONTS,
  title: story.title,
  subtitle: story.subtitle ?? "",
  excerpt: story.excerpt ?? "",
  silo: story.silo,
  category_handle: story.category_handle ?? "",
  product_handles: story.product_handles ?? [],
  intro: story.intro ?? "",
  sections: story.sections ?? [],
  highlights: story.highlights ?? [],
  faqs: story.faqs ?? [],
  cover_image_url: story.cover_image_url ?? "",
  cover_image_alt: story.cover_image_alt ?? "",
  cta_label: story.cta_label ?? "",
  cta_href: story.cta_href ?? "",
  status: story.status,
  published_at: story.published_at ? new Date(story.published_at) : null,
  rank: String(story.rank ?? 0),
  seo_title: story.seo_title ?? "",
  seo_description: story.seo_description ?? "",
  seo_keywords: story.seo_keywords ?? [],
})

const toPayload = (form: FormValues) => ({
  storefront_key:
    form.storefront_key === ALL_STOREFRONTS ? null : form.storefront_key,
  title: form.title.trim(),
  subtitle: blankToNull(form.subtitle),
  excerpt: blankToNull(form.excerpt),
  silo: form.silo.trim(),
  category_handle: blankToNull(form.category_handle),
  product_handles: form.product_handles,
  intro: blankToNull(form.intro),
  sections: form.sections.filter(
    (entry) => entry.heading.trim() && entry.body.trim()
  ),
  highlights: form.highlights.filter(
    (entry) => entry.label.trim() && entry.value.trim()
  ),
  faqs: form.faqs.filter((entry) => entry.question.trim() && entry.answer.trim()),
  cover_image_url: blankToNull(form.cover_image_url),
  cover_image_alt: blankToNull(form.cover_image_alt),
  cta_label: blankToNull(form.cta_label),
  cta_href: blankToNull(form.cta_href),
  status: form.status,
  published_at: form.published_at ? form.published_at.toISOString() : null,
  rank: Number.parseInt(form.rank, 10) || 0,
  seo_title: blankToNull(form.seo_title),
  seo_description: blankToNull(form.seo_description),
  seo_keywords: form.seo_keywords,
})

const buildChecks = (form: FormValues): SeoCheck[] => {
  const seoTitle = form.seo_title || form.title
  const seoDescription = form.seo_description || form.excerpt

  return [
    {
      label: "Judul SEO 30-60 karakter",
      ok: seoTitle.length >= 30 && seoTitle.length <= 60,
      hint: `Saat ini ${seoTitle.length} karakter.`,
    },
    {
      label: "Deskripsi SEO 70-160 karakter",
      ok: seoDescription.length >= 70 && seoDescription.length <= 160,
      hint: `Saat ini ${seoDescription.length} karakter.`,
    },
    {
      label: "Pengantar terisi",
      ok: form.intro.trim().length >= 80,
      hint: "Jelaskan dalam satu paragraf apa yang menyatukan produk di silo ini.",
    },
    {
      label: "Minimal 2 bagian",
      ok: form.sections.filter((entry) => entry.heading.trim()).length >= 2,
      hint: "Bagian bertajuk membantu mesin pencari memahami struktur halaman.",
    },
    {
      label: "Minimal 3 sorotan",
      ok: form.highlights.filter((entry) => entry.label.trim()).length >= 3,
      hint: "Tabel spesifikasi singkat yang mudah dikutip.",
    },
    {
      label: "Minimal 1 FAQ",
      ok: form.faqs.filter((entry) => entry.question.trim()).length >= 1,
      hint: "FAQ dirender sebagai schema FAQPage.",
    },
    {
      label: "Minimal 2 produk ditautkan",
      ok: form.product_handles.length >= 2,
      hint: "Silo tanpa produk tidak punya apa-apa untuk ditautkan.",
    },
    {
      label: "Kategori terisi",
      ok: form.category_handle.trim().length > 0,
      hint: "Menghubungkan cerita ke halaman kategori di toko.",
    },
  ]
}

const StoryForm = ({ story }: { story: ProductStory | null }) => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const storefronts = useStorefronts()
  const isNew = story === null

  const [form, setForm] = useState<FormValues>(story ? toForm(story) : EMPTY)
  const [handleTouched, setHandleTouched] = useState(!isNew)

  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) =>
    setForm((current) => ({ ...current, [key]: value }))

  const text =
    (key: keyof FormValues) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((current) => ({ ...current, [key]: event.target.value }))

  const save = useMutation({
    mutationFn: async () => {
      if (isNew) {
        return sdk.client.fetch<{ product_story: ProductStory }>(
          "/admin/product-stories",
          {
            method: "POST",
            body: { handle: form.handle.trim(), ...toPayload(form) },
          }
        )
      }
      return sdk.client.fetch<{ product_story: ProductStory }>(
        `/admin/product-stories/${story.id}`,
        { method: "POST", body: toPayload(form) }
      )
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["product-stories"] })
      toast.success(isNew ? "Cerita dibuat" : "Cerita disimpan", {
        description:
          form.status === "published"
            ? "Storefront memuat perubahan dalam satu menit."
            : "Masih berstatus draf, belum tampil di storefront.",
      })
      if (isNew) {
        navigate(`/product-stories/${data.product_story.id}`, { replace: true })
      }
    },
    onError: (error: Error) =>
      toast.error("Gagal menyimpan", { description: error.message }),
  })

  const remove = useMutation({
    mutationFn: () =>
      sdk.client.fetch(`/admin/product-stories/${story?.id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-stories"] })
      toast.success("Cerita dihapus")
      navigate("/product-stories", { replace: true })
    },
    onError: (error: Error) =>
      toast.error("Gagal menghapus", { description: error.message }),
  })

  const canSave =
    form.title.trim() !== "" &&
    form.silo.trim() !== "" &&
    (!isNew || form.handle.trim().length >= 2)
  const seoTitle = form.seo_title || form.title
  const seoDescription = form.seo_description || form.excerpt

  return (
    <div className="flex flex-col gap-y-3 pb-16">
      <div className="bg-ui-bg-base shadow-elevation-card-rest sticky top-0 z-10 flex flex-col gap-y-3 rounded-lg px-6 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-x-3">
          <IconButton
            size="small"
            variant="transparent"
            aria-label="Kembali"
            onClick={() => navigate("/product-stories")}
          >
            <ArrowLeft />
          </IconButton>
          <div className="min-w-0">
            <Heading className="truncate">
              {form.title || (isNew ? "Cerita baru" : "Tanpa judul")}
            </Heading>
            <div className="flex items-center gap-x-2">
              <PublishBadge status={form.status} />
              <Text size="xsmall" className="text-ui-fg-muted truncate">
                /stories/{form.handle || "handle-belum-diisi"}
              </Text>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-x-2">
          {!isNew && form.status === "published" && (
            <Button
              size="small"
              variant="transparent"
              onClick={() =>
                window.open(
                  `${STOREFRONT_URL}/${STOREFRONT_LOCALE}/stories/${form.handle}`,
                  "_blank",
                  "noopener"
                )
              }
            >
              <ArrowUpRightOnBox />
              Lihat di situs
            </Button>
          )}
          {!isNew && (
            <Prompt>
              <Prompt.Trigger asChild>
                <IconButton size="small" variant="transparent" aria-label="Hapus">
                  <Trash />
                </IconButton>
              </Prompt.Trigger>
              <Prompt.Content>
                <Prompt.Header>
                  <Prompt.Title>Hapus cerita ini?</Prompt.Title>
                  <Prompt.Description>
                    Cerita akan hilang dari storefront dan dari halaman produk
                    yang menautkannya.
                  </Prompt.Description>
                </Prompt.Header>
                <Prompt.Footer>
                  <Prompt.Cancel>Batal</Prompt.Cancel>
                  <Prompt.Action onClick={() => remove.mutate()}>
                    Hapus
                  </Prompt.Action>
                </Prompt.Footer>
              </Prompt.Content>
            </Prompt>
          )}
          <Button
            size="small"
            isLoading={save.isPending}
            disabled={!canSave}
            onClick={() => save.mutate()}
          >
            {isNew ? "Buat cerita" : "Simpan"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex flex-col gap-y-3">
          <SectionCard
            title="Cerita"
            description="Penjelasan singkat tentang satu keluarga produk."
          >
            <Field label="Judul">
              <Input
                value={form.title}
                placeholder="Sepatu Bola FG"
                onChange={(event) => {
                  const value = event.target.value
                  setForm((current) => ({
                    ...current,
                    title: value,
                    handle: handleTouched ? current.handle : slugify(value),
                  }))
                }}
              />
            </Field>
            <Field
              label="Handle"
              hint="Bagian akhir URL cerita. Tidak bisa diubah setelah dibuat."
            >
              <Input
                value={form.handle}
                disabled={!isNew}
                placeholder="silo-sepatu-bola-fg"
                onChange={(event) => {
                  setHandleTouched(true)
                  set("handle", slugify(event.target.value))
                }}
              />
            </Field>
            <Field label="Subjudul" optional>
              <Input value={form.subtitle} onChange={text("subtitle")} />
            </Field>
            <Field
              label="Nama silo"
              hint="Label keluarga produk, misalnya Sepatu Bola FG atau Daily Trainer."
            >
              <Input value={form.silo} onChange={text("silo")} />
            </Field>
            <Field
              label="Ringkasan"
              counter={[form.excerpt.length, 160]}
              hint="Tampil di kartu daftar cerita dan jadi cadangan deskripsi SEO."
            >
              <Textarea rows={3} value={form.excerpt} onChange={text("excerpt")} />
            </Field>
            <Field
              label="Pengantar"
              hint="Satu sampai dua paragraf yang menjelaskan apa yang menyatukan produk di silo ini."
            >
              <Textarea rows={5} value={form.intro} onChange={text("intro")} />
            </Field>
          </SectionCard>

          <SectionCard
            title="Bagian"
            description="Isi cerita, dirender berurutan. Markdown didukung pada isi bagian."
          >
            <RecordList
              value={form.sections}
              onChange={(value) => set("sections", value)}
              template={{ heading: "", body: "" }}
              addLabel="Tambah bagian"
              emptyLabel="Belum ada bagian. Dua sampai empat bagian biasanya cukup."
              max={12}
              fields={[
                { key: "heading", label: "Judul bagian", placeholder: "Untuk siapa silo ini" },
                { key: "body", label: "Isi", type: "textarea", rows: 6 },
              ]}
            />
          </SectionCard>

          <SectionCard
            title="Sorotan"
            description="Tabel spesifikasi singkat di samping cerita."
          >
            <RecordList
              value={form.highlights}
              onChange={(value) => set("highlights", value)}
              template={{ label: "", value: "" }}
              addLabel="Tambah sorotan"
              emptyLabel="Belum ada sorotan."
              max={12}
              fields={[
                { key: "label", label: "Label", placeholder: "Sol" },
                { key: "value", label: "Nilai", placeholder: "FG - Firm Ground" },
              ]}
            />
          </SectionCard>

          <SectionCard
            title="Pertanyaan umum"
            description="Dirender sebagai accordion dan sebagai data terstruktur FAQPage."
          >
            <RecordList
              value={form.faqs}
              onChange={(value) => set("faqs", value)}
              template={{ question: "", answer: "" }}
              addLabel="Tambah pertanyaan"
              emptyLabel="Belum ada pertanyaan."
              fields={[
                { key: "question", label: "Pertanyaan" },
                { key: "answer", label: "Jawaban", type: "textarea", rows: 4 },
              ]}
            />
          </SectionCard>

          <SectionCard
            title="Produk dalam silo"
            description="Halaman produk yang tercantum di sini akan menampilkan cerita ini."
          >
            <ProductPicker
              value={form.product_handles}
              onChange={(value) => set("product_handles", value)}
            />
          </SectionCard>
        </div>

        <div className="flex flex-col gap-y-3">
          <SectionCard title="Publikasi">
            <Field label="Status">
              <Select
                value={form.status}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    status: value as FormValues["status"],
                    published_at:
                      value === "published" && !current.published_at
                        ? new Date()
                        : current.published_at,
                  }))
                }
              >
                <Select.Trigger>
                  <Select.Value />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="draft">Draf</Select.Item>
                  <Select.Item value="published">Terbit</Select.Item>
                </Select.Content>
              </Select>
            </Field>
            <Field label="Tanggal terbit" optional>
              <DatePicker
                value={form.published_at}
                onChange={(value) => set("published_at", value)}
              />
            </Field>
            <Field label="Storefront">
              <Select
                value={form.storefront_key}
                onValueChange={(value) => set("storefront_key", value)}
              >
                <Select.Trigger>
                  <Select.Value />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value={ALL_STOREFRONTS}>
                    Semua storefront
                  </Select.Item>
                  {storefronts.map((option) => (
                    <Select.Item key={option.key} value={option.key}>
                      {option.name}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </Field>
            <Field label="Urutan" hint="Angka kecil tampil lebih dulu.">
              <Input
                type="number"
                min={0}
                value={form.rank}
                onChange={text("rank")}
              />
            </Field>
          </SectionCard>

          <SectionCard title="Tautan">
            <Field
              label="Handle kategori"
              optional
              hint="Contoh: sepatu-bola. Menghubungkan cerita ke halaman kategori."
            >
              <Input
                value={form.category_handle}
                onChange={text("category_handle")}
              />
            </Field>
            <Field label="Label tombol" optional>
              <Input
                value={form.cta_label}
                onChange={text("cta_label")}
                placeholder="Lihat semua sepatu bola"
              />
            </Field>
            <Field
              label="Tautan tombol"
              optional
              hint="Relatif terhadap storefront, misalnya /categories/sepatu-bola."
            >
              <Input value={form.cta_href} onChange={text("cta_href")} />
            </Field>
          </SectionCard>

          <SectionCard title="Media">
            <Field label="URL gambar sampul" optional>
              <Input
                value={form.cover_image_url}
                onChange={text("cover_image_url")}
                placeholder="https://..."
              />
            </Field>
            <Field label="Teks alternatif" optional>
              <Input
                value={form.cover_image_alt}
                onChange={text("cover_image_alt")}
              />
            </Field>
          </SectionCard>

          <SectionCard
            title="SEO"
            description="Kosongkan untuk memakai judul dan ringkasan cerita."
          >
            <SerpPreview
              url={`${STOREFRONT_URL}/${STOREFRONT_LOCALE}/stories/${form.handle || "handle"}`}
              title={seoTitle}
              description={seoDescription}
            />
            <Field label="Judul SEO" optional counter={[seoTitle.length, 60]}>
              <Input value={form.seo_title} onChange={text("seo_title")} />
            </Field>
            <Field
              label="Deskripsi SEO"
              optional
              counter={[seoDescription.length, 160]}
            >
              <Textarea
                rows={3}
                value={form.seo_description}
                onChange={text("seo_description")}
              />
            </Field>
            <Field label="Kata kunci" optional>
              <ChipList
                value={form.seo_keywords}
                onChange={(value) => set("seo_keywords", value)}
              />
            </Field>
          </SectionCard>

          <SectionCard
            title="Kesiapan SEO &amp; GEO"
            description="Daftar periksa yang berpengaruh nyata ke hasil pencarian."
          >
            <SeoChecklist checks={buildChecks(form)} />
          </SectionCard>
        </div>
      </div>
    </div>
  )
}

const ProductStoryDetailPage = () => {
  const { id } = useParams()
  const isNew = id === "new"

  const { data, isLoading, isError } = useQuery({
    queryKey: ["product-story", id],
    queryFn: () =>
      sdk.client.fetch<{ product_story: ProductStory }>(
        `/admin/product-stories/${id}`
      ),
    enabled: !isNew,
  })

  if (isNew) {
    return <StoryForm story={null} />
  }

  if (isLoading) {
    return (
      <Text size="small" className="text-ui-fg-muted p-6">
        Memuat cerita...
      </Text>
    )
  }

  if (isError || !data) {
    return (
      <Text size="small" className="text-ui-fg-error p-6">
        Cerita tidak ditemukan.
      </Text>
    )
  }

  return <StoryForm story={data.product_story} />
}

export default ProductStoryDetailPage
