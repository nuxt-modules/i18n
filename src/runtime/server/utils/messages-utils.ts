/**
 * Utility type to pick properties from an object based on a list of keys,
 */
type NestedPick<T, K extends string> = {
  [P in K extends `${infer A}.${string}` ? A : K & keyof T]: P extends `${infer A}.${infer B}`
    ? A extends keyof T
      ? T[A] extends object
        ? NestedPick<T[A], B>
        : never //  A non-object in the path
      : never //  A is not a key of T
    : P extends keyof T
      ? T[P]
      : never // P is not a key of T
}

/**
 * Picks properties from an object based on a list of keys, allowing for
 * nested keys using dot notation.
 */
export function pickNested<T extends object, K extends string>(keys: K[], obj: T): Partial<NestedPick<T, K>> {
  const result: Partial<NestedPick<T, K>> = {}

  for (const key of keys) {
    const value = getNestedValue(obj, key)
    if (value !== undefined) {
      // Only include keys that exist in the object
      setNestedValue(result, key, value)
    }
  }
  return result
}

/**
 * Helper function to get a value from an object using dot notation.
 */
export function getNestedValue<T extends object, K extends string>(obj: T, key: K): any {
  const parts = key.split('.')
  let current: any = obj

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part as keyof typeof current]
    } else {
      return undefined // Key not found
    }
  }
  return current
}

/**
 * Helper function to set a value in an object using dot notation, creating
 * nested objects as necessary.
 */
export function setNestedValue<T extends object, K extends string, V = any>(obj: T, key: K, value: V): void {
  const parts = key.split('.')
  let current: any = obj

  // Iterate over all parts except the last one
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]!
    if (!current[part]) {
      current[part] = {} // Create nested object if it doesn't exist
    }
    current = current[part]
  }

  // Set the value for the last part
  const lastPart = parts[parts.length - 1]!
  current[lastPart] = value
}
