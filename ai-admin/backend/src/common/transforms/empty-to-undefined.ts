export function emptyToUndefined({ value }: { value: unknown }) {
  return value === '' ? undefined : value;
}
