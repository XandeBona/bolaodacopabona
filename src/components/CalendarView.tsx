'use client'

import { useMemo, useState, useEffect } from 'react'
import { Calendar, Clock, MapPin, Radio, Eye, X, ChevronDown } from 'lucide-react'
import type { Jogo, Resultado, Palpite } from '@/types'
import { getFaseLabel, FASES_ORDER } from '@/lib/excel-parser'
import { calcularPontos } from '@/types'
import { GRUPOS } from '@/lib/grupos'
import { TeamWithFlag } from '@/lib/countryFlags'
import { ScoreBadge } from '@/components/ScoreBadge'
import clsx from 'clsx'

const PLAYOFF_GAMES: Record<string, number> = {
  Rodada_32: 16,
  Oitavas: 8,
  Quartas: 4,
  Semi: 2,
  Disputa_Terceiro: 1,
  Final: 1,
}

function formatDateTime(iso: string | null): { date: string; time: string } | null {
  if (!iso) return null
  const d = new Date(iso)
  return {
    date: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    time: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
  }
}

function PalpitesModal({
  jogoNumero,
  pais_a,
  pais_b,
  palpites,
  resultado,
  isLive,
  liveScore,
  onClose,
}: {
  jogoNumero: number
  pais_a: string | null
  pais_b: string | null
  palpites: Palpite[]
  resultado?: Resultado
  isLive?: boolean
  liveScore?: { gol_a: number; gol_b: number; minuto: number } | null
  onClose: () => void
}) {
  const palpitesDoJogo = palpites.filter((p) => p.jogo_numero === jogoNumero)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      onClick={onClose}
    >
      <div
        className="bg-stone-900 border border-stone-700 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-stone-800 sticky top-0 bg-stone-900 rounded-t-2xl z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white font-bold">Jogo #{jogoNumero}</span>
            {pais_a && pais_b && (
              <div className="flex items-center gap-2">
                <span className="text-stone-400">—</span>
                <TeamWithFlag name={pais_a} />
                <span className="text-stone-500 text-sm">×</span>
                <TeamWithFlag name={pais_b} />
              </div>
            )}
            {isLive && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-950/60 border border-red-800/50 px-1.5 py-0.5 rounded animate-pulse">
                <Radio size={8} />
                AO VIVO
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-500 hover:text-white hover:bg-stone-800 transition-colors shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {(isLive || resultado) && (
          <div className={clsx('text-center py-3 border-b border-stone-800', isLive ? 'bg-red-950/20' : 'bg-emerald-950/10')}>
            {isLive && liveScore ? (
              <span className="text-red-400 font-mono font-black text-2xl animate-pulse">
                {liveScore.gol_a} × {liveScore.gol_b}
              </span>
            ) : resultado ? (
              <span className="text-emerald-400 font-mono font-bold text-xl">
                {resultado.gol_a} × {resultado.gol_b}
                {resultado.penalti_a != null && (
                  <span className="text-stone-500 text-sm font-normal ml-2">
                    (pên: {resultado.penalti_a} × {resultado.penalti_b})
                  </span>
                )}
              </span>
            ) : null}
          </div>
        )}

        <div className="p-5">
          {palpitesDoJogo.length === 0 ? (
            <p className="text-center text-stone-500 py-8">Nenhum palpite cadastrado para este jogo.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {palpitesDoJogo
                .sort((a, b) => {
                  const pa = resultado ? calcularPontos(a, resultado) ?? 0 : 0
                  const pb = resultado ? calcularPontos(b, resultado) ?? 0 : 0
                  return pb - pa
                })
                .map((p) => {
                  const pontos = resultado ? calcularPontos(p, resultado) : null
                  return (
                    <div
                      key={p.nome_participante}
                      className={clsx(
                        'flex items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-all',
                        pontos === 10 ? 'bg-amber-950/20 border-amber-500/30' :
                          pontos !== null && pontos >= 5 ? 'bg-emerald-950/10 border-emerald-500/20' :
                            'bg-stone-800/50 border-stone-700/50'
                      )}
                    >
                      <span className="text-sm font-semibold text-white truncate">{p.nome_participante}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono font-black text-white text-sm">
                          {p.gol_a} × {p.gol_b}
                        </span>
                        {p.penalti_a != null && (
                          <span className="text-stone-500 text-xs">(pên: {p.penalti_a}×{p.penalti_b})</span>
                        )}
                        <ScoreBadge pontos={pontos} size="sm" />
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function CalendarView({
  jogos,
  resultados,
  palpites,
}: {
  jogos: Jogo[]
  resultados: Resultado[]
  palpites: Palpite[]
}) {
  const [liveScores, setLiveScores] = useState<Map<number, { gol_a: number; gol_b: number; minuto: number }>>(new Map())
  const [liveGameNumeros, setLiveGameNumeros] = useState<Set<number>>(new Set())
  const [modalJogo, setModalJogo] = useState<number | null>(null)
  const [mostrarTodos, setMostrarTodos] = useState(false)

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch('/api/live')
        const data = await res.json()
        if (data.live) {
          const map = new Map<number, { gol_a: number; gol_b: number; minuto: number }>()
          const set = new Set<number>()
          for (const g of data.live) {
            set.add(g.jogo_numero)
            map.set(g.jogo_numero, { gol_a: g.gol_a, gol_b: g.gol_b, minuto: g.minuto })
          }
          setLiveScores(map)
          setLiveGameNumeros(set)
        }
      } catch { }
    }
    poll()
    const interval = setInterval(poll, 10000)
    return () => clearInterval(interval)
  }, [])

  const resultadoMap = useMemo(
    () => new Map(resultados.map((r) => [r.jogo_numero, r])),
    [resultados]
  )

  const dbJogoMap = useMemo(
    () => new Map(jogos.map((j) => [j.jogo_numero, j])),
    [jogos]
  )

  const maxDbJogo = jogos.length > 0 ? Math.max(...jogos.map((j) => j.jogo_numero)) : 0

  const phases = useMemo(() => {
    const allPhases = new Map<string, { jogo_numero: number; fase: string }[]>()
    const dbByFase = new Map<string, Jogo[]>()
    for (const j of jogos) {
      if (!dbByFase.has(j.fase)) dbByFase.set(j.fase, [])
      dbByFase.get(j.fase)!.push(j)
    }
    for (const [fase, games] of dbByFase) allPhases.set(fase, games)
    let nextNum = Math.max(maxDbJogo + 1, 73)
    for (const [fase, count] of Object.entries(PLAYOFF_GAMES)) {
      if (allPhases.has(fase)) continue
      const placeholders: { jogo_numero: number; fase: string }[] = []
      for (let i = 0; i < count; i++) placeholders.push({ jogo_numero: nextNum + i, fase })
      nextNum += count
      allPhases.set(fase, placeholders)
    }
    return Array.from(allPhases.entries()).sort(
      (a, b) => (FASES_ORDER[a[0]] ?? 99) - (FASES_ORDER[b[0]] ?? 99)
    )
  }, [jogos, maxDbJogo])

  const groupGamesSorted = useMemo(() => {
    return jogos
      .filter((j) => j.fase === 'Grupos')
      .sort((a, b) => {
        if (!a.data_hora) return 1
        if (!b.data_hora) return -1
        return new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime()
      })
  }, [jogos])

  function dateKey(iso: string): string {
    const d = new Date(iso)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  const now = new Date()

  const gamesByDate = useMemo(() => {
    const map = new Map<string, { label: string; games: Jogo[] }>()
    for (const j of groupGamesSorted) {
      const key = j.data_hora ? dateKey(j.data_hora) : 'sem-data'
      if (!map.has(key)) {
        const d = j.data_hora ? new Date(j.data_hora) : null
        const label = d
          ? d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
          : 'Sem data'
        map.set(key, { label, games: [] })
      }
      map.get(key)!.games.push(j)
    }
    return Array.from(map.entries())
      .filter(([k]) => k !== 'sem-data')
      .sort(([a], [b]) => a.localeCompare(b))
      .concat(Array.from(map.entries()).filter(([k]) => k === 'sem-data'))
  }, [groupGamesSorted])

  // Separa dias passados dos futuros
  const { pastDates, futureDates } = useMemo(() => {
    const past: typeof gamesByDate = []
    const future: typeof gamesByDate = []
    for (const entry of gamesByDate) {
      const [key] = entry
      if (key === 'sem-data') {
        future.push(entry)
        continue
      }
      // Considera passado se todos os jogos do dia já têm data no passado
      const allPast = entry[1].games.every((j) => {
        if (!j.data_hora) return false
        return new Date(j.data_hora).getTime() < now.getTime()
      })
      if (allPast) past.push(entry)
      else future.push(entry)
    }
    return { pastDates: past, futureDates: future }
  }, [gamesByDate, now])

  const nextGameNum = useMemo(() => {
    for (const j of groupGamesSorted) {
      if (!j.data_hora) continue
      if (new Date(j.data_hora) > now && !resultadoMap.has(j.jogo_numero)) return j.jogo_numero
    }
    return null
  }, [groupGamesSorted, resultadoMap])

  const modalJogoData = modalJogo !== null ? dbJogoMap.get(modalJogo) : null
  const modalResultado = modalJogo !== null ? resultadoMap.get(modalJogo) : undefined
  const modalLive = modalJogo !== null ? liveScores.get(modalJogo) : undefined

  function renderDayGroup(entry: (typeof gamesByDate)[0]) {
    const [, { label, games: dayGames }] = entry
    return (
      <div key={label}>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-sm font-bold text-stone-300 uppercase tracking-wider">{label}</span>
          <div className="flex-1 h-px bg-stone-800" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {dayGames.map((jogo) => {
            const dt = formatDateTime(jogo.data_hora)
            const resultado = resultadoMap.get(jogo.jogo_numero)
            const live = liveScores.get(jogo.jogo_numero)
            return (
              <GameCard
                key={jogo.jogo_numero}
                jogo_numero={jogo.jogo_numero}
                fase={jogo.fase}
                grupo={jogo.grupo}
                pais_a={jogo.pais_a}
                pais_b={jogo.pais_b}
                dt={dt}
                estadio={jogo.estadio}
                resultado={live ? undefined : resultado}
                isNext={jogo.jogo_numero === nextGameNum}
                liveScore={live ?? null}
                onVerPalpites={() => setModalJogo(jogo.jogo_numero)}
              />
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {modalJogo !== null && (
        <PalpitesModal
          jogoNumero={modalJogo}
          pais_a={modalJogoData?.pais_a ?? null}
          pais_b={modalJogoData?.pais_b ?? null}
          palpites={palpites}
          resultado={modalResultado}
          isLive={liveGameNumeros.has(modalJogo)}
          liveScore={modalLive ?? null}
          onClose={() => setModalJogo(null)}
        />
      )}

      {phases.map(([fase, games]) => {
        if (fase === 'Grupos') {
          return (
            <div key={fase}>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-lg font-bold text-white">Fase de Grupos</h2>
                <div className="flex-1 h-px bg-stone-800" />
                <span className="text-xs text-stone-500">{games.length} jogos</span>
              </div>

              {gamesByDate.length === 0 ? (
                <div className="text-center py-12 text-stone-500">
                  <p className="text-3xl mb-2">📅</p>
                  <p className="text-sm">Nenhum jogo cadastrado. Faça o upload da primeira planilha.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Jogos passados */}
                  {pastDates.length > 0 && (
                    <div>
                      <button
                        onClick={() => setMostrarTodos((v) => !v)}
                        className="flex items-center gap-2 text-xs text-stone-500 hover:text-stone-300 transition-colors mb-4"
                      >
                        <ChevronDown
                          size={14}
                          className={clsx('transition-transform', mostrarTodos && 'rotate-180')}
                        />
                        {mostrarTodos
                          ? 'Ocultar jogos anteriores'
                          : `Mostrar ${pastDates.reduce((acc, [, { games: g }]) => acc + g.length, 0)} jogos anteriores`}
                      </button>
                      {mostrarTodos && (
                        <div className="space-y-6 opacity-60">
                          {pastDates.map((entry) => renderDayGroup(entry))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Jogos futuros e de hoje */}
                  <div className="space-y-6">
                    {futureDates.map((entry) => renderDayGroup(entry))}
                  </div>
                </div>
              )}
            </div>
          )
        }

        const resolvedGames = games.map((g) => ({ ...g, db: dbJogoMap.get(g.jogo_numero) }))

        return (
          <div key={fase}>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-lg font-bold text-white">{getFaseLabel(fase)}</h2>
              <div className="flex-1 h-px bg-stone-800" />
              <span className="text-xs text-stone-500">{games.length} jogos</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {resolvedGames.map((g) => {
                const resultado = resultadoMap.get(g.jogo_numero)
                const dt = g.db ? formatDateTime(g.db.data_hora) : null
                const live = liveScores.get(g.jogo_numero)
                return (
                  <GameCard
                    key={g.jogo_numero}
                    jogo_numero={g.jogo_numero}
                    fase={g.fase}
                    pais_a={g.db?.pais_a ?? null}
                    pais_b={g.db?.pais_b ?? null}
                    dt={dt}
                    estadio={g.db?.estadio ?? null}
                    resultado={live ? undefined : resultado}
                    placeholder={!g.db}
                    liveScore={live ?? null}
                    onVerPalpites={() => setModalJogo(g.jogo_numero)}
                  />
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function GameCard({
  jogo_numero,
  fase,
  grupo,
  pais_a,
  pais_b,
  dt,
  estadio,
  resultado,
  placeholder,
  isNext,
  liveScore,
  onVerPalpites,
}: {
  jogo_numero: number
  fase: string
  grupo?: string | null
  pais_a: string | null
  pais_b: string | null
  dt: { date: string; time: string } | null
  estadio: string | null
  resultado: Resultado | undefined
  placeholder?: boolean
  isNext?: boolean
  liveScore?: { gol_a: number; gol_b: number; minuto: number } | null
  onVerPalpites: () => void
}) {
  const isLive = !!liveScore

  return (
    <div
      className={clsx(
        'bg-stone-900 border rounded-xl p-4 transition-all flex flex-col',
        resultado && !isLive ? 'border-emerald-500/20' : 'border-stone-800',
        isLive && 'border-red-500/40 ring-1 ring-red-500/20',
        isNext && !resultado && !isLive && 'border-amber-500/40 ring-1 ring-amber-500/20'
      )}
    >
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="text-xs font-mono text-stone-500 bg-stone-800 px-2 py-0.5 rounded">
          #{jogo_numero}
        </span>
        {grupo && <span className="text-xs text-stone-600">Grupo {grupo}</span>}
        {isLive && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-950/60 border border-red-800/50 px-1.5 py-0.5 rounded animate-pulse">
            <Radio size={8} className="animate-ping" />
            AO VIVO
          </span>
        )}
        {isNext && !resultado && !isLive && (
          <span className="text-[10px] font-bold text-amber-400 bg-amber-950/60 border border-amber-800/50 px-1.5 py-0.5 rounded">
            PRÓXIMO
          </span>
        )}
      </div>

      {placeholder || !pais_a || !pais_b ? (
        <div className="text-center py-3 flex-1">
          <span className="text-stone-600 text-sm">A definir</span>
        </div>
      ) : (
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <TeamWithFlag name={pais_a} />
            </div>
            <span className="text-stone-600 text-xs shrink-0">vs</span>
            <div className="flex items-center gap-1.5 min-w-0 justify-end">
              <TeamWithFlag name={pais_b} />
            </div>
          </div>

          <div className="flex flex-col gap-1 text-xs text-stone-500">
            {dt && !isLive && (
              <div className="flex items-center gap-1.5">
                <Calendar size={10} />
                <span>{dt.date}</span>
                <Clock size={10} className="ml-1" />
                <span>{dt.time}</span>
              </div>
            )}
            {estadio && !isLive && (
              <div className="flex items-center gap-1.5">
                <MapPin size={10} />
                <span className="truncate">{estadio}</span>
              </div>
            )}
            {isLive && (
              <div className="flex items-center gap-1.5 text-red-400">
                <Radio size={10} />
                <span>{liveScore!.minuto}&apos;</span>
              </div>
            )}
          </div>
        </div>
      )}

      {resultado && !isLive && (
        <div className="mt-3 pt-3 border-t border-stone-800 text-center">
          <span className="text-emerald-400 font-mono font-bold text-lg">
            {resultado.gol_a} × {resultado.gol_b}
          </span>
          {resultado.penalti_a != null && (
            <span className="text-stone-500 text-xs ml-2">
              (pên: {resultado.penalti_a} × {resultado.penalti_b})
            </span>
          )}
        </div>
      )}

      {isLive && (
        <div className="mt-3 pt-3 border-t border-red-800 text-center">
          <span className="text-red-400 font-mono font-bold text-2xl animate-pulse">
            {liveScore!.gol_a} × {liveScore!.gol_b}
          </span>
        </div>
      )}

      {!placeholder && pais_a && pais_b && (
        <button
          onClick={onVerPalpites}
          className="mt-3 pt-3 border-t border-stone-800 w-full flex items-center justify-center gap-1.5 text-xs text-stone-500 hover:text-emerald-400 transition-colors"
        >
          <Eye size={12} />
          Ver palpites
        </button>
      )}
    </div>
  )
}