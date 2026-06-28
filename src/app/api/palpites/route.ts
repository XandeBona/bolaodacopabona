import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { calcularPontos } from '@/types'
import type { Palpite, Resultado, Jogo, ParticipanteRanking } from '@/types'

export async function GET() {
  const [
    { data: palpites, error: e1 },
    { data: resultados, error: e2 },
    { data: jogos, error: e3 },
  ] = await Promise.all([
    supabase.from('palpites').select('*').order('jogo_numero'),
    supabase.from('resultados').select('*'),
    supabase.from('jogos').select('jogo_numero, pais_a, pais_b'),
  ])

  if (e1 || e2 || e3) {
    return NextResponse.json({ error: e1?.message ?? e2?.message ?? e3?.message }, { status: 500 })
  }

  const resultadoMap = new Map<number, Resultado>(
    (resultados ?? []).map((r: Resultado) => [r.jogo_numero, r])
  )

  const jogoMap = new Map<number, { pais_a: string | null; pais_b: string | null }>(
    (jogos ?? []).map((j) => [j.jogo_numero, { pais_a: j.pais_a, pais_b: j.pais_b }])
  )

  const rankingMap = new Map<string, ParticipanteRanking>()

  for (const palpite of palpites ?? []) {
    const resultado = resultadoMap.get(palpite.jogo_numero) ?? null

    const isMataMAta = palpite.jogo_numero >= 73
    const jogoReal = isMataMAta
      ? jogoMap.get(palpite.jogo_numero) ?? { pais_a: null, pais_b: null }
      : undefined

    // Para mata-mata, calcula mesmo sem resultado (pontos de confronto)
    // Para grupos, só calcula se tiver resultado
    const deveCalcular = isMataMAta
      ? jogoReal?.pais_a != null && jogoReal?.pais_b != null
      : resultado !== null

    const pontos = deveCalcular
      ? calcularPontos(palpite as Palpite, resultado, jogoReal)
      : 0

    if (!rankingMap.has(palpite.nome_participante)) {
      rankingMap.set(palpite.nome_participante, {
        nome: palpite.nome_participante,
        pontos_total: 0,
        jogos_palpitados: 0,
        acertos_placar: 0,
        acertos_resultado: 0,
        erros: 0,
      })
    }

    const entry = rankingMap.get(palpite.nome_participante)!
    entry.jogos_palpitados++

    if (deveCalcular) {
      entry.pontos_total += pontos

      if (isMataMAta) {
        if (pontos === 20) entry.acertos_placar++
        else if (pontos >= 10) entry.acertos_resultado++
        else if (pontos > 0) entry.acertos_resultado++
        else entry.erros++
      } else {
        if (pontos === 10) entry.acertos_placar++
        else if (pontos >= 5) entry.acertos_resultado++
        else entry.erros++
      }
    }
  }

  const ranking = Array.from(rankingMap.values()).sort(
    (a, b) => b.pontos_total - a.pontos_total
  )

  return NextResponse.json({
    palpites: palpites ?? [],
    resultados: resultados ?? [],
    ranking,
  })
}