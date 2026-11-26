# Step 05: UI 분리 및 아키텍처 개선 (Headless Architecture & Unit Testing)

> **핵심 학습 키워드**: `헤드리스(Headless) 아키텍처`, `관심사 분리(SoC)`, `의존성 주입(DI)`, `결정론적 단위 테스트(Deterministic Unit Test)`  
> **관련 소스 코드**: [`src/core/MinesweeperEngine.ts`](../src/core/MinesweeperEngine.ts), [`src/ui/useMinesweeper.ts`](../src/ui/useMinesweeper.ts), [`tests/minesweeper.test.ts`](../tests/minesweeper.test.ts)

---

## 1. 왜 UI와 게임 코어 로직을 분리해야 하는가?

もし React 컴포넌트 내부의 `useState`와 클릭 핸들러 안에 지뢰 배치, 8방향 탐색, Flood Fill 코드를 모두 섞어 작성하면 어떻게 될까요?

1. **테스트가 어렵고 느려집니다**: Flood Fill 로직 하나만 검증하려 해도 가상 브라우저(jsdom)와 React 컴포넌트를 마운트하고 버튼 클릭 이벤트를 시뮬레이션해야 합니다.
2. **프레임워크 종속성**: 추후 Vue, Svelte, HTML5 Canvas, 혹은 터미널 콘솔(CLI) 버전으로 확장하려 할 때 코어 알고리즘을 그대로 재사용할 수 없습니다.
3. **상태 추적의 복잡성**: 타이머 렌더링과 보드 탐색 로직이 뒤섞여 불필요한 리렌더링이나 상태 동기화 버그가 발생합니다.

---

## 2. 헤드리스(Headless) 코어 엔진 아키텍처

`minesweeper-101`은 전체 아키텍처를 3개의 명확한 계층으로 분리했습니다.

```
┌──────────────────────────────────────────────────────────┐
│                 UI Layer (src/ui/*.tsx)                  │
│   React Components · CSS Animation · Timer · Keyboard    │
└────────────────────────────┬─────────────────────────────┘
                             │ Action 호출 (reveal, toggleFlag, chord)
                             │ 불변 Snapshot 구독 (getSnapshot)
                             ▼
┌──────────────────────────────────────────────────────────┐
│           Headless Core Engine (src/core/*.ts)           │
│     MinesweeperEngine · populateMines · runFloodFill     │
│        (React / DOM / Window 의존성 0% 순수 TS)          │
└────────────────────────────┬─────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────┐
│               Pure Utilities (src/utils/*.ts)            │
│    DIRECTIONS_8 · getNeighbors · fisherYatesShuffle      │
└──────────────────────────────────────────────────────────┘
```

### 단방향 데이터 흐름과 불변 스냅샷 (`GameSnapshot`)

`MinesweeperEngine`의 모든 상태 변경 메서드(`reveal`, `toggleFlag`, `chord`, `reset`, `setAlgorithm`)는 내부 상태를 갱신한 뒤 UI가 즉시 그릴 수 있는 **불변 스냅샷(`GameSnapshot`)**을 반환합니다.

React의 커스텀 훅 [`useMinesweeper.ts`](../src/ui/useMinesweeper.ts)는 아주 얇은 어댑터(Adapter) 역할만 수행합니다.

```typescript
const handleCellPrimaryAction = useCallback((row: number, col: number) => {
  setSnapshot(engineRef.current!.reveal(row, col));
}, []);
```

---

## 3. 난수 생성기 의존성 주입(DI)과 결정론적 단위 테스트

게임 로직을 테스트할 때 가장 까다로운 요소는 `Math.random()`에 의한 **무작위성(Non-determinism)**입니다. 실행할 때마다 지뢰 위치가 바뀌면 테스트가 어떨 때는 통과하고 어떨 때는 실패하는 Flaky Test가 됩니다.

이를 해결하기 위해 우리는 `MinesweeperEngine`과 `populateMines`가 외부에서 난수 생성 함수(`RandomGenerator`)를 주입받을 수 있도록 설계했습니다.

```typescript
// Mulberry32 기반 시드 난수 생성기: 동일한 시드면 항상 100% 동일한 난수 수열 생성
const rng = createSeededRandom(101);

const engine = new MinesweeperEngine({
  config: DIFFICULTY_PRESETS.beginner,
  rng,
});
```

### 단위 테스트 실행 (`tests/minesweeper.test.ts`)

브라우저나 DOM 없이 순수 Node 환경에서 Vitest로 수십 밀리초 만에 모든 핵심 로직을 검증할 수 있습니다.

```bash
npm test
```

검증 항목:
* **Step 01**: `createEmptyBoard`가 정확한 행/열 크기와 독립된 셀 참조를 생성하는지 검증
* **Step 02**: 모서리(3)·변(5)·중앙(8) 이웃 탐색 및 25개의 서로 다른 시드에서 3×3 첫 클릭 안전 구역에 지뢰가 0개인지 검증
* **Step 03**: 동일한 보드에서 `floodFillBFS`와 `floodFillDFS`가 정확히 같은 안전 셀 집합을 열고 깃발 칸을 보호하는지 검증
* **Step 04 & 05**: 첫 클릭 상태 전이(`idle -> playing`), 모든 안전 칸 오픈 시 승리(`won`), 지뢰 클릭 시 패배(`lost`), 그리고 `chord` 동작 검증
