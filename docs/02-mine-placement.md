# Step 02: 지뢰 배치와 8방향 탐색 (Mine Placement & 8-Directional Search)

> **핵심 학습 키워드**: `Fisher-Yates 셔플`, `방향 벡터(dx, dy)`, `경계값 검사(Boundary Check)`  
> **관련 소스 코드**: [`src/utils/random.ts`](../src/utils/random.ts), [`src/utils/directions.ts`](../src/utils/directions.ts), [`src/core/board.ts`](../src/core/board.ts)

---

## 1. 지뢰 배치: `while` 랜덤 뽑기 vs Fisher-Yates 셔플

### ❌ 흔히 사용하는 안티패턴 (`while` 루프)

많은 입문 튜토리얼에서 지뢰를 배치할 때 다음과 같은 코드를 사용합니다.

```typescript
// 안티패턴: 이미 지뢰가 있는 칸이면 다시 뽑기를 반복
let placed = 0;
while (placed < mines) {
  const r = Math.floor(Math.random() * rows);
  const c = Math.floor(Math.random() * cols);
  if (!board[r][c].isMine) {
    board[r][c].isMine = true;
    placed++;
  }
}
```

이 방식은 지뢰 밀도가 낮을 때는 동작하는 것처럼 보이지만, 보드 크기 대비 지뢰 수가 많아질수록 이미 뽑힌 좌표를 계속 다시 뽑게 되어 루프 횟수가 급증하며(쿠폰 수집가 문제), 잘못된 지뢰 개수가 입력되면 **무한 루프(Infinite Loop)**에 빠집니다.

### ✅ 정석 해법: Fisher-Yates (Knuth) 셔플

우리가 구현한 [`src/utils/random.ts`](../src/utils/random.ts)는 지뢰를 놓을 수 있는 후보 좌표 배열을 만든 뒤, **Fisher-Yates 셔플 알고리즘**으로 배열을 단 한 번 순회($O(N)$)하여 섞고 앞에서부터 `mines`개를 자릅니다.

```typescript
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
```

* **시간 복잡도**: 정확히 $O(R \times C)$ (재시도 없음, 무한 루프 불가능)
* **수학적 균등성**: 모든 가능한 지뢰 배치 조합이 정확히 동일한 확률로 선택됩니다.
* **테스트 용이성**: `rng` 함수를 주입받아 시드(Seed) 기반의 결정론적 테스트가 가능합니다.

---

## 2. 8방향 탐색 벡터 (`DIRECTIONS_8`)

지뢰 배치가 끝나면 각 안전 셀 주변 8칸에 지뢰가 몇 개 있는지(`neighborMines`) 계산해야 합니다. 이때 `if (r > 0 && c > 0) ...` 같은 조건문을 8번 복붙하면 오타가 나기 쉽고 가독성이 급격히 떨어집니다.

코딩 테스트와 그리드 게임 개발에서는 **방향 벡터(Direction Vector)** 배열을 선언해 해결합니다.

```
(-1, -1)   (-1,  0)   (-1, +1)
( 0, -1)   [ (r,c) ]  ( 0, +1)
(+1, -1)   (+1,  0)   (+1, +1)
```

[`src/utils/directions.ts`](../src/utils/directions.ts)의 구현을 살펴봅시다.

```typescript
export const DIRECTIONS_8: readonly [number, number][] = [
  [-1, -1], [-1, 0], [-1, 1],
  [ 0, -1],          [ 0, 1],
  [ 1, -1], [ 1, 0], [ 1, 1],
] as const;

export function isValidCoord(
  row: number,
  col: number,
  rows: number,
  cols: number
): boolean {
  return row >= 0 && row < rows && col >= 0 && col < cols;
}

export function getNeighbors(
  row: number,
  col: number,
  rows: number,
  cols: number
): Coordinate[] {
  const neighbors: Coordinate[] = [];
  for (const [dr, dc] of DIRECTIONS_8) {
    const nr = row + dr;
    const nc = col + dc;
    if (isValidCoord(nr, nc, rows, cols)) {
      neighbors.push({ row: nr, col: nc });
    }
  }
  return neighbors;
}
```

---

## 3. 경계값(Boundary) 자동 처리와 인접 지뢰 계산

`getNeighbors` 헬퍼를 사용하면 보드의 **모서리(이웃 3개)**, **가장자리 변(이웃 5개)**, **내부 중앙(이웃 8개)**을 분기문 없이 단일 루프로 처리할 수 있습니다.

```typescript
export function calculateNeighborMines(board: CellState[][]): void {
  const rows = board.length;
  const cols = board[0]?.length ?? 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r]![c]!.isMine) continue;

      const neighbors = getNeighbors(r, c, rows, cols);
      let mineCount = 0;
      for (const n of neighbors) {
        if (board[n.row]![n.col]!.isMine) {
          mineCount++;
        }
      }
      board[r]![c] = { ...board[r]![c]!, neighborMines: mineCount };
    }
  }
}
```

---

## 📌 다음 단계

이제 보드의 모든 칸이 지뢰 여부와 주변 지뢰 개수를 알고 있습니다. [Step 03: 빈 칸 연쇄 확장 알고리즘 (Flood Fill)](./03-flood-fill.md)에서는 인접 지뢰가 `0`인 빈 칸을 클릭했을 때 안전 지대가 순식간에 열리는 **Flood Fill 알고리즘(BFS vs DFS)**을 분석합니다.
