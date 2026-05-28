export function createLehmer(seed, a = 16807, m = 2147483647) {
  if (seed <= 0 || seed >= m) {
    seed = ((Math.abs(Math.round(seed)) % (m - 1)) + 1)
  }

  let x = Math.round(seed)

  return {
    name: 'Lehmer',
    seed,
    params: { a, m },

    next() {
      x = (a * x) % m
      return x / m
    },

    generate(count) {
      return Array.from({ length: count }, () => this.next())
    }
  }
}
