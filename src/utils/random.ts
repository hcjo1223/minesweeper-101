/**
 * 0 이상 1 미만의 난수를 반환하는 함수 시그니처입니다.
 * 기본값은 Math.random이며, 단위 테스트에서는 시드 기반 난수 생성기를 주입할 수 있습니다.
 */
export type RandomGenerator = () => number;

/**
 * Mulberry32 알고리즘 기반의 결정론적(Deterministic) 시드 난수 생성기입니다.
 * 동일한 시드(seed)를 입력하면 항상 동일한 지뢰 배치를 재현할 수 있어
 * 단위 테스트(Unit Test)와 알고리즘 디버깅에 활용됩니다.
 */
export function createSeededRandom(seed: number): RandomGenerator {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Fisher-Yates (Knuth) 셔플 알고리즘
 *
 * 원본 배열을 변경하지 않고 O(N) 시간 복잡도로 균등한 확률 분포의 새 셔플 배열을 반환합니다.
 * 단순 `while (placed < mines)` 방식에서 발생할 수 있는 무한 루프 위험과 편향을 방지합니다.
 */
export function fisherYatesShuffle<T>(
  items: readonly T[],
  rng: RandomGenerator = Math.random
): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const temp = result[i]!;
    result[i] = result[j]!;
    result[j] = temp;
  }
  return result;
}
