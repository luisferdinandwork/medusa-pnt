import { defineWidgetConfig } from "@medusajs/admin-sdk"
import type { AdminStockLocation, DetailWidgetProps } from "@medusajs/framework/types"
import {
  Badge,
  Button,
  Container,
  Heading,
  Input,
  Label,
  Select,
  Switch,
  Text,
  toast,
} from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { sdk } from "../lib/sdk"

// Mirrors LOCATION_META in src/lib/omnichannel.ts.
const META = {
  enabled: "omnichannel",
  code: "location_code",
  kind: "location_kind",
  isDefault: "omnichannel_default",
  latitude: "latitude",
  longitude: "longitude",
} as const

type FormValues = {
  enabled: boolean
  code: string
  kind: "warehouse" | "store"
  isDefault: boolean
  latitude: string
  longitude: string
}

const toForm = (metadata: Record<string, unknown> | null | undefined): FormValues => ({
  enabled: metadata?.[META.enabled] === true,
  code: String(metadata?.[META.code] ?? ""),
  kind: metadata?.[META.kind] === "store" ? "store" : "warehouse",
  isDefault: metadata?.[META.isDefault] === true,
  latitude: metadata?.[META.latitude] === undefined ? "" : String(metadata[META.latitude]),
  longitude: metadata?.[META.longitude] === undefined ? "" : String(metadata[META.longitude]),
})

const toNumberOrNull = (value: string) => {
  const parsed = Number.parseFloat(value.replace(",", "."))
  return Number.isFinite(parsed) ? parsed : null
}

/**
 * Omnichannel settings of a stock location: whether shoppers can pick it on
 * the storefront, its short code, whether it's a store or a warehouse, the
 * default choice, and its coordinates for the "nearest location" suggestion.
 */
const LocationOmnichannelWidget = ({ data }: DetailWidgetProps<AdminStockLocation>) => {
  const queryClient = useQueryClient()
  const { data: fetched } = useQuery({
    queryKey: ["omnichannel-location", data.id],
    queryFn: () =>
      sdk.admin.stockLocation.retrieve(data.id, { fields: "id,name,metadata" }),
  })
  const metadata = fetched?.stock_location.metadata as Record<string, unknown> | undefined
  const [form, setForm] = useState<FormValues>(toForm(metadata))
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    if (!editing) {
      setForm(toForm(metadata))
    }
  }, [metadata, editing])

  const save = useMutation({
    mutationFn: async () => {
      const latitude = toNumberOrNull(form.latitude)
      const longitude = toNumberOrNull(form.longitude)
      if ((latitude === null) !== (longitude === null)) {
        throw new Error("Fill in both latitude and longitude, or neither.")
      }

      await sdk.admin.stockLocation.update(data.id, {
        metadata: {
          ...(metadata ?? {}),
          [META.enabled]: form.enabled,
          [META.code]: form.code.trim() || data.name,
          [META.kind]: form.kind,
          [META.isDefault]: form.isDefault,
          [META.latitude]: latitude,
          [META.longitude]: longitude,
        },
      })

      // Only one location can be the default ship-from choice.
      if (form.isDefault) {
        const { stock_locations } = await sdk.admin.stockLocation.list({
          fields: "id,metadata",
          limit: 200,
        })
        await Promise.all(
          stock_locations
            .filter(
              (location) =>
                location.id !== data.id &&
                (location.metadata as Record<string, unknown> | null)?.[META.isDefault] === true
            )
            .map((location) =>
              sdk.admin.stockLocation.update(location.id, {
                metadata: {
                  ...((location.metadata as Record<string, unknown> | null) ?? {}),
                  [META.isDefault]: false,
                },
              })
            )
        )
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["omnichannel-location"] })
      setEditing(false)
      toast.success("Omnichannel settings saved")
    },
    onError: (error: Error) => toast.error("Could not save", { description: error.message }),
  })

  const current = toForm(metadata)

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">Omnichannel</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Lets shoppers pick this location to ship from.
          </Text>
        </div>
        {!editing && (
          <Button size="small" variant="secondary" onClick={() => setEditing(true)}>
            Edit
          </Button>
        )}
      </div>

      {!editing ? (
        <div className="flex flex-col gap-y-2 px-6 py-4">
          <div className="flex items-center justify-between">
            <Text size="small" className="text-ui-fg-subtle">Status</Text>
            <Badge size="2xsmall" color={current.enabled ? "green" : "grey"}>
              {current.enabled ? "Shown on storefront" : "Hidden"}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <Text size="small" className="text-ui-fg-subtle">Code</Text>
            <Text size="small">{current.code || "-"}</Text>
          </div>
          <div className="flex items-center justify-between">
            <Text size="small" className="text-ui-fg-subtle">Type</Text>
            <Text size="small">{current.kind === "store" ? "Store" : "Warehouse"}</Text>
          </div>
          <div className="flex items-center justify-between">
            <Text size="small" className="text-ui-fg-subtle">Default choice</Text>
            <Text size="small">{current.isDefault ? "Yes" : "No"}</Text>
          </div>
          <div className="flex items-center justify-between">
            <Text size="small" className="text-ui-fg-subtle">Coordinates</Text>
            <Text size="small">
              {current.latitude && current.longitude
                ? `${current.latitude}, ${current.longitude}`
                : "Not set"}
            </Text>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-y-4 px-6 py-4">
          <div className="flex items-center justify-between">
            <Label size="small">Show on storefront</Label>
            <Switch
              checked={form.enabled}
              onCheckedChange={(enabled) => setForm((f) => ({ ...f, enabled }))}
            />
          </div>
          <div className="flex flex-col gap-y-1">
            <Label size="small">Code</Label>
            <Input
              size="small"
              value={form.code}
              placeholder="FF001"
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-y-1">
            <Label size="small">Type</Label>
            <Select
              size="small"
              value={form.kind}
              onValueChange={(kind) =>
                setForm((f) => ({ ...f, kind: kind as FormValues["kind"] }))
              }
            >
              <Select.Trigger>
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="warehouse">Warehouse</Select.Item>
                <Select.Item value="store">Store</Select.Item>
              </Select.Content>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label size="small">Default choice</Label>
              <Text size="xsmall" className="text-ui-fg-subtle">
                Preselected on product pages when it has stock.
              </Text>
            </div>
            <Switch
              checked={form.isDefault}
              onCheckedChange={(isDefault) => setForm((f) => ({ ...f, isDefault }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-y-1">
              <Label size="small">Latitude</Label>
              <Input
                size="small"
                value={form.latitude}
                placeholder="-6.1632"
                onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-y-1">
              <Label size="small">Longitude</Label>
              <Input
                size="small"
                value={form.longitude}
                placeholder="106.7746"
                onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value }))}
              />
            </div>
          </div>
          <Text size="xsmall" className="text-ui-fg-subtle">
            Used to suggest the location nearest to the shopper.
          </Text>
          <div className="flex justify-end gap-x-2">
            <Button
              size="small"
              variant="secondary"
              onClick={() => {
                setEditing(false)
                setForm(toForm(metadata))
              }}
            >
              Cancel
            </Button>
            <Button size="small" isLoading={save.isPending} onClick={() => save.mutate()}>
              Save
            </Button>
          </div>
        </div>
      )}
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "location.details.side.after",
})

export default LocationOmnichannelWidget
