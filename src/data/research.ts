export type AreaCode = 'programme' | 'record';

export type ResearchItem = {
  title: string;
  area: AreaCode;
  kind: string;
  access: 'Public' | 'Private' | 'Open shelf';
  summary: string;
  signature: string;
  href?: string;
  date?: string;
  related?: string[];
  slug?: string;
  flagged?: boolean;
};

export const areas = [
  { code: 'programme' as const, label: 'Current programmes', short: 'NOW', description: 'Four scoped, non-executing programmes for autonomous-agent behavior under controlled variation.' },
  { code: 'record' as const, label: 'Research Record', short: 'RECORD', description: 'Earlier studies preserved under their original questions, evidence and lifecycle.' },
];

export const research: ResearchItem[] = [
  { title: 'Agent Behaviour & Emergence', area: 'programme', kind: 'Programme', access: 'Open shelf', summary: 'How observable agent behavior changes as conditions, feedback, memory, information and repeated interaction vary.', signature: 'agentic' },
  { title: 'Agentic Systems & Engineering', area: 'programme', kind: 'Programme', access: 'Open shelf', summary: 'What behavior belongs to a model and what belongs to its tools, authority, memory, orchestration and recovery system.', signature: 'agentic' },
  { title: 'Evaluation & Measurement', area: 'programme', kind: 'Programme', access: 'Open shelf', summary: 'How behavioral measures earn reliability, validity, comparability and stated limits.', signature: 'agentic' },
  { title: 'Multi-Agent & Human-Agent Systems', area: 'programme', kind: 'Programme', access: 'Open shelf', summary: 'How roles, communication, authority and institutions shape collective and human-agent behavior.', signature: 'agentic' },
  { title: 'Clock Dataset', area: 'record', kind: 'Study', access: 'Public', href: 'https://github.com/SekiyaLab/clock-dataset', summary: 'What was actually knowable at the moment of a decision?', signature: 'clock' },
  { title: 'Decision Assurance', area: 'record', kind: 'Study', access: 'Public', href: 'https://github.com/SekiyaLab/decision-assurance', summary: 'When does a score stop being enough for a finite-capacity decision?', signature: 'assurance' },
  { title: 'Degradation Diagnosis', area: 'record', kind: 'Study', access: 'Public', href: 'https://github.com/SekiyaLab/degradation-diagnosis', summary: 'How much can a model’s trouble be diagnosed before its labels arrive?', signature: 'diagnosis' },
  { title: 'Release Equivalence', area: 'record', kind: 'Study', access: 'Public', href: 'https://github.com/SekiyaLab/release-equivalence', summary: 'Is the system after release still the one you tested?', signature: 'release' },
  { title: 'DeepLOB', area: 'record', kind: 'Study', access: 'Public', href: 'https://github.com/SekiyaLab/deep-lob', summary: 'How an experiment can manufacture confidence from a market with no signal.', signature: 'lob' },
  { title: 'Spectral Recovery', area: 'record', kind: 'Study', access: 'Public', href: 'https://github.com/SekiyaLab/spectral-recovery', summary: 'A controlled look at when correlation-matrix denoising helps — and when it does not.', signature: 'spectral' },
  { title: 'Tail Estimator Audit', area: 'record', kind: 'Study', access: 'Public', href: 'https://github.com/SekiyaLab/tail-estimator-audit', summary: 'Known-tail experiments for finding where familiar estimators bend or break.', signature: 'tail' },
  { title: 'Evidence that exists and cannot be retrieved', area: 'record', kind: 'Finding', access: 'Public', href: '/f/audit-retrieval/', summary: 'A successful empty audit query did not establish an empty record.', signature: 'audit', flagged: true },
];
