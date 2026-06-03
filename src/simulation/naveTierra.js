
import {
  exponential,
  uniformInt,
  normal,
  binomialTabla,
  pesoEquipo,
  TABLA_TIPO_DISPOSITIVO,
  TABLA_DESTINO,
  TABLA_EFICACIA,
  AGUA_POR_TIPO,
} from './distribution.js'

const DIAS_LABORABLES  = 30
const MINUTOS_POR_DIA  = 480
const MEDIA_ENTRE_LOTES = 80

const TIPO_LABEL = { 1: 'Servidor', 2: 'Switch/Router', 3: 'Hogareño' }
const DESTINO_LABEL = { EF: 'Reutilización', ED: 'Desarme', EI: 'Disposición' }

function makeSafe(val) {
  return val <= 0 ? 1e-10 : val >= 1 ? 1 - 1e-10 : val
}

function oneShot(raw) {
  const safe = makeSafe(raw)
  return () => safe
}

function twoShot(r1, r2) {
  let calls = 0
  return () => (calls++ === 0 ? makeSafe(r1) : makeSafe(r2))
}

/**
 * Ejecuta la simulación completa de 30 días.
 *
 * @param {object} generador - Objeto con método next() que retorna u ∈ [0,1)
 * @returns {{ dias: Array, resumen: object, decisiones: object, grilla: Array, rng: object }}
 */
export function runSimulation(generador) {
  const raw = () => generador.next()

  let TTR  = 0
  let TTD  = 0
  let TTDD = 0
  let EF   = 0
  let ED   = 0
  let EI   = 0
  let PE   = 0
  let TA   = 0
  let CS   = 0
  let CR   = 0
  let ER   = 0
  let PT   = 0
  let totalU = 0

  const resultadosDias = []
  const grilla = []
  let equipoIdx = 0

  for (let d = 1; d <= DIAS_LABORABLES; d++) {
    let L        = 0
    let CS_dia   = 0
    let CR_dia   = 0
    let ER_dia   = 0
    let PT_dia   = 0
    let EF_dia   = 0
    let ED_dia   = 0
    let EI_dia   = 0
    let PE_dia   = 0
    let TA_dia   = 0
    let TTR_dia  = 0
    let TTD_dia  = 0
    let TTDD_dia = 0
    let lote = 0

    let tiempoAcum = 0
    while (true) {
      const uArribo = raw(); totalU++
      const tiempoEntreArribo = exponential(MEDIA_ENTRE_LOTES, oneShot(uArribo))
      tiempoAcum += tiempoEntreArribo
      if (tiempoAcum > MINUTOS_POR_DIA) break
      L++
      lote++

      const uCE = raw(); totalU++
      const CE = uniformInt(5, 15, oneShot(uCE))

      for (let e = 0; e < CE; e++) {
        equipoIdx++

        const uTR1 = raw(); totalU++
        const uTR2 = raw(); totalU++
        const TR = Math.max(0.1, normal(2, 0.5, twoShot(uTR1, uTR2)))
        TTR_dia += TR
        TTR     += TR

        // El tipo se determina primero porque el peso depende del tipo (DFD V2)
        const uTipo = raw(); totalU++
        const tipo = binomialTabla(TABLA_TIPO_DISPOSITIVO, oneShot(uTipo))
        if (tipo === 1)      { CS_dia++; CS++ }
        else if (tipo === 2) { CR_dia++; CR++ }
        else                 { ER_dia++; ER++ }

        // Peso según DFD V2: PS=15+15u (Srv), PR=3+5u (Router), PER=Normal(0.5,0.2) (Hog)
        const { peso: P, u1: uPeso1, u2: uPeso2 } = pesoEquipo(tipo, raw)
        totalU++  // u1 siempre se consume; u2 solo para tipo 3
        if (uPeso2 !== null) totalU++
        PT_dia += P
        PT     += P

        const uTD = raw(); totalU++
        const TD = 3 + 9 * uTD    // TD = 3 + 9·u  → Uniforme(3, 12)  [DFD: TD=3+9u]
        TTD_dia += TD
        TTD     += TD

        const uDestino = raw(); totalU++
        const destino = binomialTabla(TABLA_DESTINO, oneShot(uDestino))

        let uTDD = null
        let tdd  = null
        if (destino === 'EF') {
          EF_dia++; EF++
        } else if (destino === 'ED') {
          ED_dia++; ED++
          uTDD = raw(); totalU++
          tdd = 5 + 50 * uTDD    // TDD = 5 + 50·u  → Uniforme(5, 55)  [DFD: TDD=5+50u]
          TTDD_dia += tdd
          TTDD     += tdd
        } else {
          EI_dia++; EI++
        }

        const uEficacia = raw(); totalU++
        const eficacia = binomialTabla(TABLA_EFICACIA, oneShot(uEficacia))
        let agua = 0
        if (eficacia === 'OK') {
          agua = AGUA_POR_TIPO[tipo]
          TA_dia += agua
          TA     += agua
        } else {
          PE_dia++; PE++
        }

        grilla.push({
          idx:          equipoIdx,
          dia:          d,
          lote:         lote,
          equipoEnLote: e + 1,
          uTipo:        parseFloat(uTipo.toFixed(6)),
          tipoLabel:    TIPO_LABEL[tipo],
          uPeso:        parseFloat(uPeso1.toFixed(6)),
          uPeso2:       uPeso2 !== null ? parseFloat(uPeso2.toFixed(6)) : null,
          peso:         parseFloat(P.toFixed(4)),
          uTR1:         parseFloat(uTR1.toFixed(6)),
          uTR2:         parseFloat(uTR2.toFixed(6)),
          tr:           parseFloat(TR.toFixed(2)),
          uTD:          parseFloat(uTD.toFixed(6)),
          td:           parseFloat(TD.toFixed(2)),
          uDestino:     parseFloat(uDestino.toFixed(6)),
          destino,
          destinoLabel: DESTINO_LABEL[destino],
          uTDD:         uTDD !== null ? parseFloat(uTDD.toFixed(6)) : null,
          tdd:          tdd  !== null ? parseFloat(tdd.toFixed(2))  : null,
          uEficacia:    parseFloat(uEficacia.toFixed(6)),
          ok:           eficacia === 'OK',
          agua,
        })
      }
    }

    resultadosDias.push({
      dia:     d,
      lotes:   L,
      CS:      CS_dia,
      CR:      CR_dia,
      ER:      ER_dia,
      equipos: CS_dia + CR_dia + ER_dia,
      PT:      parseFloat(PT_dia.toFixed(2)),
      EF:      EF_dia,
      ED:      ED_dia,
      EI:      EI_dia,
      PE:      PE_dia,
      TA:      Math.round(TA_dia),
      TTR:     parseFloat(TTR_dia.toFixed(2)),
      TTD:     parseFloat(TTD_dia.toFixed(2)),
      TTDD:    parseFloat(TTDD_dia.toFixed(2)),
      TT:      parseFloat((TTD_dia + TTDD_dia).toFixed(2)),
    })
  }

  const TEP    = CS + CR + ER
  const TT     = TTD + TTDD
  const TTR_hs = TTR / 60
  const TT_hs  = TT  / 60

  const resumen = {
    TEP,
    CS, CR, ER,
    PT:     parseFloat(PT.toFixed(2)),
    EF, ED, EI,
    PE,
    TA:     Math.round(TA),
    TTR:    parseFloat(TTR.toFixed(2)),
    TTD:    parseFloat(TTD.toFixed(2)),
    TTDD:   parseFloat(TTDD.toFixed(2)),
    TT:     parseFloat(TT.toFixed(2)),
    TTR_hs: parseFloat(TTR_hs.toFixed(2)),
    TT_hs:  parseFloat(TT_hs.toFixed(2)),
  }

  const decisiones = {
    nuevoRecepcionista: TTR_hs > 160,
    nuevoOperario:      TT_hs  > 160,
    segundoTurno:       TEP    > 800,
  }

  const rng = {
    totalUConsumidos: totalU,
  }

  return {
    dias: resultadosDias,
    resumen,
    decisiones,
    grilla,
    rng,
  }
}
