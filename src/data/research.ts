export type AreaCode = 'models' | 'systems' | 'agents' | 'computation';

export type ResearchItem = {
  title: string;
  area: AreaCode;
  kind: string;
  access: 'Public' | 'Private' | 'Open shelf';
  summary: string;
  href?: string;
};

export const areas: Array<{
  code: AreaCode;
  label: string;
  short: string;
  description: string;
}> = [
  {
    code: 'models',
    label: 'Models & Statistics',
    short: 'M&S',
    description: 'What changes when information arrives late, moves underneath you, or refuses to behave like the model?',
  },
  {
    code: 'systems',
    label: 'Systems & Security',
    short: 'S&S',
    description: 'Traces, hidden state, recoveries, and the gap between what a system says and what it did.',
  },
  {
    code: 'agents',
    label: 'Agentic Systems',
    short: 'AGT',
    description: 'Autonomous software, tool use, coordination, and agents with some explaining to do.',
  },
  {
    code: 'computation',
    label: 'Computation',
    short: 'CMP',
    description: 'Simulation, visual systems, unusual machinery, and complexity made visible.',
  },
];

export const research: ResearchItem[] = [
  {
    title: 'Clock Dataset',
    area: 'models',
    kind: 'Study',
    access: 'Public',
    href: 'https://github.com/SekiyaLab/clock-dataset',
    summary: 'What was actually knowable at the moment of a decision?',
  },
  {
    title: 'Decision Assurance',
    area: 'models',
    kind: 'Study',
    access: 'Public',
    href: 'https://github.com/SekiyaLab/decision-assurance',
    summary: 'When does a score stop being enough for a finite-capacity decision?',
  },
  {
    title: 'Degradation Diagnosis',
    area: 'models',
    kind: 'Study',
    access: 'Public',
    href: 'https://github.com/SekiyaLab/degradation-diagnosis',
    summary: 'How much can a model’s trouble be diagnosed before its labels arrive?',
  },
  {
    title: 'Release Equivalence',
    area: 'models',
    kind: 'Study',
    access: 'Public',
    href: 'https://github.com/SekiyaLab/release-equivalence',
    summary: 'Is the system after release still the one you tested?',
  },
  {
    title: 'Delayed Feedback',
    area: 'models',
    kind: 'Study',
    access: 'Private',
    summary: 'Evaluating policies when outcomes arrive late, selectively, and after the policy has changed.',
  },
  {
    title: 'DeepLOB',
    area: 'models',
    kind: 'Study',
    access: 'Public',
    href: 'https://github.com/SekiyaLab/deep-lob',
    summary: 'How an experiment can manufacture confidence from a market with no signal.',
  },
  {
    title: 'Spectral Recovery',
    area: 'models',
    kind: 'Study',
    access: 'Private',
    summary: 'A controlled look at when correlation-matrix denoising helps—and when it does not.',
  },
  {
    title: 'Tail Estimator Audit',
    area: 'models',
    kind: 'Study',
    access: 'Private',
    summary: 'Known-tail experiments for finding where familiar estimators bend or break.',
  },
  {
    title: 'trace-npm',
    area: 'systems',
    kind: 'Instrument',
    access: 'Public',
    href: 'https://github.com/SekiyaLab/trace-npm',
    summary: 'A close look at what an npm lifecycle script touches, spawns, and contacts.',
  },
  {
    title: 'Systems & Security Core',
    area: 'systems',
    kind: 'Experimental core',
    access: 'Private',
    summary: 'Range harnesses, evidence ledgers, and provenance tools for difficult systems questions.',
  },
  {
    title: 'Security Decision Invariance',
    area: 'systems',
    kind: 'Study',
    access: 'Private',
    summary: 'When a transformed telemetry record still supports the same security conclusion.',
  },
  {
    title: 'Agentic Systems',
    area: 'agents',
    kind: 'Shelf',
    access: 'Open shelf',
    summary: 'A deliberate open shelf for work on autonomous software, tools, and accountable coordination.',
  },
  {
    title: 'GPU Simulation Engine',
    area: 'computation',
    kind: 'Engine',
    access: 'Private',
    summary: 'GPU-first compute and rendering for typed simulation state.',
  },
  {
    title: 'Cascade Field Study',
    area: 'computation',
    kind: 'Interactive study',
    access: 'Private',
    summary: 'A deterministic field for watching a local shock remain bounded—or become a cascade.',
  },
];
