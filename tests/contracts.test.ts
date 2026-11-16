// architecture: checks the contract files load and agree with the steering docs. No algorithm is tested here.
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import * as C from '@/lib/align/constants';
import { NarrateRequest, NarrateResponse } from '@/lib/api/contracts';
import { APP_NAME, STORAGE_PREFIX } from '@/lib/brand';
import { Fact, NarrationTemplate, RideFacts, SLOT_RE } from '@/lib/narrator/schema';

const root = path.resolve(__dirname, '..');

describe('align constants match .kiro/steering/geo-math.md', () => {
  const md = readFileSync(path.join(root, '.kiro/steering/geo-math.md'), 'utf8');
  const row = (name: string) => {
    const m = md.match(new RegExp('\\| `' + name + '` \\| ([^|]+)\\|'));
    if (!m) throw new Error(`constant ${name} missing from geo-math.md`);
    return m[1].trim();
  };

  it.each([
    ['HEADING_CHORD_M', C.HEADING_CHORD_M],
    ['CORRIDOR_RADIUS_M', C.CORRIDOR_RADIUS_M],
    ['MAX_HEADING_DIFF_DEG', C.MAX_HEADING_DIFF_DEG],
    ['HYSTERESIS_GAP_M', C.HYSTERESIS_GAP_M],
    ['MIN_RUN_LENGTH_M', C.MIN_RUN_LENGTH_M],
    ['BACKTRACK_TOLERANCE_M', C.BACKTRACK_TOLERANCE_M],
    ['SPIKE_SPEED_MPS', C.SPIKE_SPEED_MPS],
  ])('%s', (name, value) => {
    expect(Number(row(name))).toBe(value);
  });

  it('RESAMPLE_STEP_M (5, 10 for long rides)', () => {
    expect(row('RESAMPLE_STEP_M')).toBe(`${C.RESAMPLE_STEP_M} (${C.RESAMPLE_STEP_LONG_RIDE_M} if ride > ${C.LONG_RIDE_THRESHOLD_M / 1000} km)`);
  });

  it('FORWARD_WINDOW', () => {
    expect(row('FORWARD_WINDOW')).toBe(`[−${C.FORWARD_WINDOW_M.behind}, +${C.FORWARD_WINDOW_M.ahead}] m`);
  });

  it('pause and privacy defaults', () => {
    expect(md).toContain(`| ${C.PAUSE_GAP_S} / ${C.STOP_SPEED_MPS} / ${C.STOP_MIN_S} / ${C.SPEED_SMOOTH_S} |`);
    expect(md).toContain(`| ${C.PRIVACY_RADIUS_M} / ${C.ENDPOINT_TRIM_M} |`);
  });
});

describe('narrator schema', () => {
  const fact = {
    id: 'gap.final',
    kind: 'gap',
    label: 'Final gap',
    value: 24,
    unit: 's',
    display: '24 seconds',
    signed: true,
    how: 'T_present(end) − T_ghost(end), moving time',
  } as const;

  it('accepts a valid fact set and request', () => {
    expect(Fact.parse(fact)).toEqual(fact);
    const req = NarrateRequest.parse({ facts: { version: 2, facts: [fact] } });
    expect(req.persona).toBe('whisper');
  });

  it('rejects facts that are not finite', () => {
    expect(RideFacts.safeParse({ version: 2, facts: [{ ...fact, value: Number.NaN }] }).success).toBe(false);
  });

  it('template must have 3–6 lines', () => {
    expect(NarrationTemplate.safeParse({ lines: [{ text: 'a' }, { text: 'b' }] }).success).toBe(false);
  });

  it('SLOT_RE recognises the three slot forms', () => {
    const text = 'I beat you by {gap.final} — {you:gap.final:ahead}. {climb1.length}';
    const slots = [...text.matchAll(SLOT_RE)].map((m) => [m[1] ?? '', m[2], m[3] ?? '']);
    expect(slots).toEqual([
      ['', 'gap.final', ''],
      ['you:', 'gap.final', 'ahead'],
      ['', 'climb1.length', ''],
    ]);
  });

  it('response marks its source', () => {
    const r = NarrateResponse.safeParse({ script: { lines: [{ text: 'x', spans: [{ text: 'x', factId: null }] }] }, source: 'template' });
    expect(r.success).toBe(true);
  });
});

describe('brand and samples', () => {
  it('brand constants', () => {
    expect(APP_NAME).toBe('CloneRider');
    expect(STORAGE_PREFIX).toBe('clonerider');
  });

  it('sample archive is GPX-only and keeps no heart rate, power or device data', () => {
    const dir = path.join(root, 'public/samples/archive');
    const files = readdirSync(dir);
    expect(files.length).toBeGreaterThanOrEqual(2);
    for (const f of files) {
      expect(f).toMatch(/^\d{4}-\d{2}-\d{2}\.gpx$/);
      const xml = readFileSync(path.join(dir, f), 'utf8');
      expect(xml).not.toMatch(/<(extensions|gpxtpx:hr|power|cad)\b/);
    }
  });
});
