'use client';

import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  runTransaction,
  setDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Task } from '@/types';

const SHARED_BOARD_ID = 'public';

const isTask = (value: unknown): value is Task => {
  if (!value || typeof value !== 'object') return false;
  const task = value as Task;
  return (
    typeof task.id === 'string' &&
    typeof task.title === 'string' &&
    typeof task.createdAt === 'string' &&
    (task.dueDate === null || typeof task.dueDate === 'string') &&
    (task.completedAt === null || typeof task.completedAt === 'string') &&
    (task.note === null || typeof task.note === 'string') &&
    Array.isArray(task.steps)
  );
};

function tasksRef() {
  if (!db) throw new Error('Firebase is not configured.');
  return collection(db, 'shared', SHARED_BOARD_ID, 'tasks');
}

function taskRef(taskId: string) {
  if (!db) throw new Error('Firebase is not configured.');
  return doc(db, 'shared', SHARED_BOARD_ID, 'tasks', taskId);
}

export function subscribeToTasks(
  onTasks: (tasks: Task[]) => void,
  onError: (error: Error) => void,
) {
  return onSnapshot(
    tasksRef(),
    (snapshot) => {
      const tasks = snapshot.docs
        .map((item) => item.data())
        .filter(isTask)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      onTasks(tasks);
    },
    (error) => onError(error),
  );
}

export function createTask(task: Task) {
  return setDoc(taskRef(task.id), task);
}

export async function changeTask(taskId: string, change: (task: Task) => Task) {
  if (!db) throw new Error('Firebase is not configured.');
  const ref = taskRef(taskId);
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(ref);
    const current = snapshot.data();
    if (!snapshot.exists() || !isTask(current)) throw new Error('Task no longer exists.');
    const next = change(current);
    if (!isTask(next) || next.id !== taskId) throw new Error('Invalid task update.');
    transaction.set(ref, next);
  });
}

export function removeTask(taskId: string) {
  return deleteDoc(taskRef(taskId));
}
