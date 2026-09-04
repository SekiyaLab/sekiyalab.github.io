/* Gray–Scott reaction–diffusion — deterministic WebGL2 engine.
 *
 * du/dt = Du·∇²u − u·v² + F·(1−u)
 * dv/dt = Dv·∇²v + u·v² − (F+k)·v
 *
 * Determinism contract: same seed + same preset + same grid size +
 * same browser build ⇒ same trajectory. Snapshots form a scrub ring so
 * time can be dragged backward and replayed identically.
 */

import { createProgram, createQuad, createTarget, deleteTarget, VERTEX_SRC, type RenderTarget } from './gl';

export interface Preset {
  name: string;
  label: string;
  feed: number;
  kill: number;
}

export const PRESETS: Preset[] = [
  { name: 'coral', label: 'Coral', feed: 0.0545, kill: 0.0620 },
  { name: 'mitosis', label: 'Mitosis', feed: 0.0367, kill: 0.0649 },
  { name: 'maze', label: 'Maze', feed: 0.0290, kill: 0.0570 },
];

const SIM_FRAG = `#version 300 es
precision highp float;
uniform sampler2D uState;
uniform vec2 uTexel;
uniform float uFeed;
uniform float uKill;
in vec2 vUv;
out vec4 outState;

vec2 laplacian(vec2 uv) {
  vec2 sum = vec2(0.0);
  sum += texture(uState, uv + vec2(-uTexel.x, 0.0)).rg * 0.2;
  sum += texture(uState, uv + vec2( uTexel.x, 0.0)).rg * 0.2;
  sum += texture(uState, uv + vec2(0.0, -uTexel.y)).rg * 0.2;
  sum += texture(uState, uv + vec2(0.0,  uTexel.y)).rg * 0.2;
  sum += texture(uState, uv + vec2(-uTexel.x, -uTexel.y)).rg * 0.05;
  sum += texture(uState, uv + vec2( uTexel.x, -uTexel.y)).rg * 0.05;
  sum += texture(uState, uv + vec2(-uTexel.x,  uTexel.y)).rg * 0.05;
  sum += texture(uState, uv + vec2( uTexel.x,  uTexel.y)).rg * 0.05;
  sum -= texture(uState, uv).rg;
  return sum;
}

void main() {
  vec2 state = texture(uState, vUv).rg;
  float u = state.r;
  float v = state.g;
  vec2 lap = laplacian(vUv);
  float reaction = u * v * v;
  float du = 0.16 * lap.r - reaction + uFeed * (1.0 - u);
  float dv = 0.08 * lap.g + reaction - (uFeed + uKill) * v;
  outState = vec4(clamp(u + du, 0.0, 1.0), clamp(v + dv, 0.0, 1.0), 0.0, 1.0);
}
`;

const RENDER_FRAG = `#version 300 es
precision highp float;
uniform sampler2D uState;
uniform vec2 uTexel;
uniform float uGlow;
in vec2 vUv;
out vec4 fragColor;

const vec3 VOID = vec3(0.039, 0.043, 0.051);
const vec3 LOW = vec3(0.278, 0.270, 0.251);   /* ink-3 warmed */
const vec3 HIGH = vec3(0.925, 0.914, 0.886);  /* warm off-white */
const vec3 AMBER = vec3(0.851, 0.643, 0.357);

void main() {
  vec2 state = texture(uState, vUv).rg;
  float v = state.g;

  /* edge magnitude for the phosphor rim */
  float vr = texture(uState, vUv + vec2(uTexel.x, 0.0)).g;
  float vt = texture(uState, vUv + vec2(0.0, uTexel.y)).g;
  float edge = clamp(length(vec2(v - vr, v - vt)) * 9.0, 0.0, 1.0);

  float body = smoothstep(0.14, 0.34, v);
  float crest = smoothstep(0.30, 0.52, v);

  vec3 color = VOID;
  color = mix(color, LOW, body * 0.55);
  color = mix(color, HIGH, crest * 0.9);
  color += AMBER * edge * 0.22 * uGlow;

  /* vignette — lamplight falloff */
  vec2 d = vUv - 0.5;
  color *= 1.0 - dot(d, d) * 0.55;

  fragColor = vec4(color, 1.0);
}
`;

const COPY_FRAG = `#version 300 es
precision highp float;
uniform sampler2D uState;
in vec2 vUv;
out vec4 outState;
void main() { outState = texture(uState, vUv); }
`;

const DIGEST_FRAG = `#version 300 es
precision highp float;
uniform sampler2D uState;
in vec2 vUv;
out vec4 outColor;
void main() { outColor = vec4(texture(uState, vUv).rg, 0.0, 1.0); }
`;

/** float32 → float16 bits (round-to-nearest-even, sufficient for state upload) */
function toHalf(value: number): number {
  const floatView = new Float32Array(1);
  const int32View = new Int32Array(floatView.buffer);
  floatView[0] = value;
  const x = int32View[0];
  const sign = (x >> 16) & 0x8000;
  let exp = ((x >> 23) & 0xff) - 112;
  let mant = x & 0x7fffff;
  if (exp <= 0) return sign; /* flush to zero */
  if (exp >= 31) return sign | 0x7bff; /* clamp to max half */
  mant += 0x1000;
  if (mant & 0x800000) { mant = 0; exp += 1; }
  return sign | (exp << 10) | (mant >> 13);
}

/** mulberry32 — small deterministic PRNG. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function fnv1a(bytes: Uint8Array): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < bytes.length; i++) {
    h ^= bytes[i];
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

export interface FieldOptions {
  seed: number;
  preset?: string;
  size?: number;
  onState?: (state: FieldState) => void;
}

export interface FieldState {
  step: number;
  seed: number;
  preset: string;
  size: number;
  checksum: string;
  running: boolean;
  maxScrubStep: number;
}

const SNAPSHOT_EVERY = 64;
const SNAPSHOT_SLOTS = 48;
const CATCHUP_PER_FRAME = 96;

export class GrayScottField {
  private gl: WebGL2RenderingContext;
  private canvas: HTMLCanvasElement;
  private halfFloat: boolean;
  private quad: WebGLVertexArrayObject;
  private simProgram: WebGLProgram;
  private renderProgram: WebGLProgram;
  private copyProgram: WebGLProgram;
  private digestProgram: WebGLProgram;

  private size: number;
  private seed: number;
  private preset: Preset;
  private front: RenderTarget;
  private back: RenderTarget;
  private snapshots: (RenderTarget | null)[] = [];
  private snapshotSteps: number[] = [];
  private digestTarget: RenderTarget;

  private _step = 0;
  private _checksum = '00000000';
  private running = false;
  private raf = 0;
  private stepsPerFrame = 10;
  private targetStep: number | null = null;
  private onState?: (state: FieldState) => void;
  private frameTimes: number[] = [];
  private destroyed = false;

  constructor(canvas: HTMLCanvasElement, opts: FieldOptions) {
    this.canvas = canvas;
    const gl = canvas.getContext('webgl2', {
      antialias: false,
      alpha: false,
      depth: false,
      stencil: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false,
    });
    if (!gl) throw new Error('WebGL2 unavailable');
    this.gl = gl;
    this.halfFloat = !!gl.getExtension('EXT_color_buffer_float') ||
      !!gl.getExtension('EXT_color_buffer_half_float');

    this.quad = createQuad(gl);
    this.simProgram = createProgram(gl, VERTEX_SRC, SIM_FRAG);
    this.renderProgram = createProgram(gl, VERTEX_SRC, RENDER_FRAG);
    this.copyProgram = createProgram(gl, VERTEX_SRC, COPY_FRAG);
    this.digestProgram = createProgram(gl, VERTEX_SRC, DIGEST_FRAG);

    this.size = opts.size ?? 256;
    this.seed = opts.seed >>> 0;
    this.preset = PRESETS.find((p) => p.name === opts.preset) ?? PRESETS[0];
    this.onState = opts.onState;

    this.front = createTarget(gl, this.size, this.halfFloat);
    this.back = createTarget(gl, this.size, this.halfFloat);
    for (let i = 0; i < SNAPSHOT_SLOTS; i++) {
      this.snapshots.push(createTarget(gl, this.size, this.halfFloat));
      this.snapshotSteps.push(-1);
    }
    this.digestTarget = createTarget(gl, 16, false);

    this.initialize();
    this.render();
    this.emit();
  }

  get step(): number { return this._step; }
  get currentSeed(): number { return this.seed; }
  get currentPreset(): Preset { return this.preset; }

  /** CPU-side deterministic initial condition. */
  private initialState(): Float32Array {
    const n = this.size;
    const data = new Float32Array(n * n * 4);
    for (let i = 0; i < n * n; i++) {
      data[i * 4] = 1;     // u = 1
      data[i * 4 + 1] = 0; // v = 0
      data[i * 4 + 3] = 1;
    }
    const rand = mulberry32(this.seed);
    const blobs = 10 + Math.floor(rand() * 8);
    for (let b = 0; b < blobs; b++) {
      const cx = rand() * n;
      const cy = rand() * n;
      const radius = 2 + rand() * 5;
      const r2 = radius * radius;
      const x0 = Math.max(0, Math.floor(cx - radius - 1));
      const x1 = Math.min(n - 1, Math.ceil(cx + radius + 1));
      const y0 = Math.max(0, Math.floor(cy - radius - 1));
      const y1 = Math.min(n - 1, Math.ceil(cy + radius + 1));
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          const dx = x - cx;
          const dy = y - cy;
          const d2 = dx * dx + dy * dy;
          if (d2 <= r2) {
            const fall = 1 - d2 / r2;
            const idx = (y * n + x) * 4;
            data[idx] = Math.max(0, 1 - 0.5 * fall);
            data[idx + 1] = Math.min(1, data[idx + 1] + fall);
          }
        }
      }
    }
    return data;
  }

  private initialize(): void {
    const gl = this.gl;
    const data = this.initialState();
    gl.bindTexture(gl.TEXTURE_2D, this.front.texture);
    if (this.halfFloat) {
      const half = new Uint16Array(data.length);
      for (let i = 0; i < data.length; i++) half[i] = toHalf(data[i]);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, this.size, this.size, 0, gl.RGBA, gl.HALF_FLOAT, half);
    } else {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, this.size, this.size, 0, gl.RGBA, gl.UNSIGNED_BYTE,
        new Uint8Array(Array.from(data, (x) => Math.round(x * 255))));
    }
    this._step = 0;
    this.snapshotSteps.fill(-1);
    this.targetStep = null;
    this.takeSnapshot();
  }

  private pass(program: WebGLProgram, target: RenderTarget | null, bind: () => void): void {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.fbo : null);
    gl.viewport(0, 0, target ? target.size : this.canvas.width, target ? target.size : this.canvas.height);
    gl.useProgram(program);
    bind();
    gl.bindVertexArray(this.quad);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindVertexArray(null);
  }

  private stepOnce(): void {
    const gl = this.gl;
    this.pass(this.simProgram, this.back, () => {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.front.texture);
      gl.uniform1i(gl.getUniformLocation(this.simProgram, 'uState'), 0);
      gl.uniform2f(gl.getUniformLocation(this.simProgram, 'uTexel'), 1 / this.size, 1 / this.size);
      gl.uniform1f(gl.getUniformLocation(this.simProgram, 'uFeed'), this.preset.feed);
      gl.uniform1f(gl.getUniformLocation(this.simProgram, 'uKill'), this.preset.kill);
    });
    [this.front, this.back] = [this.back, this.front];
    this._step++;
    if (this._step % SNAPSHOT_EVERY === 0) this.takeSnapshot();
  }

  private takeSnapshot(): void {
    const gl = this.gl;
    const slot = Math.floor(this._step / SNAPSHOT_EVERY) % SNAPSHOT_SLOTS;
    this.pass(this.copyProgram, this.snapshots[slot], () => {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.front.texture);
      gl.uniform1i(gl.getUniformLocation(this.copyProgram, 'uState'), 0);
    });
    this.snapshotSteps[slot] = this._step;

    /* digest: quantized 16×16 readback → checksum */
    this.pass(this.digestProgram, this.digestTarget, () => {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.front.texture);
      gl.uniform1i(gl.getUniformLocation(this.digestProgram, 'uState'), 0);
    });
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.digestTarget.fbo);
    const px = new Uint8Array(16 * 16 * 4);
    gl.readPixels(0, 0, 16, 16, gl.RGBA, gl.UNSIGNED_BYTE, px);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this._checksum = fnv1a(px);
  }

  private restoreSnapshot(slot: number): void {
    const gl = this.gl;
    this.pass(this.copyProgram, this.front, () => {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.snapshots[slot]!.texture);
      gl.uniform1i(gl.getUniformLocation(this.copyProgram, 'uState'), 0);
    });
    this._step = this.snapshotSteps[slot];
    /* snapshots after the restore point are no longer on this trajectory */
    for (let i = 0; i < SNAPSHOT_SLOTS; i++) {
      if (this.snapshotSteps[i] > this._step) this.snapshotSteps[i] = -1;
    }
  }

  private render(): void {
    const gl = this.gl;
    const glow = this.running ? 1 : 0.6;
    this.pass(this.renderProgram, null, () => {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.front.texture);
      gl.uniform1i(gl.getUniformLocation(this.renderProgram, 'uState'), 0);
      gl.uniform2f(gl.getUniformLocation(this.renderProgram, 'uTexel'), 1 / this.size, 1 / this.size);
      gl.uniform1f(gl.getUniformLocation(this.renderProgram, 'uGlow'), glow);
    });
  }

  private tick = (now: number): void => {
    if (this.destroyed) return;
    this.frameTimes.push(now);
    if (this.frameTimes.length > 90) this.frameTimes.shift();
    this.adapt();

    if (this.targetStep !== null) {
      /* catching up to a scrub target */
      const before = this._step;
      for (let i = 0; i < CATCHUP_PER_FRAME && this._step < this.targetStep; i++) this.stepOnce();
      if (this._step >= this.targetStep) this.targetStep = null;
      if (this._step !== before) { this.render(); this.emit(); }
    } else if (this.running) {
      for (let i = 0; i < this.stepsPerFrame; i++) this.stepOnce();
      this.render();
      this.emit();
    }
    this.raf = requestAnimationFrame(this.tick);
  };

  private adapt(): void {
    if (this.frameTimes.length < 60) return;
    const spans = this.frameTimes[this.frameTimes.length - 1] - this.frameTimes[0];
    const avg = spans / (this.frameTimes.length - 1);
    if (avg > 24 && this.stepsPerFrame > 3) this.stepsPerFrame = 3;
    else if (avg > 17 && this.stepsPerFrame > 6) this.stepsPerFrame = 6;
    else if (avg < 12 && this.stepsPerFrame < 10) this.stepsPerFrame = 10;
  }

  start(): void {
    if (this.running || this.destroyed) return;
    this.running = true;
    this.emit();
  }

  stop(): void {
    this.running = false;
    this.render();
    this.emit();
  }

  get isRunning(): boolean { return this.running; }

  run(): void {
    if (this.raf) return;
    this.raf = requestAnimationFrame(this.tick);
  }

  halt(): void {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  /** Scrub to an arbitrary step — backward via snapshot ring, forward by running. */
  scrubTo(step: number): void {
    step = Math.max(0, Math.floor(step));
    if (step === this._step) { this.targetStep = null; this.render(); this.emit(); return; }
    if (step < this._step) {
      /* find latest snapshot ≤ step */
      let best = -1;
      for (let i = 0; i < SNAPSHOT_SLOTS; i++) {
        const s = this.snapshotSteps[i];
        if (s >= 0 && s <= step && (best < 0 || s > this.snapshotSteps[best])) best = i;
      }
      if (best >= 0 && this.snapshotSteps[best] > 0) {
        this.restoreSnapshot(best);
      } else {
        this.initialize();
      }
    }
    this.targetStep = step;
    this.emit();
  }

  maxScrubStep(): number {
    let max = this._step;
    for (const s of this.snapshotSteps) if (s > max) max = s;
    return max;
  }

  replay(seed = this.seed): void {
    this.seed = seed >>> 0;
    this.initialize();
    this.render();
    this.emit();
  }

  newSeed(): number {
    const seed = Math.floor(Math.random() * 1e9);
    this.replay(seed);
    return seed;
  }

  setPreset(name: string): void {
    const preset = PRESETS.find((p) => p.name === name);
    if (!preset) return;
    this.preset = preset;
    this.initialize();
    this.render();
    this.emit();
  }

  resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    const w = Math.floor(this.canvas.clientWidth * dpr);
    const h = Math.floor(this.canvas.clientHeight * dpr);
    if (w !== this.canvas.width || h !== this.canvas.height) {
      this.canvas.width = w;
      this.canvas.height = h;
      this.render();
    }
  }

  private emit(): void {
    this.onState?.({
      step: this._step,
      seed: this.seed,
      preset: this.preset.name,
      size: this.size,
      checksum: this._checksum,
      running: this.running,
      maxScrubStep: this.maxScrubStep(),
    });
  }

  destroy(): void {
    this.destroyed = true;
    this.halt();
    const gl = this.gl;
    deleteTarget(gl, this.front);
    deleteTarget(gl, this.back);
    deleteTarget(gl, this.digestTarget);
    for (const s of this.snapshots) if (s) deleteTarget(gl, s);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  }
}
