export function DataFlowDiagram() {
  return (
    <div className="rounded-md border border-border bg-bg-muted p-4 overflow-x-auto">
      <svg
        viewBox="0 0 760 260"
        role="img"
        aria-label="Data flow from EHR through ingest, PHI minimization, BAA-gated model serving, rule engine, human review, and back to the EHR"
        className="w-full h-auto min-w-[640px]"
      >
        <defs>
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 Z" fill="#475569" />
          </marker>
        </defs>

        {/* Trust boundary */}
        <rect
          x="120"
          y="20"
          width="540"
          height="220"
          rx="8"
          fill="#fff"
          stroke="#cbd5e1"
          strokeDasharray="4 4"
        />
        <text x="130" y="38" fontSize="11" fill="#64748b" fontFamily="ui-sans-serif, system-ui">
          Customer-tenanted VPC · BAA in place · audit log everywhere
        </text>

        {/* EHR */}
        <Node x={20} y={100} w={90} h={50} title="EHR" sub="FHIR / HL7v2" />

        {/* Ingest */}
        <Node x={140} y={60} w={110} h={50} title="Ingest gateway" sub="TLS, validate" />

        {/* PHI minimization */}
        <Node x={280} y={60} w={120} h={50} title="PHI minimization" sub="strip MRN, addr" />

        {/* Model */}
        <Node
          x={430}
          y={60}
          w={130}
          h={50}
          title="Model (BAA)"
          sub="Bedrock / Azure / VPC"
        />

        {/* Rule engine */}
        <Node x={580} y={60} w={70} h={50} title="Rules" sub="NCCI · LCD" />

        {/* Reviewer */}
        <Node x={430} y={170} w={130} h={50} title="Human reviewer" sub="accept · reject · edit" />

        {/* Audit log */}
        <Node x={140} y={170} w={110} h={50} title="Audit log" sub="immutable" />

        {/* Object store */}
        <Node x={280} y={170} w={120} h={50} title="Encrypted store" sub="AES-256, KMS" />

        {/* Arrows: EHR -> Ingest, then chain across, model -> rules, rules -> reviewer, reviewer -> EHR (back) */}
        <Arrow x1={110} y1={125} x2={140} y2={85} />
        <Arrow x1={250} y1={85} x2={280} y2={85} />
        <Arrow x1={400} y1={85} x2={430} y2={85} />
        <Arrow x1={560} y1={85} x2={580} y2={85} />
        <Arrow x1={615} y1={110} x2={560} y2={170} />
        <Arrow x1={430} y1={195} x2={110} y2={150} />
        {/* Side branches: ingest -> store, ingest -> audit */}
        <Arrow x1={195} y1={110} x2={195} y2={170} />
        <Arrow x1={340} y1={110} x2={340} y2={170} />
      </svg>
    </div>
  );
}

function Node({
  x,
  y,
  w,
  h,
  title,
  sub,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  sub: string;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx="6"
        fill="#ffffff"
        stroke="#0f766e"
        strokeWidth="1.5"
      />
      <text
        x={x + w / 2}
        y={y + 22}
        textAnchor="middle"
        fontSize="13"
        fontWeight="600"
        fill="#0f172a"
        fontFamily="ui-sans-serif, system-ui"
      >
        {title}
      </text>
      <text
        x={x + w / 2}
        y={y + 38}
        textAnchor="middle"
        fontSize="11"
        fill="#64748b"
        fontFamily="ui-sans-serif, system-ui"
      >
        {sub}
      </text>
    </g>
  );
}

function Arrow({
  x1,
  y1,
  x2,
  y2,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}) {
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke="#475569"
      strokeWidth="1.25"
      markerEnd="url(#arrow)"
    />
  );
}
