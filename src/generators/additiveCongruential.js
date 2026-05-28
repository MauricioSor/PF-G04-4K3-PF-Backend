function mulmod(a, b, m) {
  a = ((a % m) + m) % m
  b = ((b % m) + m) % m

  let result = 0
  while (b > 0) {
    if (b % 2 === 1) result = (result + a) % m
    a = (a * 2) % m
    b = Math.floor(b / 2)
  }
  return result
}


export function createAdditiveCongruential(seed, k, m) {
  const A_BOOTSTRAP = 16807
  const M_BOOTSTRAP = 2147483647

  k = Math.max(2, Math.round(Math.abs(k)))  
  m = Math.round(Math.abs(m))

  let bootstrapX = Math.abs(Math.round(seed)) % M_BOOTSTRAP
  if (bootstrapX === 0) bootstrapX = 12345

  // Tabla inicial: k valores generados con Lehmer (seguro: m=2^31-1 ≤ 2^53)
  const table = []
  for (let i = 0; i < k; i++) {
    bootstrapX = mulmod(A_BOOTSTRAP, bootstrapX, M_BOOTSTRAP)
    table.push(bootstrapX % m)   // reducir al módulo del método
  }

  let pos = 0

  return {
    name: 'Congruencial Aditivo',
    seed,
    params: { k, m },
    initialTable: table.slice(),

    next() {
      const prevIdx = (pos - 1 + k) % k
      const newVal  = (table[prevIdx] + table[pos]) % m
      table[pos]    = newVal
      pos           = (pos + 1) % k
      return newVal / m
    },

    generate(count) {
      return Array.from({ length: count }, () => this.next())
    }
  }
}
