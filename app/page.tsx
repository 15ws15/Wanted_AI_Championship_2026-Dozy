'use client';

import { useEffect, useState } from 'react';
import CalendarView from '@/components/CalendarView';
import ConfirmDelete from '@/components/ConfirmDelete';
import DayPanel from '@/components/DayPanel';
import EditDialog from '@/components/EditDialog';
import { planDay, todayStr } from '@/lib/date';
import { firebaseEnabled, getAnonymousUid } from '@/lib/firebase';
import { changeTask, createTask, removeTask, subscribeToTasks } from '@/lib/task-sync';
import { loadTasks, saveTasks } from '@/lib/storage';
import type { Task } from '@/types';

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [cloudReady, setCloudReady] = useState(false);
  const [localMode, setLocalMode] = useState(!firebaseEnabled);
  const [syncError, setSyncError] = useState<string | null>(null);
  // "오늘"은 브라우저에서만 정할 수 있다. 서버는 UTC라 미리 정해두면 새벽에 날짜가 어긋난다.
  const [picked, setPicked] = useState('');
  // 수정창은 페이지가 하나만 들고 있는다. 카드마다 하나씩 만들 이유가 없다.
  const [editing, setEditing] = useState<Task | null>(null);
  // 할 일 삭제는 되돌릴 수 없어서 한 번 묻는다. 쪼갠 행동은 묻지 않는다.
  const [deleting, setDeleting] = useState<Task | null>(null);

  useEffect(() => {
    setPicked(todayStr());
    if (!firebaseEnabled) {
      setTasks(loadTasks());
      setLocalMode(true);
      setLoaded(true);
      return;
    }

    let active = true;
    let unsubscribe: (() => void) | undefined;
    void (async () => {
      try {
        const anonymousUid = await getAnonymousUid();
        if (!active || !anonymousUid) throw new Error('Anonymous authentication is unavailable.');
        setCloudReady(true);
        unsubscribe = subscribeToTasks(
          (nextTasks) => {
            if (!active) return;
            setTasks(nextTasks);
            setLoaded(true);
          },
          () => {
            if (!active) return;
            setSyncError('실시간 동기화에 연결하지 못했어요. 잠시 후 다시 열어 주세요.');
            setLoaded(true);
          },
        );
      } catch {
        if (!active) return;
        setTasks(loadTasks());
        setLocalMode(true);
        setSyncError('동기화 설정을 확인해 주세요. 이 기기에는 임시로 저장할게요.');
        setLoaded(true);
      }
    })();

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (loaded && localMode) saveTasks(tasks);
  }, [tasks, loaded, localMode]);

  function addTask(title: string) {
    const task: Task = {
      id: crypto.randomUUID(),
      title,
      createdAt: new Date().toISOString(),
      // 달력에서 고른 날이 곧 이 일을 하려는 날이다.
      dueDate: picked,
      completedAt: null,
      note: null,
      steps: [],
    };
    if (!cloudReady) {
      setTasks((ts) => [...ts, task]);
      return;
    }
    void createTask(task).catch(() => setSyncError('할 일을 추가하지 못했어요. 다시 시도해 주세요.'));
  }

  function updateTask(id: string, change: (task: Task) => Task) {
    if (!cloudReady) {
      setTasks((ts) => ts.map((task) => (task.id === id ? change(task) : task)));
      return;
    }
    void changeTask(id, change).catch(() => setSyncError('변경사항을 저장하지 못했어요. 다시 시도해 주세요.'));
  }

  function deleteTask(taskId: string) {
    if (!cloudReady) {
      setTasks((ts) => ts.filter((task) => task.id !== taskId));
      return;
    }
    void removeTask(taskId).catch(() => setSyncError('할 일을 삭제하지 못했어요. 다시 시도해 주세요.'));
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

      {syncError && <p role="status" className="mb-5 text-sm text-mute">{syncError}</p>}

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
            onChange={updateTask}
            onRemove={setDeleting}
            onEdit={setEditing}
          />
        </div>
      )}

      <ConfirmDelete
        task={deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) deleteTask(deleting.id);
          setDeleting(null);
        }}
      />

      <EditDialog
        task={editing}
        onClose={() => setEditing(null)}
        onSave={(patch) => {
          if (editing) updateTask(editing.id, (task) => ({ ...task, ...patch }));
          setEditing(null);
        }}
      />
    </main>
  );
}
