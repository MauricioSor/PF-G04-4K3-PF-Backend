// u = numero aleatorio entre 0 y 1
const u = () => Math.random()

export function exponential(mean) {
  return -mean * Math.log(u())
}

export function uniform(a, b) {
  return a + (b - a) * u()
}

export function uniformInt(a, b) {
  return Math.floor(a + (b - a + 1) * u())  // +1 para incluir b
}

export function normal(mu, sigma) {
  // Box-Muller transform
  const u1 = u()
  const u2 = u()
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  return mu + sigma * z
}


export function binomial(table, randomValue = u()) {
  for (const entry of table) {
    if (randomValue <= entry.cumulative) return entry.value
  }
  return table[table.length - 1].value // fallback
}