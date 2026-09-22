/**
 * Verificación funcional — Fases 2, 3 y 4
 * Ejecutar desde la raíz del proyecto:
 *   node test/verify-phases.mjs
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DATABASE_PATH ||
  (fs.existsSync(path.join(__dirname, '..', 'data_db', 'finanzas.db'))
    ? path.join(__dirname, '..', 'data_db', 'finanzas.db')
    : path.join(__dirname, '..', 'database', 'finance.db'));

// ─── Test runner ──────────────────────────────────────────────────────────────

let passed = 0, failed = 0;

function assert(cond, msg) {
  if (cond) { console.log(`  ✅ ${msg}`); passed++; }
  else       { console.error(`  ❌ FAIL: ${msg}`); failed++; }
}

function section(title) {
  console.log(`\n${title}`);
  console.log('─'.repeat(title.length));
}

// ─── DB setup ─────────────────────────────────────────────────────────────────

const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');

// Ensure new tables exist
db.exec(`
  CREATE TABLE IF NOT EXISTS presupuestos (
    id              TEXT PRIMARY KEY,
    categoria       TEXT NOT NULL UNIQUE,
    limite_mensual  REAL NOT NULL CHECK (limite_mensual > 0),
    activo          INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0,1))
  );
  CREATE TABLE IF NOT EXISTS metas (
    id             TEXT PRIMARY KEY,
    nombre         TEXT NOT NULL,
    objetivo       REAL NOT NULL CHECK (objetivo > 0),
    aportado       REAL NOT NULL DEFAULT 0 CHECK (aportado >= 0),
    fecha_objetivo TEXT,
    icono          TEXT NOT NULL DEFAULT '🎯',
    color          TEXT NOT NULL DEFAULT '#9b8ec4'
  );
`);

const uid = () => crypto.randomUUID();
const today = new Date().toISOString().slice(0, 10);
const mp = today.slice(0, 7); // YYYY-MM
const from = `${mp}-01T00:00:00Z`;
const to   = `${mp}-31T23:59:59Z`;

// ─── Insert test transactions ─────────────────────────────────────────────────

const [id1, id2, id3] = [uid(), uid(), uid()];
db.prepare(`INSERT OR IGNORE INTO transacciones (id,fecha,tipo,categoria,concepto,importe)
  VALUES (?,?,'Ingreso','Ingresos','[TEST] Ingreso F2',1000)`).run(id1, `${mp}-01T10:00:00Z`);
db.prepare(`INSERT OR IGNORE INTO transacciones (id,fecha,tipo,categoria,concepto,importe)
  VALUES (?,?,'Gasto','Comida','[TEST] Gasto Comida',200)`).run(id2, `${mp}-05T10:00:00Z`);
db.prepare(`INSERT OR IGNORE INTO transacciones (id,fecha,tipo,categoria,concepto,importe)
  VALUES (?,?,'Gasto','Ocio','[TEST] Gasto Ocio',500)`).run(id3, `${mp}-10T10:00:00Z`);

// ═══════════════════════════════════════════════════════════════════════════════
// FASE 2 — KPI, Heatmap, Top Transactions
// ═══════════════════════════════════════════════════════════════════════════════

section('📊 FASE 2 — KPI comparison, Heatmap & Top Transactions');

// KPI totals
const kpi = db.prepare(`
  SELECT
    COALESCE(SUM(CASE WHEN tipo='Ingreso' THEN importe ELSE 0 END),0) AS ingresos,
    COALESCE(SUM(CASE WHEN tipo='Gasto'   THEN importe ELSE 0 END),0) AS gastos
  FROM transacciones WHERE fecha >= ? AND fecha <= ?
`).get(from, to);

assert(kpi.ingresos >= 1000,             `Ingresos acumulados >= 1000 (got ${kpi.ingresos})`);
assert(kpi.gastos >= 700,                `Gastos acumulados >= 700 (got ${kpi.gastos})`);
assert(kpi.ingresos - kpi.gastos < kpi.ingresos, 'Beneficio neto < ingresos totales');

// Savings rate
const tasa = kpi.ingresos > 0 ? Math.max(0, Math.min(100, ((kpi.ingresos - kpi.gastos) / kpi.ingresos) * 100)) : 0;
assert(tasa >= 0 && tasa <= 100,         `Tasa de ahorro en rango [0,100] (got ${tasa.toFixed(1)}%)`);

// shiftRange: período anterior (mismo nº de días)
const fromD = new Date(from), toD = new Date(to);
const days = Math.round((toD - fromD) / 86_400_000) + 1;
const prevTo = new Date(fromD); prevTo.setDate(prevTo.getDate() - 1);
const prevFrom = new Date(prevTo); prevFrom.setDate(prevFrom.getDate() - days + 1);
assert(prevFrom < fromD,                 'shiftRange: período anterior < período actual');
assert(days > 0,                         `shiftRange: días calculados > 0 (got ${days})`);

// Top transactions — validate ordering (greatest expense first)
const allGastos = db.prepare(`
  SELECT importe FROM transacciones
  WHERE tipo='Gasto' AND fecha >= ? AND fecha <= ?
  ORDER BY importe DESC
`).all(from, to);
const topGasto = allGastos[0];
assert(topGasto !== undefined,           'Top gasto: existe al menos un gasto en el período');
assert(allGastos.every(g => g.importe <= topGasto.importe),
  `Top gasto es el mayor (got ${topGasto?.importe} — todos los demás son menores o iguales)`);

const topIngreso = db.prepare(`
  SELECT importe FROM transacciones
  WHERE tipo='Ingreso' AND fecha >= ? AND fecha <= ?
  ORDER BY importe DESC LIMIT 1
`).get(from, to);
assert(topIngreso?.importe >= 1000,      `Top ingreso >= 1000 (got ${topIngreso?.importe})`);

// Heatmap — distinct days with spending
const heatDays = db.prepare(`
  SELECT COUNT(*) AS c FROM (
    SELECT strftime('%Y-%m-%d', fecha) AS d
    FROM transacciones
    WHERE tipo='Gasto' AND fecha >= ? AND fecha <= ?
    GROUP BY d
  )
`).get(from, to);
assert(heatDays.c >= 2,                  `Heatmap: >= 2 días distintos con gasto (got ${heatDays.c})`);

const heatRows = db.prepare(`
  SELECT strftime('%Y-%m-%d', fecha) AS fecha, COALESCE(SUM(importe),0) AS gastos
  FROM transacciones WHERE tipo='Gasto' AND fecha >= ? AND fecha <= ?
  GROUP BY strftime('%Y-%m-%d', fecha) ORDER BY fecha
`).all(from, to);
assert(heatRows.every(r => r.gastos > 0), 'Heatmap: todos los días tienen gastos > 0');

// intensityToColor logic test
function getIntensity(v, max) { return max === 0 || v === 0 ? 0 : Math.min(1, v / max); }
const maxGasto = Math.max(...heatRows.map(r => r.gastos));
const intensities = heatRows.map(r => getIntensity(r.gastos, maxGasto));
assert(Math.max(...intensities) === 1,   'Heatmap: intensidad máxima = 1.0 (día de mayor gasto)');
assert(intensities.every(i => i >= 0 && i <= 1), 'Heatmap: todas las intensidades en [0,1]');

// ═══════════════════════════════════════════════════════════════════════════════
// FASE 3 — Presupuestos
// ═══════════════════════════════════════════════════════════════════════════════

section('💰 FASE 3 — Presupuestos CRUD & Progress');

const bid = uid();

// Create
db.prepare(`INSERT INTO presupuestos (id, categoria, limite_mensual) VALUES (?, ?, ?)`).run(bid, 'ComidaTest', 300);
const bud = db.prepare(`SELECT * FROM presupuestos WHERE id = ?`).get(bid);
assert(bud !== undefined,                'Presupuesto creado en BD');
assert(bud.categoria === 'ComidaTest',  `Categoría correcta (got "${bud.categoria}")`);
assert(bud.limite_mensual === 300,      `Límite mensual = 300 (got ${bud.limite_mensual})`);
assert(bud.activo === 1,               `Activo por defecto = 1 (got ${bud.activo})`);

// Update limit (inline edit)
db.prepare(`UPDATE presupuestos SET limite_mensual = ? WHERE id = ?`).run(450, bid);
const upd = db.prepare(`SELECT limite_mensual FROM presupuestos WHERE id = ?`).get(bid);
assert(upd.limite_mensual === 450,      `Límite actualizado a 450 (got ${upd.limite_mensual})`);

// Toggle active/inactive
db.prepare(`UPDATE presupuestos SET activo = ((activo + 1) % 2) WHERE id = ?`).run(bid);
const tog1 = db.prepare(`SELECT activo FROM presupuestos WHERE id = ?`).get(bid);
assert(tog1.activo === 0,              'Toggle 1: activo = 0 (desactivado)');
db.prepare(`UPDATE presupuestos SET activo = ((activo + 1) % 2) WHERE id = ?`).run(bid);
const tog2 = db.prepare(`SELECT activo FROM presupuestos WHERE id = ?`).get(bid);
assert(tog2.activo === 1,              'Toggle 2: activo = 1 (reactivado)');

// Duplicate category rejected
let dupErr = false;
try { db.prepare(`INSERT INTO presupuestos (id, categoria, limite_mensual) VALUES (?, ?, ?)`).run(uid(), 'ComidaTest', 200); }
catch { dupErr = true; }
assert(dupErr, 'UNIQUE constraint: categoría duplicada rechazada');

// Progress calculation (Comida = id2 = 200€ en mes actual)
const gastadoComida = db.prepare(`
  SELECT COALESCE(SUM(importe), 0) AS g
  FROM transacciones
  WHERE tipo = 'Gasto' AND categoria = 'Comida' AND fecha >= ? AND fecha <= ?
`).get(from, to);
assert(gastadoComida.g >= 200,         `Gasto Comida >= 200 en mes actual (got ${gastadoComida.g})`);

const pctComida = (gastadoComida.g / 450) * 100;
assert(pctComida > 0 && pctComida <= 100, `Porcentaje uso en [0,100] (got ${pctComida.toFixed(1)}%)`);

// Color lógica (verde→amarillo→rojo)
function barColor(pct) { return pct >= 100 ? '#b08080' : pct >= 80 ? '#c9a96e' : '#7db88f'; }
assert(barColor(30)  === '#7db88f',    'Color <80%  = sage (verde)');
assert(barColor(85)  === '#c9a96e',    'Color >=80% = warm-tan (amarillo)');
assert(barColor(105) === '#b08080',    'Color >=100%= dusty-rose (rojo)');

// Delete
db.prepare(`DELETE FROM presupuestos WHERE id = ?`).run(bid);
assert(!db.prepare(`SELECT id FROM presupuestos WHERE id = ?`).get(bid), 'Presupuesto eliminado');

// ═══════════════════════════════════════════════════════════════════════════════
// FASE 4 — Metas
// ═══════════════════════════════════════════════════════════════════════════════

section('🎯 FASE 4 — Metas CRUD, Aportaciones & Progreso circular');

const mid = uid();
const fechaFutura = new Date(); fechaFutura.setFullYear(fechaFutura.getFullYear() + 1);
const fechaStr = fechaFutura.toISOString().slice(0, 10);

// Create
db.prepare(`INSERT INTO metas (id, nombre, objetivo, fecha_objetivo, icono, color)
  VALUES (?, ?, ?, ?, ?, ?)`).run(mid, '[TEST] Fondo emergencia', 5000, fechaStr, '🏦', '#7db88f');
const meta = db.prepare(`SELECT * FROM metas WHERE id = ?`).get(mid);
assert(meta !== undefined,                   'Meta creada en BD');
assert(meta.nombre === '[TEST] Fondo emergencia', `Nombre correcto (got "${meta.nombre}")`);
assert(meta.objetivo === 5000,              `Objetivo = 5000 (got ${meta.objetivo})`);
assert(meta.aportado === 0,                `Aportado inicial = 0 (got ${meta.aportado})`);
assert(meta.icono === '🏦',                `Icono correcto (got "${meta.icono}")`);
assert(meta.color === '#7db88f',           `Color correcto (got "${meta.color}")`);
assert(meta.fecha_objetivo === fechaStr,   `Fecha objetivo guardada (got "${meta.fecha_objetivo}")`);

// Add contribution
db.prepare(`UPDATE metas SET aportado = MIN(objetivo, aportado + ?) WHERE id = ?`).run(1500, mid);
const m1 = db.prepare(`SELECT aportado FROM metas WHERE id = ?`).get(mid);
assert(m1.aportado === 1500,               `Aportación 1: aportado = 1500 (got ${m1.aportado})`);

// Second contribution
db.prepare(`UPDATE metas SET aportado = MIN(objetivo, aportado + ?) WHERE id = ?`).run(2000, mid);
const m2 = db.prepare(`SELECT aportado FROM metas WHERE id = ?`).get(mid);
assert(m2.aportado === 3500,               `Aportación 2: aportado = 3500 (got ${m2.aportado})`);

// Porcentaje
const pctMeta = (m2.aportado / 5000) * 100;
assert(Math.abs(pctMeta - 70) < 0.01,     `Porcentaje = 70% (got ${pctMeta.toFixed(1)}%)`);

// Cap at objetivo
db.prepare(`UPDATE metas SET aportado = MIN(objetivo, aportado + ?) WHERE id = ?`).run(99999, mid);
const mCap = db.prepare(`SELECT aportado FROM metas WHERE id = ?`).get(mid);
assert(mCap.aportado === 5000,             `Cap: aportado nunca supera objetivo (got ${mCap.aportado})`);
assert((mCap.aportado / 5000) * 100 === 100, 'Porcentaje = 100% al completar');

// Days remaining
const diasRestantes = Math.ceil((fechaFutura.getTime() - Date.now()) / 86_400_000);
assert(diasRestantes > 300,                `Días restantes > 300 (got ${diasRestantes})`);

// Days overdue (test with past date)
const ayer = new Date(); ayer.setDate(ayer.getDate() - 10);
const diasVencido = Math.ceil((ayer.getTime() - Date.now()) / 86_400_000);
assert(diasVencido < 0,                    `Días vencidos es negativo (got ${diasVencido})`);

// Circular SVG progress math
const radius = 31, circ = 2 * Math.PI * radius;
const offset = circ - Math.min(pctMeta / 100, 1) * circ;
assert(offset >= 0 && offset <= circ,      `SVG strokeDashoffset en rango [0, circumference] (got ${offset.toFixed(1)})`);
assert(circ - offset > 0,                  `SVG arco visible > 0`);

// Delete
db.prepare(`DELETE FROM metas WHERE id = ?`).run(mid);
assert(!db.prepare(`SELECT id FROM metas WHERE id = ?`).get(mid), 'Meta eliminada correctamente');

// ─── Cleanup test transactions ────────────────────────────────────────────────

db.prepare(`DELETE FROM transacciones WHERE id IN (?, ?, ?)`).run(id1, id2, id3);

// ─── Summary ──────────────────────────────────────────────────────────────────

const total = passed + failed;
console.log(`\n${'═'.repeat(50)}`);
console.log(`Resultado: ${total} pruebas | ✅ ${passed} OK | ${failed > 0 ? '❌' : '✅'} ${failed} FAIL`);
console.log('═'.repeat(50));
if (failed > 0) {
  console.error(`\n⛔ ${failed} prueba(s) fallaron. Revisar los errores arriba.\n`);
  process.exit(1);
} else {
  console.log('\n🎉 ¡Todas las pruebas pasaron correctamente!\n');
}
