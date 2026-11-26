# Step 04: 게임 루프와 승패 판정 (Game Loop & Win/Loss Conditions)

> **핵심 학습 키워드**: `첫 클릭 안전 알고리즘(First-Click Safe)`, `체비쇼프 거리(Chebyshev Distance)`, `승리 조건 체크`, `Chording`, `타이머 상태 머신`  
> **관련 소스 코드**: [`src/core/MinesweeperEngine.ts`](../src/core/MinesweeperEngine.ts), [`src/ui/useMinesweeper.ts`](../src/ui/useMinesweeper.ts)

---

## 1. 게임 상태 머신 (Finite State Machine)

지뢰찾기 게임의 생명주기는 총 4가지 상태(`GameStatus`)의 유한 상태 머신(FSM)으로 명확히 표현됩니다.

```
         [새 게임 / reset()]
                 │
                 ▼
             ┌────────┐
             │  idle  │  (지뢰 미생성, 타이머 정지)
             └────────┘
                 │
         첫 번째 셀 클릭 (reveal)
         -> 3×3 안전 구역 제외 지뢰 배치
                 │
                 ▼
            ┌─────────┐
            │ playing │  (타이머 1초 간격 증가)
            └─────────┘
             ╱       ╲
   지뢰 셀 오픈       모든 안전 셀 오픈 완료
           ╱           ╲
          ▼             ▼
      ┌──────┐       ┌──────┐
      │ lost │       │ won  │  (남은 지뢰 자동 깃발, 타이머 정지)
      └──────┘       └──────┘
```

---

## 2. 첫 클릭 보호 로직 (First-Click Safe Guarantee)

만약 첫 클릭한 칸만 지뢰가 아니도록 막으면, 첫 클릭한 칸에 숫자 `3`이나 `4`가 떠서 **첫 수부터 찍기(운에 맡기는 선택)**를 강요받게 됩니다.

진정한 클래식 지뢰찾기의 첫 클릭 보호는 **첫 번째로 클릭한 칸 `(safeRow, safeCol)`뿐만 아니라 그 주변 8칸(총 3×3 영역)에도 지뢰가 배치되지 않도록** 보장합니다. 그래야 첫 클릭한 칸의 `neighborMines`가 무조건 `0`이 되어 첫 클릭 즉시 시원한 Flood Fill 확장이 일어납니다.

[`src/utils/directions.ts`](../src/utils/directions.ts)에서는 두 좌표 사이의 **체비쇼프 거리(Chebyshev Distance)**를 사용해 이를 한 줄의 수식으로 판별합니다.

$$\max(|r - r_{\text{safe}}|, |c - c_{\text{safe}}|) \le 1$$

```typescript
export function isWithinSafeZone(
  row: number,
  col: number,
  safeRow: number,
  safeCol: number,
  radius = 1
): boolean {
  return (
    Math.abs(row - safeRow) <= radius && Math.abs(col - safeCol) <= radius
  );
}
```

---

## 3. 정확한 승리 조건 판정 (Win Condition)

초보 개발자들이 자주 혼동하는 부분이 **"깃발을 모든 지뢰에 정확히 꽂아야 승리하는가?"**입니다.

정답은 **"아니다"**입니다. 지뢰찾기의 표준 승리 조건은 깃발 개수와 무관하게 **"지뢰가 아닌 모든 안전한 칸을 전부 오픈했는가?"**입니다.

$$\text{열린 안전 칸 개수} = (R \times C) - M$$

```typescript
private evaluateWinCondition(): void {
  const totalCells = this.config.rows * this.config.cols;
  const safeCellsTotal = totalCells - this.config.mines;

  let revealedSafeCount = 0;
  for (let r = 0; r < this.config.rows; r++) {
    for (let c = 0; c < this.config.cols; c++) {
      const cell = this.board[r]![c]!;
      if (cell.isRevealed && !cell.isMine) {
        revealedSafeCount++;
      }
    }
  }

  if (revealedSafeCount === safeCellsTotal) {
    this.status = 'won';
    // 승리 시 플레이어가 아직 깃발을 꽂지 않은 지뢰 칸에도 자동으로 깃발을 꽂아줌
  }
}
```

이렇게 설계하면 플레이어가 마지막 안전 칸을 열자마자 즉시 클리어 처리되어 쾌적한 UX를 제공합니다.

---

## 4. 고급 조작: 코딩 (Chording / Quick Reveal)

이미 열린 숫자 셀(예: `2`) 주변 8칸에 플레이어가 깃발(`🚩`)을 정확히 2개 꽂아두었다면, 나머지 닫힌 이웃 칸들은 플레이어가 안전하다고 판단한 칸들입니다.

이때 열린 숫자 셀을 클릭(또는 더블클릭)하면 **주변의 닫힌 칸들을 한 번에 모두 여는 기능(`chord`)**이 동작합니다.

* 만약 깃발을 올바른 위치에 꽂았다면 주변 안전 칸들이 Flood Fill과 함께 빠르게 열립니다.
* 만약 엉뚱한 곳에 깃발을 꽂고 `chord`를 실행해 인접한 진짜 지뢰가 열리면 즉시 지뢰가 폭발(`lost`)합니다.

---

## 📌 다음 단계

마지막 [Step 05: UI 분리 및 아키텍처 개선](./05-architecture.md)에서는 왜 코어 게임 엔진(`MinesweeperEngine`)을 React로부터 독립된 **헤드리스(Headless) 아키텍처**로 분리했는지, 그리고 시드(Seed) 난수를 주입해 100% 재현 가능한 단위 테스트를 작성하는 방법을 배웁니다.
