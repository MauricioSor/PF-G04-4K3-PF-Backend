export function createCentralSquare(seed) {
  const seedStr = Math.abs(Math.round(seed)).toString()
  const n = seedStr.length

  if (n < 4) {
    throw new Error('La semilla debe tener al menos 4 dígitos para el método de la parte central del cuadrado.')
  }

  let x = parseInt(seedStr)
  const divisor = Math.pow(10, n)

  return {
    name: 'Parte Central del Cuadrado',
    seed,
    state: () => x,

    next() {
      const squared = x * x
      const squaredStr = squared.toString().padStart(n * 2, '0')
      const start = Math.floor((squaredStr.length - n) / 2)
      const middle = squaredStr.substring(start, start + n)
      x = parseInt(middle)

      if (x === 0) {
        x = parseInt(seedStr.split('').reverse().join('')) || 1234
      }

      return x / divisor
    },

    generate(count) {
      return Array.from({ length: count }, () => this.next())
    }
  }
}
