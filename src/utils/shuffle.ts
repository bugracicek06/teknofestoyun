/**
 * Pure Fisher–Yates Shuffle
 * Guaranteed unbiased random permutation.
 * Does not mutate canonical array, returns a new array.
 */
export function shuffleAnimals<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}
