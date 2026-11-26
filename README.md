# 💣 Minesweeper 101

> **Play the classic game, master the underlying algorithms.**  
> 지뢰찾기(Minesweeper) 게임을 직접 플레이하고, 그 속에 숨겨진 2차원 배열 제어, 탐색 알고리즘(Flood Fill), 그리고 깔끔한 상태 관리 아키텍처를 단계별로 학습하는 오픈소스 프로젝트입니다.

---

## 🎯 프로젝트 소개 (About)

단순히 동작하는 클론 코딩을 넘어 **"왜 이렇게 설계했는가?"**에 집중합니다.  
이 레포지토리는 크게 두 가지 영역으로 구성되어 있습니다.

1. **Interactive Game (`src/`)**: 첫 클릭 안전 보장(First-Click Safe), 깃발 꽂기, 난이도 조절 등 클래식 지뢰찾기의 모든 기능이 구현된 플레이 가능한 게임입니다.
2. **Step-by-Step Learning Guide (`docs/`)**: 보드 생성부터 재귀/BFS 탐색까지, 게임 개발과 코딩 테스트에 필수적인 핵심 로직을 5단계 튜토리얼로 분해하여 설명합니다.

### ✨ 주요 기능
* **첫 클릭 보호 로직**: 첫 번째로 연 칸과 그 주변 8칸에는 절대 지뢰가 배치되지 않도록 동적 생성
* **빈 칸 연쇄 확장 (Flood Fill)**: 인접 지뢰가 `0`인 셀을 클릭했을 때 주변 안전 구역을 자동으로 탐색 및 오픈
* **난이도 프리셋**: 초급(9×9, 10개), 중급(16×16, 40개), 고급(30×16, 99개) 지원
* **순수 로직 분리**: UI 렌더링 코드와 게임 코어 엔진 로직의 철저한 분리

---

## 🚀 시작하기 (Getting Started)

### 사전 요구사항
* Node.js v20 이상 (또는 사용 중인 런타임 환경으로 변경)

### 설치 및 실행

```bash
# 1. 레포지토리 클론
git clone [https://github.com/your-username/minesweeper-101.git](https://github.com/your-username/minesweeper-101.git)

# 2. 프로젝트 폴더로 이동
cd minesweeper-101

# 3. 의존성 패키지 설치
npm install

# 4. 로컬 개발 서버 실행
npm run dev
