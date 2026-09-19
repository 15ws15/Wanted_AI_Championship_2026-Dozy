'use client';

import { useEffect, useState } from 'react';
import CalendarView from '@/components/CalendarView';
import ConfirmDelete from '@/components/ConfirmDelete';
import DayPanel from '@/components/DayPanel';
import EditDialog from '@/components/EditDialog';
import { planDay, todayStr } from '@/lib/date';
import { loadTasks, saveTasks } from '@/lib/storage';
import type { Task } from '@/types';

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loaded, setLoaded] = useState(false);
  // "오늘"은 브라우저에서만 정할 수 있다. 서버는 UTC라 미리 정해두면 새벽에 날짜가 어긋난다.
  const [picked, setPicked] = useState('');
  // 수정창은 페이지가 하나만 들고 있는다. 카드마다 하나씩 만들 이유가 없다.
  const [editing, setEditing] = useState<Task | null>(null);
  // 할 일 삭제는 되돌릴 수 없어서 한 번 묻는다. 쪼갠 행동은 묻지 않는다.
  const [deleting, setDeleting] = useState<Task | null>(null);

  useEffect(() => {
    setTasks(loadTasks());
    setPicked(todayStr());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) saveTasks(tasks);
  }, [tasks, loaded]);

  function addTask(title: string) {
    setTasks((ts) => [
      ...ts,
      {
        id: crypto.randomUUID(),
        title,
        createdAt: new Date().toISOString(),
        // 달력에서 고른 날이 곧 이 일을 하려는 날이다.
        dueDate: picked,
        completedAt: null,
        note: null,
        steps: [],
      },
    ]);
  }

  return (
    <main className="mx-auto w-full max-w-xl px-5 pb-20 pt-12 sm:pt-20 lg:max-w-5xl">
      <header className="mb-9">
        <h1 className="font-serif text-2xl tracking-tight">Dozy</h1>
        <p className="mt-1.5 text-sm text-mute">
          시작하기 어려운 일을, 지금 할 수 있는 한 가지로.
          {/* 제목과 같은 세리프로 적어 이름의 유래(Do + easy)가 드러나게 한다.
              색을 흐리면 대비가 4.5:1 아래로 떨어져서, 구분은 서체에만 맡긴다. */}
          <span className="ml-2 whitespace-nowrap font-serif">Do easy.</span>
        </p>
      </header>

      {loaded && (
        // 넓은 화면에서는 달력을 왼쪽에 세워두고 오른쪽에서 그 날 목록을 다룬다.
        // items-start가 없으면 칸이 늘어나 sticky가 걸리지 않는다.
        <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-12">
          <div className="lg:sticky lg:top-8">
            <CalendarView tasks={tasks} picked={picked} onPick={setPicked} />
          </div>

          <DayPanel
            picked={picked}
            tasks={tasks.filter((t) => planDay(t) === picked)}
            firstRun={tasks.length === 0}
            onAdd={addTask}
            onChange={(id, fn) => setTasks((ts) => ts.map((t) => (t.id === id ? fn(t) : t)))}
            onRemove={setDeleting}
            onEdit={setEditing}
          />
        </div>
      )}

      <ConfirmDelete
        task={deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          setTasks((ts) => ts.filter((t) => t.id !== deleting?.id));
          setDeleting(null);
        }}
      />

      <EditDialog
        task={editing}
        onClose={() => setEditing(null)}
        onSave={(patch) => {
          setTasks((ts) => ts.map((t) => (t.id === editing?.id ? { ...t, ...patch } : t)));
          setEditing(null);
        }}
      />
    </main>
  );
}
