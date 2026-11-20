export function calculateBooking(bundleSizes, groupSize) {
  if (!Number.isInteger(groupSize) || groupSize < 1) {
    throw new RangeError('groupSize must be a positive integer');
  }

  const sizes = [...new Set(bundleSizes)]
    .filter((size) => Number.isInteger(size) && size > 0)
    .sort((a, b) => b - a);

  const fewest = new Array(groupSize + 1).fill(Infinity);
  const lastBundle = new Uint16Array(groupSize + 1);
  fewest[0] = 0;

  for (let seats = 1; seats <= groupSize; seats++) {
    for (const size of sizes) {
      if (size > seats) continue;
      const candidate = fewest[seats - size] + 1;
      if (candidate < fewest[seats]) {
        fewest[seats] = candidate;
        lastBundle[seats] = size;
      }
    }
  }

  if (fewest[groupSize] === Infinity) {
    return { possible: false, totalBundles: 0, bundles: [] };
  }

  const counts = new Map();
  for (let seats = groupSize; seats > 0; seats -= lastBundle[seats]) {
    const size = lastBundle[seats];
    counts.set(size, (counts.get(size) ?? 0) + 1);
  }

  const bundles = [...counts]
    .map(([size, count]) => ({ size, count }))
    .sort((a, b) => b.size - a.size);

  return { possible: true, totalBundles: fewest[groupSize], bundles };
}
