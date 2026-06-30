export interface Palpite {
  id?: number
  numero_inscricao: string | null
  jogo_numero: number
  nome_participante: string
  fase: string
  pais_a: string
  gol_a: number
  gol_b: number
  pais_b: string
  penalti_a: number | null
  penalti_b: number | null
  grupo: string | null
  critica: string | null
}

export interface Jogo {
  id?: number
  jogo_numero: number
  fase: string
  grupo: string | null
  pais_a: string | null
  pais_b: string | null
  data_hora: string | null
  estadio: string | null
  created_at?: string
}

export interface Resultado {
  id?: number
  jogo_numero: number
  gol_a: number
  gol_b: number
  penalti_a: number | null
  penalti_b: number | null
  registrado_em?: string
}

export interface PalpiteComPontos extends Palpite {
  resultado?: Resultado
  pontos: number
}

export interface ParticipanteRanking {
  nome: string
  pontos_total: number
  jogos_palpitados: number
  acertos_placar: number
  acertos_resultado: number
  erros: number
}

export interface ParsedSheet {
  participante: string
  palpites: Palpite[]
}

// ============================================================
// FASE DE GRUPOS (jogos 1–72): máx 10 pts por jogo
// 1pt por gol_a acertado
// 1pt por gol_b acertado
// 5pt por resultado (vitória/empate) acertado
// 3pt bônus por placar exato (ou penalti exato se houver)
// ============================================================
function calcularPontosGrupo(palpite: Palpite, resultado: Resultado): number {
  const golsA = palpite.gol_a
  const golsB = palpite.gol_b
  const resA = resultado.gol_a
  const resB = resultado.gol_b

  let pontos = 0

  if (golsA === resA) pontos += 1
  if (golsB === resB) pontos += 1

  const palpiteOutcome = golsA > golsB ? 'A' : golsB > golsA ? 'B' : 'E'
  const resOutcome = resA > resB ? 'A' : resB > resA ? 'B' : 'E'

  if (palpiteOutcome === resOutcome) pontos += 5

  if (golsA === resA && golsB === resB) {
    if (resultado.penalti_a !== null && palpite.penalti_a !== null) {
      if (palpite.penalti_a === resultado.penalti_a && palpite.penalti_b === resultado.penalti_b) {
        pontos += 3
      }
    } else {
      pontos += 3
    }
  }

  return pontos
}

// ============================================================
// FASE MATA-MATA (jogos 73+): máx 20 pts por jogo
//
// resultado é opcional — sem ele, calcula só pontos de confronto
//
// BÔNUS DE CONFRONTO (conta mesmo sem resultado):
//   +10 acertou as duas equipes
//   +5  acertou ao menos uma equipe na posição correta
//
// SE PLACAR EXATO:
//   +10 bônus placar exato
//   -1  punição se não acertou as duas equipes
//   (não soma gols nem resultado separadamente)
//
// SE NÃO É PLACAR EXATO:
//   +1  acertou gols da equipe A (só se pais_a correto)
//   +1  acertou gols da equipe B (só se pais_b correto)
//   +5  acertou o resultado (vitória/empate)
// ============================================================
function calcularPontosMataMAta(
  palpite: Palpite,
  resultado: Resultado | null,
  jogoReal: { pais_a: string | null; pais_b: string | null }
): number {
  const paisAReal = jogoReal.pais_a
  const paisBReal = jogoReal.pais_b

  if (!paisAReal || !paisBReal) return 0

  const acertouA = palpite.pais_a === paisAReal
  const acertouB = palpite.pais_b === paisBReal
  const acertouAmbos = acertouA && acertouB
  const acertouAoMenosUm = acertouA || acertouB

  // Sem acerto de equipe = zero pontos
  if (!acertouAoMenosUm) return 0

  let pontos = 0

  // Bônus de confronto — conta mesmo sem resultado
  if (acertouAmbos) {
    pontos += 10
  } else {
    pontos += 5
  }

  // Pontuação de placar — só conta com resultado
  if (resultado) {
    const golsA = palpite.gol_a
    const golsB = palpite.gol_b
    const resA = resultado.gol_a
    const resB = resultado.gol_b

    const placardExato = golsA === resA && golsB === resB

    if (placardExato) {
      // Placar exato: bônus +10, punição -1 se não acertou os dois times
      if (!acertouAmbos) pontos -= 1
      if (resultado.penalti_a !== null && palpite.penalti_a !== null) {
        if (palpite.penalti_a === resultado.penalti_a && palpite.penalti_b === resultado.penalti_b) {
          pontos += 10
        }
      } else {
        pontos += 10
      }
    } else {
      // Não é placar exato — pontos normais de gols e resultado
      if (acertouA && golsA === resA) pontos += 1
      if (acertouB && golsB === resB) pontos += 1

      const palpiteOutcome = golsA > golsB ? 'A' : golsB > golsA ? 'B' : 'E'
      const resOutcome = resA > resB ? 'A' : resB > resA ? 'B' : 'E'
      if (palpiteOutcome === resOutcome) pontos += 5
    }
  }

  return pontos
}

// ============================================================
// FUNÇÃO PRINCIPAL
// Para mata-mata, passa o jogo real via parâmetro opcional
// resultado também é opcional para calcular só confronto
// ============================================================
export function calcularPontos(
  palpite: Palpite,
  resultado: Resultado | null,
  jogoReal?: { pais_a: string | null; pais_b: string | null }
): number {
  if (palpite.jogo_numero >= 73) {
    const jogo = jogoReal ?? { pais_a: palpite.pais_a, pais_b: palpite.pais_b }
    return calcularPontosMataMAta(palpite, resultado, jogo)
  }
  if (!resultado) return 0
  return calcularPontosGrupo(palpite, resultado)
}