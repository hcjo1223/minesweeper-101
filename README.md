# 💣 Minesweeper 101

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg)
![React](https://img.shields.io/badge/React-19-61DAFB.svg)
![Vite](https://img.shields.io/badge/Vite-8.x-646CFF.svg)

> **Play the classic game, master the underlying algorithms.**  
> 지뢰찾기(Minesweeper) 게임을 직접 플레이하고, 그 속에 숨겨진 2차원 배열 제어, 탐색 알고리즘(Flood Fill), 그리고 깔끔한 상태 관리 아키텍처를 단계별로 학습하는 오픈소스 프로젝트입니다.

---

## 🎯 프로젝트 소개 (About)

단순히 동작하는 클론 코딩을 넘어 **"왜 이렇게 설계했는가?"**에 집중합니다.  
이 레포지토리는 크게 두 가지 영역으로 구성되어 있습니다.

1. **Interactive Game (`src/`)**: 첫 클릭 안전 보장(First-Click Safe), 깃발 꽂기, 난이도 조절, 실시간 BFS/DFS 탐색 순서 시각화 등 클래식 지뢰찾기의 모든 기능이 구현된 플레이 가능한 게임입니다.
2. **Step-by-Step Learning Guide (`docs/`)**: 보드 생성부터 재귀/BFS 탐색까지, 게임 개발과 코딩 테스트에 필수적인 핵심 로직을 5단계 튜토리얼로 분해하여 설명합니다.

### ✨ 주요 기능
* **첫 클릭 보호 로직**: 첫 번째로 연 칸과 그 주변 8칸(3×3 구역)에는 절대 지뢰가 배치되지 않도록 동적 생성
* **빈 칸 연쇄 확장 (Flood Fill)**: 인접 지뢰가 `0`인 셀을 클릭했을 때 주변 안전 구역을 자동으로 탐색 및 오픈 (큐 기반 **BFS**와 재귀 기반 **DFS** 실시간 비교 및 탐색 순번 `#1, #2...` 시각화 지원)
* **난이도 프리셋**: 초급(9×9, 10개), 중급(16×16, 40개), 고급(30×16, 99개) 지원
* **순수 로직 분리**: UI 렌더링 코드(`src/ui/`)와 게임 코어 엔진 로직(`src/core/`)의 철저한 분리 및 결정론적 단위 테스트(`tests/`)

---

## 🚀 시작하기 (Getting Started)

### 사전 요구사항
* Node.js v20 이상

### 설치 및 실행

```bash
# 1. 레포지토리 클론
git clone https://github.com/hcjo1223/minesweeper-101.git

# 2. 프로젝트 폴더로 이동
cd minesweeper-101

# 3. 의존성 패키지 설치
npm install

# 4. 로컬 개발 서버 실행
npm run dev
```

브라우저에서 `http://localhost:5173` (또는 터미널에 표시된 로컬 주소)으로 접속하여 바로 게임을 플레이할 수 있습니다.

### 단위 테스트 및 프로덕션 빌드

```bash
# 코어 엔진 및 알고리즘 단위 테스트 실행 (Vitest)
npm test

# 프로덕션 번들 빌드 검증
npm run build
```

---

## 📚 학습 로드맵 (Learning Roadmap)

코드를 처음부터 끝까지 한 번에 읽지 말고, 아래 커리큘럼 순서대로 `docs/` 문서와 `src/` 코드를 대조하며 학습하는 것을 권장합니다.

| 단계 | 주제 | 핵심 학습 키워드 | 가이드 문서 |
| :---: | :--- | :--- | :--- |
| **Step 01** | 보드 설계와 데이터 모델링 | 2차원 배열(Grid), 셀 상태(`isMine`, `isRevealed`, `isFlagged`) 설계 | [01-board-modeling.md](./docs/01-board-modeling.md) |
| **Step 02** | 지뢰 배치와 8방향 탐색 | Fisher-Yates 셔플, 방향 벡터(`dx`, `dy`), 경계값 처리 | [02-mine-placement.md](./docs/02-mine-placement.md) |
| **Step 03** | 빈 칸 연쇄 확장 알고리즘 | Flood Fill, 재귀(Recursion) vs 큐 기반 BFS 성능·스택 비교 | [03-flood-fill.md](./docs/03-flood-fill.md) |
| **Step 04** | 게임 루프와 승패 판정 | 첫 클릭 안전 알고리즘, 승리 조건 체크, 타이머 상태 관리 | [04-game-loop.md](./docs/04-game-loop.md) |
| **Step 05** | UI 분리 및 아키텍처 개선 | 헤드리스(Headless) 코어 엔진 분리, 단위 테스트 작성 | [05-architecture.md](./docs/05-architecture.md) |

---

## 📂 디렉토리 구조 (Project Structure)

```text
minesweeper-101/
├── docs/                  # 단계별 알고리즘 및 설계 학습 가이드 (Markdown)
│   ├── 01-board-modeling.md
│   ├── 02-mine-placement.md
│   ├── 03-flood-fill.md
│   ├── 04-game-loop.md
│   └── 05-architecture.md
├── src/
│   ├── core/              # UI에 의존하지 않는 순수 지뢰찾기 게임 엔진
│   │   ├── types.ts
│   │   ├── board.ts
│   │   ├── floodFill.ts
│   │   └── MinesweeperEngine.ts
│   ├── ui/                # React 화면 렌더링, 인터랙티브 인스펙터 및 입력 이벤트 처리
│   │   ├── GameControls.tsx
│   │   ├── MinesweeperBoard.tsx
│   │   ├── AlgorithmInspector.tsx
│   │   ├── curriculumData.ts
│   │   └── useMinesweeper.ts
│   └── utils/             # 8방향 벡터, 시드 기반 난수 생성 및 Fisher-Yates 셔플 유틸리티
│       ├── directions.ts
│       └── random.ts
├── tests/                 # 코어 로직 검증을 위한 단위 테스트 (Vitest)
│   └── minesweeper.test.ts
├── LICENSE
└── README.md
```

---

## 🤝 기여하기 (Contributing)

학습 내용 보완, 새로운 알고리즘 풀이(예: 자동 지뢰찾기 Solver 구현), 버그 수정 등 모든 기여를 환영합니다.

1. 이 레포지토리를 Fork 합니다.
2. 새로운 브랜치를 생성합니다 (`git checkout -b feature/solver-algorithm`).
3. 변경 사항을 커밋합니다 (`git commit -m 'Add: 확률 기반 지뢰찾기 솔버 예제 추가'`).
4. 브랜치에 Push 후 Pull Request를 생성해 주세요.

---

## 📄 라이선스 (License)

이 프로젝트는 [MIT License](./LICENSE)를 따릅니다. 학습 및 개인 프로젝트에 자유롭게 활용하세요.
