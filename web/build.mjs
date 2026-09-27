// 크레인 JSON(data/cranes/*.json)을 검증해 index.src.html에 삽입 → index.html
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = join(here, '..', 'data', 'cranes');
const KEEP = ['id','manufacturer','model','type','boomType','dims','groundPressure_kPa','maxCapacity_t','axles','operatingWeight_t','maxBoom_m','maxHookHeight_m',
  'counterweight_t','outriggerSpan_m','maxOutriggerForce_t','chartConfig','chartIncludesHookBlock','livery','boomLengths_m','radii_m','capacity_t','source','notes'];

const cranes = [];
for (const f of readdirSync(dataDir).filter(f => f.endsWith('.json')).sort()) {
  const c = JSON.parse(readFileSync(join(dataDir, f), 'utf8'));
  const errs = [], warns = [];
  if (!Array.isArray(c.radii_m) || !Array.isArray(c.boomLengths_m) || !Array.isArray(c.capacity_t)) errs.push('차트 배열 누락');
  else {
    if (c.capacity_t.length !== c.radii_m.length) errs.push(`행 수 ${c.capacity_t.length} ≠ 반경 ${c.radii_m.length}`);
    c.capacity_t.forEach((row, i) => { if (row.length !== c.boomLengths_m.length) errs.push(`행 ${i} 열 수 ${row.length} ≠ ${c.boomLengths_m.length}`); });
    for (let i = 1; i < c.radii_m.length; i++) if (!(c.radii_m[i] > c.radii_m[i - 1])) errs.push(`반경 오름차순 아님 @${i}`);
    // 같은 붐 길이에서 반경이 커질수록 정격하중이 감소해야 함 (소폭 상승은 경고만)
    c.boomLengths_m.forEach((L, j) => {
      let prev = null;
      c.capacity_t.forEach((row, i) => {
        const v = row[j]; if (v == null) return;
        if (prev != null && v > prev * 1.05) warns.push(`붐 ${L} m: R ${c.radii_m[i]} m에서 ${prev}→${v} 상승`);
        prev = v;
      });
    });
  }
  if (errs.length) { console.error(`✗ ${f}: ${errs.join('; ')}`); continue; }
  warns.forEach(w => console.warn(`  ! ${f}: ${w}`));
  if (/^sany$/i.test(c.manufacturer)) c.manufacturer = 'Sany';
  // 아웃트리거: 전개 폭 목록(3개 이상)으로 주어진 경우 최대 전개 폭 하나로 정리
  if (Array.isArray(c.outriggerSpan_m) && c.outriggerSpan_m.length > 2) c.outriggerSpan_m = [Math.max(...c.outriggerSpan_m)];
  cranes.push(Object.fromEntries(KEEP.filter(k => k in c).map(k => [k, c[k]])));
  console.log(`✓ ${c.model} (${c.maxCapacity_t} t) — ${c.radii_m.length}×${c.boomLengths_m.length}`);
}

// 제조사 도색 (data/spec/liveries.json, 실물 사진 기준)
const livPath = join(here, '..', 'data', 'spec', 'liveries.json');
const liveries = existsSync(livPath) ? JSON.parse(readFileSync(livPath, 'utf8')) : {};
for (const v of Object.values(liveries)) if (v && typeof v === 'object') { delete v.photo; delete v.notes; delete v.confidence; }

// 제조사·형식 → 도색 키 (Liebherr LR 크롤러, Grove RT, Manitowoc 크롤러 등은 도색이 다름)
function liveryKey(c) {
  const m = c.manufacturer.toLowerCase(), cr = c.type === 'CR';
  if (m.includes('grove')) return c.type === 'RT' ? 'Manitowoc Grove GRT' : 'Manitowoc Grove';
  if (m.includes('manitowoc')) return 'Manitowoc crawler';
  if (m.includes('liebherr')) return cr ? 'Liebherr crawler' : 'Liebherr';
  if (m.includes('sumitomo')) return 'Sumitomo / Hitachi Sumitomo';
  for (const b of ['XCMG', 'Sany', 'Zoomlion']) if (m.includes(b.toLowerCase())) return cr ? `${b} crawler` : b;
  return ['Tadano', 'Kato', 'Kobelco'].find(b => m.includes(b.toLowerCase()));
}
for (const c of cranes) { const k = liveryKey(c); if (k && liveries[k]) c.livery = liveries[k]; else console.warn(`  ! 도색 없음: ${c.model}`); }
delete liveries._meta;

const src = readFileSync(join(here, 'index.src.html'), 'utf8');
writeFileSync(join(here, 'index.html'), src.replace('/*__CRANES__*/[]', JSON.stringify(cranes)));
console.log(`→ index.html (${cranes.length}종)`);

// 공개 배포용(GitHub Pages): 문서 골격·viewport·기본 리셋을 붙인 완전한 HTML → docs/index.html
const page = readFileSync(join(here, 'index.html'), 'utf8');
const shell = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="공사 기획 단계에서 중량물별 필요 크레인 용량을 제조사 정격하중표로 검토하는 도구">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>
${page.replace('<meta charset="utf-8">\n', '')}
</html>
`;
const docsDir = join(here, '..', 'docs');
if (!existsSync(docsDir)) mkdirSync(docsDir);
writeFileSync(join(docsDir, 'index.html'), shell);
writeFileSync(join(docsDir, '.nojekyll'), '');
console.log('→ docs/index.html (배포용)');
