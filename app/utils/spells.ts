/**
 * As magias dos tomos. Cada framework tem uma: plantas (Vue), ácido (Nuxt),
 * gelo (React), fumaça (Next), brasas (Laravel), raio (Web) e rocha (SQL).
 *
 * O clique solta um estouro da magia (emit), desenhado numa única camada
 * <canvas> fixa sobre a página, que só roda enquanto há partículas vivas.
 *
 * Com "reduzir movimento" ligado, spellLayer() devolve null e nada roda.
 */
export type Spell = 'plants' | 'acid' | 'ice' | 'smoke' | 'embers' | 'lightning' | 'rock'

const SPELL_NAMES = new Set<string>(['plants', 'acid', 'ice', 'smoke', 'embers', 'lightning', 'rock'])
export const isSpell = (value: unknown): value is Spell => typeof value === 'string' && SPELL_NAMES.has(value)

interface Leaf { i: number, side: number, size: number, t: number }
interface Particle {
  spell: Spell
  kind: string
  x: number
  y: number
  vx: number
  vy: number
  age: number
  life: number
  size: number
  rot: number
  vr: number
  color: string
  palette: string[]
  dark: boolean
  seed: number
  alpha: number
  // usados por algumas magias
  ground?: number
  pts?: number[]
  ang?: number
  target?: number
  len?: number
  speed?: number
  mark?: number
  leaves?: Leaf[]
}

interface SpellEffect {
  /** soma a luz em fundo escuro */
  additive?: boolean
  burst: (c: SpellLayer, x: number, y: number, f: number, dark: boolean) => void
  step: (p: Particle, dt: number, c: SpellLayer) => boolean
  draw: (ctx: CanvasRenderingContext2D, p: Particle) => void
}

const rnd = (a: number, b: number) => a + Math.random() * (b - a)
const pick = <T>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)]!
const TAU = Math.PI * 2

const PALETTE: Record<Spell, { dark: string[], light: string[] }> = {
  // dark: sobre fundo escuro · light: sobre o papel claro
  embers: { dark: ['#fff0b0', '#ffc65a', '#ff8a2a', '#e8461c', '#9e2416'], light: ['#f5a524', '#ea6a1a', '#cf3f12', '#a3220f', '#6b1712'] },
  smoke: { dark: ['#dcdcd8', '#c8c8c3', '#ecebe7'], light: ['#77776f', '#8a8a84', '#63635e'] },
  acid: { dark: ['#c2f77a', '#9be84e', '#dcff96'], light: ['#5aa21e', '#4a8f14', '#6fb52a'] },
  ice: { dark: ['#eef9ff', '#b6e2f8', '#86caf0'], light: ['#3f95c8', '#2f7fb3', '#5aa6d4'] },
  rock: { dark: ['#c9cdd2', '#a4aab1', '#8a9099', '#d8d2c6'], light: ['#4a5059', '#5f666f', '#3a3e44', '#7a7468'] },
  lightning: { dark: ['#fffbe0', '#fff1a0', '#ffe14d', '#f5c518'], light: ['#d9a400', '#b88900', '#e6b800', '#8a6400'] },
  plants: { dark: ['#6cc795', '#4aa874', '#9be08a', '#3a9a62'], light: ['#2f7a45', '#3f9a5c', '#1f5c36', '#5aa04a'] },
}

function spawn(spell: Spell, kind: string, x: number, y: number, dark: boolean, o: Partial<Particle> = {}): Particle {
  const palette = PALETTE[spell][dark ? 'dark' : 'light']
  return { spell, kind, x, y, vx: 0, vy: 0, age: 0, life: 1, size: 2, rot: 0, vr: 0, color: pick(palette), palette, dark, seed: Math.random() * 100, alpha: 1, ...o }
}

function drawLeaf(ctx: CanvasRenderingContext2D, x: number, y: number, ang: number, s: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(ang)
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.quadraticCurveTo(s * 0.45, -s * 0.48, s, 0)
  ctx.quadraticCurveTo(s * 0.45, s * 0.48, 0, 0)
  ctx.fill()
  ctx.restore()
}

/* ------------------------------ brasas ------------------------------ */
const embers: SpellEffect = {
  additive: true,
  burst(c, x, y, f, dark) {
    for (let i = 0; i < 16 * f; i++) {
      const a = -Math.PI / 2 + rnd(-1.5, 1.5)
      const v = rnd(120, 380)
      c.add(spawn('embers', 'spark', x, y, dark, { vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rnd(0.35, 0.7), size: rnd(1, 2) }))
    }
    for (let i = 0; i < 9 * f; i++)
      c.add(spawn('embers', 'ember', x + rnd(-8, 8), y + rnd(-4, 4), dark, { vx: rnd(-40, 40), vy: rnd(-40, -130), life: rnd(0.8, 1.6), size: rnd(1, 2.4) }))
  },
  step(p, dt) {
    if (p.kind === 'spark') {
      p.vx *= 1 - 2.2 * dt
      p.vy = p.vy * (1 - 2.2 * dt) - 60 * dt
    }
    else {
      p.vy -= 25 * dt
      p.vx += Math.sin(p.age * 3 + p.seed) * 40 * dt
      p.vx *= 1 - 0.8 * dt
    }
    p.x += p.vx * dt
    p.y += p.vy * dt
    return true
  },
  draw(ctx, p) {
    const v = 1 - p.age / p.life
    // a brasa esfria: do amarelo ao vermelho escuro
    const color = p.palette[Math.min(p.palette.length - 1, Math.floor((1 - v) * p.palette.length))]!
    if (p.kind === 'spark') {
      ctx.globalAlpha = v
      ctx.strokeStyle = color
      ctx.lineWidth = p.size
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(p.x, p.y)
      ctx.lineTo(p.x - p.vx * 0.035, p.y - p.vy * 0.035)
      ctx.stroke()
      return
    }
    const glow = 0.65 + 0.35 * Math.sin(p.age * 22 + p.seed * 7)
    ctx.fillStyle = color
    ctx.globalAlpha = v * (p.dark ? 0.16 : 0.1) * glow
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size * (p.dark ? 4 : 2.4), 0, TAU)
    ctx.fill()
    ctx.globalAlpha = v * glow
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size, 0, TAU)
    ctx.fill()
  },
}

/* ------------------------------ fumaça ------------------------------ */
const smoke: SpellEffect = {
  burst(c, x, y, f, dark) {
    for (let i = 0; i < 8 * f; i++) {
      const a = rnd(0, TAU)
      const v = rnd(30, 90)
      c.add(spawn('smoke', 'puff', x, y, dark, { vx: Math.cos(a) * v, vy: Math.sin(a) * v - 20, size: rnd(6, 14), vr: rnd(25, 50), life: rnd(0.9, 1.6) }))
    }
  },
  step(p, dt) {
    p.vx += Math.sin(p.age * 1.2 + p.seed) * 8 * dt
    p.vx *= 1 - 0.5 * dt
    p.vy *= 1 - 0.3 * dt
    p.x += p.vx * dt
    p.y += p.vy * dt
    return true
  },
  draw(ctx, p) {
    const r = p.size + p.vr * p.age
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r)
    g.addColorStop(0, p.color)
    g.addColorStop(1, `${p.color}00`)
    ctx.globalAlpha = Math.min(1, Math.sin(Math.PI * p.age / p.life) * 0.22 * p.alpha)
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(p.x, p.y, r, 0, TAU)
    ctx.fill()
  },
}

/* ------------------------------ ácido ------------------------------ */
const acid: SpellEffect = {
  additive: true,
  burst(c, x, y, f, dark) {
    for (let i = 0; i < 11 * f; i++) {
      const a = -Math.PI / 2 + rnd(-1.25, 1.25)
      const v = rnd(140, 320)
      c.add(spawn('acid', 'drop', x, y, dark, { vx: Math.cos(a) * v, vy: Math.sin(a) * v, size: rnd(1.6, 3.2), ground: y + rnd(20, 70), life: 2 }))
    }
    for (let i = 0; i < 4 * f; i++)
      c.add(spawn('acid', 'bubble', x + rnd(-12, 12), y + rnd(-6, 6), dark, { vy: rnd(-30, -70), size: rnd(2, 5), life: rnd(0.6, 1.2) }))
  },
  step(p, dt, c) {
    switch (p.kind) {
      case 'drop':
      case 'splash':
        p.vy += 900 * dt
        p.x += p.vx * dt
        p.y += p.vy * dt
        if (p.kind === 'drop' && p.ground != null && p.vy > 0 && p.y >= p.ground) {
          const n = Math.round(rnd(3, 6))
          for (let i = 0; i < n; i++)
            c.add(spawn('acid', 'splash', p.x, p.ground, p.dark, { vx: rnd(-90, 90), vy: -rnd(60, 200), size: p.size * 0.5, life: 0.5 }))
          if (Math.random() < 0.4)
            c.add(spawn('acid', 'bubble', p.x, p.ground, p.dark, { vy: rnd(-20, -50), size: rnd(1.5, 3.5), life: rnd(0.6, 1.2) }))
          return false
        }
        return true
      case 'bubble':
        p.vy *= 1 - 0.2 * dt
        p.vx = Math.sin(p.age * 4 + p.seed) * 12
        p.x += p.vx * dt
        p.y += p.vy * dt
        return true
      default:
        return true
    }
  },
  draw(ctx, p) {
    const v = 1 - p.age / p.life
    ctx.fillStyle = p.color
    ctx.strokeStyle = p.color
    if (p.kind === 'bubble') {
      const pop = v < 0.12 ? 1 + (0.12 - v) * 8 : 1
      ctx.globalAlpha = 0.9 * Math.min(1, v * 4)
      ctx.lineWidth = 1.2
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * pop, 0, TAU)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(p.x - p.size * 0.35, p.y - p.size * 0.35, p.size * 0.22, 0, TAU)
      ctx.fill()
      return
    }
    const speed = Math.hypot(p.vx, p.vy)
    const stretch = 1 + Math.min(2, speed / 350)
    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.rotate(Math.atan2(p.vy, p.vx))
    if (p.dark) {
      ctx.globalAlpha = 0.2 * v
      ctx.beginPath()
      ctx.ellipse(0, 0, p.size * stretch * 2.2, p.size * 2.2, 0, 0, TAU)
      ctx.fill()
    }
    ctx.globalAlpha = Math.min(1, v * 3)
    ctx.beginPath()
    ctx.ellipse(0, 0, p.size * stretch, p.size, 0, 0, TAU)
    ctx.fill()
    ctx.restore()
  },
}

/* ------------------------------ gelo ------------------------------ */
const ice: SpellEffect = {
  additive: true,
  burst(c, x, y, f, dark) {
    for (let i = 0; i < 12 * f; i++) {
      const a = rnd(0, TAU)
      const v = rnd(120, 300)
      c.add(spawn('ice', 'shard', x, y, dark, { vx: Math.cos(a) * v, vy: Math.sin(a) * v, rot: a, vr: rnd(-6, 6), size: rnd(5, 12), life: rnd(0.45, 0.8) }))
    }
    c.add(spawn('ice', 'crystal', x, y, dark, { size: rnd(14, 24) * Math.max(0.6, f), rot: rnd(0, TAU), vr: rnd(0.3, 0.5), life: rnd(0.9, 1.3) }))
  },
  step(p, dt) {
    if (p.kind === 'shard') {
      p.vx *= 1 - 3 * dt
      p.vy = p.vy * (1 - 3 * dt) + 40 * dt
      p.rot += p.vr * dt
    }
    else if (p.kind === 'flake') {
      p.vx = Math.sin(p.age * 1.5 + p.seed) * 10
    }
    p.x += p.vx * dt
    p.y += p.vy * dt
    return true
  },
  draw(ctx, p) {
    const v = 1 - p.age / p.life
    ctx.fillStyle = p.color
    ctx.strokeStyle = p.color
    if (p.kind === 'flake') {
      ctx.globalAlpha = Math.min(1, v * 3) * 0.9
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, TAU)
      ctx.fill()
      return
    }
    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.rotate(p.rot)
    if (p.kind === 'shard') {
      const l = p.size
      const w = p.size * 0.26
      ctx.globalAlpha = v
      ctx.beginPath()
      ctx.moveTo(-l, 0)
      ctx.lineTo(0, -w)
      ctx.lineTo(l, 0)
      ctx.lineTo(0, w)
      ctx.closePath()
      ctx.fill()
    }
    else {
      // cristal de gelo: seis braços com ramos, que crescem e depois derretem
      const g = Math.min(1, p.age / p.vr)
      const fade = p.age > p.life * 0.6 ? 1 - (p.age - p.life * 0.6) / (p.life * 0.4) : 1
      const L = p.size * g
      ctx.globalAlpha = Math.max(0, fade) * 0.95
      ctx.lineWidth = Math.max(0.8, p.size / 16)
      ctx.lineCap = 'round'
      ctx.beginPath()
      for (let k = 0; k < 6; k++) {
        const a = k * Math.PI / 3
        const cx = Math.cos(a)
        const cy = Math.sin(a)
        ctx.moveTo(0, 0)
        ctx.lineTo(cx * L, cy * L)
        for (const [pos, length] of [[0.42, 0.34], [0.7, 0.22]] as const) {
          const bx = cx * L * pos
          const by = cy * L * pos
          for (const s of [-1, 1]) {
            const b = a + s * Math.PI / 3
            ctx.moveTo(bx, by)
            ctx.lineTo(bx + Math.cos(b) * L * length, by + Math.sin(b) * L * length)
          }
        }
      }
      ctx.stroke()
    }
    ctx.restore()
  },
}

/* ------------------------------ plantas ------------------------------ */
function spawnVine(x: number, y: number, dark: boolean, o: Partial<Particle>) {
  const p = spawn('plants', 'vine', x, y, dark, o)
  p.pts = [x, y]
  p.len = 0
  p.mark = 0
  p.leaves = []
  const greens = PALETTE.plants[dark ? 'dark' : 'light']
  p.color = dark ? '#2f7a4c' : '#1f5c36'
  p.palette = greens
  p.life = p.target! / p.speed! + (o.life ?? 1.4)
  return p
}

const plants: SpellEffect = {
  burst(c, x, y, f, dark) {
    for (let i = 0; i < 10 * f; i++) {
      const a = rnd(0, TAU)
      const v = rnd(60, 180)
      c.add(spawn('plants', 'leaf', x, y, dark, { vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, size: rnd(4, 8), rot: rnd(0, TAU), vr: rnd(-6, 6), life: rnd(1.2, 2) }))
    }
    for (let i = 0; i < 3 * f; i++)
      c.add(spawnVine(x, y, dark, { ang: rnd(0, TAU), target: rnd(18, 40), speed: rnd(120, 200), size: 1.4, life: 0.7 }))
  },
  step(p, dt) {
    if (p.kind === 'leaf') {
      p.vx = p.vx * (1 - 1.5 * dt) + Math.sin(p.age * 2.4 + p.seed) * 60 * dt
      p.vy = Math.min(p.vy + 50 * dt, 90)
      p.rot += p.vr * dt
      p.vr *= 1 - 0.4 * dt
      p.x += p.vx * dt
      p.y += p.vy * dt
      return true
    }
    // vinha: a ponta avança curvando, e brotam folhas pelo caminho
    if (p.len! < p.target!) {
      p.ang! += Math.sin(p.len! / 38 + p.seed) * 0.022 * p.speed! * dt
      const advance = p.speed! * dt
      p.x += Math.cos(p.ang!) * advance
      p.y += Math.sin(p.ang!) * advance
      p.len! += advance
      const pts = p.pts!
      const lx = pts[pts.length - 2]!
      const ly = pts[pts.length - 1]!
      if (Math.hypot(p.x - lx, p.y - ly) > 3) pts.push(p.x, p.y)
      if (p.len! - p.mark! > p.size * 6 + 6 && pts.length >= 4) {
        p.mark = p.len!
        p.leaves!.push({ i: pts.length - 4, side: p.leaves!.length % 2 ? 1 : -1, size: (p.size * 2.4 + 5) * rnd(0.8, 1.25), t: p.age })
      }
    }
    return true
  },
  draw(ctx, p) {
    if (p.kind === 'leaf') {
      const v = 1 - p.age / p.life
      ctx.globalAlpha = Math.min(1, v * 3)
      ctx.fillStyle = p.color
      drawLeaf(ctx, p.x, p.y, p.rot, p.size * 2)
      return
    }
    const remaining = p.life - p.age
    ctx.globalAlpha = remaining < 0.8 ? Math.max(0, remaining / 0.8) : 1
    const pts = p.pts!
    ctx.strokeStyle = p.color
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    // o caule afina da base à ponta, em quatro trechos
    const n = pts.length / 2
    for (let t = 0; t < 4; t++) {
      const from = Math.floor((n - 1) * t / 4)
      const to = Math.floor((n - 1) * (t + 1) / 4)
      if (to <= from) continue
      ctx.lineWidth = p.size * (1.5 - t * 0.33)
      ctx.beginPath()
      ctx.moveTo(pts[from * 2]!, pts[from * 2 + 1]!)
      for (let i = from + 1; i <= to; i++) ctx.lineTo(pts[i * 2]!, pts[i * 2 + 1]!)
      if (t === 3) ctx.lineTo(p.x, p.y)
      ctx.stroke()
    }
    for (const f of p.leaves!) {
      const x = pts[f.i]!
      const y = pts[f.i + 1]!
      const tg = Math.atan2(pts[f.i + 3]! - y, pts[f.i + 2]! - x)
      const s = Math.min(1, (p.age - f.t) / 0.35)
      ctx.fillStyle = p.palette[f.i % p.palette.length]!
      drawLeaf(ctx, x, y, tg + f.side * 0.9, f.size * s)
    }
  },
}

/* ------------------------------ raio ------------------------------ */
// Um relâmpago: um traço quebrado em zigue-zague, com ramos, que pisca e some.
function zigzag(x: number, y: number, ang: number, length: number, spread: number) {
  const pts = [x, y]
  const n = Math.max(3, Math.round(length / 9))
  let px = x
  let py = y
  for (let i = 1; i <= n; i++) {
    const t = length / n
    const a = ang + rnd(-spread, spread)
    px += Math.cos(a) * t
    py += Math.sin(a) * t
    pts.push(px, py)
  }
  return pts
}

const lightning: SpellEffect = {
  additive: true,
  burst(c, x, y, f, dark) {
    for (let i = 0; i < Math.round(4 * f); i++) {
      const ang = rnd(0, TAU)
      const length = rnd(34, 70)
      const pts = zigzag(x, y, ang, length, 0.7)
      c.add(spawn('lightning', 'bolt', x, y, dark, { pts, size: rnd(1.4, 2.2), life: rnd(0.28, 0.42) }))
      // um ramo sai do meio do relâmpago
      const k = 2 * Math.floor(pts.length / 4)
      c.add(spawn('lightning', 'bolt', pts[k]!, pts[k + 1]!, dark, { pts: zigzag(pts[k]!, pts[k + 1]!, ang + rnd(-0.9, 0.9), length * 0.45, 0.8), size: 1, life: rnd(0.2, 0.32) }))
    }
    for (let i = 0; i < 10 * f; i++) {
      const a = rnd(0, TAU)
      const v = rnd(160, 360)
      c.add(spawn('lightning', 'spark', x, y, dark, { vx: Math.cos(a) * v, vy: Math.sin(a) * v, size: rnd(1, 1.8), life: rnd(0.25, 0.5) }))
    }
    c.add(spawn('lightning', 'flash', x, y, dark, { size: rnd(16, 24) * Math.max(0.6, f), life: 0.22 }))
  },
  step(p, dt) {
    if (p.kind === 'spark') {
      p.vx *= 1 - 4 * dt
      p.vy *= 1 - 4 * dt
      p.x += p.vx * dt
      p.y += p.vy * dt
    }
    return true
  },
  draw(ctx, p) {
    const v = 1 - p.age / p.life
    ctx.fillStyle = p.color
    ctx.strokeStyle = p.color
    if (p.kind === 'flash') {
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size)
      g.addColorStop(0, p.palette[0]!)
      g.addColorStop(1, `${p.palette[0]!}00`)
      ctx.globalAlpha = v * (p.dark ? 0.55 : 0.4)
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, TAU)
      ctx.fill()
      return
    }
    if (p.kind === 'spark') {
      ctx.globalAlpha = v
      ctx.lineWidth = p.size
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(p.x, p.y)
      ctx.lineTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03)
      ctx.stroke()
      return
    }
    // relâmpago: pisca (cintila) e esmaece; um halo largo por baixo no escuro
    const pts = p.pts!
    const flicker = Math.sin(p.age * 90 + p.seed) > -0.3 ? 1 : 0.35
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    const strokeBolt = (width: number, alpha: number, color: string) => {
      ctx.globalAlpha = alpha
      ctx.strokeStyle = color
      ctx.lineWidth = width
      ctx.beginPath()
      ctx.moveTo(pts[0]!, pts[1]!)
      for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i]!, pts[i + 1]!)
      ctx.stroke()
    }
    if (p.dark) strokeBolt(p.size * 4, v * 0.18 * flicker, p.color)
    strokeBolt(p.size, v * flicker, p.dark ? p.palette[0]! : p.color)
  },
}

/* ------------------------------ rocha ------------------------------ */
// Estilhaços de pedra: polígonos irregulares que saltam, giram, caem, quicam uma vez e levantam poeira.
function stoneShape() {
  const n = 5 + Math.floor(Math.random() * 3)
  const pts: number[] = []
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + rnd(-0.3, 0.3)
    const r = rnd(0.65, 1)
    pts.push(Math.cos(a) * r, Math.sin(a) * r)
  }
  return pts
}

const rock: SpellEffect = {
  burst(c, x, y, f, dark) {
    for (let i = 0; i < 9 * f; i++) {
      const a = -Math.PI / 2 + rnd(-1.2, 1.2)
      const v = rnd(150, 330)
      c.add(spawn('rock', 'stone', x, y, dark, { vx: Math.cos(a) * v, vy: Math.sin(a) * v, size: rnd(2.5, 6), rot: rnd(0, TAU), vr: rnd(-9, 9), ground: y + rnd(24, 64), pts: stoneShape(), life: rnd(1.1, 1.6), mark: 0 }))
    }
    for (let i = 0; i < 5 * f; i++)
      c.add(spawn('rock', 'dust', x + rnd(-10, 10), y + rnd(-4, 6), dark, { vx: rnd(-50, 50), vy: rnd(-40, -10), size: rnd(5, 10), vr: rnd(14, 26), life: rnd(0.7, 1.1) }))
  },
  step(p, dt, c) {
    if (p.kind === 'dust') {
      p.vx *= 1 - 2 * dt
      p.vy *= 1 - 2 * dt
      p.x += p.vx * dt
      p.y += p.vy * dt
      return true
    }
    p.vy += 1100 * dt
    p.x += p.vx * dt
    p.y += p.vy * dt
    p.rot += p.vr * dt
    if (p.ground != null && p.vy > 0 && p.y >= p.ground) {
      p.y = p.ground
      if (p.mark === 0) {
        // primeiro impacto: quica com perda e solta um pouco de poeira
        p.mark = 1
        p.vy *= -0.35
        p.vx *= 0.6
        p.vr *= 0.5
        c.add(spawn('rock', 'dust', p.x, p.y, p.dark, { vx: rnd(-25, 25), vy: rnd(-25, -8), size: p.size * 0.9, vr: rnd(8, 14), life: rnd(0.5, 0.8) }))
      }
      else {
        p.vy = 0
        p.vx *= 1 - 8 * dt
        p.vr *= 1 - 8 * dt
      }
    }
    return true
  },
  draw(ctx, p) {
    const v = 1 - p.age / p.life
    ctx.fillStyle = p.color
    if (p.kind === 'dust') {
      const r = p.size + p.vr * p.age
      ctx.globalAlpha = Math.sin(Math.PI * p.age / p.life) * (p.dark ? 0.2 : 0.16)
      ctx.beginPath()
      ctx.arc(p.x, p.y, r, 0, TAU)
      ctx.fill()
      return
    }
    const pts = p.pts!
    ctx.globalAlpha = Math.min(1, v * 4)
    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.rotate(p.rot)
    ctx.scale(p.size, p.size)
    ctx.beginPath()
    ctx.moveTo(pts[0]!, pts[1]!)
    for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i]!, pts[i + 1]!)
    ctx.closePath()
    ctx.fill()
    // aresta iluminada: uma face mais clara dá volume à pedra
    ctx.globalAlpha *= 0.35
    ctx.fillStyle = p.dark ? '#ffffff' : '#e8e4dc'
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(pts[0]!, pts[1]!)
    ctx.lineTo(pts[2]!, pts[3]!)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  },
}

const EFFECTS: Record<Spell, SpellEffect> = { embers, smoke, acid, ice, plants, lightning, rock }

/* ------------------------------ a camada ------------------------------ */

const MAX_PARTICLES = 1400

class SpellLayer {
  cv: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  particles: Particle[] = []
  pending: Particle[] = []
  raf = 0
  lastTime = 0
  w = 0
  h = 0
  dirty = false

  constructor() {
    this.cv = document.createElement('canvas')
    this.cv.className = 'pointer-events-none fixed inset-0 z-70 size-full'
    this.cv.setAttribute('aria-hidden', 'true')
    this.ctx = this.cv.getContext('2d')!
    document.body.appendChild(this.cv)
    this.measure()
    addEventListener('resize', () => this.measure(), { passive: true })
  }

  measure() {
    const dpr = Math.min(2, devicePixelRatio || 1)
    this.w = innerWidth
    this.h = innerHeight
    this.cv.width = Math.round(this.w * dpr)
    this.cv.height = Math.round(this.h * dpr)
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  add(p: Particle) {
    if (this.particles.length + this.pending.length < MAX_PARTICLES) this.pending.push(p)
    this.wake()
  }

  wake() {
    if (this.raf) return
    this.lastTime = performance.now()
    this.raf = requestAnimationFrame(this.frame)
  }

  /** Um estouro da magia num ponto da tela. `force` escala a quantidade. */
  emit(spell: Spell, x: number, y: number, force = 1, dark = isDarkNow()) {
    EFFECTS[spell].burst(this, x, y, force, dark)
  }

  frame = (now: number) => {
    this.raf = 0
    if (!this.cv.isConnected) document.body.appendChild(this.cv)
    // o carimbo do rAF pode vir antes do performance.now() de wake(): nunca deixe dt negativo
    const dt = Math.max(0, Math.min(0.05, (now - this.lastTime) / 1000))
    this.lastTime = now
    const { ctx, w, h } = this

    if (this.pending.length) { this.particles.push(...this.pending); this.pending = [] }
    if (this.dirty || this.particles.length) ctx.clearRect(0, 0, w, h)
    this.dirty = false

    let n = 0
    for (const p of this.particles) {
      p.age += dt
      const T = EFFECTS[p.spell]
      if (p.age >= p.life || !T.step(p, dt, this)) continue
      if (p.y > h + 200 || p.y < -400 || p.x < -300 || p.x > w + 300) continue
      this.particles[n++] = p
      ctx.globalCompositeOperation = p.dark && T.additive ? 'lighter' : 'source-over'
      T.draw(ctx, p)
    }
    this.particles.length = n
    if (n) this.dirty = true
    ctx.globalCompositeOperation = 'source-over'
    ctx.globalAlpha = 1
    // respingos criados durante o passo entram no próximo quadro
    if (this.pending.length) { this.particles.push(...this.pending); this.pending = [] }

    if (this.particles.length) this.raf = requestAnimationFrame(this.frame)
    else ctx.clearRect(0, 0, w, h)
  }
}

let layer: SpellLayer | null = null

/** A camada das magias, criada na primeira vez. null no servidor ou com "reduzir movimento". */
export function spellLayer(): SpellLayer | null {
  if (typeof window === 'undefined') return null
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return null
  layer ??= new SpellLayer()
  return layer
}

/** O tema escuro está valendo agora? (escolha salva ou o sistema) */
export function isDarkNow() {
  const t = document.documentElement.dataset.theme
  if (t === 'dark') return true
  if (t === 'light') return false
  return matchMedia('(prefers-color-scheme: dark)').matches
}
