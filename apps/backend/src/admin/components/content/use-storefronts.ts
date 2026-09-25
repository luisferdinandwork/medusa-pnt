import { useQuery } from "@tanstack/react-query"
import { sdk } from "../../lib/sdk"
import type { StorefrontOption } from "./types"

/** The shop fronts a piece of content can be scoped to (Storefronts page). */
export const useStorefronts = () => {
  const { data } = useQuery({
    queryKey: ["storefronts"],
    queryFn: () =>
      sdk.client.fetch<{ storefronts: StorefrontOption[] }>(
        "/admin/storefronts"
      ),
  })

  return data?.storefronts ?? []
}
