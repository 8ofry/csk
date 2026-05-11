// Tiny SVG bar chart — server-renderable, no client JS.
// Used for monthly revenue + attendance trend.

interface BarChartProps {
  data: { label: string; value: number }[];
  height?: number;
  width?: number;
  /** Format the bar's tooltip / value-overlay. */
  format?: (n: number) => string;
  color?: string;
}

const DEFAULT_COLOR = "#D4AF37";

export function BarChart({
  data,
  height = 160,
  width = 640,
  format = (n) => String(Math.round(n)),
  color = DEFAULT_COLOR,
}: BarChartProps) {
  if (data.length === 0) {
    return <div className="text-sm text-muted-foreground">No data.</div>;
  }
  const max = Math.max(1, ...data.map((d) => d.value));
  const padX = 32;
  const padY = 24;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const slot = innerW / data.length;
  const barW = Math.max(2, slot * 0.6);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      role="img"
      aria-label="Monthly bar chart"
    >
      {/* Y axis baseline */}
      <line
        x1={padX}
        x2={width - padX}
        y1={height - padY}
        y2={height - padY}
        stroke="currentColor"
        opacity={0.2}
      />
      {data.map((d, i) => {
        const h = (d.value / max) * innerH;
        const x = padX + i * slot + (slot - barW) / 2;
        const y = height - padY - h;
        return (
          <g key={`${d.label}-${i}`}>
            <rect x={x} y={y} width={barW} height={h} fill={color} rx={2}>
              <title>
                {d.label}: {format(d.value)}
              </title>
            </rect>
            <text
              x={x + barW / 2}
              y={height - padY + 14}
              textAnchor="middle"
              fontSize="9"
              fill="currentColor"
              opacity={0.7}
            >
              {d.label.slice(-2)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
