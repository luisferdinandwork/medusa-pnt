import {
  ArrowLeft,
  ArrowUpRightOnBox,
  Sparkles,
  Trash,
} from "@medusajs/icons"
import {
  Button,
  DatePicker,
  Heading,
  IconButton,
  Input,
  Prompt,
  Select,
  Switch,
  Text,
  Textarea,
  toast,
} from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  ChipList,
  LineList,
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
  type Article,
  type Faq,
  type Source,
} from "../../../components/content/types"
import {
  blankToNull,
  estimateReadMinutes,
  Field,
  PublishBadge,
  SectionCard,
  slugify,
  wordCount,
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
  content: string
  status: "draft" | "published"
  published_at: Date | null
  rank: string
  is_featured: boolean
  category: string
  tags: string[]
  cover_image_url: string
  cover_image_alt: string
  read_minutes: string
  author_name: string
  author_role: string
  seo_title: string
  seo_description: string
  seo_keywords: string[]
  canonical_url: string
  og_image_url: string
  noindex: boolean
  answer_summary: string
  key_takeaways: string[]
  faqs: Faq[]
  sources: Source[]
  geo_locale: string
  geo_target_area: string
  related_product_handles: string[]
  related_category_handles: string[]
}

const EMPTY: FormValues = {
  handle: "",
  storefront_key: ALL_STOREFRONTS,
  title: "",
  subtitle: "",
  excerpt: "",
  content: "",
  status: "draft",
  published_at: null,
  rank: "0",
  is_featured: false,
  category: "",
  tags: [],
  cover_image_url: "",
  cover_image_alt: "",
  read_minutes: "",
  author_name: "",
  author_role: "",
  seo_title: "",
  seo_description: "",
  seo_keywords: [],
  canonical_url: "",
  og_image_url: "",
  noindex: false,
  answer_summary: "",
  key_takeaways: [],
  faqs: [],
  sources: [],
  geo_locale: "id-ID",
  geo_target_area: "Indonesia",
  related_product_handles: [],
  related_category_handles: [],
}

const toForm = (article: Article): FormValues => ({
  handle: article.handle,
  storefront_key: article.storefront_key ?? ALL_STOREFRONTS,
  title: article.title,
  subtitle: article.subtitle ?? "",
  excerpt: article.excerpt ?? "",
  content: article.content ?? "",
  status: article.status,
  published_at: article.published_at ? new Date(article.published_at) : null,
  rank: String(article.rank ?? 0),
  is_featured: article.is_featured,
  category: article.category ?? "",
  tags: article.tags ?? [],
  cover_image_url: article.cover_image_url ?? "",
  cover_image_alt: article.cover_image_alt ?? "",
  read_minutes: article.read_minutes ? String(article.read_minutes) : "",
  author_name: article.author_name ?? "",
  author_role: article.author_role ?? "",
  seo_title: article.seo_title ?? "",
  seo_description: article.seo_description ?? "",
  seo_keywords: article.seo_keywords ?? [],
  canonical_url: article.canonical_url ?? "",
  og_image_url: article.og_image_url ?? "",
  noindex: article.noindex,
  answer_summary: article.answer_summary ?? "",
  key_takeaways: article.key_takeaways ?? [],
  faqs: article.faqs ?? [],
  sources: article.sources ?? [],
  geo_locale: article.geo_locale ?? "",
  geo_target_area: article.geo_target_area ?? "",
  related_product_handles: article.related_product_handles ?? [],
  related_category_handles: article.related_category_handles ?? [],
})

const toPayload = (form: FormValues) => ({
  storefront_key:
    form.storefront_key === ALL_STOREFRONTS ? null : form.storefront_key,
  title: form.title.trim(),
  subtitle: blankToNull(form.subtitle),
  excerpt: blankToNull(form.excerpt),
  content: blankToNull(form.content),
  status: form.status,
  published_at: form.published_at ? form.published_at.toISOString() : null,
  rank: Number.parseInt(form.rank, 10) || 0,
  is_featured: form.is_featured,
  category: blankToNull(form.category),
  tags: form.tags,
  cover_image_url: blankToNull(form.cover_image_url),
  cover_image_alt: blankToNull(form.cover_image_alt),
  read_minutes: form.read_minutes
    ? Number.parseInt(form.read_minutes, 10) || null
    : null,
  author_name: blankToNull(form.author_name),
  author_role: blankToNull(form.author_role),
  seo_title: blankToNull(form.seo_title),
  seo_description: blankToNull(form.seo_description),
  seo_keywords: form.seo_keywords,
  canonical_url: blankToNull(form.canonical_url),
  og_image_url: blankToNull(form.og_image_url),
  noindex: form.noindex,
  answer_summary: blankToNull(form.answer_summary),
  key_takeaways: form.key_takeaways.filter((entry) => entry.trim() !== ""),
  faqs: form.faqs.filter((entry) => entry.question.trim() && entry.answer.trim()),
  sources: form.sources.filter((entry) => entry.label.trim() && entry.url.trim()),
  geo_locale: blankToNull(form.geo_locale),
  geo_target_area: blankToNull(form.geo_target_area),
  related_product_handles: form.related_product_handles,
  related_category_handles: form.related_category_handles,
})

const buildChecks = (form: FormValues): SeoCheck[] => {
  const seoTitle = form.seo_title || form.title
  const seoDescription = form.seo_description || form.excerpt
  const words = wordCount(form.content)

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
      label: "Isi minimal 300 kata",
      ok: words >= 300,
      hint: `Saat ini ${words} kata.`,
    },
    {
      label: "Ringkasan jawaban terisi",
      ok: form.answer_summary.trim().length >= 40,
      hint: "Paragraf singkat yang menjawab pertanyaan utama - ini yang dikutip asisten AI.",
    },
    {
      label: "Minimal 3 poin kunci",
      ok: form.key_takeaways.filter((entry) => entry.trim()).length >= 3,
      hint: "Poin kunci jadi daftar ringkas di halaman dan di data terstruktur.",
    },
    {
      label: "Minimal 2 FAQ",
      ok: form.faqs.filter((entry) => entry.question.trim()).length >= 2,
      hint: "FAQ dirender sebagai schema FAQPage.",
    },
    {
      label: "Minimal 1 sumber",
      ok: form.sources.filter((entry) => entry.url.trim()).length >= 1,
      hint: "Kutipan sumber meningkatkan kepercayaan mesin jawaban.",
    },
    {
      label: "Gambar sampul punya teks alternatif",
      ok: !form.cover_image_url || form.cover_image_alt.trim().length > 0,
      hint: "Isi alt supaya gambar terbaca mesin pencari.",
    },
    {
      label: "Terhubung ke produk atau kategori",
      ok:
        form.related_product_handles.length > 0 ||
        form.related_category_handles.length > 0,
      hint: "Tautan internal mengikat artikel ke silo produknya.",
    },
  ]
}

const ArticleForm = ({ article }: { article: Article | null }) => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const storefronts = useStorefronts()
  const isNew = article === null

  const [form, setForm] = useState<FormValues>(
    article ? toForm(article) : EMPTY
  )
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
        return sdk.client.fetch<{ article: Article }>("/admin/articles", {
          method: "POST",
          body: { handle: form.handle.trim(), ...toPayload(form) },
        })
      }
      return sdk.client.fetch<{ article: Article }>(
        `/admin/articles/${article.id}`,
        { method: "POST", body: toPayload(form) }
      )
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["articles"] })
      toast.success(isNew ? "Artikel dibuat" : "Artikel disimpan", {
        description:
          form.status === "published"
            ? "Storefront memuat perubahan dalam satu menit."
            : "Masih berstatus draf, belum tampil di storefront.",
      })
      if (isNew) {
        navigate(`/articles/${data.article.id}`, { replace: true })
      }
    },
    onError: (error: Error) =>
      toast.error("Gagal menyimpan", { description: error.message }),
  })

  const remove = useMutation({
    mutationFn: () =>
      sdk.client.fetch(`/admin/articles/${article?.id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] })
      toast.success("Artikel dihapus")
      navigate("/articles", { replace: true })
    },
    onError: (error: Error) =>
      toast.error("Gagal menghapus", { description: error.message }),
  })

  const canSave =
    form.title.trim() !== "" && (!isNew || form.handle.trim().length >= 2)
  const checks = buildChecks(form)
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
            onClick={() => navigate("/articles")}
          >
            <ArrowLeft />
          </IconButton>
          <div className="min-w-0">
            <Heading className="truncate">
              {form.title || (isNew ? "Artikel baru" : "Tanpa judul")}
            </Heading>
            <div className="flex items-center gap-x-2">
              <PublishBadge status={form.status} />
              <Text size="xsmall" className="text-ui-fg-muted truncate">
                /blog/{form.handle || "handle-belum-diisi"}
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
                  `${STOREFRONT_URL}/${STOREFRONT_LOCALE}/blog/${form.handle}`,
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
                  <Prompt.Title>Hapus artikel ini?</Prompt.Title>
                  <Prompt.Description>
                    Artikel akan hilang dari storefront. Tindakan ini tidak bisa
                    dibatalkan dari halaman ini.
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
            {isNew ? "Buat artikel" : "Simpan"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex flex-col gap-y-3">
          <SectionCard
            title="Konten"
            description="Judul, ringkasan, dan isi artikel dalam format Markdown."
          >
            <Field label="Judul">
              <Input
                value={form.title}
                placeholder="FG, AG, SG, atau TF? Panduan memilih sol sepatu bola"
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
              hint={
                isNew
                  ? "Bagian akhir URL artikel. Tidak bisa diubah setelah dibuat."
                  : "Handle tidak bisa diubah setelah artikel dibuat."
              }
            >
              <Input
                value={form.handle}
                disabled={!isNew}
                placeholder="panduan-memilih-sol-sepatu-bola"
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
              label="Ringkasan"
              hint="Tampil di kartu daftar blog dan jadi cadangan deskripsi SEO."
              counter={[form.excerpt.length, 160]}
            >
              <Textarea rows={3} value={form.excerpt} onChange={text("excerpt")} />
            </Field>
            <Field
              label="Isi artikel (Markdown)"
              hint="## untuk judul bagian, ### subbagian, - untuk daftar, > untuk kutipan, **tebal**, dan [teks](url)."
            >
              <Textarea
                rows={22}
                value={form.content}
                onChange={text("content")}
                className="font-mono text-xs"
              />
            </Field>
            <div className="flex items-center justify-between">
              <Text size="xsmall" className="text-ui-fg-muted">
                {wordCount(form.content)} kata
              </Text>
              <Button
                size="small"
                variant="transparent"
                onClick={() =>
                  set("read_minutes", String(estimateReadMinutes(form.content)))
                }
              >
                <Sparkles />
                Hitung waktu baca
              </Button>
            </div>
          </SectionCard>

          <SectionCard
            title="Ringkasan untuk mesin jawaban (GEO)"
            description="Bagian yang dikutip asisten AI. Tulis jawaban langsung, bukan pengantar."
          >
            <Field
              label="Ringkasan jawaban"
              hint="Satu paragraf yang menjawab pertanyaan utama artikel secara langsung."
            >
              <Textarea
                rows={4}
                value={form.answer_summary}
                onChange={text("answer_summary")}
              />
            </Field>
            <Field label="Poin kunci" hint="Tampil sebagai daftar ringkas di awal artikel.">
              <LineList
                value={form.key_takeaways}
                onChange={(value) => set("key_takeaways", value)}
                addLabel="Tambah poin"
                placeholder="Satu poin, satu kalimat"
              />
            </Field>
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
              emptyLabel="Belum ada pertanyaan. Dua sampai lima pertanyaan biasanya cukup."
              fields={[
                { key: "question", label: "Pertanyaan", placeholder: "Apakah sepatu FG boleh dipakai di rumput sintetis?" },
                { key: "answer", label: "Jawaban", type: "textarea", rows: 4 },
              ]}
            />
          </SectionCard>

          <SectionCard
            title="Sumber"
            description="Referensi yang dikutip di akhir artikel."
          >
            <RecordList
              value={form.sources}
              onChange={(value) => set("sources", value)}
              template={{ label: "", url: "" }}
              addLabel="Tambah sumber"
              emptyLabel="Belum ada sumber."
              fields={[
                { key: "label", label: "Label", placeholder: "SPECS Football Footwear" },
                { key: "url", label: "URL", placeholder: "https://www.specs.id/football/footwear.html" },
              ]}
            />
          </SectionCard>

          <SectionCard
            title="Tautan silo"
            description="Produk dan kategori yang ditautkan dari artikel ini."
          >
            <Field label="Produk terkait" optional>
              <ProductPicker
                value={form.related_product_handles}
                onChange={(value) => set("related_product_handles", value)}
              />
            </Field>
            <Field
              label="Handle kategori"
              optional
              hint="Contoh: sepatu-bola, sepatu-futsal."
            >
              <ChipList
                value={form.related_category_handles}
                onChange={(value) => set("related_category_handles", value)}
                placeholder="Ketik handle lalu Enter"
              />
            </Field>
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
            <Field
              label="Storefront"
              hint="Pilih satu storefront, atau biarkan semua agar artikel tampil di seluruh toko."
            >
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
            <div className="flex items-center justify-between">
              <div>
                <Text size="small" weight="plus">
                  Artikel unggulan
                </Text>
                <Text size="xsmall" className="text-ui-fg-subtle">
                  Tampil besar di atas halaman blog.
                </Text>
              </div>
              <Switch
                checked={form.is_featured}
                onCheckedChange={(checked) => set("is_featured", checked)}
              />
            </div>
            <Field label="Urutan" hint="Angka kecil tampil lebih dulu.">
              <Input
                type="number"
                min={0}
                value={form.rank}
                onChange={text("rank")}
              />
            </Field>
          </SectionCard>

          <SectionCard title="Organisasi">
            <Field label="Kategori" optional hint="Panduan, Perawatan, Ukuran, Cerita.">
              <Input value={form.category} onChange={text("category")} />
            </Field>
            <Field label="Tag" optional>
              <ChipList
                value={form.tags}
                onChange={(value) => set("tags", value)}
              />
            </Field>
            <Field label="Penulis" optional>
              <Input value={form.author_name} onChange={text("author_name")} />
            </Field>
            <Field label="Peran penulis" optional>
              <Input value={form.author_role} onChange={text("author_role")} />
            </Field>
            <Field label="Waktu baca (menit)" optional>
              <Input
                type="number"
                min={0}
                value={form.read_minutes}
                onChange={text("read_minutes")}
              />
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
            <Field
              label="Teks alternatif"
              optional
              hint="Deskripsi gambar untuk pembaca layar dan mesin pencari."
            >
              <Input
                value={form.cover_image_alt}
                onChange={text("cover_image_alt")}
              />
            </Field>
            <Field
              label="URL gambar share"
              optional
              hint="Dipakai saat tautan dibagikan. Kosong berarti memakai gambar sampul."
            >
              <Input value={form.og_image_url} onChange={text("og_image_url")} />
            </Field>
          </SectionCard>

          <SectionCard
            title="SEO"
            description="Kosongkan judul dan deskripsi untuk memakai judul serta ringkasan artikel."
          >
            <SerpPreview
              url={`${STOREFRONT_URL}/${STOREFRONT_LOCALE}/blog/${form.handle || "handle"}`}
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
            <Field
              label="URL kanonik"
              optional
              hint="Isi hanya jika artikel ini menduplikasi halaman lain."
            >
              <Input
                value={form.canonical_url}
                onChange={text("canonical_url")}
              />
            </Field>
            <div className="flex items-center justify-between">
              <div>
                <Text size="small" weight="plus">
                  Sembunyikan dari mesin pencari
                </Text>
                <Text size="xsmall" className="text-ui-fg-subtle">
                  Menambahkan noindex pada halaman.
                </Text>
              </div>
              <Switch
                checked={form.noindex}
                onCheckedChange={(checked) => set("noindex", checked)}
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Target bahasa &amp; wilayah"
            description="Ditulis ke data terstruktur halaman."
          >
            <Field label="Bahasa" optional hint="Contoh: id-ID.">
              <Input value={form.geo_locale} onChange={text("geo_locale")} />
            </Field>
            <Field label="Wilayah" optional hint="Contoh: Indonesia, Jakarta.">
              <Input
                value={form.geo_target_area}
                onChange={text("geo_target_area")}
              />
            </Field>
          </SectionCard>

          <SectionCard
            title="Kesiapan SEO &amp; GEO"
            description="Daftar periksa yang berpengaruh nyata ke hasil pencarian."
          >
            <SeoChecklist checks={checks} />
          </SectionCard>
        </div>
      </div>
    </div>
  )
}

const ArticleDetailPage = () => {
  const { id } = useParams()
  const isNew = id === "new"

  const { data, isLoading, isError } = useQuery({
    queryKey: ["article", id],
    queryFn: () =>
      sdk.client.fetch<{ article: Article }>(`/admin/articles/${id}`),
    enabled: !isNew,
  })

  if (isNew) {
    return <ArticleForm article={null} />
  }

  if (isLoading) {
    return (
      <Text size="small" className="text-ui-fg-muted p-6">
        Memuat artikel...
      </Text>
    )
  }

  if (isError || !data) {
    return (
      <Text size="small" className="text-ui-fg-error p-6">
        Artikel tidak ditemukan.
      </Text>
    )
  }

  return <ArticleForm article={data.article} />
}

export default ArticleDetailPage
