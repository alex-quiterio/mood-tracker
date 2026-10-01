/**
 * A readable id made from a label ("Read before bed" → "read-before-bed"), with a
 * number added when it's already taken ("walk-2").
 */
export function uniqueId(label: string, taken: string[], fallback: string): string {
  const base =
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || fallback;
  let id = base;
  for (let n = 2; taken.includes(id); n++) id = `${base}-${n}`;
  return id;
}
