import { trpc } from "@/lib/trpc";
import { CalendarDays, Clock3, Coffee, Pause, Play, Plus, Sparkles, Sprout, Square, TimerReset } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type TimeEntry = {
  id: number;
  type: "seat" | "focus";
  label: string | null;
  startedAt: Date;
  endedAt: Date | null;
  runningStartedAt: Date | null;
  elapsedSeconds: number;
  status: "running" | "paused" | "completed";
};

const dayKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const asDate = (value: Date | string) => value instanceof Date ? value : new Date(value);
const formatDuration = (seconds: number) => `${String(Math.floor(seconds / 3600)).padStart(2, "0")}:${String(Math.floor(seconds % 3600 / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
const formatHours = (seconds: number) => seconds >= 3600 ? `${Math.floor(seconds / 3600)}시간 ${Math.floor(seconds % 3600 / 60)}분` : `${Math.floor(seconds / 60)}분`;

function useLiveSeconds(entry?: TimeEntry) {
  const [current, setCurrent] = useState(() => Date.now());
  useEffect(() => {
    if (entry?.status !== "running") return;
    const timer = window.setInterval(() => setCurrent(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [entry?.id, entry?.status]);
  if (!entry) return 0;
  const runningSince = entry.runningStartedAt ? asDate(entry.runningStartedAt).getTime() : current;
  return entry.elapsedSeconds + (entry.status === "running" ? Math.max(0, Math.floor((current - runningSince) / 1000)) : 0);
}

function TimerCard({ type, entry, onChanged }: { type: "seat" | "focus"; entry?: TimeEntry; onChanged: () => void }) {
  const [label, setLabel] = useState("");
  const elapsed = useLiveSeconds(entry);
  const start = trpc.tracking.start.useMutation({ onSuccess: () => { setLabel(""); onChanged(); }, onError: error => toast.error(error.message) });
  const pause = trpc.tracking.pause.useMutation({ onSuccess: onChanged, onError: error => toast.error(error.message) });
  const resume = trpc.tracking.resume.useMutation({ onSuccess: onChanged, onError: error => toast.error(error.message) });
  const finish = trpc.tracking.finish.useMutation({ onSuccess: () => { toast.success("시간 기록을 저장했어요."); onChanged(); }, onError: error => toast.error(error.message) });
  const isSeat = type === "seat";
  const title = isSeat ? "좌석 시간" : "집중 세션";
  const activeLabel = entry?.label || (isSeat ? "자리에 앉아 있는 중" : "이름 없는 집중");

  return <section className={`relative overflow-hidden rounded-[28px] p-5 shadow-[0_14px_36px_rgba(21,86,66,0.08)] sm:p-6 ${isSeat ? "bg-[#18332a] text-white" : "border border-[#e3eaf0] bg-white text-[#2a3a3b]"}`}><div className={`pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full blur-2xl ${isSeat ? "bg-[#3ddc84]/25" : "bg-[#e9fff1]"}`} />
    <div className="relative flex items-start justify-between gap-4"><div><p className={`text-[10px] font-bold tracking-[0.14em] ${isSeat ? "text-[#a9f5c9]" : "text-[#22aa62]"}`}>{isSeat ? "SEAT TIMER" : "FOCUS TIMER"}</p><h2 className="mt-2 text-lg font-extrabold tracking-[-0.06em]">{title}</h2></div><div className={`grid h-10 w-10 place-items-center rounded-2xl ${isSeat ? "bg-white/10 text-[#a9f5c9]" : "bg-[#e9fff1] text-[#22aa62]"}`}>{isSeat ? <Coffee className="h-5 w-5" /> : <TimerReset className="h-5 w-5" />}</div></div>
    {!entry ? <div className="relative mt-8"><p className={`text-[11px] font-semibold ${isSeat ? "text-[#c4e4d5]" : "text-[#7b9187]"}`}>{isSeat ? "앉기 시작한 순간부터 차분히 기록하세요." : "과목 또는 업무 이름과 함께 몰입을 시작하세요."}</p>{!isSeat && <input value={label} onChange={event => setLabel(event.target.value)} maxLength={120} placeholder="예: 영어 독해 · 기획서 작성" className="mt-4 w-full rounded-xl border border-[#dfe9e4] bg-[#f8fafc] px-3 py-3 text-sm font-semibold text-[#314542] outline-none placeholder:text-[#a7ada7] focus:border-[#3ddc84] focus:ring-2 focus:ring-[#3ddc84]/15" />}<button disabled={start.isPending} onClick={() => start.mutate({ type, label: isSeat ? "좌석 기록" : label.trim() || "집중" })} className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition active:scale-[0.97] disabled:opacity-60 ${isSeat ? "bg-[#3ddc84] text-[#093d27] hover:bg-[#6fe8a2]" : "bg-[#195b43] text-white hover:bg-[#0b5a46]"}`}><Play className="h-4 w-4 fill-current" />{isSeat ? "좌석 기록 시작" : "집중 시작"}</button></div> : <div className="relative mt-7"><div className={`rounded-2xl px-4 py-4 ${isSeat ? "bg-white/8" : "bg-[#f2f7f4]"}`}><p className={`truncate text-[11px] font-bold ${isSeat ? "text-[#c1d7cb]" : "text-[#49816d]"}`}>{activeLabel}</p><p className="mt-1 font-mono text-[31px] font-bold tracking-[-0.08em] tabular-nums sm:text-[35px]">{formatDuration(elapsed)}</p></div><div className="mt-4 grid grid-cols-2 gap-2"><button disabled={pause.isPending || resume.isPending} onClick={() => entry.status === "running" ? pause.mutate({ id: entry.id }) : resume.mutate({ id: entry.id })} className={`inline-flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition active:scale-[0.97] disabled:opacity-60 ${isSeat ? "bg-white/10 text-white hover:bg-white/15" : "border border-[#dce7e1] text-[#52645e] hover:bg-[#effff5]"}`}>{entry.status === "running" ? <Pause className="h-3.5 w-3.5 fill-current" /> : <Play className="h-3.5 w-3.5 fill-current" />}{entry.status === "running" ? "일시정지" : "다시 시작"}</button><button disabled={finish.isPending} onClick={() => finish.mutate({ id: entry.id })} className={`inline-flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition active:scale-[0.97] disabled:opacity-60 ${isSeat ? "bg-[#3ddc84] text-[#093d27]" : "bg-[#195b43] text-white"}`}><Square className="h-3.5 w-3.5 fill-current" />종료 · 저장</button></div></div>}
  </section>;
}

export default function Home() {
  const utils = trpc.useUtils();
  const { data: rawEntries = [], isLoading } = trpc.tracking.list.useQuery();
  const { data: steps = [] } = trpc.tracking.steps.list.useQuery();
  const entries = rawEntries as TimeEntry[];
  const today = dayKey(new Date());
  const seatEntry = entries.find(entry => entry.type === "seat" && entry.status !== "completed");
  const focusEntry = entries.find(entry => entry.type === "focus" && entry.status !== "completed");
  const liveSeat = useLiveSeconds(seatEntry);
  const liveFocus = useLiveSeconds(focusEntry);
  const todayEntries = useMemo(() => entries.filter(entry => dayKey(asDate(entry.startedAt)) === today), [entries, today]);
  const completedSeatSeconds = todayEntries.filter(entry => entry.type === "seat" && entry.status === "completed").reduce((total, entry) => total + entry.elapsedSeconds, 0) + liveSeat;
  const completedFocusSeconds = todayEntries.filter(entry => entry.type === "focus" && entry.status === "completed").reduce((total, entry) => total + entry.elapsedSeconds, 0) + liveFocus;
  const todaySteps = steps.find(item => item.dateKey === today)?.steps;
  const refetch = () => { void utils.tracking.list.invalidate(); };
  const readableDate = new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", weekday: "long" }).format(new Date());

  return <div className="animate-page-in"><header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-[10px] font-bold tracking-[0.16em] text-[#22aa62]">TODAY, {readableDate.toUpperCase()}</p><h1 className="mt-2 text-3xl font-extrabold tracking-[-0.08em] text-[#18332a] sm:text-4xl">오늘의 리듬</h1><p className="mt-2 text-sm leading-6 text-[#71877e]">시간을 시작하고, 멈추고, 저장하세요. 작은 기록이 하루의 회복 리듬을 만듭니다.</p></div><div className="inline-flex items-center gap-2 self-start rounded-full border border-[#dce7e1] bg-white px-3 py-2 text-[11px] font-semibold text-[#5d8979] sm:self-auto"><span className="h-2 w-2 rounded-full bg-[#3ddc84]" />내 계정에 안전하게 저장 중</div></header>
    <section className="relative mt-6 overflow-hidden rounded-[28px] bg-[#195b43] p-5 text-white shadow-[0_16px_38px_rgba(21,86,66,0.14)] sm:p-6"><div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-[#3ddc84]/15 blur-2xl" /><div className="relative grid gap-5 sm:grid-cols-[1fr_auto] sm:items-center"><div><div className="flex items-center gap-2 text-xs font-bold text-[#a9f5c9]"><span className="grid h-7 w-7 place-items-center rounded-lg bg-[#3ddc84]/15"><Sparkles className="h-3.5 w-3.5" /></span>DAILY RHYTHM</div><h2 className="mt-4 text-2xl font-bold tracking-[-0.07em]">앉아 있던 시간 속에도<br /><span className="text-[#3ddc84]">회복의 리듬</span>이 생겨요.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-[#c6dfd4]">오늘은 좌석 시간과 집중 시간을 차분히 기록하고, 흐름이 길어질 때는 작은 움직임의 틈을 남겨보세요.</p></div><div className="relative flex items-end gap-4 rounded-2xl bg-white/[0.08] p-4"><div><p className="text-xs font-bold text-[#a9f5c9]">오늘의 리듬 잎</p><p className="mt-1 text-2xl font-bold tracking-[-0.06em]">{todayEntries.filter(entry => entry.status === "completed").length}개</p><p className="mt-1 text-[10px] leading-4 text-[#c6dfd4]">저장한 세션이<br />하루의 흐름을 만들어요.</p></div><div className="grid h-12 w-12 place-items-center rounded-full bg-white/15"><Sprout className="h-6 w-6 text-[#3ddc84]" /></div></div></div></section>
    <div className="mt-7 grid gap-4 xl:grid-cols-[1fr_1fr_.92fr]"><TimerCard type="seat" entry={seatEntry} onChanged={refetch} /><TimerCard type="focus" entry={focusEntry} onChanged={refetch} /><section className="rounded-[28px] border border-[#e6e2d9] bg-[#fbfaf7] p-5 shadow-[0_14px_36px_rgba(45,55,50,0.05)] sm:p-6"><p className="text-[10px] font-bold tracking-[0.14em] text-[#9c7d57]">TODAY AT A GLANCE</p><h2 className="mt-2 text-lg font-extrabold tracking-[-0.06em] text-[#2a3a3b]">기록의 요약</h2><div className="mt-6 grid gap-3"><div className="flex items-center justify-between rounded-2xl bg-[#f1f3ef] p-3.5"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#dfece5] text-[#41665f]"><Clock3 className="h-4 w-4" /></span><span><span className="block text-[10px] font-bold text-[#788078]">좌석 누적</span><strong className="mt-0.5 block text-sm tracking-[-0.04em] text-[#3b4a48]">{formatHours(completedSeatSeconds)}</strong></span></div></div><div className="flex items-center justify-between rounded-2xl bg-[#f4eee5] p-3.5"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#ead9c2] text-[#836342]"><TimerReset className="h-4 w-4" /></span><span><span className="block text-[10px] font-bold text-[#8a8175]">집중 누적</span><strong className="mt-0.5 block text-sm tracking-[-0.04em] text-[#3b4a48]">{formatHours(completedFocusSeconds)}</strong></span></div></div><div className="flex items-center justify-between rounded-2xl bg-[#f4f3ef] px-3.5 py-3"><span className="text-[11px] font-semibold text-[#6f7770]">오늘 걸음 수</span><strong className="text-sm tracking-[-0.04em] text-[#45665e]">{todaySteps === undefined ? "아직 기록 없음" : `${todaySteps.toLocaleString()}걸음`}</strong></div></div></section></div>
    <section className="mt-7 grid gap-5 xl:grid-cols-[1.15fr_.85fr]"><div className="rounded-[28px] border border-[#e6e2d9] bg-[#fbfaf7] p-5 shadow-[0_14px_36px_rgba(45,55,50,0.05)] sm:p-6"><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold tracking-[0.14em] text-[#9c7d57]">SESSION HISTORY</p><h2 className="mt-2 text-lg font-extrabold tracking-[-0.06em] text-[#2a3a3b]">오늘 저장한 세션</h2></div><span className="rounded-full bg-[#eef1ee] px-2.5 py-1.5 text-[10px] font-bold text-[#62736b]">{todayEntries.filter(entry => entry.status === "completed").length}개 기록</span></div>{isLoading ? <div className="mt-6 h-32 animate-pulse rounded-2xl bg-[#f0efea]" /> : todayEntries.filter(entry => entry.status === "completed").length === 0 ? <div className="mt-6 rounded-2xl border border-dashed border-[#d9d7cf] bg-[#f7f6f2] px-5 py-10 text-center"><Plus className="mx-auto h-5 w-5 text-[#a69277]" /><p className="mt-3 text-sm font-bold text-[#5a6660]">아직 저장된 세션이 없어요.</p><p className="mt-1 text-xs text-[#8b918a]">위 타이머로 첫 기록을 시작해 보세요.</p></div> : <div className="mt-5 space-y-2">{todayEntries.filter(entry => entry.status === "completed").slice(0, 6).map(entry => <div key={entry.id} className="flex items-center gap-3 rounded-2xl border border-[#ece9e1] px-4 py-3"><span className={`grid h-9 w-9 place-items-center rounded-xl ${entry.type === "seat" ? "bg-[#e3eee8] text-[#41665f]" : "bg-[#f2e7d7] text-[#97734c]"}`}>{entry.type === "seat" ? <Coffee className="h-4 w-4" /> : <TimerReset className="h-4 w-4" />}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-[#44534f]">{entry.label || (entry.type === "seat" ? "좌석 기록" : "집중")}</p><p className="mt-0.5 text-[10px] font-semibold text-[#92978f]">{new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false }).format(asDate(entry.startedAt))} 시작</p></div><strong className="text-xs text-[#526a61]">{formatHours(entry.elapsedSeconds)}</strong></div>)}</div>}</div>
      <aside className="relative overflow-hidden rounded-[28px] bg-[#e5f7ed] p-5 shadow-[0_12px_32px_rgba(21,86,66,0.06)] sm:p-6"><div className="absolute -right-8 -bottom-8 h-32 w-32 rounded-full bg-[#3ddc84]/20 blur-2xl" /><div className="relative"><p className="text-[10px] font-bold tracking-[0.14em] text-[#34816a]">다음 흐름</p><h2 className="mt-2 text-xl font-extrabold leading-tight tracking-[-0.07em] text-[#265745]">기록을 쌓아<br />하루를 돌보세요.</h2><p className="mt-4 text-sm leading-6 text-[#5d8979]">캘린더에서는 저장된 시간대를 드래그해 조정할 수 있고, 리포트에서는 걸음 수와 집중 시간을 함께 볼 수 있어요.</p><div className="mt-7 rounded-2xl bg-white/70 p-4 text-xs leading-5 text-[#5d8979]"><span className="font-bold text-[#195b43]">작은 다음 걸음</span><br />시간 캘린더에서 과거 기록을 직접 배치하거나, 활동 리포트에서 오늘의 걸음 수를 남겨보세요.</div><div className="mt-4 flex items-center gap-2 text-xs font-bold text-[#34816a]"><CalendarDays className="h-4 w-4" />일정 사이의 틈도 함께 살펴보세요.</div></div></aside></section>
  </div>;
}
