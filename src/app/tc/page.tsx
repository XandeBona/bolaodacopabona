'use client'

import { FlagOnly } from '@/lib/countryFlags'
import { useState, useEffect, useCallback } from 'react'
import type { Palpite, Resultado, ParticipanteRanking, Jogo } from '@/types'
import clsx from 'clsx'

type Tab = 'copa2022' | 'copa2026'

export default function Home() {
    const [tab, setTab] = useState<Tab>('copa2022')
    const [palpites, setPalpites] = useState<Palpite[]>([])
    const [resultados, setResultados] = useState<Resultado[]>([])
    const [ranking, setRanking] = useState<ParticipanteRanking[]>([])
    const [jogos, setJogos] = useState<Jogo[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchData = useCallback(async (isInitial = false) => {
        try {
            const [palpitesRes, jogosRes] = await Promise.all([
                fetch('/api/palpites').then((r) => r.json()),
                fetch('/api/jogos').then((r) => r.json()),
            ])
            if (palpitesRes.error) throw new Error(palpitesRes.error)
            setPalpites(palpitesRes.palpites)
            setResultados(palpitesRes.resultados)
            setJogos(jogosRes)
            setRanking(palpitesRes.ranking)
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
                if (data.em_andamento > 0) {
                    fetchData()
                }
            } catch { }
        }
        const interval = setInterval(checkLive, 15000)
        return () => clearInterval(interval)
    }, [fetchData])

    const participantes = [...new Set(palpites.map((p) => p.nome_participante))].sort()
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
                                    Ranking The Chatubas
                                </h1>
                            </div>
                            <p className="text-stone-400 text-sm ml-12">
                                Histórico de Bolões
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-4 py-6">
                <div className="flex gap-1 bg-stone-900 border border-stone-800 rounded-xl p-1 mb-6 w-fit">
                    {(['copa2022', 'copa2026'] as Tab[]).map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={clsx(
                                'px-5 py-2 rounded-lg text-sm font-semibold transition-all',
                                tab === t ? 'bg-blue-600 text-white shadow' : 'text-stone-400 hover:text-white'
                            )}
                        >
                            {t === 'copa2022' ? (
                                <img src="/2022.png" alt="Copa 2022" className="w-10 h-10 rounded object-cover" />
                            ) : (
                                <img src="/2026.png" alt="Copa 2026" className="w-10 h-10 rounded object-cover" />
                            )}</button>
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
                                                { pos: '🥇', nome: 'Giovanella', pontos: 295, pais: 'Brasil' },
                                                { pos: '🥈', nome: 'Tesoro', pontos: 248, pais: 'Brasil' },
                                                { pos: '🥉', nome: 'Xande', pontos: 240, pais: 'Brasil' },
                                                { pos: '4', nome: 'Caio', pontos: 216, pais: 'Brasil' },
                                                { pos: '5', nome: 'Matheus', pontos: 184, pais: 'Brasil' },
                                            ].map((row, i) => (
                                                <tr
                                                    key={i}
                                                    className={clsx(
                                                        'group transition-colors',
                                                        i === 0 && 'bg-amber-500/5',
                                                        i > 0 && 'hover:bg-stone-800/40'
                                                    )}
                                                >
                                                    <td className="py-3 pr-4 text-stone-500 font-mono font-bold w-8">{row.pos}</td>
                                                    <td className="py-3 pr-4">
                                                        <p className={clsx('font-semibold', i === 0 ? 'text-amber-300' : 'text-white')}>
                                                            {row.nome}
                                                        </p>
                                                    </td>
                                                    <td className="py-3 pr-4 text-right">
                                                        <span className={clsx('font-mono font-black text-lg', i === 0 ? 'text-amber-300' : 'text-white')}>
                                                            {row.pontos}
                                                        </span>
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
                                                { pos: '🥇', nome: 'Alexandre', pontos: '⏳', pais: 'França' },
                                                { pos: '🥈', nome: 'Caio', pontos: '⏳', pais: 'Brasil' },
                                                { pos: '🥉', nome: 'Carlos', pontos: '⏳', pais: 'Brasil' },
                                                { pos: '4', nome: 'Cristian', pontos: '⏳', pais: 'Brasil' },
                                                { pos: '5', nome: 'Felipe', pontos: '⏳', pais: 'Brasil' },
                                                { pos: '6', nome: 'Geovani', pontos: '⏳', pais: 'França' },
                                                { pos: '7', nome: 'Giovanella', pontos: '⏳', pais: 'Espanha' },
                                                { pos: '8', nome: 'Groto', pontos: '⏳', pais: 'Brasil' },
                                                { pos: '9', nome: 'Tiso', pontos: '⏳', pais: 'Brasil' },
                                                { pos: '10', nome: 'Klitzke', pontos: '⏳', pais: 'Brasil' },
                                                { pos: '11', nome: 'Kopsch', pontos: '⏳', pais: 'França' },
                                                { pos: '12', nome: 'Luizinho', pontos: '⏳', pais: 'Brasil' },
                                                { pos: '13', nome: 'Matheus', pontos: '⏳', pais: 'Brasil' },
                                                { pos: '14', nome: 'Tesoro', pontos: '⏳', pais: 'Brasil' },
                                            ].map((row, i) => (
                                                <tr
                                                    key={i}
                                                    className={clsx(
                                                        'group transition-colors',
                                                        i === 0 && 'bg-amber-500/5',
                                                        i > 0 && 'hover:bg-stone-800/40'
                                                    )}
                                                >
                                                    <td className="py-3 pr-4 text-stone-500 font-mono font-bold w-8">{row.pos}</td>
                                                    <td className="py-3 pr-4">
                                                        <p className={clsx('font-semibold', i === 0 ? 'text-amber-300' : 'text-white')}>
                                                            {row.nome}
                                                        </p>
                                                    </td>
                                                    <td className="py-3 pr-4 text-right">
                                                        <span className={clsx('font-mono font-black text-lg', i === 0 ? 'text-amber-300' : 'text-white')}>
                                                            {row.pontos}
                                                        </span>
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
                                <a href="/admin" className="hover:text-stone-400 transition-colors">
                                    Área Admin
                                </a>
                                <span className="text-stone-700">|</span>
                                <a href="/" className="hover:text-stone-400 transition-colors">
                                    Bona
                                </a>
                            </div>
                        </footer>
                    </>
                )}
            </div>
        </div>
    )
}