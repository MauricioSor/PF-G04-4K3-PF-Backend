function mulmod(a, b, m) {
  a = ((a % m) + m) % m
  b = ((b % m) + m) % m

  let result = 0
  while (b > 0) {
    if (b % 2 === 1) {
      result = (result + a) % m
    }
    a = (a * 2) % m
    b = Math.floor(b / 2)
  }
  return result
}

export function createMixedCongruential(seed, a, c, m) {
  a = Math.round(Math.abs(a))
  c = Math.round(Math.abs(c))
  m = Math.round(Math.abs(m))

  let x = Math.abs(Math.round(seed)) % m

  return {
    name: 'Congruencial Mixto',
    seed,
    params: { a, c, m },

    next() {
      x = (mulmod(a, x, m) + c) % m
      return x / m
    },

    generate(count) {
      return Array.from({ length: count }, () => this.next())
    }
  }
}
