export type MiniCellTone =
  | 'open'
  | 'hidden'
  | 'flag'
  | 'focus'
  | 'safe-target'
  | 'mine-target';

export interface MiniBoardCell {
  readonly label?: string;
  readonly icon?: 'flag' | 'check';
  readonly tone: MiniCellTone;
  readonly numberColor?: number;
}

export interface PlayerGuideStep {
  readonly stepNumber: string;
  readonly title: string;
  readonly badge: string;
  readonly summary: string;
  readonly actionRule: string;
  readonly proTip: string;
  readonly miniBoardCols: number;
  readonly miniBoardCaption: string;
  readonly miniBoard: readonly MiniBoardCell[];
}

export interface PracticePuzzle {
  readonly id: string;
  readonly difficultyLabel: string;
  readonly title: string;
  readonly prompt: string;
  readonly cols: number;
  readonly targetType: 'safe' | 'mine';
  readonly targetIndices: readonly number[];
  readonly explanation: string;
  readonly cells: readonly MiniBoardCell[];
}

export const PLAYER_GUIDE_STEPS: readonly PlayerGuideStep[] = [
  {
    stepNumber: 'Step 01',
    title: '규칙과 난이도 기준 (지뢰 비율 & 3BV)',
    badge: '기초 규칙',
    summary:
      '숫자 1~8은 해당 칸을 둘러싼 8칸(3×3) 안에 숨어 있는 지뢰의 개수입니다. 지뢰를 제외한 모든 안전 칸을 열면(모든 지뢰에 깃발을 꽂지 않아도) 즉시 승리합니다.',
    actionRule:
      '초급(9×9, 10개 · 밀도 12.3%) → 중급(16×16, 40개 · 밀도 15.6%) → 상급(30×16, 99개 · 밀도 20.6%). 지뢰 비율이 20%를 넘어가면 추론이 한층 까다로워집니다.',
    proTip:
      '숙련자들이 실력을 비교할 때는 깃발 없이 보드를 깨는 최소 클릭 수인 "3BV"와 클릭 효율(3BV ÷ 클릭 수)을 지표로 사용합니다.',
    miniBoardCols: 3,
    miniBoardCaption:
      '중앙의 숫자 1은 주변 8칸 중 1곳에만 지뢰가 있음을 뜻하며, 첫 클릭 주변 8칸은 항상 안전합니다.',
    miniBoard: [
      { tone: 'hidden' },
      { tone: 'hidden' },
      { tone: 'hidden' },
      { tone: 'hidden' },
      { label: '1', tone: 'focus', numberColor: 1 },
      { tone: 'hidden' },
      { tone: 'hidden' },
      { tone: 'hidden' },
      { icon: 'flag', tone: 'mine-target' },
    ],
  },
  {
    stepNumber: 'Step 02',
    title: '기본 확정 & 조작 (양클릭 · 물음표 · NF)',
    badge: '핵심 조작',
    summary:
      '가장 기본이 되는 두 가지 확정 규칙과 클래식 지뢰찾기의 빠른 조작법(화음/Chording, 물음표, 노플래그)을 익히세요.',
    actionRule:
      '① 닫힌 칸 수 = 숫자 → 전부 지뢰(깃발). ② 주변 깃발 수 = 숫자 → 나머지 닫힌 칸은 전부 안전(열기). 깃발을 다 꽂은 숫자를 누르면(양클릭/Shift+클릭/휠클릭) 주변이 한 번에 열립니다.',
    proTip:
      '확신이 없을 때는 우클릭 2번으로 물음표(?)를 남겨두고, 반대로 기록 단축을 원한다면 깃발을 아예 쓰지 않는 노플래그(NF) 플레이에도 도전해 보세요!',
    miniBoardCols: 3,
    miniBoardCaption:
      '깃발 2개를 맞춘 숫자 2를 클릭(양클릭/화음)하면 나머지 안전 칸(✓)이 동시에 열립니다.',
    miniBoard: [
      { icon: 'flag', tone: 'flag' },
      { icon: 'check', tone: 'safe-target' },
      { icon: 'check', tone: 'safe-target' },
      { icon: 'check', tone: 'safe-target' },
      { label: '2', tone: 'focus', numberColor: 2 },
      { icon: 'flag', tone: 'flag' },
      { icon: 'check', tone: 'safe-target' },
      { icon: 'check', tone: 'safe-target' },
      { icon: 'check', tone: 'safe-target' },
    ],
  },
  {
    stepNumber: 'Step 03',
    title: '부분집합 원리 (1-1 패턴 & 모퉁이)',
    badge: '필수 정석',
    summary:
      '작은 숫자의 닫힌 칸 영역이 이웃한 숫자의 닫힌 칸 영역 안에 완전히 포함될 때(부분집합), 두 영역의 지뢰 수 차이로 바깥쪽 칸의 정체를 100% 확정할 수 있습니다.',
    actionRule:
      '벽에 붙은 1-1에서 첫 번째 1의 2칸이 두 번째 1의 3칸에 완전히 포함되므로, 3번째 바깥 칸(✓)은 절대 지뢰가 될 수 없습니다.',
    proTip:
      '모퉁이에 1-3이나 2-4가 붙어 있을 때도 같은 부분집합 원리로 바깥쪽 칸들이 모두 지뢰임을 한눈에 잡아낼 수 있습니다.',
    miniBoardCols: 4,
    miniBoardCaption:
      '왼쪽 1이 보는 2칸에 이미 지뢰 1개가 들어가므로, 오른쪽 1의 3번째 바깥 칸(✓)은 100% 안전합니다.',
    miniBoard: [
      { tone: 'hidden' },
      { tone: 'hidden' },
      { icon: 'check', tone: 'safe-target' },
      { tone: 'hidden' },
      { label: '1', tone: 'focus', numberColor: 1 },
      { label: '1', tone: 'focus', numberColor: 1 },
      { label: '1', tone: 'open', numberColor: 1 },
      { tone: 'open' },
      { tone: 'open' },
      { tone: 'open' },
      { tone: 'open' },
      { tone: 'open' },
    ],
  },
  {
    stepNumber: 'Step 04',
    title: '차집합 원리 (1-2 · 1-2-1 · 1-2-2-1 본질)',
    badge: '고수 정석',
    summary:
      '인터넷에 떠도는 1-2-1, 1-2-2-1 공식은 사실 별도의 암기 공식이 아니라 기본 "1-2 차집합"을 좌우로 이어 붙인 것에 불과합니다. 차집합 원리 하나만 알면 1-3, 1-4, 꺾인 패턴까지 모두 풀립니다.',
    actionRule:
      '두 숫자가 영역을 공유할 때 (큰 숫자 - 작은 숫자 = 큰 숫자 쪽 바깥 칸 개수)가 성립하면, 큰 숫자 바깥 칸은 100% 지뢰이고 반대쪽 바깥 칸은 100% 안전합니다!',
    proTip:
      '이미 꽂힌 깃발 수를 숫자에서 빼서 생각하세요. 예: 깃발 1개가 붙은 2와 3이 나란히 있으면 실질적으로는 1-2 패턴과 똑같습니다.',
    miniBoardCols: 4,
    miniBoardCaption:
      '1과 2의 차이(2 - 1 = 1)가 오른쪽 바깥 1칸(깃발)과 같으므로 해당 칸은 100% 지뢰, 그다음 왼쪽 바깥은 안전!',
    miniBoard: [
      { tone: 'hidden' },
      { tone: 'hidden' },
      { icon: 'flag', tone: 'mine-target' },
      { tone: 'hidden' },
      { label: '1', tone: 'focus', numberColor: 1 },
      { label: '2', tone: 'focus', numberColor: 2 },
      { label: '1', tone: 'open', numberColor: 1 },
      { tone: 'open' },
      { tone: 'open' },
      { tone: 'open' },
      { tone: 'open' },
      { tone: 'open' },
    ],
  },
  {
    stepNumber: 'Step 05',
    title: '마인 카운팅 & 찍기(50:50) 이해하기',
    badge: '종반 운영',
    summary:
      '게임 후반부에는 "남은 지뢰 개수" 자체가 가장 강력한 힌트가 됩니다. 서로 겹치지 않는 숫자 구역들의 지뢰 합이 보드에 남은 지뢰 수와 같다면 그 밖의 모든 닫힌 칸은 안전합니다.',
    actionRule:
      '만약 남은 지뢰와 닫힌 칸이 완벽히 대칭을 이루어 논리적 단서가 전혀 없다면(찍기 구간), 다른 구역을 먼저 열어 남은 지뢰 수로 풀 수 있는지 확인한 뒤 마지막에 선택하세요.',
    proTip:
      '나무위키 공략에서도 억지 가정법(찍기 노가다)보다는 부분집합 → 차집합 → 마인 카운팅 순서로 빠르고 정확하게 스캔하는 것을 권장합니다.',
    miniBoardCols: 4,
    miniBoardCaption:
      '남은 지뢰가 2개일 때 위 1과 아래 1이 각각 1개씩을 확정 점유한다면, 구석의 남은 칸(✓)은 100% 안전!',
    miniBoard: [
      { tone: 'hidden' },
      { tone: 'hidden' },
      { label: '1', tone: 'focus', numberColor: 1 },
      { icon: 'check', tone: 'safe-target' },
      { tone: 'open' },
      { tone: 'open' },
      { tone: 'open' },
      { tone: 'open' },
      { tone: 'hidden' },
      { tone: 'hidden' },
      { label: '1', tone: 'focus', numberColor: 1 },
      { tone: 'open' },
    ],
  },
];

/**
 * 나무위키 '지뢰 찾기/공략' 4절 풀어보기 스타일 실전 인터랙티브 퀴즈
 */
export const PRACTICE_PUZZLES: readonly PracticePuzzle[] = [
  {
    id: 'quiz-1-1',
    difficultyLabel: '쉬움 · 부분집합',
    title: 'Q1. 100% 안전한 칸 하나를 클릭하세요',
    prompt: '벽(위쪽 끝)에 붙은 숫자 1과 1을 비교해, 지뢰가 절대 없는 칸을 찾아보세요.',
    cols: 4,
    targetType: 'safe',
    targetIndices: [6],
    explanation:
      '정답입니다! 1행 2열의 1 때문에 2행 1~2열 중 1곳에 지뢰가 있으므로, 1행 3열의 1이 보는 2행 3열은 100% 안전합니다.',
    cells: [
      { tone: 'open' },
      { label: '1', tone: 'focus', numberColor: 1 },
      { label: '1', tone: 'focus', numberColor: 1 },
      { tone: 'open' },
      { tone: 'hidden' },
      { tone: 'hidden' },
      { tone: 'hidden' },
      { tone: 'open' },
      { tone: 'open' },
      { tone: 'open' },
      { tone: 'open' },
      { tone: 'open' },
    ],
  },
  {
    id: 'quiz-1-2',
    difficultyLabel: '보통 · 차집합 1-2',
    title: 'Q2. 100% 지뢰가 있는 칸을 클릭하세요',
    prompt: '2와 3 사이에 이미 깃발이 1개 꽂혀 있습니다. 반드시 지뢰가 숨어 있는 칸은 어디일까요?',
    cols: 4,
    targetType: 'mine',
    targetIndices: [3],
    explanation:
      '정답입니다! 왼쪽 깃발(1개)을 빼고 생각하면 실제로는 "1-2 패턴"입니다. 따라서 오른쪽 3의 바깥쪽(1행 4열)이 100% 지뢰입니다!',
    cells: [
      { tone: 'hidden' },
      { tone: 'hidden' },
      { tone: 'hidden' },
      { tone: 'hidden' },
      { icon: 'flag', tone: 'flag' },
      { label: '2', tone: 'focus', numberColor: 2 },
      { label: '3', tone: 'focus', numberColor: 3 },
      { tone: 'open' },
      { tone: 'open' },
      { tone: 'open' },
      { tone: 'open' },
      { tone: 'open' },
    ],
  },
  {
    id: 'quiz-1-2-1',
    difficultyLabel: '도전 · 1-2-1 복합',
    title: 'Q3. 가운데가 안전할까요, 양옆이 지뢰일까요? 안전한 칸을 고르세요!',
    prompt: '가로로 놓인 1 - 2 - 1 패턴에서 100% 안전한 칸(지뢰가 없는 칸)을 클릭하세요.',
    cols: 5,
    targetType: 'safe',
    targetIndices: [2],
    explanation:
      '정답입니다! 가운데 2는 양쪽 1이 담당하는 구역(2행 2열, 2행 4열)에서 지뢰 1개씩을 모두 받아야 하므로, 정중앙(1행 3열)은 100% 안전합니다!',
    cells: [
      { tone: 'hidden' },
      { tone: 'hidden' },
      { tone: 'hidden' },
      { tone: 'hidden' },
      { tone: 'hidden' },
      { tone: 'open' },
      { label: '1', tone: 'focus', numberColor: 1 },
      { label: '2', tone: 'focus', numberColor: 2 },
      { label: '1', tone: 'focus', numberColor: 1 },
      { tone: 'open' },
      { tone: 'open' },
      { tone: 'open' },
      { tone: 'open' },
      { tone: 'open' },
      { tone: 'open' },
    ],
  },
];
