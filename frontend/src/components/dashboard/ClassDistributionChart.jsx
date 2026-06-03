import React, { useState } from 'react';

/**
 * ClassDistributionChart
 * Props:
 *   data: Array<{ id: number, name: string, count: number }>
 */
export default function ClassDistributionChart({ data = [] }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '200px',
        color: 'var(--text-muted)',
        fontSize: '13px'
      }}>
        No class distribution data available.
      </div>
    );
  }

  const maxCount = Math.max(...data.map(d => d.count));

  // Palette cycling through primary/purple/info/success/warning
  const COLORS = [
    '#6366f1', // primary indigo
    '#8b5cf6', // purple
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#06b6d4', // cyan
    '#f97316', // orange
    '#84cc16', // lime
    '#ec4899', // pink
  ];

  const barHeight = 28;
  const barGap = 10;
  const labelWidth = 130;
  const countWidth = 52;
  const barAreaWidth = 260;
  const svgWidth = labelWidth + barAreaWidth + countWidth + 16;
  const svgHeight = data.length * (barHeight + barGap) + barGap;

  return (
    <div style={{ overflowY: 'auto', maxHeight: '340px' }}>
      <svg
        width="100%"
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        style={{ fontFamily: 'var(--font-body, sans-serif)', display: 'block' }}
      >
        {data.map((item, idx) => {
          const y = barGap + idx * (barHeight + barGap);
          const barWidth = maxCount > 0 ? (item.count / maxCount) * barAreaWidth : 0;
          const color = COLORS[idx % COLORS.length];
          const isHovered = hoveredIdx === idx;

          // Truncate long label names
          const maxLabelChars = 16;
          const displayName =
            item.name.length > maxLabelChars
              ? item.name.slice(0, maxLabelChars - 1) + '…'
              : item.name;

          return (
            <g
              key={item.id}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{ cursor: 'default' }}
            >
              {/* Class name label */}
              <text
                x={labelWidth - 8}
                y={y + barHeight / 2 + 4}
                textAnchor="end"
                fontSize="12"
                fill={isHovered ? '#e2e8f0' : '#94a3b8'}
                fontWeight={isHovered ? '600' : '400'}
              >
                {displayName}
              </text>

              {/* Bar background track */}
              <rect
                x={labelWidth}
                y={y}
                width={barAreaWidth}
                height={barHeight}
                rx="5"
                fill="rgba(255,255,255,0.04)"
              />

              {/* Filled bar */}
              <rect
                x={labelWidth}
                y={y}
                width={Math.max(barWidth, 4)}
                height={barHeight}
                rx="5"
                fill={color}
                opacity={isHovered ? 1 : 0.75}
                style={{ transition: 'width 0.4s ease, opacity 0.15s' }}
              />

              {/* Count label */}
              <text
                x={labelWidth + barAreaWidth + 8}
                y={y + barHeight / 2 + 4}
                textAnchor="start"
                fontSize="12"
                fill={isHovered ? '#e2e8f0' : '#64748b'}
                fontWeight={isHovered ? '600' : '400'}
              >
                {item.count.toLocaleString()}
              </text>

              {/* Tooltip on hover: full name if truncated */}
              {isHovered && item.name.length > maxLabelChars && (
                <g>
                  <rect
                    x={labelWidth + 4}
                    y={y - 26}
                    width={Math.min(item.name.length * 7 + 16, 260)}
                    height={22}
                    rx="4"
                    fill="#1e293b"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="1"
                  />
                  <text
                    x={labelWidth + 12}
                    y={y - 10}
                    fontSize="11"
                    fill="#e2e8f0"
                  >
                    {item.name}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
