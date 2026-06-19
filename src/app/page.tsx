'use client'

import { TeamWithFlag, FlagOnly } from '@/lib/countryFlags'
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Trophy } from 'lucide-react'
import type { Palpite, Resultado, ParticipanteRanking, Jogo } from '@/types'
import { FASES_ORDER } from '@/lib/excel-parser'
import { RankingTable } from '@/components/RankingTable'
import { CalendarView } from '@/components/CalendarView'
import clsx from 'clsx'

type Tab = 'ranking' | 'palpites' | 'copa2022' | 'copa2026'

export default function Home() {
  const [tab, setTab] = useState<Tab>('ranking')
  const [palpites, setPalpites] = useState<Palpite[]>([])
  const [resultados, setResultados] = useState<Resultado[]>([])
  const [ranking, setRanking] = useState<ParticipanteRanking[]>([])
  const [jogos, setJogos] = useState<Jogo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [positionChanges, setPositionChanges] = useState<Record<string, number>>({})
  const prevRankingRef = useRef<ParticipanteRanking[]>([])

  const fetchData = useCallback(async (isInitial = false) => {
    try {
      const [palpitesRes, jogosRes] = await Promise.all([
        fetch('/api/palpites').then((r) => r.json()),
        fetch('/api/jogos').then((r) => r.json()),
      ])
      if (palpitesRes.error) throw new Error(palpitesRes.error)
      const oldRanking = isInitial ? [] : prevRankingRef.current
      setPalpites(palpitesRes.palpites)
      setResultados(palpitesRes.resultados)
      setJogos(jogosRes)
      setRanking(palpitesRes.ranking)
      prevRankingRef.current = palpitesRes.ranking
      if (!isInitial && oldRanking.length > 0) {
        const changes: Record<string, number> = {}
        const oldPos = new Map(oldRanking.map((r, i) => [r.nome, i]))
        for (let i = 0; i < palpitesRes.ranking.length; i++) {
          const nome = palpitesRes.ranking[i].nome
          const oldIdx = oldPos.get(nome)
          if (oldIdx !== undefined && oldIdx !== i) {
            changes[nome] = oldIdx - i
          }
        }
        setPositionChanges(changes)
        setTimeout(() => setPositionChanges({}), 5000)
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      if (isInitial) setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData(true)
  }, [fetchData])

  useEffect(() => {
    const checkLive = async () => {
      try {
        const res = await fetch('/api/live')
        const data = await res.json()
        if (data.em_andamento > 0) fetchData()
      } catch { }
    }
    const interval = setInterval(checkLive, 15000)
    return () => clearInterval(interval)
  }, [fetchData])

  const resultadoMap = useMemo(
    () => new Map(resultados.map((r) => [r.jogo_numero, r])),
    [resultados]
  )

  const participantes = useMemo(
    () => [...new Set(palpites.map((p) => p.nome_participante))].sort(),
    [palpites]
  )

  const jogosConcluidos = resultados.length
  const totalJogos = palpites.length > 0 ? Math.max(...palpites.map((p) => p.jogo_numero)) : 0

  return (
    <div className="min-h-screen">
      <header className="ocean-header border-b border-stone-800/50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-3xl">🏆</span>
                <h1 className="text-2xl font-black tracking-tight text-white">
                  Bolão Copa do Mundo
                </h1>
              </div>
              <p className="text-stone-400 text-sm ml-12">
                Acompanhe palpites e pontuação em tempo real
              </p>
            </div>
            <div className="flex gap-3 text-center">
              <div className="bg-stone-900/60 border border-stone-800 rounded-xl px-4 py-2">
                <p className="text-2xl font-black text-emerald-400 font-mono">{jogosConcluidos}</p>
                <p className="text-xs text-stone-500">com resultado</p>
              </div>
              <div className="bg-stone-900/60 border border-stone-800 rounded-xl px-4 py-2">
                <p className="text-2xl font-black text-white font-mono">{totalJogos}</p>
                <p className="text-xs text-stone-500">total jogos</p>
              </div>
              <div className="bg-stone-900/60 border border-stone-800 rounded-xl px-4 py-2">
                <p className="text-2xl font-black text-amber-400 font-mono">{participantes.length}</p>
                <p className="text-xs text-stone-500">participantes</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-1 bg-stone-900 border border-stone-800 rounded-xl p-1 mb-6 w-fit">
          {(['ranking', 'palpites', 'copa2022', 'copa2026'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={clsx(
                'px-5 py-2 rounded-lg text-sm font-semibold transition-all',
                tab === t ? 'bg-blue-600 text-white shadow' : 'text-stone-400 hover:text-white'
              )}
            >
              {t === 'ranking' ? '🏅 Ranking'
                : t === 'palpites' ? '📋 Palpites'
                  : t === 'copa2022' ? <img src="/2022.png" alt="Copa 2022" className="w-10 h-10 rounded object-cover" />
                    : <img src="/2026.png" alt="Copa 2026" className="w-10 h-10 rounded object-cover" />
              }
            </button>
          ))}
        </div>

        {loading && (
          <div className="text-center py-20 text-stone-500">
            <div className="text-4xl mb-4 animate-bounce">⚽</div>
            <p>Carregando dados...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-950/50 border border-red-800 rounded-xl p-6 text-center">
            <p className="text-red-400 font-medium">{error}</p>
            <p className="text-stone-500 text-sm mt-2">Verifique a configuração do Supabase.</p>
          </div>
        )}

        {!loading && !error && (
          <>
            {tab === 'ranking' && (
              <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6">
                <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <Trophy className="text-amber-400" size={20} />
                  Classificação Geral
                </h2>
                <RankingTable ranking={ranking} positionChanges={positionChanges} />
              </div>
            )}

            {tab === 'palpites' && (
              <CalendarView
                jogos={jogos}
                resultados={resultados}
                palpites={palpites}
              />
            )}

            {tab === 'copa2022' && (
              <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6">
                <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                  Copa do Mundo 2022
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-stone-500 uppercase tracking-wider">
                        <th className="text-left pb-3 pr-4 font-medium">#</th>
                        <th className="text-left pb-3 pr-4 font-medium">Participante</th>
                        <th className="text-right pb-3 pr-4 font-medium">Pontos</th>
                        <th className="text-right pb-3 font-medium">País Campeão</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-800/50">
                      {[
                        { pos: '🥇', nome: 'Natalia', pontos: 333, pais: 'Brasil' },
                        { pos: '🥈', nome: 'Gilmar', pontos: 289, pais: 'França' },
                        { pos: '🥉', nome: 'Rafael', pontos: 283, pais: 'Alemanha' },
                        { pos: '4', nome: 'Fabiane', pontos: 262, pais: 'Alemanha' },
                        { pos: '5', nome: 'Neusa', pontos: 260, pais: 'Brasil' },
                        { pos: '6', nome: 'Blandino', pontos: 244, pais: 'Portugal' },
                        { pos: '7', nome: 'Alexandre', pontos: 240, pais: 'Brasil' },
                      ].map((row, i) => (
                        <tr key={i} className={clsx('group transition-colors', i === 0 && 'bg-amber-500/5', i > 0 && 'hover:bg-stone-800/40')}>
                          <td className="py-3 pr-4 text-stone-500 font-mono font-bold w-8">{row.pos}</td>
                          <td className="py-3 pr-4">
                            <p className={clsx('font-semibold', i === 0 ? 'text-amber-300' : 'text-white')}>{row.nome}</p>
                          </td>
                          <td className="py-3 pr-4 text-right">
                            <span className={clsx('font-mono font-black text-lg', i === 0 ? 'text-amber-300' : 'text-white')}>{row.pontos}</span>
                          </td>
                          <td className="py-3 text-right">
                            <FlagOnly name={row.pais} className="justify-end text-stone-300" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-stone-700">
                        <td colSpan={4} className="py-4 text-center font-bold text-white text-base">
                          🏆 Campeão: <FlagOnly name="Argentina" className="inline-flex text-stone-400 font-normal ml-2" />
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {tab === 'copa2026' && (
              <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6">
                <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                  Copa do Mundo 2026
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-stone-500 uppercase tracking-wider">
                        <th className="text-left pb-3 pr-4 font-medium">#</th>
                        <th className="text-left pb-3 pr-4 font-medium">Participante</th>
                        <th className="text-right pb-3 pr-4 font-medium">Pontos</th>
                        <th className="text-right pb-3 font-medium">País Campeão</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-800/50">
                      {[
                        { pos: '🥇', nome: 'Natalia', pontos: '⏳', pais: 'Argentina' },
                        { pos: '🥈', nome: 'Gilmar', pontos: '⏳', pais: 'Espanha' },
                        { pos: '🥉', nome: 'Rafael', pontos: '⏳', pais: 'Portugal' },
                        { pos: '4', nome: 'Fabiane', pontos: '⏳', pais: 'Alemanha' },
                        { pos: '5', nome: 'Neusa', pontos: '⏳', pais: 'Espanha' },
                        { pos: '6', nome: 'Blandino', pontos: '⏳', pais: 'Portugal' },
                        { pos: '7', nome: 'Alexandre', pontos: '⏳', pais: 'França' },
                      ].map((row, i) => (
                        <tr key={i} className={clsx('group transition-colors', i === 0 && 'bg-amber-500/5', i > 0 && 'hover:bg-stone-800/40')}>
                          <td className="py-3 pr-4 text-stone-500 font-mono font-bold w-8">{row.pos}</td>
                          <td className="py-3 pr-4">
                            <p className={clsx('font-semibold', i === 0 ? 'text-amber-300' : 'text-white')}>{row.nome}</p>
                          </td>
                          <td className="py-3 pr-4 text-right">
                            <span className={clsx('font-mono font-black text-lg', i === 0 ? 'text-amber-300' : 'text-white')}>{row.pontos}</span>
                          </td>
                          <td className="py-3 text-right">
                            <FlagOnly name={row.pais} className="justify-end text-stone-300" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-stone-700">
                        <td colSpan={4} className="py-4 text-center font-bold text-white text-base">
                          🏆 Campeão: <span className="text-stone-400 font-normal ml-2">⏳</span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            <footer className="border-t border-stone-800 mt-16 py-6 text-center text-xs text-stone-600">
              <div className="flex items-center justify-center gap-4">
                <a href="/admin" className="hover:text-stone-400 transition-colors">Área Admin</a>
                <span className="text-stone-700">|</span>
                <a href="/tc" className="hover:text-stone-400 transition-colors">TC</a>
              </div>
            </footer>
          </>
        )}
      </div>
    </div>
  )
}