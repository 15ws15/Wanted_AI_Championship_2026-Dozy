'use client';

// 몸이 막는 일과 막막함이 막는 일을 섞어 둔다. 둘을 눌러보면 처방이 다르다는 것을
// 설명 없이 알게 된다 — 이 서비스가 일반적인 투두앱과 갈리는 지점이다.
const EXAMPLES = ['보고서 작성', '발표자료 만들기', '운동하기', '방 청소'];

export default function EmptyState({ onPick }: { onPick: (title: string) => void }) {
  return (
    <div className="mt-10">
      <p className="text-sm leading-loose text-mute">
        할 일을 하나 적어 보세요.
        <br />
        막막하면 <span className="text-ink">쪼개기</span>를 누르면 돼요.
        <br />
        지금 5분 안에 할 수 있는 행동 하나로 바꿔 드릴게요.
      </p>

      <p className="mt-7 text-[13px] text-mute/80">눌러서 바로 넣어볼 수도 있어요</p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {EXAMPLES.map((title) => (
          <li key={title}>
            <button
              onClick={() => onPick(title)}
              className="min-h-11 rounded-full border border-line-strong px-4 text-[13px] text-mute transition-colors hover:border-accent hover:bg-accent-wash hover:text-accent"
            >
              {title}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
