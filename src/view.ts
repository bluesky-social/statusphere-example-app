// @ts-ignore
import ssr from 'uhtml/ssr'
import type initSSR from 'uhtml/types/init-ssr'
import type { Hole } from 'uhtml/types/keyed'

export type { Hole }

export const { html }: ReturnType<typeof initSSR> = ssr()

export function page(hole: Hole) {
  return `<!DOCTYPE html>\n${hole.toDOM().toString()}`
}
