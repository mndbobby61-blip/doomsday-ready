import { useMemo, useState } from 'react';

const PALETTE = [
  { name: 'Purple', bg: 'rgba(157, 78, 221, 0.25)', border: '#9d4edd', text: '#e0aaff', glow: 'rgba(157, 78, 221, 0.4)' },
  { name: 'Teal', bg: 'rgba(6, 214, 160, 0.25)', border: '#06d6a0', text: '#b7efc5', glow: 'rgba(6, 214, 160, 0.4)' },
  { name: 'Amber', bg: 'rgba(255, 176, 32, 0.25)', border: '#ffb020', text: '#ffe3a8', glow: 'rgba(255, 176, 32, 0.4)' },
  { name: 'Pink', bg: 'rgba(247, 37, 133, 0.25)', border: '#f72585', text: '#fcc5e4', glow: 'rgba(247, 37, 133, 0.4)' },
  { name: 'Cyan', bg: 'rgba(76, 201, 240, 0.25)', border: '#4cc9f0', text: '#caf0f8', glow: 'rgba(76, 201, 240, 0.4)' },
  { name: 'Lime', bg: 'rgba(82, 183, 136, 0.25)', border: '#52b788', text: '#d8f3dc', glow: 'rgba(82, 183, 136, 0.4)' },
];

export default function AuditoriumPreview({ quote }) {
  const [hoveredBundleIndex, setHoveredBundleIndex] = useState(null);

  // Flatten the bundle list: [{ size: 20, count: 1 }, { size: 9, count: 2 }] -> 3 distinct bundle blocks
  const blocks = useMemo(() => {
    if (!quote?.bundles) return [];
    const result = [];
    let id = 0;
    quote.bundles.forEach((b, bIdx) => {
      const color = PALETTE[bIdx % PALETTE.length];
      for (let i = 0; i < b.count; i++) {
        result.push({
          id: id++,
          bundleIndex: bIdx,
          size: b.size,
          bundleNumber: i + 1,
          color,
        });
      }
    });
    return result;
  }, [quote]);

  if (!quote || !quote.possible) return null;

  const isLargeGroup = quote.groupSize > 120;

  return (
    <div className="auditorium-wrapper">
      <div className="auditorium-header">
        <div>
          <h3>Interactive Hall Preview</h3>
          <p className="muted">Visual seat allocation by bundle — 0 wasted seats</p>
        </div>
        <span className="badge-live">Live DP Mapping</span>
      </div>

      <div className="cinema-stage">
        {/* Curved Screen */}
        <div className="cinema-screen" aria-label="Movie screen">
          <div className="screen-arc" />
          <span className="screen-label">SCREEN</span>
        </div>

        {/* Seating Arrangement */}
        {!isLargeGroup ? (
          <div className="hall-grid" role="group" aria-label="Assigned seat bundles">
            {blocks.map((block) => {
              const isHovered = hoveredBundleIndex === block.bundleIndex;
              return (
                <div
                  key={block.id}
                  className={`seat-pod ${isHovered ? 'is-active' : ''}`}
                  style={{
                    borderColor: block.color.border,
                    background: block.color.bg,
                    boxShadow: isHovered ? `0 0 16px ${block.color.glow}` : undefined,
                  }}
                  onMouseEnter={() => setHoveredBundleIndex(block.bundleIndex)}
                  onMouseLeave={() => setHoveredBundleIndex(null)}
                  title={`Bundle of ${block.size} seats (#${block.bundleNumber})`}
                >
                  <div className="pod-header" style={{ color: block.color.text }}>
                    <span>Bundle: {block.size} seats</span>
                  </div>
                  <div className="pod-seats">
                    {Array.from({ length: block.size }).map((_, seatIdx) => (
                      <span
                        key={seatIdx}
                        className="seat-dot"
                        style={{ background: block.color.border }}
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="hall-zones">
            {blocks.map((block) => (
              <div
                key={block.id}
                className="zone-block"
                style={{
                  borderColor: block.color.border,
                  background: block.color.bg,
                  color: block.color.text,
                }}
              >
                <strong>{block.size} seats</strong>
                <small>Bundle #{block.bundleNumber}</small>
              </div>
            ))}
          </div>
        )}

        {/* Legend */}
        <div className="hall-legend">
          {quote.bundles.map((bundle, idx) => {
            const color = PALETTE[idx % PALETTE.length];
            return (
              <div
                key={bundle.size}
                className="legend-item"
                onMouseEnter={() => setHoveredBundleIndex(idx)}
                onMouseLeave={() => setHoveredBundleIndex(null)}
                style={{ cursor: 'pointer' }}
              >
                <span className="legend-chip" style={{ background: color.border }} />
                <span>
                  <strong>{bundle.size}-seat</strong> bundle (×{bundle.count})
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
