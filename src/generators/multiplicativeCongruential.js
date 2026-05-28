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

export function createMultiplicativeCongruential(seed, a, m) {
  a = Math.round(Math.abs(a))
  m = Math.round(Math.abs(m))

  let x = Math.abs(Math.round(seed)) % m
  if (x === 0) x = 1
  if (x % 2 === 0) x += 1 

  return {
    name: 'Congruencial Multiplicativo',
    seed,
    params: { a, m },

    next() {
      x = mulmod(a, x, m)
      return x / m
    },

    generate(count) {
      return Array.from({ length: count }, () => this.next())
    }
  }
}
