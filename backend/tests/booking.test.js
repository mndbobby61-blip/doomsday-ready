import { describe, expect, it } from 'vitest';
import { calculateBooking } from '../src/logic/booking.js';

describe('calculateBooking', () => {
  it('bundles 1,3,4 for 6 seats -> 3 x 2', () => {
    expect(calculateBooking([1, 3, 4], 6)).toEqual({
      possible: true,
      totalBundles: 2,
      bundles: [{ size: 3, count: 2 }],
    });
  });

  it('bundles 2,5 for 11 seats -> 5 x 1, 2 x 3', () => {
    expect(calculateBooking([2, 5], 11)).toEqual({
      possible: true,
      totalBundles: 4,
      bundles: [
        { size: 5, count: 1 },
        { size: 2, count: 3 },
      ],
    });
  });

  it('bundles 6,9,20 for 44 seats -> 20 x 1, 9 x 2, 6 x 1 (greedy would fail)', () => {
    expect(calculateBooking([6, 9, 20], 44)).toEqual({
      possible: true,
      totalBundles: 4,
      bundles: [
        { size: 20, count: 1 },
        { size: 9, count: 2 },
        { size: 6, count: 1 },
      ],
    });
  });

  it('bundles 4,6 for 7 seats -> not possible', () => {
    expect(calculateBooking([4, 6], 7)).toEqual({ possible: false, totalBundles: 0, bundles: [] });
  });

  it('handles a group of one', () => {
    expect(calculateBooking([1, 5], 1).bundles).toEqual([{ size: 1, count: 1 }]);
  });

  it('ignores duplicate sizes and input order', () => {
    expect(calculateBooking([4, 3, 3, 1], 6).totalBundles).toBe(2);
  });

  it('is not possible when every bundle is bigger than the group', () => {
    expect(calculateBooking([10, 20], 5).possible).toBe(false);
  });

  it('solves the maximum group size exactly', () => {
    const quote = calculateBooking([7, 500], 10000);
    expect(quote.bundles).toEqual([{ size: 500, count: 20 }]);
  });

  it('rejects an invalid group size', () => {
    expect(() => calculateBooking([2], 0)).toThrow(RangeError);
    expect(() => calculateBooking([2], 2.5)).toThrow(RangeError);
  });
});