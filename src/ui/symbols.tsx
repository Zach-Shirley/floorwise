/**
 * Top-down drawings for furniture and fixtures.
 * Each symbol draws in a local frame centered on (0, 0), w wide and d deep (feet),
 * with the FRONT facing +y (down the screen). Add a new case here when you add a
 * new `symbol` key to the catalog.
 */
import type { ReactNode } from 'react';
import type { SymbolKey } from '../engine/types';

const NS = { vectorEffect: 'non-scaling-stroke' as const };

function R(x: number, y: number, w: number, h: number, rx = 0, cls = '') {
  return <rect x={x} y={y} width={w} height={h} rx={rx} className={cls} {...NS} />;
}

interface SymbolProps {
  symbol: SymbolKey;
  w: number;
  d: number;
  round?: boolean;
  /** Mirror left-to-right (left-hand L-desks and sectionals). */
  flip?: boolean;
}

export function SymbolShape({ flip, ...p }: SymbolProps) {
  return flip ? <g transform="scale(-1 1)">{symbolBody(p)}</g> : symbolBody(p);
}

function symbolBody({ symbol, w, d, round }: SymbolProps) {
  const x0 = -w / 2,
    y0 = -d / 2;
  const m = Math.min(w, d);
  const body = (rx = Math.min(0.25, m * 0.08)) =>
    round ? <ellipse cx={0} cy={0} rx={w / 2} ry={d / 2} {...NS} /> : R(x0, y0, w, d, rx);
  let detail: ReactNode = null;
  switch (symbol) {
    case 'bed':
    case 'bunk': {
      const pw = (w - 0.5) / (w > 4 ? 2 : 1);
      const pillows = w > 4 ? [x0 + 0.2, x0 + 0.3 + pw] : [x0 + 0.25];
      detail = (
        <>
          {R(x0, y0, w, 0.35, 0.08, 'sym-solid')}
          {pillows.map((px, i) => (
            <g key={i}>{R(px, y0 + 0.5, w > 4 ? pw - 0.1 : w - 0.5, 1.1, 0.3, 'sym-soft')}</g>
          ))}
          <path d={`M${x0} ${y0 + 2.1} L${-x0} ${y0 + 2.1} L${-x0} ${y0 + 2.6} Q0 ${y0 + 2.9} ${x0} ${y0 + 2.6} Z`} className="sym-soft" {...NS} />
          {symbol === 'bunk' && <line x1={x0} y1={y0} x2={-x0} y2={-y0} className="sym-thin" {...NS} />}
        </>
      );
      break;
    }
    case 'crib':
      detail = R(x0 + 0.15, y0 + 0.15, w - 0.3, d - 0.3, 0.1, 'sym-thin');
      break;
    case 'sofa':
    case 'loveseat': {
      const arm = Math.min(0.6, w * 0.1);
      const back = Math.min(0.75, d * 0.28);
      const seats = symbol === 'loveseat' ? 2 : w > 6.5 ? 3 : 2;
      const sw = (w - 2 * arm) / seats;
      detail = (
        <>
          {R(x0, y0, w, back, 0.2, 'sym-solid')}
          {R(x0, y0, arm, d, 0.2, 'sym-solid')}
          {R(-x0 - arm, y0, arm, d, 0.2, 'sym-solid')}
          {Array.from({ length: seats }, (_, i) => (
            <g key={i}>{R(x0 + arm + i * sw + 0.04, y0 + back + 0.04, sw - 0.08, d - back - 0.12, 0.15, 'sym-soft')}</g>
          ))}
        </>
      );
      break;
    }
    case 'sectional': {
      const back = 0.75,
        arm = 0.5,
        seat = 3;
      return (
        <g className="sym">
          <path
            d={`M${x0} ${y0} H${-x0} V${y0 + seat} H${x0 + seat} V${-y0} H${x0} Z`}
            {...NS}
          />
          <path d={`M${x0} ${y0} H${-x0} V${y0 + back} H${x0 + back} V${-y0} H${x0} Z`} className="sym-solid" {...NS} />
          {R(-x0 - arm, y0, arm, seat, 0.15, 'sym-solid')}
          {R(x0, -y0 - arm, seat, arm, 0.15, 'sym-solid')}
        </g>
      );
    }
    case 'armchair': {
      const arm = Math.min(0.45, w * 0.18);
      detail = (
        <>
          {R(x0, y0, w, Math.min(0.6, d * 0.25), 0.2, 'sym-solid')}
          {R(x0, y0, arm, d, 0.2, 'sym-solid')}
          {R(-x0 - arm, y0, arm, d, 0.2, 'sym-solid')}
        </>
      );
      break;
    }
    case 'coffee-table':
    case 'side-table':
      detail = round ? (
        <ellipse cx={0} cy={0} rx={w / 2 - 0.15} ry={d / 2 - 0.15} className="sym-thin" {...NS} />
      ) : (
        R(x0 + 0.15, y0 + 0.15, w - 0.3, d - 0.3, 0.05, 'sym-thin')
      );
      break;
    case 'tv-console':
      detail = R(x0 + w * 0.1, y0 + 0.05, w * 0.8, 0.12, 0, 'sym-solid');
      break;
    case 'bookshelf': {
      const n = Math.max(1, Math.floor(w / 1.5));
      detail = (
        <>
          {Array.from({ length: n }, (_, i) => {
            const x = x0 + ((i + 1) * w) / (n + 1);
            return <line key={i} x1={x} y1={y0} x2={x} y2={-y0} className="sym-thin" {...NS} />;
          })}
        </>
      );
      break;
    }
    case 'rug':
      detail = R(x0 + 0.3, y0 + 0.3, w - 0.6, d - 0.6, 0.1, 'sym-thin sym-dash');
      break;
    case 'plant':
      detail = (
        <>
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <ellipse key={a} cx={0} cy={-w / 4} rx={w / 9} ry={w / 4} transform={`rotate(${a})`} className="sym-thin" {...NS} />
          ))}
        </>
      );
      break;
    case 'piano':
      detail = (
        <>
          {R(x0, -y0 - 0.5, w, 0.5, 0, 'sym-thin')}
          {Array.from({ length: 12 }, (_, i) => {
            const x = x0 + (w * (i + 1)) / 13;
            return <line key={i} x1={x} y1={-y0 - 0.5} x2={x} y2={-y0} className="sym-thin" {...NS} />;
          })}
        </>
      );
      break;
    case 'table-rect':
    case 'table-round': {
      const chairs: [number, number, number][] = [];
      if (symbol === 'table-round') {
        const n = w > 4.5 ? 6 : 4;
        for (let i = 0; i < n; i++) {
          const a = (i / n) * 360 + 45;
          chairs.push([Math.cos((a * Math.PI) / 180) * (w / 2 + 0.55), Math.sin((a * Math.PI) / 180) * (w / 2 + 0.55), a + 90]);
        }
      } else {
        const per = Math.max(1, Math.round(w / 2.4));
        for (let i = 0; i < per; i++) {
          const x = x0 + ((i + 0.5) * w) / per;
          chairs.push([x, y0 - 0.55, 0], [x, -y0 + 0.55, 180]);
        }
        if (w >= 5.5) chairs.push([x0 - 0.55, 0, 270], [-x0 + 0.55, 0, 90]);
      }
      return (
        <g className="sym">
          {chairs.map(([cx, cy, a], i) => (
            <rect key={i} x={-0.7} y={-0.65} width={1.4} height={1.3} rx={0.25} transform={`translate(${cx} ${cy}) rotate(${a})`} className="sym-ghost" {...NS} />
          ))}
          {body(0.1)}
        </g>
      );
    }
    case 'chair':
    case 'stool':
      detail = !round && R(x0, y0, w, 0.3, 0.1, 'sym-solid');
      break;
    case 'office-chair':
      detail = <path d={`M${-w / 3} ${y0 + 0.15} Q0 ${y0 - 0.1} ${w / 3} ${y0 + 0.15}`} className="sym-thin" fill="none" {...NS} />;
      break;
    case 'desk':
      detail = R(x0 + 0.2, y0 + 0.2, w * 0.35, d * 0.5, 0.05, 'sym-thin');
      break;
    case 'dresser':
    case 'nightstand':
      detail = (
        <>
          <line x1={x0} y1={-y0 - 0.12} x2={-x0} y2={-y0 - 0.12} className="sym-thin" {...NS} />
          {symbol === 'dresser' && w > 2.5 && <line x1={0} y1={y0} x2={0} y2={-y0 - 0.12} className="sym-thin" {...NS} />}
        </>
      );
      break;
    case 'wardrobe':
      detail = (
        <>
          <line x1={0} y1={y0} x2={0} y2={-y0} className="sym-thin" {...NS} />
          <line x1={x0 + 0.15} y1={-0.05} x2={-x0 - 0.15} y2={-0.05} className="sym-thin sym-dash" {...NS} />
        </>
      );
      break;
    case 'counter':
      detail = <line x1={x0} y1={-y0 - 0.15} x2={-x0} y2={-y0 - 0.15} className="sym-thin" {...NS} />;
      break;
    case 'island':
      detail = R(x0 + 0.15, y0 + 0.15, w - 0.3, d - 0.3, 0.05, 'sym-thin');
      break;
    case 'sink-kitchen':
      detail = (
        <>
          {R(x0 + 0.25, y0 + 0.35, w / 2 - 0.35, d - 0.75, 0.15, 'sym-thin')}
          {R(0.1, y0 + 0.35, w / 2 - 0.35, d - 0.75, 0.15, 'sym-thin')}
          <circle cx={0} cy={y0 + 0.2} r={0.08} className="sym-solid" {...NS} />
        </>
      );
      break;
    case 'range':
      detail = (
        <>
          {[
            [-1, -1],
            [1, -1],
            [-1, 1],
            [1, 1],
          ].map(([sx, sy], i) => (
            <circle key={i} cx={(sx * w) / 4.4} cy={(sy * d) / 4.6 + 0.08} r={Math.min(w, d) / 6.2} className="sym-thin" {...NS} />
          ))}
          <line x1={x0} y1={y0 + 0.2} x2={-x0} y2={y0 + 0.2} className="sym-thin" {...NS} />
        </>
      );
      break;
    case 'fridge':
      detail = (
        <>
          <line x1={x0} y1={-y0 - 0.2} x2={-x0} y2={-y0 - 0.2} className="sym-thin" {...NS} />
          <line x1={0} y1={y0 + 0.2} x2={0} y2={-y0 - 0.2} className="sym-thin" {...NS} />
          <text x={0} y={0.1} className="sym-label" fontSize={Math.min(w, d) * 0.28}>
            REF
          </text>
        </>
      );
      break;
    case 'dishwasher':
      detail = (
        <>
          <line x1={x0} y1={y0} x2={-x0} y2={-y0} className="sym-thin" {...NS} />
          <line x1={-x0} y1={y0} x2={x0} y2={-y0} className="sym-thin" {...NS} />
        </>
      );
      break;
    case 'toilet':
      return (
        <g className="sym">
          {R(x0 + 0.05, y0, w - 0.1, d * 0.3, 0.1)}
          <ellipse cx={0} cy={y0 + d * 0.62} rx={w / 2 - 0.05} ry={d * 0.36} {...NS} />
          <ellipse cx={0} cy={y0 + d * 0.64} rx={w / 2 - 0.25} ry={d * 0.24} className="sym-thin" {...NS} />
        </g>
      );
    case 'vanity': {
      const n = w >= 4.8 ? 2 : 1;
      detail = (
        <>
          {Array.from({ length: n }, (_, i) => (
            <ellipse key={i} cx={n === 1 ? 0 : (i === 0 ? -1 : 1) * (w / 4)} cy={0.05} rx={Math.min(0.75, w / (2 * n) - 0.25)} ry={d / 2 - 0.35} className="sym-thin" {...NS} />
          ))}
        </>
      );
      break;
    }
    case 'tub':
      detail = (
        <>
          {R(x0 + 0.25, y0 + 0.25, w - 0.5, d - 0.5, Math.min(0.9, d / 2 - 0.3), 'sym-thin')}
          <circle cx={x0 + 0.6} cy={0} r={0.08} className="sym-solid" {...NS} />
        </>
      );
      break;
    case 'shower':
      detail = (
        <>
          <line x1={x0} y1={y0} x2={-x0} y2={-y0} className="sym-thin" {...NS} />
          <line x1={-x0} y1={y0} x2={x0} y2={-y0} className="sym-thin" {...NS} />
          <circle cx={0} cy={0} r={0.12} className="sym-solid" {...NS} />
        </>
      );
      break;
    case 'washer':
    case 'dryer':
      detail = (
        <>
          <circle cx={0} cy={0.15} r={Math.min(w, d) * 0.32} className="sym-thin" {...NS} />
          <text x={0} y={-d / 2 + 0.38} className="sym-label" fontSize={0.28}>
            {symbol === 'washer' ? 'W' : 'D'}
          </text>
        </>
      );
      break;
    case 'water-heater':
      detail = <text x={0} y={0.1} className="sym-label" fontSize={0.3}>WH</text>;
      break;
    case 'desk-l': {
      // long wing along the back, return down the right side (mirrored by `flip`)
      const t = Math.min(d * 0.42, 2.5);
      const r = Math.min(w * 0.42, 2.5);
      return (
        <g className="sym">
          <path d={`M${x0} ${y0} H${-x0} V${-y0} H${-x0 - r} V${y0 + t} H${x0} Z`} {...NS} />
          {R(x0 + 0.2, y0 + 0.2, w * 0.3, t * 0.5, 0.05, 'sym-thin')}
        </g>
      );
    }
    case 'monitor':
      return (
        <g className="sym">
          {R(x0, y0 + d * 0.15, w, Math.min(0.12, d * 0.3), 0.03, 'sym-solid')}
          <ellipse cx={0} cy={y0 + d * 0.55} rx={Math.min(w * 0.18, 0.45)} ry={d * 0.3} className="sym-thin" {...NS} />
          {w > 3.5 && <line x1={0} y1={y0 + d * 0.15} x2={0} y2={-y0} className="sym-thin" {...NS} />}
        </g>
      );
    case 'pc-tower':
      detail = (
        <>
          <line x1={x0} y1={-y0 - 0.12} x2={-x0} y2={-y0 - 0.12} className="sym-thin" {...NS} />
          <circle cx={0} cy={-y0 - 0.3} r={0.05} className="sym-solid" {...NS} />
        </>
      );
      break;
    case 'laptop':
      detail = (
        <>
          {R(x0, y0, w, d * 0.12, 0.02, 'sym-solid')}
          {R(x0 + w * 0.1, y0 + d * 0.25, w * 0.8, d * 0.4, 0.02, 'sym-thin')}
        </>
      );
      break;
    case 'keyboard':
      return (
        <g className="sym">
          {R(x0, y0, w * 0.72, d, 0.03)}
          <ellipse cx={-x0 - w * 0.09} cy={0} rx={w * 0.06} ry={d * 0.35} {...NS} />
        </g>
      );
    case 'lamp':
    case 'floor-lamp':
    case 'pendant':
      return (
        <g className="sym">
          <circle cx={0} cy={0} r={m / 2} {...NS} />
          <circle cx={0} cy={0} r={m / 6} className="sym-solid" {...NS} />
          {symbol !== 'lamp' && <circle cx={0} cy={0} r={m / 3} className="sym-thin sym-dash" {...NS} />}
        </g>
      );
    case 'ceiling-fan':
      return (
        <g className="sym sym-overhead">
          <circle cx={0} cy={0} r={0.3} {...NS} />
          {[0, 90, 180, 270].map((a) => (
            <ellipse key={a} cx={0} cy={-w / 4 - 0.1} rx={0.28} ry={w / 4 - 0.15} transform={`rotate(${a + 20})`} {...NS} />
          ))}
        </g>
      );
    case 'shelf-wall':
      detail = <line x1={x0} y1={y0 + d * 0.5} x2={-x0} y2={y0 + d * 0.5} className="sym-thin sym-dash" {...NS} />;
      break;
    case 'art':
    case 'mirror':
      return round ? (
        <g className="sym">
          <ellipse cx={0} cy={0} rx={w / 2} ry={Math.max(d / 2, 0.06)} {...NS} />
        </g>
      ) : (
        <g className="sym">
          {R(x0, y0, w, Math.max(d, 0.08), 0.01, symbol === 'art' ? 'sym-solid' : '')}
          {symbol === 'mirror' && <line x1={x0} y1={-y0} x2={-x0} y2={-y0} className="sym-thin" {...NS} />}
        </g>
      );
    case 'tv':
      return (
        <g className="sym">
          {R(x0, y0, w, Math.max(d * 0.35, 0.08), 0.02, 'sym-solid')}
          {d > 0.5 && R(-w * 0.15, y0, w * 0.3, d, 0.05, 'sym-thin')}
        </g>
      );
    case 'speaker':
      detail = <circle cx={0} cy={d * 0.1} r={m * 0.3} className="sym-thin" {...NS} />;
      break;
    case 'pegboard':
      return (
        <g className="sym">
          {R(x0, y0, w, d, 0.01)}
          {Array.from({ length: Math.max(2, Math.floor(w * 2)) }, (_, i) => (
            <circle key={i} cx={x0 + ((i + 0.5) * w) / Math.max(2, Math.floor(w * 2))} cy={0} r={0.02} className="sym-solid" {...NS} />
          ))}
        </g>
      );
    case 'workbench':
      detail = (
        <>
          {R(x0 + 0.1, y0 + 0.1, w - 0.2, d * 0.3, 0.02, 'sym-thin')}
          <line x1={x0} y1={-y0 - 0.15} x2={-x0} y2={-y0 - 0.15} className="sym-thin" {...NS} />
        </>
      );
      break;
    case 'tool-chest':
      detail = (
        <>
          {[0.3, 0.55, 0.8].map((f) => (
            <line key={f} x1={x0} y1={y0 + d * f} x2={-x0} y2={y0 + d * f} className="sym-thin" {...NS} />
          ))}
        </>
      );
      break;
    case 'loft-bed':
      detail = (
        <>
          {R(x0, y0, w, 0.35, 0.08, 'sym-solid')}
          {R(x0 + 0.25, y0 + 0.5, w - 0.5, 1.1, 0.3, 'sym-soft')}
          <line x1={x0} y1={y0} x2={-x0} y2={-y0} className="sym-thin sym-dash" {...NS} />
          <line x1={-x0} y1={y0} x2={x0} y2={-y0} className="sym-thin sym-dash" {...NS} />
          {[0.2, 0.4, 0.6].map((f) => (
            <line key={f} x1={-x0 - 0.3} y1={-y0 - d * f} x2={-x0} y2={-y0 - d * f} className="sym-thin" {...NS} />
          ))}
        </>
      );
      break;
    case 'beanbag':
      detail = <ellipse cx={0} cy={-d * 0.12} rx={w * 0.32} ry={d * 0.26} className="sym-soft" {...NS} />;
      break;
    case 'ottoman':
      detail = round ? <circle cx={0} cy={0} r={m * 0.3} className="sym-thin" {...NS} /> : R(x0 + 0.12, y0 + 0.12, w - 0.24, d - 0.24, 0.1, 'sym-thin');
      break;
    case 'pool-table':
      return (
        <g className="sym">
          {R(x0, y0, w, d, 0.2)}
          {R(x0 + 0.4, y0 + 0.4, w - 0.8, d - 0.8, 0.05, 'sym-soft')}
          {[
            [x0 + 0.45, y0 + 0.45],
            [0, y0 + 0.4],
            [-x0 - 0.45, y0 + 0.45],
            [x0 + 0.45, -y0 - 0.45],
            [0, -y0 - 0.4],
            [-x0 - 0.45, -y0 - 0.45],
          ].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r={0.17} className="sym-solid" {...NS} />
          ))}
        </g>
      );
    case 'ping-pong':
      detail = (
        <>
          <line x1={0} y1={y0} x2={0} y2={-y0} className="sym-thin" {...NS} />
          <line x1={x0} y1={0} x2={-x0} y2={0} className="sym-thin sym-dash" {...NS} />
        </>
      );
      break;
    case 'arcade':
      detail = (
        <>
          {R(x0 + 0.15, y0 + 0.15, w - 0.3, d * 0.45, 0.04, 'sym-solid')}
          <circle cx={-w * 0.2} cy={d * 0.25} r={0.1} className="sym-thin" {...NS} />
          <circle cx={w * 0.15} cy={d * 0.25} r={0.07} className="sym-thin" {...NS} />
        </>
      );
      break;
    case 'treadmill':
      detail = (
        <>
          {R(x0, y0, w, d * 0.15, 0.08, 'sym-solid')}
          {R(x0 + w * 0.15, y0 + d * 0.2, w * 0.7, d * 0.75, 0.05, 'sym-soft')}
        </>
      );
      break;
    case 'bike':
      detail = (
        <>
          <line x1={0} y1={y0 + 0.2} x2={0} y2={-y0 - 0.2} className="sym-thin" {...NS} />
          <ellipse cx={0} cy={y0 + d * 0.25} rx={w * 0.3} ry={0.25} className="sym-solid" {...NS} />
          <ellipse cx={0} cy={-y0 - d * 0.25} rx={w * 0.2} ry={0.3} className="sym-soft" {...NS} />
        </>
      );
      break;
    case 'weight-bench':
      detail = R(x0 + w * 0.15, y0 + 0.2, w * 0.7, d - 0.4, 0.15, 'sym-soft');
      break;
    case 'rack':
      detail = (
        <>
          {[
            [x0 + 0.1, y0 + 0.1],
            [-x0 - 0.1, y0 + 0.1],
            [x0 + 0.1, -y0 - 0.1],
            [-x0 - 0.1, -y0 - 0.1],
          ].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r={0.1} className="sym-solid" {...NS} />
          ))}
          <line x1={x0} y1={0} x2={-x0} y2={0} className="sym-thin" {...NS} />
        </>
      );
      break;
    case 'guitar':
      return (
        <g className="sym">
          <ellipse cx={0} cy={0} rx={w / 2} ry={Math.max(d / 2, 0.15)} {...NS} />
          <line x1={0} y1={0} x2={-x0} y2={0} className="sym-thin" {...NS} />
        </g>
      );
    case 'drums':
      return (
        <g className="sym">
          <circle cx={0} cy={y0 + d * 0.35} r={m * 0.2} {...NS} />
          <circle cx={x0 + w * 0.2} cy={y0 + d * 0.3} r={m * 0.12} {...NS} />
          <circle cx={-x0 - w * 0.2} cy={y0 + d * 0.3} r={m * 0.12} {...NS} />
          <circle cx={x0 + w * 0.15} cy={-y0 - d * 0.35} r={m * 0.13} className="sym-thin" {...NS} />
          <circle cx={-x0 - w * 0.15} cy={-y0 - d * 0.4} r={m * 0.16} className="sym-thin" {...NS} />
          <circle cx={0} cy={-y0 - d * 0.15} r={m * 0.1} className="sym-soft" {...NS} />
        </g>
      );
    case 'aquarium':
      detail = R(x0 + 0.08, y0 + 0.08, w - 0.16, d - 0.16, 0.02, 'sym-soft');
      break;
    case 'pad':
      return (
        <g className="sym">
          {R(x0, y0, w, d, Math.min(0.08, m * 0.15), 'sym-soft')}
        </g>
      );
    case 'mouse':
      return (
        <g className="sym">
          <ellipse cx={0} cy={0} rx={w / 2} ry={d / 2} {...NS} />
          <line x1={0} y1={y0} x2={0} y2={y0 + d * 0.4} className="sym-thin" {...NS} />
        </g>
      );
    case 'riser':
      detail = (
        <>
          <line x1={x0 + 0.1} y1={y0} x2={x0 + 0.1} y2={-y0} className="sym-thin" {...NS} />
          <line x1={-x0 - 0.1} y1={y0} x2={-x0 - 0.1} y2={-y0} className="sym-thin" {...NS} />
        </>
      );
      break;
    case 'mug':
      return (
        <g className="sym">
          <circle cx={0} cy={0} r={w / 2} {...NS} />
          <path d={`M${w / 2} ${-d * 0.15} q${w * 0.3} ${d * 0.15} 0 ${d * 0.3}`} fill="none" className="sym-thin" {...NS} />
        </g>
      );
    case 'led-strip':
      return <line x1={x0} y1={0} x2={-x0} y2={0} className="sym-led" {...NS} />;
    case 'printer':
      detail = R(x0 + w * 0.15, y0, w * 0.7, d * 0.25, 0.02, 'sym-thin');
      break;
    case 'easel':
      return (
        <g className="sym">
          <path d={`M${x0} ${-y0} L0 ${y0} L${-x0} ${-y0}`} fill="none" {...NS} />
          {R(x0 + w * 0.1, y0 + d * 0.15, w * 0.8, 0.12, 0.02, 'sym-solid')}
        </g>
      );
    case 'divider': {
      const n = 3;
      const seg = w / n;
      const pts = Array.from({ length: n + 1 }, (_, i) => `${x0 + i * seg},${i % 2 ? -y0 * 0.6 : y0 * 0.6}`).join(' ');
      return (
        <g className="sym">
          <polyline points={pts} fill="none" strokeWidth={3} {...NS} />
        </g>
      );
    }
    default:
      detail = (
        <>
          <line x1={x0} y1={y0} x2={-x0} y2={-y0} className="sym-thin" {...NS} />
        </>
      );
  }
  return (
    <g className="sym">
      {body()}
      {detail}
    </g>
  );
}
