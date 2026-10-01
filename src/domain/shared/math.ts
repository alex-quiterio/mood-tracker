/** The mean of some numbers, or null when there are none. */
export const average = (values: number[]): number | null =>
  values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : null;
