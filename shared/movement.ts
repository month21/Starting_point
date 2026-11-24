export const exercises = {
  ankle: "앉아서 발목 움직이기",
  walk: "잠깐 걷기",
  stretch: "가볍게 기지개 켜기",
};
export type Exercise = keyof typeof exercises;
export type Mode = "fixed" | "custom";
export const interval = 30 * 60_000;
export const day = 24 * 60 * 60_000;
export const kstDay = (date: Date) =>
  Math.floor((date.getTime() + 9 * 3600_000) / day);

export function recommend(
  place: string,
  situation: string,
  preference: Exercise
): Exercise {
  if (situation === "quiet") return "ankle";
  if (place === "desk" && preference === "walk") return "stretch";
  return preference;
}

export function decide(
  active: boolean,
  classEnd: Date | undefined,
  recent: boolean
) {
  if (!active)
    return {
      decision: "skip",
      reason: "좌석 기록 종료 또는 일시정지",
    } as const;
  if (classEnd) return { decision: "defer", reason: "수업 중" } as const;
  if (recent)
    return { decision: "skip", reason: "최근 30분 이내 알림" } as const;
  return { decision: "send", reason: "좌석 시간 30분 경과" } as const;
}

type RecordRow = {
  shownAt: Date | null;
  respondedAt: Date | null;
  response: "done" | "dismiss" | null;
  mode: Mode;
  exercise: Exercise;
};
export function summarize(rows: RecordRow[], now: Date, enrolled: Date) {
  const today = kstDay(now);
  let count = 0;
  let weekCount = 0;
  const groups: Record<
    string,
    Record<string, { sent: number; done: number }>
  > = {
    mode: {},
    hour: {},
    weekday: {},
    exercise: {},
  };
  for (const row of rows) {
    if (row.response === "done" && row.respondedAt) {
      const age = today - kstDay(row.respondedAt);
      if (age === 0) count++;
      if (age >= 1 && age <= 7) weekCount++;
    }
    if (!row.shownAt) continue;
    const local = new Date(row.shownAt.getTime() + 9 * 3600_000);
    const keys = {
      mode: row.mode === "fixed" ? "고정" : "맞춤",
      hour: local.getUTCHours() + "시",
      weekday: "일월화수목금토"[local.getUTCDay()] + "요일",
      exercise: exercises[row.exercise],
    };
    for (const [axis, label] of Object.entries(keys)) {
      const group = (groups[axis][label] ??= { sent: 0, done: 0 });
      group.sent++;
      if (row.response === "done") group.done++;
    }
  }
  const goal =
    today - kstDay(enrolled) < 7
      ? 8
      : Math.min(16, Math.max(1, Math.ceil(weekCount / 7) + 1));
  return {
    goal,
    count,
    score: Math.min(100, Math.round((100 * count) / goal)),
    groups,
  };
}
