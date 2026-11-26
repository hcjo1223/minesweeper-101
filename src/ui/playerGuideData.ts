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

export const PLAYER_GUIDE_STEPS: readonly PlayerGuideStep[] = [
  {
    stepNumber: 'Step 01',
    title: '숫자가 알려주는 비밀 (주변 8칸)',
    badge: '기초 규칙',
    summary:
      '보드에 나타나는 숫자 1~8은 해당 칸을 둘러싼 8방향(상하좌우 + 대각선) 이웃 칸 안에 숨어 있는 지뢰의 총 개수입니다.',
    actionRule:
      '첫 클릭한 칸과 주변 8칸에는 절대 지뢰가 나오지 않으니 안심하고 아무 곳이나 눌러 시작하세요. 보드 중앙 부근을 열면 넓은 안전 지대가 열리기 쉽습니다.',
    proTip:
      '숫자가 없는 빈 칸은 주변 8칸이 모두 안전하다는 뜻이므로 자동으로 연쇄 확장됩니다.',
    miniBoardCols: 3,
    miniBoardCaption:
      '중앙의 숫자 1은 테두리 8칸 중 정확히 1곳에 지뢰가 있다는 신호입니다.',
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
    title: '찍지 않고 100% 확정 찾기',
    badge: '핵심 추론',
    summary:
      '지뢰찾기는 운이 아니라 논리 게임입니다. 다음 두 가지 기본 공식만 기억해도 초급·중급 보드의 대부분을 실수 없이 풀 수 있습니다.',
    actionRule:
      '① 닫힌 칸 개수 = 숫자이면 그 닫힌 칸들은 100% 지뢰(깃발 꽂기). ② 주변 깃발 개수 = 숫자이면 나머지 닫힌 칸은 100% 안전(열기).',
    proTip:
      '모서리에 튀어나온 숫자 1 옆에 닫힌 칸이 딱 1개만 남았다면? 고민할 필요 없이 바로 깃발을 꽂으세요!',
    miniBoardCols: 3,
    miniBoardCaption:
      '위 1 주변 닫힌 칸이 1개뿐 → 100% 지뢰 / 가운데 1은 깃발 1개 충족 → 오른쪽은 안전!',
    miniBoard: [
      { label: '1', tone: 'focus', numberColor: 1 },
      { icon: 'flag', tone: 'mine-target' },
      { label: '1', tone: 'open', numberColor: 1 },
      { label: '1', tone: 'focus', numberColor: 1 },
      { icon: 'flag', tone: 'flag' },
      { icon: 'check', tone: 'safe-target' },
      { tone: 'open' },
      { label: '1', tone: 'open', numberColor: 1 },
      { tone: 'open' },
    ],
  },
  {
    stepNumber: 'Step 03',
    title: '가장 많이 쓰는 "1-1 패턴"',
    badge: '필수 패턴',
    summary:
      '벽(보드 끝이나 이미 열린 안전 구역)에 붙어 있는 숫자 1과 1이 나란히 있을 때, 안쪽 1이 지뢰 1개를 이미 품고 있어 바깥쪽 세 번째 칸은 무조건 안전해집니다.',
    actionRule:
      '벽 쪽 첫 번째 1의 범위(2칸)가 두 번째 1의 범위(3칸) 안에 완전히 들어가면, 두 번째 1의 남은 바깥쪽 1칸(체크)은 절대 지뢰가 될 수 없습니다.',
    proTip:
      '긴 직선 경계선에서 막혔을 때 1-1 패턴이 있는지 먼저 훑어보면 바로 돌파구가 열립니다.',
    miniBoardCols: 4,
    miniBoardCaption:
      '왼쪽 두 칸 중 1곳이 지뢰이므로, 오른쪽 1이 보는 3번째 칸(체크)은 100% 안전합니다.',
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
    title: '지뢰를 콕 집어내는 "1-2 패턴"',
    badge: '고수 공식',
    summary:
      '가로 또는 세로로 숫자 1과 2가 나란히 붙어 있을 때, 1 쪽에서 최대 1개의 지뢰만 담당할 수 있으므로 2의 바깥쪽 튀어나온 칸은 반드시 지뢰가 됩니다.',
    actionRule:
      '1과 2가 같은 2칸을 공유하고 2가 바깥 1칸을 더 본다면, 2 - 1 = 1 공식에 의해 바깥쪽 1칸(깃발)은 100% 지뢰입니다.',
    proTip:
      '1-2-1이 연달아 나오면 양쪽 끝이 모두 지뢰, 가운데 칸이 안전이라는 사실도 같은 원리로 한 번에 풀립니다!',
    miniBoardCols: 4,
    miniBoardCaption:
      '왼쪽 두 칸에는 지뢰가 1개뿐이므로, 2의 오른쪽 바깥 칸(깃발)은 무조건 지뢰입니다.',
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
    title: '빠른 열기(Chording) & 실전 팁',
    badge: '스피드 팁',
    summary:
      '지뢰 위치에 깃발을 꽂았다면 나머지 안전 칸을 하나씩 클릭할 필요가 없습니다. 이미 열린 숫자를 직접 클릭하면 주변 안전 칸을 한 번에 열어줍니다.',
    actionRule:
      '숫자 주변에 그 숫자만큼의 깃발을 꽂은 뒤 해당 숫자를 클릭(또는 더블클릭)하세요. 모바일에서도 열린 숫자를 한 번만 탭하면 바로 동작합니다.',
    proTip:
      '잘못된 깃발을 꽂은 채로 빠른 열기를 누르면 진짜 지뢰가 터질 수 있으니, 숫자 주변 깃발 개수가 맞는지 확인한 뒤 실행하세요!',
    miniBoardCols: 3,
    miniBoardCaption:
      '깃발 2개를 정확히 꽂은 뒤 숫자 2를 클릭하면 나머지 안전 칸이 동시에 열립니다.',
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
];
