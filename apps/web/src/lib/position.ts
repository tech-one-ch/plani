export function calculatePosition(
  prevPosition: number | null,
  nextPosition: number | null,
): number {
  if (prevPosition === null && nextPosition === null) return 1000;
  if (prevPosition === null) return nextPosition! / 2;
  if (nextPosition === null) return prevPosition + 1000;
  return (prevPosition + nextPosition) / 2;
}
