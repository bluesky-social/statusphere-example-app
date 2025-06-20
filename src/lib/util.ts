export function ifString<T>(value: T): (T & string) | undefined {
  if (typeof value === 'string') return value
  return undefined
}
