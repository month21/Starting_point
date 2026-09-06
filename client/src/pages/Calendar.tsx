import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { CalendarDays, ChevronLeft, ChevronRight, GripVertical, Plus, Save } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type CalendarEntry = { id: number; type: "seat" | "focus"; label: string | null; startedAt: Date; endedAt: Date | null; elapsedSeconds: number; status: "running" | "paused" | "completed" };
const asDate = (value: Date | string) => value instanceof Date ? value : new Date(value);
const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const addDays = (date: Date, days: number) => { const result = new Date(date); result.setDate(result.getDate() + days); return result; };
const startOfWeek = (date: Date) => { const result = new Date(date); const shift = (result.getDay() + 6) % 7; result.setDate(result.getDate() - shift); result.setHours(0, 0, 0, 0); return result; };
const localInputValue = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}T${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
const displayHours = (seconds: number) => `${Math.floor(seconds / 3600)}시간 ${Math.round((seconds % 3600) / 60)}분`;

function EntryDialog({ entry, selectedDate, onClose, onSaved }: { entry?: CalendarEntry; selectedDate: Date; onClose: () => void; onSaved: () => void }) {
  const [type, setType] = useState<"seat" | "focus">(entry?.type || "focus");
  const [label, setLabel] = useState(entry?.label || "");
  const [start, setStart] = useState(entry ? localInputValue(asDate(entry.startedAt)) : `${dateKey(selectedDate)}T09:00`);
  const initialEnd = entry?.endedAt ? asDate(entry.endedAt) : new Date(new Date(start).getTime() + 60 * 60 * 1000);
  const [end, setEnd] = useState(entry ? localInputValue(initialEnd) : `${dateKey(selectedDate)}T10:00`);
  const create = trpc.tracking.createCompleted.useMutation({ onSuccess: () => { toast.success("시간 기록을 추가했어요."); onSaved(); }, onError: error => toast.error(error.message) });
  const update = trpc.tracking.updatePlacement.useMutation({ onSuccess: () => { toast.success("시간 기록을 수정했어요."); onSaved(); }, onError: error => toast.error(error.message) });
  const save = () => {
    const startedAtMs = new Date(start).getTime(); const endedAtMs = new Date(end).getTime();
    if (!Number.isFinite(startedAtMs) || !Number.isFinite(endedAtMs) || endedAtMs - startedAtMs < 60000) return toast.error("시작과 종료 시간을 1분 이상으로 지정해 주세요.");
    if (entry) update.mutate({ id: entry.id, label: label.trim() || null, startedAtMs, endedAtMs });
    else create.mutate({ type, label: label.trim() || null, startedAtMs, endedAtMs });
  };
  return <Dialog open onOpenChange={open => !open && onClose()}><DialogContent className="max-w-md rounded-[28px] border-[#e6e2d9] bg-[#fbfaf7] p-6"><DialogHeader><p className="text-[10px] font-bold tracking-[0.14em] text-[#9c7d57]">{entry ? "EDIT RECORD" : "NEW RECORD"}</p><DialogTitle className="pt-1 text-xl font-extrabold tracking-[-0.06em] text-[#30413f]">{entry ? "시간 기록 수정" : "캘린더에 기록 추가"}</DialogTitle><DialogDescription className="pt-1 text-xs leading-5 text-[#7c827c]">{entry ? "시간대를 직접 조정하거나 라벨을 다듬을 수 있어요." : "완료된 좌석 또는 집중 시간을 직접 기록해 보세요."}</DialogDescription></DialogHeader><div className="mt-2 space-y-4"><div className="space-y-2"><Label className="text-xs font-bold text-[#5d6963]">기록 종류</Label><Select value={type} onValueChange={value => setType(value as "seat" | "focus")} disabled={Boolean(entry)}><SelectTrigger className="h-11 border-[#dfddd5] bg-white"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="focus">집중 세션</SelectItem><SelectItem value="seat">좌석 시간</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label className="text-xs font-bold text-[#5d6963]">라벨</Label><Input value={label} maxLength={120} onChange={event => setLabel(event.target.value)} placeholder={type === "focus" ? "예: 회의 자료 정리" : "예: 사무실 작업"} className="h-11 border-[#dfddd5] bg-white" /></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label className="text-xs font-bold text-[#5d6963]">시작</Label><Input type="datetime-local" value={start} onChange={event => setStart(event.target.value)} className="h-11 border-[#dfddd5] bg-white text-xs" /></div><div className="space-y-2"><Label className="text-xs font-bold text-[#5d6963]">종료</Label><Input type="datetime-local" value={end} onChange={event => setEnd(event.target.value)} className="h-11 border-[#dfddd5] bg-white text-xs" /></div></div></div><DialogFooter className="mt-6"><Button variant="outline" onClick={onClose} className="rounded-xl border-[#dedbd3]">취소</Button><Button onClick={save} disabled={create.isPending || update.isPending} className="rounded-xl bg-[#426a61] text-white hover:bg-[#355a52]"><Save className="mr-2 h-4 w-4" />저장</Button></DialogFooter></DialogContent></Dialog>;
}

export default function Calendar() {
  const utils = trpc.useUtils();
  const [mode, setMode] = useState<"day" | "week">("week");
  const [anchor, setAnchor] = useState(() => new Date());
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [editing, setEditing] = useState<CalendarEntry | undefined>();
  const [adding, setAdding] = useState(false);
  const { data: rawEntries = [], isLoading } = trpc.tracking.list.useQuery();
  const entries = rawEntries as CalendarEntry[];
  const move = trpc.tracking.updatePlacement.useMutation({ onSuccess: () => { toast.success("시간대를 이동했어요."); void utils.tracking.list.invalidate(); }, onError: error => toast.error(error.message) });
  const weekStart = startOfWeek(anchor);
  const days = mode === "week" ? Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)) : [anchor];
  const visibleKeys = new Set(days.map(dateKey));
  const visibleEntries = useMemo(() => entries.filter(entry => entry.status === "completed" && visibleKeys.has(dateKey(asDate(entry.startedAt)))), [entries, days]);
  const title = mode === "week" ? `${new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric" }).format(weekStart)} – ${new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric" }).format(addDays(weekStart, 6))}` : new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "long" }).format(anchor);
  const shift = (direction: number) => setAnchor(current => addDays(current, mode === "week" ? direction * 7 : direction));
  const drop = (day: Date, minutes: number) => {
    if (!draggedId) return;
    const entry = entries.find(item => item.id === draggedId); setDraggedId(null);
    if (!entry) return;
    const duration = Math.max(60, entry.elapsedSeconds) * 1000;
    const start = new Date(day); start.setHours(6 + Math.floor(minutes / 60), minutes % 60, 0, 0);
    move.mutate({ id: entry.id, label: entry.label, startedAtMs: start.getTime(), endedAtMs: start.getTime() + duration });
  };
  const refetch = () => { setEditing(undefined); setAdding(false); void utils.tracking.list.invalidate(); };
  const nowKey = dateKey(new Date());
  const hours = Array.from({ length: 16 }, (_, index) => index + 6);

  return <div className="animate-page-in"><header className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.16em] text-[#22aa62]"><CalendarDays className="h-3.5 w-3.5" />SCHEDULE</div><h1 className="mt-2 text-3xl font-extrabold tracking-[-0.08em] text-[#18332a] sm:text-4xl">시간 사이에 <span className="text-[#22aa62]">리듬의 틈</span>을<br className="hidden sm:block" /> 남겨요.</h1><p className="mt-2 text-sm leading-6 text-[#71877e]">좌석·집중 기록을 캘린더에 쌓고, 카드를 직접 옮겨 하루의 흐름을 다듬어 보세요.</p></div><Button onClick={() => setAdding(true)} className="self-start rounded-2xl bg-[#3ddc84] px-4 text-[#093d27] shadow-[0_10px_20px_rgba(61,220,132,0.18)] hover:bg-[#6fe8a2] lg:self-auto"><Plus className="mr-2 h-4 w-4" />기록 직접 추가</Button></header>
    <section className="mt-7 overflow-hidden rounded-[28px] border border-[#e6e2d9] bg-[#fbfaf7] shadow-[0_14px_36px_rgba(45,55,50,0.05)]"><div className="flex flex-col gap-4 border-b border-[#ebe7de] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div className="flex items-center gap-2"><button onClick={() => shift(-1)} aria-label="이전 기간" className="grid h-9 w-9 place-items-center rounded-xl text-[#69756e] transition hover:bg-[#f0eee8]"><ChevronLeft className="h-4 w-4" /></button><button onClick={() => setAnchor(new Date())} className="rounded-xl px-3 py-2 text-xs font-bold text-[#576760] transition hover:bg-[#f0eee8]">오늘</button><button onClick={() => shift(1)} aria-label="다음 기간" className="grid h-9 w-9 place-items-center rounded-xl text-[#69756e] transition hover:bg-[#f0eee8]"><ChevronRight className="h-4 w-4" /></button><strong className="ml-1 text-sm tracking-[-0.04em] text-[#3d4c49]">{title}</strong></div><div className="inline-flex rounded-xl bg-[#efede7] p-1"><button onClick={() => setMode("day")} className={`rounded-lg px-3 py-1.5 text-[11px] font-bold transition ${mode === "day" ? "bg-white text-[#45665e] shadow-sm" : "text-[#8a918a]"}`}>일</button><button onClick={() => setMode("week")} className={`rounded-lg px-3 py-1.5 text-[11px] font-bold transition ${mode === "week" ? "bg-white text-[#45665e] shadow-sm" : "text-[#8a918a]"}`}>주</button></div></div>
      <div className="overflow-x-auto"><div className="min-w-[720px]"><div className="grid border-b border-[#ebe7de]" style={{ gridTemplateColumns: `56px repeat(${days.length}, minmax(0, 1fr))` }}><div />{days.map(day => <div key={dateKey(day)} className={`px-3 py-3 text-center ${dateKey(day) === nowKey ? "bg-[#edf3ee]" : ""}`}><p className="text-[10px] font-bold text-[#9b9389]">{new Intl.DateTimeFormat("ko-KR", { weekday: "short" }).format(day)}</p><p className={`mt-1 text-sm font-extrabold ${dateKey(day) === nowKey ? "text-[#3f675e]" : "text-[#485652]"}`}>{day.getDate()}</p></div>)}</div>
        <div className="grid" style={{ gridTemplateColumns: `56px repeat(${days.length}, minmax(0, 1fr))` }}><div className="border-r border-[#ebe7de]">{hours.map(hour => <div key={hour} className="h-[60px] pr-3 pt-[-2px] text-right text-[10px] font-medium text-[#a29e95]">{String(hour).padStart(2, "0")}:00</div>)}</div>{days.map(day => <div key={dateKey(day)} className={`relative min-h-[960px] border-r border-[#ebe7de] last:border-r-0 ${dateKey(day) === nowKey ? "bg-[#fcfcf8]" : ""}`}>{hours.map(hour => <div key={hour} onDragOver={event => event.preventDefault()} onDrop={() => drop(day, (hour - 6) * 60)} className="h-[60px] border-b border-dashed border-[#eeeae2]" />)}{Array.from({ length: 16 }, (_, index) => <div key={`half-${index}`} onDragOver={event => event.preventDefault()} onDrop={() => drop(day, index * 60 + 30)} className="absolute left-0 right-0 h-[30px]" style={{ top: `${index * 60 + 30}px` }} />)}{visibleEntries.filter(entry => dateKey(asDate(entry.startedAt)) === dateKey(day)).map(entry => { const started = asDate(entry.startedAt); const top = Math.max(0, (started.getHours() - 6) * 60 + started.getMinutes()); const height = Math.max(36, Math.min(240, entry.elapsedSeconds / 60)); return <button draggable onDragStart={() => setDraggedId(entry.id)} onClick={() => setEditing(entry)} key={entry.id} style={{ top: `${top}px`, height: `${height}px` }} className={`group absolute left-1.5 right-1.5 overflow-hidden rounded-xl border px-2 py-2 text-left shadow-sm transition hover:brightness-[.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#547c71] ${entry.type === "focus" ? "border-[#b8d2c5] bg-[#e2efe7] text-[#3e6257]" : "border-[#e6cda7] bg-[#f4e8d7] text-[#785e3f]"}`}><span className="flex items-center gap-1 text-[9px] font-bold"><GripVertical className="h-3 w-3 shrink-0 opacity-55" />{entry.type === "focus" ? "집중" : "좌석"}</span><span className="mt-1 block truncate text-[11px] font-extrabold">{entry.label || (entry.type === "focus" ? "집중 세션" : "좌석 기록")}</span>{height > 54 && <span className="mt-0.5 block text-[9px] font-semibold opacity-75">{displayHours(entry.elapsedSeconds)}</span>}</button>; })}</div>)}</div></div></div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#e3eaf0] px-5 py-3 text-[10px] font-semibold text-[#6f7972]"><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded bg-[#aeeac6]" />집중 기록</span><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded bg-[#ffe0aa]" />좌석 기록</span><span className="text-[#6d8278]">카드를 드래그해 30분 단위로 이동할 수 있습니다.</span></div></section>
    {isLoading && <p className="mt-4 text-center text-xs font-semibold text-[#8b918a]">기록을 불러오는 중입니다.</p>}{editing && <EntryDialog entry={editing} selectedDate={anchor} onClose={() => setEditing(undefined)} onSaved={refetch} />}{adding && <EntryDialog selectedDate={anchor} onClose={() => setAdding(false)} onSaved={refetch} />}
  </div>;
}
