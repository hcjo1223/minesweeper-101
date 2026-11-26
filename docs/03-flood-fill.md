# Step 03: 빈 칸 연쇄 확장 알고리즘 (Flood Fill: BFS vs DFS)

> **핵심 학습 키워드**: `Flood Fill`, `너비 우선 탐색(Queue BFS)`, `깊이 우선 탐색(Recursive DFS)`, `콜 스택(Call Stack)`  
> **관련 소스 코드**: [`src/core/floodFill.ts`](../src/core/floodFill.ts)

---

## 1. 지뢰찾기의 꽃, Flood Fill이란?

지뢰찾기에서 주변 8칸에 지뢰가 하나도 없는 칸(`neighborMines === 0`)을 클릭하면, 플레이어가 일일이 주변 칸을 클릭하지 않아도 **인접한 모든 `0`인 칸들과 그 경계를 둘러싼 숫자 칸(`neighborMines > 0`)까지 한 번에 자동으로 열리는 현상**을 볼 수 있습니다.

이 알고리즘을 그림판의 '페인트통 채우기'와 같다고 하여 **Flood Fill(플러드 필)**이라고 부릅니다.

### 연쇄 확장의 3가지 핵심 규칙

1. **확장 조건 (`neighborMines === 0`)**: 현재 열린 칸의 인접 지뢰 수가 `0`이면 주변 8칸은 무조건 안전하므로, 닫혀 있는 이웃 칸들을 모두 엽니다.
2. **경계 정지 조건 (`neighborMines > 0`)**: 이웃 칸이 숫자(`1~8`)를 가진 칸이라면, **그 숫자 칸까지만 열고** 그 너머로는 더 이상 확장하지 않습니다. (숫자 칸이 안전 구역의 '벽' 역할을 합니다.)
3. **보호 조건 (`isFlagged || isRevealed`)**: 이미 열린 칸이나 플레이어가 깃발(`🚩`)을 꽂아둔 칸은 탐색에서 건너뜁니다.

---

## 2. 큐(Queue) 기반 너비 우선 탐색 (BFS)

[`src/core/floodFill.ts`](../src/core/floodFill.ts)의 기본 엔진 알고리즘은 **큐 기반 BFS**입니다.

```typescript
const queue: Coordinate[] = [origin];
let head = 0;

board[origin.row]![origin.col] = {
  ...startCell,
  isRevealed: true,
  revealOrder: stepOrder++,
};

while (head < queue.length) {
  const current = queue[head++]!;
  const currentCell = board[current.row]![current.col]!;

  if (currentCell.neighborMines === 0) {
    for (const neighbor of getNeighbors(current.row, current.col, rows, cols)) {
      const neighborCell = board[neighbor.row]![neighbor.col]!;
      if (!neighborCell.isRevealed && !neighborCell.isFlagged && !neighborCell.isMine) {
        // ⚠️ 중요: 큐에서 꺼낼 때가 아니라 큐에 넣기 직전에 즉시 isRevealed = true로 변경!
        board[neighbor.row]![neighbor.col] = {
          ...neighborCell,
          isRevealed: true,
          revealOrder: stepOrder++,
        };

        if (neighborCell.neighborMines === 0) {
          queue.push(neighbor);
        }
      }
    }
  }
}
```

### 💡 코딩 테스트 단골 실수: 방문 체크(`isRevealed = true`) 시점

BFS를 구현할 때 큐에서 좌표를 꺼낸 뒤(`queue[head++]`) 방문 표시를 하면, 동일한 이웃 좌표가 여러 방향에서 중복으로 큐에 삽입되어 메모리와 시간이 최대 8배 이상 낭비됩니다. 반드시 **큐에 넣기 직전(Enqueue 시점)**에 `isRevealed = true`로 상태를 변경해야 중복 삽입을 완벽히 막을 수 있습니다.

또한 `Array.prototype.shift()`는 배열의 모든 원소를 앞으로 한 칸씩 당기므로 $O(N)$ 시간이 걸립니다. 위 구현처럼 인덱스 포인터 `head++`를 사용하면 디큐(Dequeue) 연산을 $O(1)$로 유지할 수 있습니다.

---

## 3. 재귀(Recursion) 기반 깊이 우선 탐색 (DFS)

동일한 로직을 재귀 함수(DFS)로도 구현할 수 있습니다.

```typescript
function dfs(coord: Coordinate, depth: number): void {
  const cell = board[coord.row]?.[coord.col];
  if (!cell || cell.isRevealed || cell.isFlagged || cell.isMine) {
    return;
  }

  board[coord.row]![coord.col] = {
    ...cell,
    isRevealed: true,
    revealOrder: stepOrder++,
  };

  // 숫자 칸이면 자신만 열고 더 이상 재귀 호출하지 않음
  if (cell.neighborMines > 0) {
    return;
  }

  for (const neighbor of getNeighbors(coord.row, coord.col, rows, cols)) {
    dfs(neighbor, depth + 1);
  }
}
```

---

## 4. BFS vs DFS 완벽 비교 (왜 실무에서는 BFS를 선호할까?)

두 알고리즘 모두 최종적으로 열리는 셀의 집합은 **100% 동일**하지만, 탐색 순서와 메모리 구조에서 큰 차이가 있습니다.

| 비교 항목 | 큐 기반 BFS (`floodFillBFS`) | 재귀 기반 DFS (`floodFillDFS`) |
| :--- | :--- | :--- |
| **탐색 방향** | 시작점으로부터 동심원 물결 모양으로 균일하게 확산 | 한 방향(예: 좌상단) 끝까지 파고든 후 백트래킹 |
| **메모리 위치** | 힙(Heap) 메모리의 배열 큐 (`queue`) | 자바스크립트 엔진 콜 스택 (Call Stack) |
| **최대 공간 복잡도** | 물결의 둘레 길이에 비례 ($O(\min(R, C))$) | 열린 빈 칸 전체 개수에 비례 (최악 $O(R \times C)$) |
| **대형 보드 안정성** | 보드가 `1000 × 1000`이어도 안전하게 동작 | 보드가 크면 `RangeError: Maximum call stack size exceeded` 발생 위험 |

> 🎮 **직접 실험해 보기**: 웹 앱 우측의 **Flood Fill 탐색 인스펙터**에서 `BFS (큐)`와 `DFS (재귀)`를 전환해가며 빈 칸을 클릭해 보세요. 보드 각 칸 우측 하단에 표시되는 탐색 순번(`#1, #2, #3...`)과 **최대 큐 길이 vs 최대 재귀 깊이** 수치가 확연히 다른 것을 눈으로 확인할 수 있습니다!

---

## 📌 다음 단계

[Step 04: 게임 루프와 승패 판정](./04-game-loop.md)에서는 첫 클릭 시 무조건 `0`인 칸에서 출발하도록 만드는 **첫 클릭 안전 알고리즘**과 승리/패배 판정, 그리고 고수들의 필수 기술인 **Chording(주변 한 번에 열기)** 구현을 살펴봅니다.
