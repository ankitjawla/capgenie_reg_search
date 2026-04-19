'use client';

// Visualizes the deep-agent's multi-node graph and lights up nodes as their
// info events fire during the SSE stream.

interface NodeDef {
  id: string;
  label: string;
  // Substrings to match against the agent's `info` event text. The node lights
  // up the first time any matching substring is seen.
  matchers: string[];
  column: number;
  row: number;
}

const NODES: NodeDef[] = [
  { id: 'planner', label: 'Planner', matchers: ['Planning jurisdictions'], column: 0, row: 3 },
  { id: 'researchUS', label: '🇺🇸 US', matchers: ['Researching United States'], column: 1, row: 0 },
  { id: 'researchUK', label: '🇬🇧 UK', matchers: ['Researching United Kingdom'], column: 1, row: 1 },
  { id: 'researchEU', label: '🇪🇺 EU', matchers: ['Researching European Union'], column: 1, row: 2 },
  { id: 'researchIN', label: '🇮🇳 IN', matchers: ['Researching India'], column: 1, row: 3 },
  { id: 'researchCA', label: '🇨🇦 CA', matchers: ['Researching Canada'], column: 1, row: 4 },
  { id: 'researchSG', label: '🇸🇬 SG', matchers: ['Researching Singapore'], column: 1, row: 5 },
  { id: 'researchHK', label: '🇭🇰 HK', matchers: ['Researching Hong Kong'], column: 1, row: 6 },
  { id: 'verifier', label: 'Verifier', matchers: ['Cross-verifying'], column: 2, row: 3 },
  { id: 'synthesizer', label: 'Synthesizer', matchers: ['Synthesizing the verified'], column: 3, row: 3 },
];

const EDGES: Array<[string, string]> = [
  ['planner', 'researchUS'],
  ['planner', 'researchUK'],
  ['planner', 'researchEU'],
  ['planner', 'researchIN'],
  ['planner', 'researchCA'],
  ['planner', 'researchSG'],
  ['planner', 'researchHK'],
  ['researchUS', 'verifier'],
  ['researchUK', 'verifier'],
  ['researchEU', 'verifier'],
  ['researchIN', 'verifier'],
  ['researchCA', 'verifier'],
  ['researchSG', 'verifier'],
  ['researchHK', 'verifier'],
  ['verifier', 'synthesizer'],
];

interface Props {
  infoLog: string[]; // list of `info` event messages, in order
  done: boolean;
}

export default function ProgressGraph({ infoLog, done }: Props) {
  const activated = new Set<string>();
  const haystack = infoLog.join(' ').toLowerCase();
  for (const node of NODES) {
    if (node.matchers.some((m) => haystack.includes(m.toLowerCase()))) {
      activated.add(node.id);
    }
  }

  // Place nodes in a grid that mirrors the architecture.
  const COL_X = [40, 200, 360, 500];
  const ROW_Y = [20, 70, 120, 170, 220, 270, 320];

  function nodeAt(id: string) {
    const n = NODES.find((x) => x.id === id);
    if (!n) return { x: 0, y: 0, label: '' };
    return { x: COL_X[n.column], y: ROW_Y[n.row], label: n.label };
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 print-card">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Deep agent progress
        </h3>
        <span className="text-[10px] text-slate-500 dark:text-slate-400">
          {activated.size}/{NODES.length} nodes · {done ? 'done' : 'running'}
        </span>
      </div>
      <svg viewBox="0 0 580 370" className="w-full text-slate-300 dark:text-slate-600">
        {/* Edges */}
        <g stroke="currentColor" strokeWidth="1.5" fill="none">
          {EDGES.map(([a, b], i) => {
            const from = nodeAt(a);
            const to = nodeAt(b);
            const fx = from.x + 60;
            const fy = from.y + 18;
            const tx = to.x;
            const ty = to.y + 18;
            const midX = (fx + tx) / 2;
            const path = `M ${fx},${fy} C ${midX},${fy} ${midX},${ty} ${tx},${ty}`;
            const active = activated.has(a) && activated.has(b);
            return (
              <path
                key={i}
                d={path}
                stroke={active ? '#10b981' : 'currentColor'}
                strokeOpacity={active ? 0.9 : 0.4}
              />
            );
          })}
        </g>

        {/* Nodes */}
        {NODES.map((n) => {
          const { x, y, label } = nodeAt(n.id);
          const active = activated.has(n.id);
          return (
            <g key={n.id} transform={`translate(${x},${y})`}>
              <rect
                width="120"
                height="36"
                rx="8"
                fill={active ? '#d1fae5' : '#f1f5f9'}
                stroke={active ? '#10b981' : '#cbd5e1'}
                className={active ? '' : 'dark:fill-slate-800 dark:stroke-slate-600'}
              />
              <text
                x="60"
                y="22"
                textAnchor="middle"
                className={active ? 'fill-emerald-700' : 'fill-slate-600 dark:fill-slate-300'}
                style={{ fontSize: 12, fontWeight: 600 }}
              >
                {active && '✓ '}
                {label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

