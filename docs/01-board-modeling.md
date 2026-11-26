# Step 01: 보드 설계와 데이터 모델링 (Board Design & Data Modeling)

> **핵심 학습 키워드**: `2차원 배열(2D Grid)`, `셀 상태 모델링(CellState)`, `불변성(Immutability)`, `지연 초기화(Lazy Evaluation)`  
> **관련 소스 코드**: [`src/core/types.ts`](../src/core/types.ts), [`src/core/board.ts`](../src/core/board.ts)

---

## 1. 왜 데이터 모델링이 가장 중요한가?

지뢰찾기를 처음 구현할 때 흔히 저지르는 실수는 보드를 단순한 `number[][]` (예: `-1`은 지뢰, `0~8`은 숫자) 하나로만 표현하거나, 반대로 HTML DOM 요소(`data-mine="true"`)에 직접 게임 상태를 저장하는 것입니다.

그렇게 설계하면 다음과 같은 문제가 발생합니다.

1. **"지뢰가 있는 칸(`isMine`)"과 "플레이어가 열어서 확인한 칸(`isRevealed`)"을 구분하기 어렵습니다.**
2. **깃발(`isFlagged`)을 꽂았다가 해제할 때 원래 셀에 있던 지뢰/숫자 정보가 손실되기 쉽습니다.**
3. **DOM에 상태를 저장하면 UI 프레임워크(React, Canvas, CLI)를 바꿀 때 게임 로직을 처음부터 다시 짜야 합니다.**

따라서 우리는 **"변하지 않는 지형 데이터"**와 **"플레이어의 행동에 따라 변하는 상태 데이터"**를 하나의 명확한 인터페이스 `CellState`로 분리하여 설계합니다.

---

## 2. `CellState` 인터페이스 설계

[`src/core/types.ts`](../src/core/types.ts)에 정의된 셀 모델은 다음과 같습니다.

```typescript
export interface CellState {
  readonly row: number;           // 행 인덱스 (0 <= row < rows)
  readonly col: number;           // 열 인덱스 (0 <= col < cols)
  readonly isMine: boolean;       // 지뢰 여부 (첫 클릭 시 결정)
  readonly isRevealed: boolean;   // 플레이어가 오픈했는지 여부
  readonly isFlagged: boolean;    // 깃발(🚩) 표시 여부
  readonly neighborMines: number; // 주변 8방향의 인접 지뢰 개수 (0 ~ 8)
  readonly isExploded?: boolean;  // 패배를 유발한 폭발 지뢰인지 여부
  readonly revealOrder?: number;  // Flood Fill 탐색 순서 시각화용 순번 (#1, #2...)
}
```

### 상태 조합표 (State Matrix)

각 셀은 `isRevealed`와 `isFlagged`의 조합으로 화면에 어떻게 렌더링될지 완벽히 결정됩니다.

| `isRevealed` | `isFlagged` | `isMine` | 화면 표시 상태 |
| :---: | :---: | :---: | :--- |
| `false` | `false` | `true / false` | 닫힌 기본 셀 (클릭 및 우클릭 가능) |
| `false` | `true` | `true / false` | 깃발(`🚩`)이 꽂힌 셀 (좌클릭 실수 방지 보호) |
| `true` | `false` | `false` | 열린 안전 셀 (`neighborMines === 0`이면 빈 칸, `1~8`이면 숫자 표시) |
| `true` | `false` | `true` | 게임 오버 시 공개된 지뢰 (`💣` 또는 폭발한 `💥`) |

> **불변 규칙(Invariant)**: 이미 열린 칸(`isRevealed === true`)에는 절대 깃발을 꽂을 수 없으며(`isFlagged === false`), 깃발이 꽂힌 칸(`isFlagged === true`)은 깃발을 해제하기 전까지 열리지 않습니다.

---

## 3. 2차원 배열 생성과 지연 초기화 (Lazy Initialization)

클래식 지뢰찾기에서는 **첫 번째 클릭이 절대 지뢰가 되지 않도록** 보장해야 합니다. 이를 위해 게임을 시작할 때(`createEmptyBoard`)는 지뢰를 미리 배치하지 않고, 모든 셀의 `isMine: false`인 깨끗한 2차원 배열만 먼저 생성합니다.

```typescript
export function createEmptyBoard(config: BoardConfig): CellState[][] {
  const { rows, cols } = config;
  return Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col): CellState => ({
      row,
      col,
      isMine: false,
      isRevealed: false,
      isFlagged: false,
      neighborMines: 0,
    }))
  );
}
```

### ⚠️ 주의: `new Array(rows).fill(new Array(cols))`의 함정

JavaScript/TypeScript에서 2차원 배열을 만들 때 `Array(rows).fill(Array(cols).fill(...))`를 사용하면 **모든 행이 동일한 배열 참조(Reference)를 공유**하게 되어, `(0, 1)`만 수정해도 모든 행의 `1`번 열이 함께 바뀌는 치명적인 버그가 발생합니다. 반드시 위 코드처럼 `Array.from`의 매핑 함수를 사용해 각 행과 셀마다 독립된 객체를 생성해야 합니다.

---

## 4. 난이도 프리셋 모델링

초급·중급·고급 난이도 역시 하드코딩된 조건문 대신 `BoardConfig` 데이터 사전(`DIFFICULTY_PRESETS`)으로 관리합니다.

| 난이도 | 보드 크기 (`cols × rows`) | 전체 셀 수 | 지뢰 수 (`mines`) | 지뢰 밀도 |
| :--- | :---: | :---: | :---: | :---: |
| **초급 (Beginner)** | `9 × 9` | 81칸 | 10개 | 12.3% |
| **중급 (Intermediate)** | `16 × 16` | 256칸 | 40개 | 15.6% |
| **고급 (Expert)** | `30 × 16` | 480칸 | 99개 | 20.6% |

---

## 📌 다음 단계

2차원 보드와 셀 데이터 모델을 완성했으니, 이제 [Step 02: 지뢰 배치와 8방향 탐색](./02-mine-placement.md)에서 **Fisher-Yates 셔플**과 **8방향 벡터(`dx, dy`)**를 사용해 지뢰와 숫자를 채워 넣는 방법을 알아봅니다.
