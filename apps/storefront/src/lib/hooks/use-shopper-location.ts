"use client"

import type { Coordinates } from "@lib/util/omnichannel"
import { useCallback, useEffect, useState } from "react"

export type ShopperLocationStatus =
  | "idle"
  | "locating"
  | "granted"
  | "denied"
  | "unavailable"

const STORAGE_KEY = "specs_shopper_location"
// The position is reused for half an hour so moving between product pages
// doesn't ask the device again.
const MAX_AGE_MS = 30 * 60 * 1000

const readCached = (): Coordinates | null => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return null
    }
    const cached = JSON.parse(raw) as Coordinates & { at: number }
    if (Date.now() - cached.at > MAX_AGE_MS) {
      return null
    }
    return { latitude: cached.latitude, longitude: cached.longitude }
  } catch {
    return null
  }
}

const writeCached = (coords: Coordinates) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...coords, at: Date.now() }))
  } catch {
    // Private mode or blocked storage: the position just isn't remembered.
  }
}

/**
 * The shopper's position for recommending the nearest stock location.
 * With `askOnMount` the browser's permission prompt is shown as soon as the
 * component mounts (the product page asks before anything is added to the
 * bag); `request` asks again, e.g. from an "allow location" button.
 */
export const useShopperLocation = ({ askOnMount = false } = {}) => {
  const [status, setStatus] = useState<ShopperLocationStatus>("idle")
  const [coords, setCoords] = useState<Coordinates | null>(null)

  const request = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unavailable")
      return
    }
    setStatus("locating")
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }
        writeCached(next)
        setCoords(next)
        setStatus("granted")
      },
      (error) => {
        setStatus(error.code === error.PERMISSION_DENIED ? "denied" : "unavailable")
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 10 * 60 * 1000 }
    )
  }, [])

  useEffect(() => {
    const cached = readCached()
    if (cached) {
      setCoords(cached)
      setStatus("granted")
      return
    }

    let cancelled = false
    const permissions = navigator.permissions?.query?.({
      name: "geolocation" as PermissionName,
    })

    if (!permissions) {
      if (askOnMount) {
        request()
      }
      return
    }

    permissions
      .then((permission) => {
        if (cancelled) {
          return
        }
        if (permission.state === "denied") {
          setStatus("denied")
        } else if (permission.state === "granted" || askOnMount) {
          // Already allowed: read the position without prompting. Otherwise
          // this shows the browser's permission prompt.
          request()
        }
      })
      .catch(() => {
        if (!cancelled && askOnMount) {
          request()
        }
      })

    return () => {
      cancelled = true
    }
  }, [askOnMount, request])

  return { status, coords, request }
}
