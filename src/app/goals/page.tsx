import { Suspense } from 'react';
import { Target } from 'lucide-react';
import { getGoals } from './actions';
import { GoalCard } from '@/components/goals/GoalCard';
import { GoalForm } from '@/components/goals/GoalForm';

// ─── Goals content ────────────────────────────────────────────────────────────

async function GoalsContent() {
  const goals = await getGoals();

  if (goals.length === 0) {
    return (
      <div className="card flex flex-col items-center justify-center py-20 gap-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[rgba(125,184,143,0.1)] border border-[rgba(125,184,143,0.2)] flex items-center justify-center">
          <Target className="w-7 h-7 text-[#7db88f]" />
        </div>
        <div>
          <p className="text-[#f0ece4] font-medium mb-1">Sin metas</p>
          <p className="text-[#5a5f75] text-sm max-w-xs">
            Crea tu primera meta de ahorro con el formulario y empieza a hacer seguimiento de tu progreso.
          </p>
        </div>
      </div>
    );
  }

  const completed  = goals.filter((g) => g.porcentaje >= 100);
  const inProgress = goals.filter((g) => g.porcentaje < 100);

  const totalObjetivo = goals.reduce((s, g) => s + g.objetivo, 0);
  const totalAportado = goals.reduce((s, g) => s + g.aportado, 0);

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="card px-5 py-4 flex flex-wrap gap-6">
        <div>
          <p className="section-label">Total objetivos</p>
          <p className="font-editorial text-xl text-[#f0ece4] tabular-nums">{fmt(totalObjetivo)}</p>
        </div>
        <div>
          <p className="section-label">Total aportado</p>
          <p className="font-editorial text-xl text-[#7db88f] tabular-nums">{fmt(totalAportado)}</p>
        </div>
        <div>
          <p className="section-label">Metas completadas</p>
          <p className="font-editorial text-xl text-[#9b8ec4]">
            {completed.length} / {goals.length}
          </p>
        </div>
      </div>

      {/* In progress */}
      {inProgress.length > 0 && (
        <div>
          <p className="section-label mb-3">En progreso</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {inProgress.map((g, i) => (
              <div key={g.id} className="animate-fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
                <GoalCard goal={g} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <div>
          <p className="section-label mb-3">Completadas ✓</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 opacity-75">
            {completed.map((g, i) => (
              <div key={g.id} className="animate-fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
                <GoalCard goal={g} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GoalsPage() {
  return (
    <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
      <header className="mb-6">
        <h1 className="font-editorial text-xl text-[#f0ece4] tracking-tight">Metas de Ahorro</h1>
        <p className="text-[#5a5f75] text-xs mt-0.5">Establece objetivos financieros y haz seguimiento</p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-[300px_1fr] gap-5">
        <aside className="xl:self-start xl:sticky xl:top-6">
          <GoalForm />
        </aside>

        <Suspense
          fallback={
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => <div key={i} className="card h-52 animate-pulse" />)}
            </div>
          }
        >
          <GoalsContent />
        </Suspense>
      </div>
    </main>
  );
}
