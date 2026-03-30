/**
 * Shared Hall Pass overlap: users who pick the same celebrities are ranked together.
 * Higher overlap → appears earlier in the swipe deck (mirrors SQL ordering in production).
 */

export function overlapCount(
  viewerCelebrityIds: ReadonlySet<string>,
  candidateCelebrityIds: readonly string[]
): number {
  let n = 0;
  for (const id of candidateCelebrityIds) {
    if (viewerCelebrityIds.has(id)) n += 1;
  }
  return n;
}

export function rankCandidatesBySharedHallPass<
  T extends { id: string; celebrityIds: readonly string[] },
>(viewerCelebrityIds: Iterable<string>, candidates: readonly T[]): Array<T & { overlapCount: number }> {
  const viewer = new Set(viewerCelebrityIds);
  return [...candidates]
    .map((c) => ({
      ...c,
      overlapCount: overlapCount(viewer, c.celebrityIds),
    }))
    .sort((a, b) => {
      if (b.overlapCount !== a.overlapCount) {
        return b.overlapCount - a.overlapCount;
      }
      return a.id.localeCompare(b.id);
    });
}
