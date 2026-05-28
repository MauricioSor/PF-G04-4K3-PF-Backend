
import {
  exponential,
  uniformInt,
  uniform,
  normal,
  binomialTabla,
  TABLA_TIPO_DISPOSITIVO,
  TABLA_DESTINO,
  TABLA_EFICACIA,
  AGUA_POR_TIPO,
} from './distribution.js'

const DIAS_LABORABLES  = 30
const MINUTOS_POR_DIA  = 480  
const MEDIA_ENTRE_LOTES = 80 


/**
 * Ejecuta la simulación completa de 30 días.
 *
 * @param {object} generador - Objeto con método next() que retorna u ∈ [0,1)
 * @returns {{ dias: Array, resumen: object, decisiones: object }}
 */
export function runSimulation(generador) {
  const u = () => {
    const val = generador.next()
    // Protección: evitar 0 exacto (problemas con log(0))
    return val <= 0 ? 1e-10 : val >= 1 ? 1 - 1e-10 : val
  }

  let TTR  = 0  // Total tiempo de recepción (minutos)
  let TTD  = 0  // Total tiempo de diagnóstico
  let TTDD = 0  // Total tiempo de desarme
  let EF   = 0  // Equipos funcionales
  let ED   = 0  // Equipos para desarme
  let EI   = 0  // Equipos irrecuperables
  let PE   = 0  // Incidentes de contaminación
  let TA   = 0  // Litros de agua no contaminada
  let CS   = 0  // Cantidad de servidores (mes)
  let CR   = 0  // Cantidad de routers (mes)
  let ER   = 0  // Cantidad de equipos hogareños (mes)
  let PT   = 0  // Peso total procesado (mes)

  const resultadosDias = []

  // ── LOOP POR DÍAS ──────────────────────────
  for (let d = 1; d <= DIAS_LABORABLES; d++) {

    // Acumuladores del día
    let L         = 0    // Lotes que llegan hoy
    let CS_dia    = 0
    let CR_dia    = 0
    let ER_dia    = 0
    let PT_dia    = 0
    let EF_dia    = 0
    let ED_dia    = 0
    let EI_dia    = 0
    let PE_dia    = 0
    let TA_dia    = 0
    let TTR_dia   = 0
    let TTD_dia   = 0
    let TTDD_dia  = 0

    // ── GENERAR LOTES DEL DÍA (inter-arrivals exponenciales) ──
    let tiempoAcum = 0
    while (true) {
      const tiempoEntreArribo = exponential(MEDIA_ENTRE_LOTES, u)
      tiempoAcum += tiempoEntreArribo
      if (tiempoAcum > MINUTOS_POR_DIA) break
      L++

      // ── EQUIPOS EN ESTE LOTE ──
      const CE = uniformInt(5, 15, u) 

      for (let e = 0; e < CE; e++) {

        // 1. Tiempo de recepción ~ Normal(μ=2, σ=0.5) minutos
        const TR = Math.max(0.1, normal(2, 0.5, u))
        TTR_dia += TR
        TTR     += TR

        // 2. Tipo de dispositivo (Binomial tabla)
        const tipo = binomialTabla(TABLA_TIPO_DISPOSITIVO, u)
        if (tipo === 1)      { CS_dia++; CS++ }
        else if (tipo === 2) { CR_dia++; CR++ }
        else                 { ER_dia++; ER++ }

        // 3. Peso del dispositivo ~ Uniforme(0.5, 20)  → P = 0.5 + 19.5u
        const P = uniform(0.5, 20, u)
        PT_dia += P
        PT     += P

        // 4. Tiempo de diagnóstico ~ Uniforme(3, 15) → TD = 3 + 12u
        const TD = uniform(3, 15, u)
        TTD_dia += TD
        TTD     += TD

        // 5. Destino del equipo (Binomial tabla)
        const destino = binomialTabla(TABLA_DESTINO, u)

        if (destino === 'EF') {
          EF_dia++; EF++
        } else if (destino === 'ED') {
          ED_dia++; ED++
          // Tiempo de desarme ~ Uniforme(5, 60) → TDD = 5 + 55u
          const TDD = uniform(5, 60, u)
          TTDD_dia += TDD
          TTDD     += TDD
        } else {
          EI_dia++; EI++
        }

        // 6. Eficacia del procesamiento (contaminación)
        const eficacia = binomialTabla(TABLA_EFICACIA, u)
        if (eficacia === 'OK') {
          // Equipo procesado sin fugas → sumar agua evitada según tipo
          const aguaEvitada = AGUA_POR_TIPO[tipo]
          TA_dia += aguaEvitada
          TA     += aguaEvitada
        } else {
          PE_dia++; PE++
        }
      }
    }

    // ── REGISTRAR RESULTADO DEL DÍA ──
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

  // ── RESUMEN DEL MES ───
  const TEP = CS + CR + ER
  const TT  = TTD + TTDD

  // Convertir minutos → horas para las decisiones
  const TTR_hs  = TTR  / 60
  const TT_hs   = TT   / 60

  const resumen = {
    TEP,
    CS,    CR,    ER,
    PT:    parseFloat(PT.toFixed(2)),
    EF,    ED,    EI,
    PE,
    TA:    Math.round(TA),
    TTR:   parseFloat(TTR.toFixed(2)),   
    TTD:   parseFloat(TTD.toFixed(2)),   
    TTDD:  parseFloat(TTDD.toFixed(2)),  
    TT:    parseFloat(TT.toFixed(2)),    
    TTR_hs:  parseFloat(TTR_hs.toFixed(2)),
    TT_hs:   parseFloat(TT_hs.toFixed(2)),
  }

  // ── DECISIONES DE INVERSIÓN ──
  const decisiones = {
    // Si TTR > 160 horas → invertir en nuevo recepcionista
    nuevoRecepcionista: TTR_hs > 160,
    // Si TT (diagnóstico + desarme) > 160 horas → invertir en nuevo operario
    nuevoOperario:      TT_hs  > 160,
    // Si TEP > 800 → habilitar segundo turno o convenio
    segundoTurno:       TEP    > 800,
  }

  return {
    dias: resultadosDias,
    resumen,
    decisiones,
  }
}
