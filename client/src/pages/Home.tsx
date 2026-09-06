import { useEffect, useState } from "react";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bell,
  Brain,
  CalendarDays,
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
  Droplets,
  Footprints,
  HeartPulse,
  Home as HomeIcon,
  Info,
  MapPin,
  Moon,
  LogIn,
  Phone,
  Play,
  ShieldCheck,
  Sparkles,
  Sprout,
  Stethoscope,
  TimerReset,
  Trophy,
  UserPlus,
  Users,
  X,
} from "lucide-react";

type View = "home" | "routine" | "report" | "care" | "calendar";

type Recommendation = {
  title: string;
  description: string;
  duration: number;
  tag: string;
  cue: string;
};

const moveRecommendation: Recommendation = {
  title: "물 리필하러 2분 걷기",
  description: "다음 일정 전, 물병을 채우고 창가까지 천천히 걸어볼까요?",
  duration: 120,
  tag: "자리 이동 가능",
  cue: "2분 · 164걸음 예상",
};

const seatRecommendation: Recommendation = {
  title: "발목 원 그리기",
  description: "온라인 강의 중에도 가능해요. 발목을 천천히 양방향으로 움직여요.",
  duration: 60,
  tag: "자리에서 가능",
  cue: "1분 · 양방향 10회",
};

const navItems = [
  { id: "home" as View, label: "오늘", icon: HomeIcon },
  { id: "calendar" as View, label: "일정", icon: CalendarDays },
  { id: "routine" as View, label: "루틴", icon: Sparkles },
  { id: "report" as View, label: "리포트", icon: Activity },
  { id: "care" as View, label: "케어", icon: HeartPulse },
];

const formatTime = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

type ProfileSetup = {
  goal: string;
  riskFactors: string[];
  calendarConnected: boolean;
};

const PROFILE_STORAGE_KEY = "startpoint:profile:v1";
const FIRST_RUN_TUTORIAL_KEY = "startpoint:first-run-tutorial:v1";

const readStoredProfile = (): ProfileSetup | null => {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as ProfileSetup) : null;
  } catch {
    return null;
  }
};

const riskFactorOptions = [
  { id: "smoking", label: "흡연 중이에요" },
  { id: "pill", label: "경구 피임약을 복용해요" },
  { id: "history", label: "혈전 가족력 또는 과거력이 있어요" },
  { id: "kidney", label: "신장 질환 등 의료적 위험요인이 있어요" },
];

const goalOptions = [
  { id: "focus", label: "집중력 회복", detail: "공부 사이에 짧게 리셋하기", icon: Brain },
  { id: "activity", label: "기본 활동량", detail: "하루 움직임을 자연스럽게 늘리기", icon: Footprints },
  { id: "schedule", label: "일정 관리", detail: "캘린더 사이에 쉬는 시간 만들기", icon: CalendarDays },
];

function EntryView({ onTestStart }: { onTestStart: () => void }) {
  const [panel, setPanel] = useState<"none" | "help" | "login" | "signup">("none");
  const panelTitle = panel === "login" ? "로그인" : panel === "signup" ? "회원가입" : "앱 사용 도움말";

  return (
    <main className="min-h-screen bg-[#f8fafc] px-5 py-6 text-[#18332a] sm:px-8 sm:py-8">
      <div className="mx-auto max-w-[1180px]">
        <header className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#3ddc84] text-[#093d27] shadow-[0_8px_18px_rgba(61,220,132,0.25)]"><Sprout className="h-5 w-5" /></div><div><p className="text-xl font-bold tracking-[-0.07em] text-[#18332a]">시작점</p><p className="text-[10px] font-bold tracking-[0.12em] text-[#7c9388]">LIFE RHYTHM</p></div></div><button onClick={() => setPanel("help")} className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2.5 text-xs font-bold text-[#46665a] shadow-sm ring-1 ring-[#e3eaf0] transition hover:bg-[#effff5]"><BookOpen className="h-4 w-4 text-[#22aa62]" />앱 사용 도움말</button></header>
        <section className="relative mt-12 overflow-hidden rounded-[34px] bg-[#18332a] px-6 py-8 text-white shadow-[0_24px_60px_rgba(24,51,42,0.16)] sm:mt-16 sm:px-12 sm:py-14"><div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#3ddc84]/20 blur-3xl" /><div className="absolute bottom-[-100px] left-[45%] h-64 w-64 rounded-full bg-[#3ddc84]/10 blur-3xl" /><div className="relative grid items-center gap-10 lg:grid-cols-[1.05fr_.95fr]"><div><span className="inline-flex items-center gap-2 rounded-full border border-[#3ddc84]/30 bg-[#3ddc84]/10 px-3 py-1.5 text-[11px] font-bold text-[#a9f5c9]"><span className="h-1.5 w-1.5 rounded-full bg-[#3ddc84]" />생활 리듬을 가볍게 바꾸는 앱</span><h1 className="mt-6 text-[34px] font-bold leading-[1.13] tracking-[-0.08em] sm:text-[52px]">앉아 있는 하루에도<br /><span className="text-[#3ddc84]">움직임의 틈</span>을 만들어요.</h1><p className="mt-5 max-w-xl text-sm leading-7 text-[#d4e8de] sm:text-base">리듬은 대학생의 일정과 집중 흐름에 맞춰, 지금 할 수 있는 가장 작은 움직임을 추천해요.</p><div className="mt-8 flex flex-wrap gap-3"><button onClick={onTestStart} className="inline-flex items-center gap-2 rounded-2xl bg-[#3ddc84] px-5 py-3.5 text-sm font-bold text-[#093d27] shadow-[0_12px_24px_rgba(61,220,132,0.18)] transition hover:bg-[#6fe8a2] active:scale-[0.97]">테스트로 시작하기 <ArrowRight className="h-4 w-4" /></button><button onClick={() => setPanel("help")} className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-white/10"><BookOpen className="h-4 w-4" />먼저 알아보기</button></div></div><div className="relative rounded-[28px] border border-white/10 bg-white/[0.07] p-5 backdrop-blur-sm sm:p-7"><div className="flex items-center justify-between"><p className="text-xs font-bold text-[#a9f5c9]">오늘의 리듬 미리보기</p><span className="rounded-full bg-[#3ddc84]/15 px-2.5 py-1 text-[10px] font-bold text-[#a9f5c9]">샘플</span></div><div className="mt-5 space-y-3"><div className="rounded-2xl bg-white/[0.08] p-4"><div className="flex items-center justify-between"><span className="text-xs font-semibold text-[#d4e8de]">현재 상태</span><span className="text-xs font-bold text-[#3ddc84]">주의 57</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[57%] rounded-full bg-[#3ddc84]" /></div></div><div className="rounded-2xl bg-[#3ddc84] p-4 text-[#093d27]"><div className="flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.12em] opacity-70">지금 가능한 움직임</p><p className="mt-2 text-lg font-bold tracking-[-0.05em]">발목 원 그리기</p><p className="mt-1 text-xs font-medium opacity-75">1분 · 자리에서 가능</p></div><TimerReset className="h-5 w-5" /></div></div><div className="flex items-center justify-between px-1 text-xs text-[#b9d6ca]"><span>오늘의 회복 잎</span><span className="font-bold text-[#a9f5c9]">6 / 8</span></div></div></div></div></section>
        <section className="mt-6 grid gap-4 sm:grid-cols-3"><div className="rounded-3xl bg-white p-5 ring-1 ring-[#e3eaf0]"><div className="grid h-9 w-9 place-items-center rounded-xl bg-[#e9fff1] text-[#22aa62]"><ShieldCheck className="h-4 w-4" /></div><h2 className="mt-4 text-sm font-bold text-[#29463b]">개인 위험 요인 설정</h2><p className="mt-2 text-xs leading-5 text-[#7a9087]">내 몸과 상황에 맞는 안내를 받아요.</p></div><div className="rounded-3xl bg-white p-5 ring-1 ring-[#e3eaf0]"><div className="grid h-9 w-9 place-items-center rounded-xl bg-[#e9fff1] text-[#22aa62]"><CalendarDays className="h-4 w-4" /></div><h2 className="mt-4 text-sm font-bold text-[#29463b]">일정 사이 마이크로 루틴</h2><p className="mt-2 text-xs leading-5 text-[#7a9087]">쉬는 시간에 부담 없는 움직임을 추천해요.</p></div><div className="rounded-3xl bg-white p-5 ring-1 ring-[#e3eaf0]"><div className="grid h-9 w-9 place-items-center rounded-xl bg-[#e9fff1] text-[#22aa62]"><Sparkles className="h-4 w-4" /></div><h2 className="mt-4 text-sm font-bold text-[#29463b]">완료할수록 회복 잎</h2><p className="mt-2 text-xs leading-5 text-[#7a9087]">작은 실천을 눈에 보이는 성취로 남겨요.</p></div></section>
        <section className="mt-7 flex flex-col items-center justify-between gap-4 rounded-3xl border border-[#e3eaf0] bg-white px-5 py-4 sm:flex-row"><p className="text-xs font-semibold text-[#6d8278]">처음 방문하셨나요? 테스트 모드로 기능을 둘러볼 수 있어요.</p><div className="flex w-full gap-2 sm:w-auto"><button onClick={() => setPanel("login")} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#dce7e1] px-4 py-2.5 text-xs font-bold text-[#45665a] transition hover:border-[#3ddc84] hover:bg-[#effff5] sm:flex-none"><LogIn className="h-3.5 w-3.5" />로그인</button><button onClick={() => setPanel("signup")} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#3ddc84] px-4 py-2.5 text-xs font-bold text-[#093d27] transition hover:bg-[#6fe8a2] sm:flex-none"><UserPlus className="h-3.5 w-3.5" />회원가입</button></div></section>
      </div>
      {panel !== "none" && <div className="fixed inset-0 z-50 grid place-items-center bg-[#18332a]/35 p-4 backdrop-blur-sm"><section className="animate-modal-in w-full max-w-md rounded-[30px] bg-white p-6 shadow-2xl sm:p-7"><div className="flex items-center justify-between"><div><span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#22aa62]">{panel === "help" ? "HOW IT WORKS" : "TEMPORARY MODE"}</span><h2 className="mt-1 text-xl font-bold tracking-[-0.06em] text-[#224336]">{panelTitle}</h2></div><button onClick={() => setPanel("none")} className="grid h-9 w-9 place-items-center rounded-xl bg-[#f3f7f5] text-[#799087]"><X className="h-4 w-4" /></button></div>{panel === "help" ? <div className="mt-6 space-y-3">{[["01", "설정하기", "위험 요인과 목표를 선택하면 나에게 맞는 안내가 시작돼요."], ["02", "틈 찾기", "캘린더 일정 사이의 쉬는 시간을 찾아 1–3분 루틴을 추천해요."], ["03", "완료하기", "작은 움직임을 끝내면 회복 잎과 상태 메시지로 성취를 알려줘요."]].map(([number, title, description]) => <div key={number} className="flex gap-3 rounded-2xl bg-[#f8fafc] p-4"><span className="text-xs font-bold text-[#3ddc84]">{number}</span><div><p className="text-sm font-bold text-[#345b4b]">{title}</p><p className="mt-1 text-xs leading-5 text-[#7b9187]">{description}</p></div></div>)}</div> : <div className="mt-6"><label className="text-xs font-bold text-[#547267]">이메일</label><input className="mt-2 w-full rounded-xl border border-[#dfe9e4] bg-[#f8fafc] px-3 py-3 text-sm outline-none focus:border-[#3ddc84]" placeholder="sample@rhythm.app" /><label className="mt-4 block text-xs font-bold text-[#547267]">비밀번호</label><input type="password" className="mt-2 w-full rounded-xl border border-[#dfe9e4] bg-[#f8fafc] px-3 py-3 text-sm outline-none focus:border-[#3ddc84]" placeholder="테스트용 입력" /><p className="mt-3 text-[11px] text-[#8ba097]">현재는 화면 확인을 위한 임시 모드입니다.</p></div>}<button onClick={panel === "help" ? () => setPanel("none") : onTestStart} className="mt-6 w-full rounded-2xl bg-[#3ddc84] py-3.5 text-sm font-bold text-[#093d27] transition hover:bg-[#6fe8a2] active:scale-[0.98]">{panel === "help" ? "확인했어요" : "테스트로 시작하기"}</button></section></div>}
    </main>
  );
}

function WeeklyAiReport({ goal, completedToday }: { goal: string; completedToday: boolean }) {
  const goalCopy = goal === "activity" ? "활동량 목표" : goal === "schedule" ? "일정 관리 목표" : "집중력 회복 목표";
  const insight = completedToday ? "오늘 루틴까지 이어간 덕분에, 이번 주 회복 리듬이 더 안정적으로 연결됐어요." : goal === "activity" ? "이동 루틴을 짧게 여러 번 나누면, 지금의 활동량 목표를 더 편하게 이어갈 수 있어요." : goal === "schedule" ? "수업 사이의 10분 틈을 잘 찾고 있어요. 다음 쉬는 시간에도 같은 패턴을 추천할게요." : "집중 시간이 긴 날에도 1분 루틴을 선택한 점이 좋아요. 집중 전환이 필요한 오후에 특히 효과적이에요.";
  return <section className="overflow-hidden rounded-[28px] bg-[#18332a] text-white shadow-[0_16px_38px_rgba(24,51,42,0.14)]"><div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1.1fr_.9fr] lg:p-8"><div><div className="flex items-center gap-2 text-xs font-bold text-[#a9f5c9]"><span className="grid h-7 w-7 place-items-center rounded-lg bg-[#3ddc84]/15"><Sparkles className="h-3.5 w-3.5" /></span>AI RHYTHM COACH <span className="rounded-full bg-white/10 px-2 py-1 text-[9px] tracking-normal text-[#c4e4d5]">이번 주 분석</span></div><h2 className="mt-5 text-2xl font-bold tracking-[-0.06em] sm:text-3xl">이번 주 리듬을<br /><span className="text-[#3ddc84]">잘 이어가고 있어요.</span></h2><p className="mt-3 max-w-xl text-sm leading-6 text-[#c6dfd4]">{insight}</p><div className="mt-5 flex flex-wrap gap-2"><span className="rounded-full bg-white/10 px-3 py-2 text-[11px] font-bold text-[#cde9dc]">{goalCopy}</span><span className="rounded-full bg-[#3ddc84]/15 px-3 py-2 text-[11px] font-bold text-[#a9f5c9]">루틴 달성률 84%</span></div></div><div className="rounded-2xl bg-white/[0.08] p-4 sm:p-5"><div className="flex items-center justify-between"><p className="text-xs font-bold text-[#d8f0e3]">주간 달성 기록</p><span className="text-lg font-bold text-[#3ddc84]">10 / 12</span></div><div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[84%] rounded-full bg-[#3ddc84] shadow-[0_0_16px_rgba(61,220,132,0.45)]" /></div><div className="mt-5 grid grid-cols-3 gap-2"><div><p className="text-[10px] text-[#a9cfc0]">평균 좌식</p><p className="mt-1 text-sm font-bold">2h 10m</p></div><div><p className="text-[10px] text-[#a9cfc0]">회복 시간</p><p className="mt-1 text-sm font-bold">38분</p></div><div><p className="text-[10px] text-[#a9cfc0]">연속 기록</p><p className="mt-1 text-sm font-bold">3일</p></div></div><div className="mt-5 flex items-start gap-2 rounded-xl bg-[#3ddc84]/10 p-3 text-xs leading-5 text-[#c8edda]"><HeartPulse className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#3ddc84]" />내일도 한 번만 더 움직이면, 이번 주 목표를 달성할 수 있어요.</div></div></div></section>;
}

function CalendarView({ connected, onConnect, completed, onStart }: { connected: boolean; onConnect: () => void; completed: boolean; onStart: (recommendation: Recommendation) => void }) {
  const events = [
    ["09:00", "온라인 강의", "B204 · 진행 중", "focus"],
    ["12:30", "점심 이동", "학생회관 · 20분", "move"],
    ["15:20", "추천 쉬는 시간", "마이크로 루틴 2분", "break"],
    ["16:00", "소비자행동론", "B204 · 90분", "focus"],
  ];
  return <div className="animate-page-in space-y-6"><section className="rounded-[28px] bg-white p-6 shadow-[0_12px_32px_rgba(21,86,66,0.055)] ring-1 ring-[#e3eaf0] sm:p-8"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start"><div><div className="flex items-center gap-2 text-xs font-bold text-[#22aa62]"><CalendarDays className="h-4 w-4" />SCHEDULE</div><h1 className="mt-3 text-3xl font-bold tracking-[-0.07em] text-[#18332a]">일정 사이에<br /><span className="text-[#22aa62]">움직임의 틈</span>을 찾아요.</h1><p className="mt-3 text-sm leading-6 text-[#71877e]">캘린더를 연결하면 수업과 집중 시간 사이의 쉬는 시간을 자동으로 찾아드려요.</p></div><button onClick={onConnect} className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition active:scale-[0.97] ${connected ? "bg-[#effff5] text-[#22aa62] ring-1 ring-[#aeeac6]" : "bg-[#3ddc84] text-[#093d27] shadow-[0_10px_20px_rgba(61,220,132,0.18)] hover:bg-[#72e7a0]"}`}><CalendarDays className="h-4 w-4" />{connected ? "캘린더 연동됨" : "캘린더 연동하기"}</button></div>{connected && <div className="mt-7 flex items-center gap-3 rounded-2xl bg-[#effff5] p-4 text-sm font-semibold text-[#3d6e59]"><Check className="h-5 w-5 text-[#22aa62]" /><span>오늘 일정 사이에서 <strong className="text-[#22aa62]">2개의 움직임 틈</strong>을 찾았어요.</span></div>}</section><section className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]"><article className="rounded-[28px] bg-white p-6 shadow-[0_12px_32px_rgba(21,86,66,0.055)] ring-1 ring-[#e3eaf0]"><div className="flex items-center justify-between"><div><h2 className="font-bold tracking-[-0.04em] text-[#25483c]">오늘의 일정</h2><p className="mt-1 text-xs text-[#8aa097]">9월 5일 · 금요일</p></div><span className="rounded-full bg-[#f3f7fa] px-2.5 py-1 text-[10px] font-bold text-[#7d9289]">{connected ? "연동 완료" : "샘플 일정"}</span></div><div className="mt-6 space-y-2">{events.map(([time, title, detail, type]) => <div key={time} className={`flex items-center gap-3 rounded-2xl border p-3.5 ${type === "break" && connected ? "border-[#aeeac6] bg-[#effff5]" : "border-[#edf1f3] bg-white"}`}><span className="w-12 text-xs font-bold text-[#668077]">{time}</span><span className={`grid h-8 w-8 place-items-center rounded-xl ${type === "break" ? "bg-[#dffbea] text-[#22aa62]" : type === "move" ? "bg-[#fff2db] text-[#d88d1f]" : "bg-[#f1f5ff] text-[#6986c5]"}`}>{type === "break" ? <Sparkles className="h-4 w-4" /> : type === "move" ? <Footprints className="h-4 w-4" /> : <Brain className="h-4 w-4" />}</span><div className="min-w-0 flex-1"><p className="text-sm font-bold text-[#45675a]">{title}</p><p className="mt-0.5 text-[11px] text-[#8aa097]">{detail}</p></div>{type === "break" && connected && <button onClick={() => onStart(moveRecommendation)} className="rounded-xl bg-[#3ddc84] px-2.5 py-2 text-[10px] font-bold text-[#093d27]">루틴 시작</button>}</div>)}</div></article><article className="rounded-[28px] bg-[#18332a] p-6 text-white shadow-[0_12px_32px_rgba(21,86,66,0.12)]"><div className="flex items-center gap-2 text-xs font-bold text-[#a9f5c9]"><Check className="h-4 w-4" />완료 기록</div><h2 className="mt-4 text-2xl font-bold tracking-[-0.06em]">이번 주 움직임<br />캘린더</h2><div className="mt-6 grid grid-cols-7 gap-2">{["월", "화", "수", "목", "금", "토", "일"].map((day, index) => <div key={day} className="text-center"><p className="text-[10px] font-bold text-[#a9cfc0]">{day}</p><div className={`mx-auto mt-2 grid h-8 w-8 place-items-center rounded-xl text-xs font-bold ${index === 4 && completed ? "bg-[#3ddc84] text-[#093d27]" : index === 4 ? "bg-white/10 text-white" : index < 4 ? "bg-white/15 text-[#a9f5c9]" : "bg-white/5 text-[#6e9282]"}`}>{index < 4 || (index === 4 && completed) ? <Check className="h-3.5 w-3.5" /> : "·"}</div></div>)}</div><div className="mt-7 rounded-2xl bg-white/10 p-4"><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#a9f5c9]">오늘</p><p className="mt-2 text-sm font-bold">{completed ? "마이크로 루틴 1개 완료" : "아직 완료한 루틴이 없어요"}</p><p className="mt-1 text-xs text-[#b9d6ca]">{completed ? "회복 시간 +1분이 기록됐어요." : "첫 루틴을 완료하면 여기에 남아요."}</p></div></article></section></div>;
}

function FirstRunIntro({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"splash" | "tutorial">("splash");
  const [slide, setSlide] = useState(0);
  const slides = [
    { eyebrow: "01 · 작은 시작", title: "지금 할 수 있는\n움직임부터", body: "시작점은 거창한 운동보다, 지금의 자리와 컨디션에 맞는 1–3분 루틴을 먼저 찾아요.", icon: Sprout, color: "#e9fff1" },
    { eyebrow: "02 · 일정 사이", title: "비어 있는 틈을\n놓치지 않게", body: "캘린더 일정 사이의 쉬는 시간을 찾아 부담 없는 움직임을 추천해요.", icon: CalendarDays, color: "#eff8ff" },
    { eyebrow: "03 · 매일의 기록", title: "작은 실천을\n눈에 보이게", body: "완료한 루틴은 회복 기록과 주간 리포트에 쌓여요. 한 번이면 충분해요.", icon: Sparkles, color: "#fff5e7" },
  ];
  useEffect(() => {
    if (phase !== "splash") return;
    const timer = window.setTimeout(() => setPhase("tutorial"), 1250);
    return () => window.clearTimeout(timer);
  }, [phase]);
  const next = () => slide === slides.length - 1 ? onDone() : setSlide((current) => current + 1);
  if (phase === "splash") return <main className="first-run-splash grid min-h-screen place-items-center bg-[#f8fafc] p-6 text-center" aria-label="시작점 준비 중"><div><div className="splash-logo mx-auto grid h-24 w-24 place-items-center rounded-[30px] bg-white shadow-[0_18px_45px_rgba(61,220,132,0.24)]"><img src="/manus-storage/startpoint-logo_afef8c07.webp" alt="시작점 로고" className="h-20 w-20 rounded-[26px] object-cover" /></div><p className="mt-7 text-2xl font-bold tracking-[-0.08em] text-[#18332a]">시작점</p><p className="mt-2 text-xs font-semibold tracking-[0.14em] text-[#88a095]">YOUR NEXT SMALL STEP</p><div className="mx-auto mt-8 h-1 w-16 overflow-hidden rounded-full bg-[#e2eee8]" role="progressbar" aria-label="튜토리얼 준비 중"><div className="splash-progress h-full rounded-full bg-[#3ddc84]" /></div></div></main>;
  const CurrentIcon = slides[slide].icon;
  return <main className="first-run-tutorial min-h-screen bg-[#f8fafc] px-5 py-6 text-[#18332a] sm:px-8"><div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-[420px] flex-col"><header className="flex items-center justify-between"><div className="flex items-center gap-2"><img src="/manus-storage/startpoint-logo_afef8c07.webp" alt="시작점 로고" className="h-9 w-9 rounded-xl object-cover" /><span className="text-sm font-bold tracking-[-0.05em]">시작점</span></div><button onClick={onDone} className="rounded-full px-2 py-2 text-xs font-bold text-[#8aa097]">건너뛰기</button></header><section className="flex flex-1 flex-col justify-center pb-8 pt-10" aria-live="polite"><div key={slides[slide].eyebrow} className="tutorial-slide"><div className="tutorial-art relative mx-auto grid h-64 w-64 place-items-center rounded-[44px]" style={{ backgroundColor: slides[slide].color }}><div className="tutorial-ring absolute inset-7 rounded-full border border-white/80" /><div className="tutorial-icon grid h-28 w-28 place-items-center rounded-[34px] bg-white shadow-[0_18px_35px_rgba(24,51,42,0.1)]"><CurrentIcon className="h-12 w-12 text-[#3ddc84]" /></div><span className="absolute right-8 top-8 h-3 w-3 rounded-full bg-[#3ddc84]" /><span className="absolute bottom-12 left-8 h-2 w-2 rounded-full bg-[#efb34e]" /></div><div className="mt-10"><p className="text-xs font-bold tracking-[0.14em] text-[#22aa62]">{slides[slide].eyebrow}</p><h1 className="mt-4 whitespace-pre-line text-[34px] font-bold leading-[1.12] tracking-[-0.08em] text-[#18332a]">{slides[slide].title}</h1><p className="mt-5 text-sm leading-7 text-[#71877e]">{slides[slide].body}</p></div></div></section><footer><div className="mb-5 flex gap-1.5" aria-label={`${slide + 1} / ${slides.length}`} role="tablist">{slides.map((item, index) => <span key={item.eyebrow} role="tab" aria-selected={index === slide} className={`h-1.5 rounded-full transition-all duration-300 ${index === slide ? "w-8 bg-[#3ddc84]" : "w-1.5 bg-[#dcebe3]"}`} />)}</div><button onClick={next} className="flex w-full items-center justify-between rounded-2xl bg-[#3ddc84] px-5 py-4 text-sm font-bold text-[#093d27] shadow-[0_12px_24px_rgba(61,220,132,0.2)] transition hover:bg-[#72e7a0] active:scale-[0.98]"><span>{slide === slides.length - 1 ? "시작점 시작하기" : "다음"}</span><ArrowRight className="h-4 w-4" /></button><p className="mt-4 pb-2 text-center text-[11px] font-medium text-[#9aaba4]">나에게 맞는 작은 변화를 시작해요.</p></footer></div></main>;
}

function WebAppEntryView({ onTestStart, onLogin }: { onTestStart: () => void; onLogin: () => void }) {
  const [panel, setPanel] = useState<"none" | "help" | "login" | "signup">("none");
  const panelTitle = panel === "login" ? "로그인" : panel === "signup" ? "회원가입" : "앱 사용 도움말";

  return (
    <main className="min-h-screen bg-[#f8fafc] text-[#18332a] lg:flex">
      <aside className="hidden w-[270px] shrink-0 flex-col border-r border-[#e4ebf0] bg-white p-5 lg:flex"><div className="flex items-center gap-3 px-2"><img src="/manus-storage/startpoint-logo_afef8c07.webp" alt="시작점 로고" className="h-10 w-10 rounded-2xl object-cover" /><div><p className="text-lg font-bold tracking-[-0.07em]">시작점</p><p className="text-[10px] font-bold tracking-[0.12em] text-[#8aa096]">LIFE RHYTHM</p></div></div><div className="mt-12 rounded-2xl bg-[#effff5] p-4"><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#22aa62]">WELCOME</p><p className="mt-3 text-sm font-bold leading-5 text-[#275241]">오늘의 움직임을<br />가볍게 시작해요.</p><p className="mt-2 text-xs leading-5 text-[#789087]">개인 일정과 컨디션에 맞는 루틴을 찾아드려요.</p></div><nav className="mt-6 space-y-1.5"><div className="flex items-center gap-3 rounded-xl bg-[#f5f8fa] px-3 py-3 text-sm font-bold text-[#45675a]"><HomeIcon className="h-4 w-4 text-[#3ddc84]" />시작하기</div><div className="flex items-center gap-3 px-3 py-3 text-sm font-semibold text-[#9aaba4]"><CalendarDays className="h-4 w-4" />일정 연결</div><div className="flex items-center gap-3 px-3 py-3 text-sm font-semibold text-[#9aaba4]"><HeartPulse className="h-4 w-4" />몸의 신호</div></nav><div className="mt-auto rounded-2xl border border-[#e6edf1] p-4"><div className="flex items-center gap-2 text-xs font-bold text-[#668077]"><ShieldCheck className="h-4 w-4 text-[#3ddc84]" />안전한 사용 안내</div><p className="mt-2 text-[11px] leading-5 text-[#8aa097]">시작점은 생활 관리 도구이며 의료 진단을 대신하지 않아요.</p></div></aside>
      <section className="min-w-0 flex-1"><header className="flex h-[76px] items-center justify-between border-b border-[#e4ebf0] bg-white px-5 sm:px-8"><div className="flex items-center gap-3 lg:hidden"><img src="/manus-storage/startpoint-logo_afef8c07.webp" alt="시작점 로고" className="h-9 w-9 rounded-xl object-cover" /><p className="font-bold">시작점</p></div><div className="hidden text-xs font-semibold text-[#94a59e] sm:block">서비스 시작 · 계정이 없어도 테스트 가능</div><button onClick={() => setPanel("help")} className="inline-flex items-center gap-2 rounded-xl border border-[#e1e9ee] bg-white px-3 py-2.5 text-xs font-bold text-[#4d6d60] transition hover:border-[#3ddc84] hover:bg-[#effff5]"><BookOpen className="h-4 w-4 text-[#22aa62]" />도움말</button></header><div className="mx-auto grid max-w-[1080px] gap-6 px-5 py-7 sm:px-8 sm:py-10 lg:grid-cols-[1.1fr_.9fr] lg:px-10 lg:py-14"><div className="flex flex-col justify-center"><div className="flex items-center gap-2 text-xs font-bold text-[#22aa62]"><span className="h-2 w-2 rounded-full bg-[#3ddc84]" />시작점 웹 앱에 오신 것을 환영해요</div><h1 className="mt-5 text-4xl font-bold leading-[1.1] tracking-[-0.08em] text-[#18332a] sm:text-5xl">작은 움직임을<br /><span className="text-[#22aa62]">매일의 기본값</span>으로.</h1><p className="mt-5 max-w-lg text-sm leading-7 text-[#71877e]">수업과 공부 사이의 빈틈을 찾아, 지금 할 수 있는 1–3분 루틴을 추천해요. 먼저 테스트 모드로 기능을 둘러보세요.</p><div className="mt-8 grid max-w-lg grid-cols-3 gap-3"><div className="rounded-2xl border border-[#e4ebf0] bg-white p-3"><p className="text-[10px] font-bold text-[#22aa62]">01</p><p className="mt-2 text-xs font-bold text-[#45675a]">위험 요인</p></div><div className="rounded-2xl border border-[#e4ebf0] bg-white p-3"><p className="text-[10px] font-bold text-[#22aa62]">02</p><p className="mt-2 text-xs font-bold text-[#45675a]">일정 틈</p></div><div className="rounded-2xl border border-[#e4ebf0] bg-white p-3"><p className="text-[10px] font-bold text-[#22aa62]">03</p><p className="mt-2 text-xs font-bold text-[#45675a]">회복 기록</p></div></div></div><div className="rounded-[28px] border border-[#e1e9ee] bg-white p-5 shadow-[0_16px_40px_rgba(32,66,53,0.07)] sm:p-7"><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#22aa62]">GET STARTED</p><h2 className="mt-2 text-xl font-bold tracking-[-0.06em] text-[#25483c]">어떻게 시작할까요?</h2></div><div className="grid h-10 w-10 place-items-center rounded-xl bg-[#effff5] text-[#22aa62]"><ArrowRight className="h-5 w-5" /></div></div><div className="mt-7 space-y-3"><button onClick={onTestStart} className="flex w-full items-center justify-between rounded-2xl bg-[#3ddc84] px-4 py-4 text-left text-sm font-bold text-[#093d27] shadow-[0_10px_20px_rgba(61,220,132,0.18)] transition hover:bg-[#72e7a0] active:scale-[0.98]"><span><span className="block">테스트로 시작하기</span><span className="mt-1 block text-[11px] font-medium opacity-70">설정 없이 기능을 먼저 체험해요</span></span><Play className="h-4 w-4 fill-current" /></button><button onClick={() => setPanel("login")} className="flex w-full items-center justify-between rounded-2xl border border-[#dfe9e4] px-4 py-4 text-left text-sm font-bold text-[#45675a] transition hover:border-[#3ddc84] hover:bg-[#effff5]"><span><span className="block">로그인</span><span className="mt-1 block text-[11px] font-medium text-[#91a49b]">기존 설정을 이어서 사용해요</span></span><LogIn className="h-4 w-4" /></button><button onClick={() => setPanel("signup")} className="flex w-full items-center justify-between rounded-2xl border border-[#dfe9e4] px-4 py-4 text-left text-sm font-bold text-[#45675a] transition hover:border-[#3ddc84] hover:bg-[#effff5]"><span><span className="block">회원가입</span><span className="mt-1 block text-[11px] font-medium text-[#91a49b]">나만의 리듬을 저장해요</span></span><UserPlus className="h-4 w-4" /></button></div><div className="mt-6 flex items-start gap-2 rounded-xl bg-[#f8fafc] p-3 text-[11px] leading-5 text-[#8aa097]"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#3ddc84]" />로그인과 회원가입은 현재 화면 확인을 위한 임시 버튼입니다.</div></div></div></section>
      {panel !== "none" && <div className="fixed inset-0 z-50 grid place-items-center bg-[#18332a]/35 p-4 backdrop-blur-sm"><section className="animate-modal-in w-full max-w-md rounded-[30px] bg-white p-6 shadow-2xl sm:p-7"><div className="flex items-center justify-between"><div><span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#22aa62]">{panel === "help" ? "HOW IT WORKS" : "TEMPORARY MODE"}</span><h2 className="mt-1 text-xl font-bold tracking-[-0.06em] text-[#224336]">{panelTitle}</h2></div><button onClick={() => setPanel("none")} className="grid h-9 w-9 place-items-center rounded-xl bg-[#f3f7f5] text-[#799087]"><X className="h-4 w-4" /></button></div>{panel === "help" ? <div className="mt-6 space-y-3">{[["01", "설정하기", "위험 요인과 목표를 선택하면 나에게 맞는 안내가 시작돼요."], ["02", "틈 찾기", "캘린더 일정 사이의 쉬는 시간을 찾아 1–3분 루틴을 추천해요."], ["03", "완료하기", "작은 움직임을 끝내면 회복 잎과 상태 메시지로 성취를 알려줘요."]].map(([number, title, description]) => <div key={number} className="flex gap-3 rounded-2xl bg-[#f8fafc] p-4"><span className="text-xs font-bold text-[#3ddc84]">{number}</span><div><p className="text-sm font-bold text-[#345b4b]">{title}</p><p className="mt-1 text-xs leading-5 text-[#7b9187]">{description}</p></div></div>)}</div> : <div className="mt-6"><label className="text-xs font-bold text-[#547267]">이메일</label><input className="mt-2 w-full rounded-xl border border-[#dfe9e4] bg-[#f8fafc] px-3 py-3 text-sm outline-none focus:border-[#3ddc84]" placeholder="sample@rhythm.app" /><label className="mt-4 block text-xs font-bold text-[#547267]">비밀번호</label><input type="password" className="mt-2 w-full rounded-xl border border-[#dfe9e4] bg-[#f8fafc] px-3 py-3 text-sm outline-none focus:border-[#3ddc84]" placeholder="테스트용 입력" /><p className="mt-3 text-[11px] text-[#8ba097]">현재는 화면 확인을 위한 임시 모드입니다.</p></div>}      <button onClick={panel === "help" ? () => setPanel("none") : panel === "login" ? onLogin : onTestStart} className="mt-6 w-full rounded-2xl bg-[#3ddc84] py-3.5 text-sm font-bold text-[#093d27] transition hover:bg-[#72e7a0] active:scale-[0.98]">{panel === "help" ? "확인했어요" : panel === "login" ? "로그인 후 개인정보 설정하기" : "테스트로 시작하기"}</button></section></div>}</main>
  );
}

function OnboardingView({ onComplete, onSkip }: { onComplete: (profile: ProfileSetup) => void; onSkip: () => void }) {
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState("focus");
  const [riskFactors, setRiskFactors] = useState<string[]>([]);
  const [calendarConnected, setCalendarConnected] = useState(false);

  const toggleRisk = (id: string) => setRiskFactors((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const finish = () => onComplete({ goal, riskFactors, calendarConnected });

  return (
    <main className="min-h-screen bg-[#f8fafc] px-4 py-6 text-[#2c2c2a] sm:px-8 sm:py-10">
      <div className="mx-auto max-w-[980px]">
        <header className="flex items-center justify-between"><div className="flex items-center gap-3"><img src="/manus-storage/startpoint-logo_afef8c07.webp" alt="시작점 로고" className="h-10 w-10 rounded-2xl object-cover shadow-[0_8px_16px_rgba(61,220,132,0.18)]" /><div><p className="text-lg font-bold tracking-[-0.07em] text-[#174c3e]">시작점</p><p className="text-[10px] font-semibold tracking-[0.08em] text-[#76958a]">LIFE RHYTHM</p></div></div><button onClick={onSkip} className="text-xs font-bold text-[#76958a] transition hover:text-[#195b43]">나중에 설정하기</button></header>
        <div className="mx-auto mt-12 max-w-[620px] text-center sm:mt-16"><span className="rounded-full bg-[#e4f7ed] px-3 py-1.5 text-[11px] font-bold text-[#195b43]">{step} / 3</span><h1 className="mt-5 text-3xl font-bold tracking-[-0.07em] text-[#21483b] sm:text-4xl">나에게 맞는 리듬을<br /><span className="text-[#3ddc84]">함께 만들어볼게요.</span></h1><p className="mt-4 text-sm leading-6 text-[#71877e]">몇 가지 정보만 알려주면, 공부와 일정 사이에<br className="hidden sm:block" /> 부담 없는 움직임을 추천해드릴게요.</p></div>
        <div className="mx-auto mt-9 max-w-[640px] rounded-[32px] bg-white p-5 shadow-[0_18px_48px_rgba(21,86,66,0.08)] ring-1 ring-[#d8eee5] sm:mt-12 sm:p-8">
          {step === 1 && <div><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#fff3df] text-[#d7891d]"><ShieldCheck className="h-5 w-5" /></span><div><h2 className="font-bold text-[#25483c]">개인 위험 요인을 알려주세요.</h2><p className="mt-1 text-xs text-[#80938b]">더 안전한 리듬을 제안하는 데만 사용해요.</p></div></div><div className="mt-6 space-y-2">{riskFactorOptions.map((factor) => { const active = riskFactors.includes(factor.id); return <button key={factor.id} onClick={() => toggleRisk(factor.id)} className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left text-sm font-semibold transition ${active ? "border-[#a9d8c3] bg-[#eefaf3] text-[#195b43]" : "border-[#e0eee8] text-[#526a61] hover:border-[#bcdccf]"}`}><span className={`grid h-5 w-5 place-items-center rounded-md border ${active ? "border-[#195b43] bg-[#195b43] text-white" : "border-[#bfd2c9]"}`}>{active && <Check className="h-3.5 w-3.5" />}</span>{factor.label}</button>; })}</div><div className="mt-4 flex items-start gap-2 text-[11px] leading-5 text-[#8da099]"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />모든 항목은 선택 사항이며, 리듬의 위험도 안내를 개인화하기 위한 정보예요.</div></div>}
          {step === 2 && <div><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#eaf3ff] text-[#4b73b6]"><Sparkles className="h-5 w-5" /></span><div><h2 className="font-bold text-[#25483c]">가장 먼저 바꾸고 싶은 건 무엇인가요?</h2><p className="mt-1 text-xs text-[#80938b]">선택한 목표를 기준으로 추천 문장을 바꿔드려요.</p></div></div><div className="mt-6 space-y-3">{goalOptions.map((item) => { const Icon = item.icon; const active = goal === item.id; return <button key={item.id} onClick={() => setGoal(item.id)} className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${active ? "border-[#8cc8ae] bg-[#eefaf3] shadow-[0_6px_16px_rgba(15,110,86,0.06)]" : "border-[#e0eee8] hover:border-[#bcdccf]"}`}><span className={`grid h-11 w-11 place-items-center rounded-2xl ${active ? "bg-[#195b43] text-white" : "bg-[#f1f8f4] text-[#7e9d90]"}`}><Icon className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className={`block text-sm font-bold ${active ? "text-[#195b43]" : "text-[#526a61]"}`}>{item.label}</span><span className="mt-1 block text-xs text-[#8da099]">{item.detail}</span></span>{active && <Check className="h-5 w-5 text-[#3ddc84]" />}</button>; })}</div></div>}
          {step === 3 && <div><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#fff3df] text-[#d7891d]"><CalendarDays className="h-5 w-5" /></span><div><h2 className="font-bold text-[#25483c]">캘린더와 연결할까요?</h2><p className="mt-1 text-xs text-[#80938b]">일정 사이의 빈 시간을 찾아 루틴을 추천해요.</p></div></div><div className="mt-6 rounded-2xl border border-[#dfeee7] bg-[#f7fcf9] p-4"><div className="flex items-center justify-between"><div><p className="text-sm font-bold text-[#335e4f]">오늘의 일정 미리보기</p><p className="mt-1 text-xs text-[#81948b]">연결 후 쉬는 시간에 맞춰 추천</p></div><button onClick={() => setCalendarConnected((value) => !value)} className={`relative h-7 w-12 rounded-full transition ${calendarConnected ? "bg-[#3ddc84]" : "bg-[#c9d9d2]"}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${calendarConnected ? "left-6" : "left-1"}`} /></button></div><div className="mt-4 space-y-2">{[["09:00", "온라인 강의", "진행 중"], ["15:20", "쉬는 시간", "추천 루틴"], ["16:00", "소비자행동론", "강의실 B204"]].map(([time, title, state]) => <div key={time} className={`flex items-center gap-3 rounded-xl p-3 ${state === "추천 루틴" && calendarConnected ? "bg-[#e5f7ed]" : "bg-white"}`}><span className="w-12 text-xs font-bold text-[#55786a]">{time}</span><span className="flex-1 text-xs font-semibold text-[#567269]">{title}</span><span className={`text-[10px] font-bold ${state === "추천 루틴" && calendarConnected ? "text-[#3ddc84]" : "text-[#9aaba4]"}`}>{state}</span></div>)}</div></div><div className="mt-4 flex items-start gap-2 text-[11px] leading-5 text-[#8da099]"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />실제 캘린더 연결 전에도 샘플 일정으로 추천 흐름을 미리 볼 수 있어요.</div></div>}
          <div className="mt-8 flex items-center justify-between gap-3 border-t border-[#edf3f0] pt-5"><button onClick={() => step > 1 ? setStep((value) => value - 1) : onSkip()} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-bold text-[#82968d] transition hover:bg-[#f4faf7]">{step > 1 && <ArrowLeft className="h-3.5 w-3.5" />} {step > 1 ? "이전" : "건너뛰기"}</button><button onClick={() => step < 3 ? setStep((value) => value + 1) : finish()} className="inline-flex items-center gap-2 rounded-xl bg-[#195b43] px-5 py-3 text-xs font-bold text-white shadow-[0_9px_18px_rgba(15,110,86,0.18)] transition hover:bg-[#0b5a46] active:scale-[0.97]">{step < 3 ? "다음" : "리듬 시작하기"}<ArrowRight className="h-3.5 w-3.5" /></button></div>
        </div>
        <div className="mx-auto mt-6 flex max-w-[640px] gap-2">{[1, 2, 3].map((item) => <div key={item} className={`h-1.5 flex-1 rounded-full transition ${item <= step ? "bg-[#3ddc84]" : "bg-[#dcece4]"}`} />)}</div>
      </div>
    </main>
  );
}

function NavButton({
  active,
  label,
  icon: Icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: typeof HomeIcon;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`group flex items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-semibold transition-all duration-200 ${
        active
          ? "bg-[#e5f8ef] text-[#195b43] shadow-[0_8px_22px_rgba(15,110,86,0.08)]"
          : "text-[#75847f] hover:bg-white hover:text-[#165e4b]"
      }`}
    >
      <Icon className={`h-[18px] w-[18px] ${active ? "text-[#195b43]" : "text-[#94a59f] group-hover:text-[#195b43]"}`} />
      <span>{label}</span>
    </button>
  );
}

function MetricCard({
  icon: Icon,
  value,
  unit,
  label,
  note,
  iconClass,
}: {
  icon: typeof Clock3;
  value: string;
  unit: string;
  label: string;
  note: string;
  iconClass: string;
}) {
  return (
    <article className="rounded-[24px] bg-white p-4 shadow-[0_12px_32px_rgba(21,86,66,0.055)] ring-1 ring-[#d8eee5]/70 sm:p-5">
      <div className="mb-5 flex items-start justify-between">
        <div className={`grid h-9 w-9 place-items-center rounded-xl ${iconClass}`}>
          <Icon className="h-[17px] w-[17px]" />
        </div>
        <span className="rounded-full bg-[#f4faf7] px-2 py-1 text-[10px] font-bold text-[#6b8079]">{note}</span>
      </div>
      <p className="text-[25px] font-bold tracking-[-0.06em] text-[#1e322b] sm:text-[28px]">
        {value} <span className="text-[13px] font-semibold tracking-[-0.02em] text-[#6a7d76]">{unit}</span>
      </p>
      <p className="mt-1 text-xs font-medium text-[#80918b]">{label}</p>
    </article>
  );
}

function WeeklyChart() {
  const data = [38, 46, 24, 62, 43, 31, 18];
  const labels = ["월", "화", "수", "목", "금", "토", "일"];
  return (
    <div className="mt-5 flex h-28 items-end justify-between gap-2">
      {data.map((height, index) => (
        <div key={labels[index]} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
          <div className="relative flex h-[92px] w-full max-w-[24px] items-end overflow-hidden rounded-full bg-[#edf7f2]">
            <div
              style={{ height: `${height}%` }}
              className={`w-full rounded-full ${index === 3 ? "bg-[#195b43]" : "bg-[#9edbc4]"}`}
            />
          </div>
          <span className={`text-[10px] font-bold ${index === 3 ? "text-[#195b43]" : "text-[#95a7a0]"}`}>{labels[index]}</span>
        </div>
      ))}
    </div>
  );
}

function RoutineView({ onStart }: { onStart: (recommendation: Recommendation) => void }) {
  const routines: Recommendation[] = [
    seatRecommendation,
    { title: "발끝 톡톡 30회", description: "발바닥을 바닥에 붙이고 리듬 있게 발끝을 움직여요.", duration: 45, tag: "방해 없이", cue: "45초 · 30회" },
    moveRecommendation,
    { title: "가슴 열고 자세 세우기", description: "어깨를 뒤로 보내고, 천천히 3번 호흡해요.", duration: 90, tag: "자리에서 가능", cue: "1분 30초 · 호흡 3회" },
  ];
  return (
    <div className="animate-page-in space-y-6">
      <section className="overflow-hidden rounded-[30px] bg-[#195b43] p-6 text-white shadow-[0_18px_45px_rgba(15,110,86,0.18)] sm:p-8">
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.17em] text-[#9cdec8]">맞춤 마이크로 루틴</p>
            <h1 className="mt-3 text-2xl font-bold tracking-[-0.06em] sm:text-3xl">지금 가능한 움직임만 모았어요.</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#d2eee3]">강의, 과제, 카페 어디에서든. 자리와 일정에 맞춰 1–3분짜리 루틴을 골라보세요.</p>
          </div>
          <Sparkles className="h-8 w-8 shrink-0 text-[#b2efda]" />
        </div>
      </section>
      <section className="grid gap-4 sm:grid-cols-2">
        {routines.map((routine, index) => (
          <article key={routine.title} className="group rounded-[26px] bg-white p-5 shadow-[0_12px_30px_rgba(21,86,66,0.06)] ring-1 ring-[#dceee7] transition hover:-translate-y-0.5 hover:shadow-[0_18px_38px_rgba(21,86,66,0.10)]">
            <div className="flex items-start justify-between gap-3">
              <span className={`grid h-10 w-10 place-items-center rounded-2xl ${index === 2 ? "bg-[#e5f8ef] text-[#195b43]" : "bg-[#fff3db] text-[#c87815]"}`}>
                {index === 2 ? <Footprints className="h-5 w-5" /> : <TimerReset className="h-5 w-5" />}
              </span>
              <span className="rounded-full bg-[#f2f8f5] px-2.5 py-1 text-[10px] font-bold text-[#507067]">{routine.tag}</span>
            </div>
            <h2 className="mt-5 text-lg font-bold tracking-[-0.045em] text-[#20362d]">{routine.title}</h2>
            <p className="mt-2 text-sm leading-6 text-[#74847e]">{routine.description}</p>
            <div className="mt-5 flex items-center justify-between">
              <span className="text-xs font-bold text-[#195b43]">{routine.cue}</span>
              <button onClick={() => onStart(routine)} className="inline-flex items-center gap-1 rounded-xl bg-[#ecf8f2] px-3 py-2 text-xs font-bold text-[#195b43] transition hover:bg-[#d8f1e5] active:scale-[0.97]">
                시작 <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

function ReportView() {
  return (
    <div className="animate-page-in space-y-6">
      <section className="rounded-[30px] bg-white p-6 shadow-[0_12px_32px_rgba(21,86,66,0.055)] ring-1 ring-[#d8eee5]/80 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.17em] text-[#195b43]">이번 주 리포트</p>
            <h1 className="mt-2 text-2xl font-bold tracking-[-0.06em] text-[#21382f] sm:text-3xl">앉아 있던 시간 속에도<br />회복의 리듬이 생겼어요.</h1>
          </div>
          <span className="rounded-2xl bg-[#f0faf5] px-3 py-2 text-xs font-bold text-[#195b43]">9월 1일 — 7일</span>
        </div>
        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-[#f1fbf6] p-4"><p className="text-xs font-medium text-[#789188]">되찾은 시간</p><p className="mt-2 text-2xl font-bold tracking-[-0.05em] text-[#195b43]">38<span className="ml-1 text-sm">분</span></p><p className="mt-1 text-[11px] font-semibold text-[#4e977e]">지난주보다 12분 더</p></div>
          <div className="rounded-2xl bg-[#fff8ed] p-4"><p className="text-xs font-medium text-[#98836a]">평균 위험 점수</p><p className="mt-2 text-2xl font-bold tracking-[-0.05em] text-[#9d6517]">42<span className="ml-1 text-sm">점</span></p><p className="mt-1 text-[11px] font-semibold text-[#bd8635]">안정 구간 유지</p></div>
          <div className="rounded-2xl bg-[#f3f7ff] p-4"><p className="text-xs font-medium text-[#7786a1]">루틴 실천율</p><p className="mt-2 text-2xl font-bold tracking-[-0.05em] text-[#3e6db7]">84<span className="ml-1 text-sm">%</span></p><p className="mt-1 text-[11px] font-semibold text-[#6388c2]">12개 중 10개 완료</p></div>
        </div>
      </section>
      <section className="grid gap-5 lg:grid-cols-[1.35fr_.85fr]">
        <article className="rounded-[28px] bg-white p-6 shadow-[0_12px_32px_rgba(21,86,66,0.055)] ring-1 ring-[#d8eee5]/80">
          <div className="flex items-center justify-between"><div><h2 className="text-base font-bold text-[#23392f]">좌식 리듬</h2><p className="mt-1 text-xs text-[#80908a]">앉아 있던 누적 시간</p></div><span className="rounded-full bg-[#fff3df] px-2.5 py-1 text-[10px] font-bold text-[#b9781e]">목요일 주의</span></div>
          <WeeklyChart />
          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-[#f6faf8] p-3 text-xs leading-5 text-[#678078]"><Info className="h-4 w-4 shrink-0 text-[#195b43]" />목요일 오후 2시대가 가장 길었어요. 다음 주엔 해당 시간 전 알림을 보내드릴게요.</div>
        </article>
        <article className="overflow-hidden rounded-[28px] bg-[#e2f6ec] p-6 shadow-[0_12px_32px_rgba(21,86,66,0.055)]">
          <Trophy className="h-6 w-6 text-[#5e9726]" />
          <h2 className="mt-6 text-xl font-bold tracking-[-0.05em] text-[#23513f]">이번 주<br />3일 연속 실천!</h2>
          <div className="mt-5 flex -space-x-2"><span className="grid h-8 w-8 place-items-center rounded-full border-2 border-[#e2f6ec] bg-[#f9cdd1] text-xs">소</span><span className="grid h-8 w-8 place-items-center rounded-full border-2 border-[#e2f6ec] bg-[#cfe8fc] text-xs">준</span><span className="grid h-8 w-8 place-items-center rounded-full border-2 border-[#e2f6ec] bg-[#f6dcad] text-xs">민</span></div>
          <p className="mt-3 text-xs font-medium leading-5 text-[#4e7968]">캠퍼스 메이트 중 상위 18%</p>
        </article>
      </section>
    </div>
  );
}

function CareView() {
  const [checked, setChecked] = useState<string[]>([]);
  const symptoms = ["한쪽 다리가 붓거나 묵직해요", "다리에 통증이나 압통이 있어요", "피부가 붉거나 열감이 있어요", "숨이 차거나 흉통이 있어요"];
  const hasUrgentSymptom = checked.includes(symptoms[3]);
  return (
    <div className="animate-page-in space-y-6">
      <section className="rounded-[30px] bg-[#123f36] p-6 text-white shadow-[0_18px_45px_rgba(15,110,86,0.18)] sm:p-8">
        <div className="flex items-start gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/10"><ShieldCheck className="h-5 w-5 text-[#a7eed5]" /></span><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9edec8]">몸의 신호 케어</p><h1 className="mt-2 text-2xl font-bold tracking-[-0.06em]">예방을 위한 가벼운 확인이에요.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#d1ebe1]">시작점은 진단을 대신하지 않아요. 다만 오래 앉아 있던 날, 몸의 변화를 놓치지 않도록 도와드려요.</p></div></div>
      </section>
      <section className="rounded-[28px] bg-white p-6 shadow-[0_12px_32px_rgba(21,86,66,0.055)] ring-1 ring-[#d8eee5]/80">
        <div className="flex items-center gap-3"><CircleAlert className="h-5 w-5 text-[#e69a26]" /><div><h2 className="font-bold text-[#23392f]">오늘 몸에서 느낀 변화가 있나요?</h2><p className="mt-1 text-xs text-[#80908a]">해당되는 항목만 체크해 주세요.</p></div></div>
        <div className="mt-5 space-y-2">
          {symptoms.map((symptom) => {
            const active = checked.includes(symptom);
            return <button key={symptom} onClick={() => setChecked((current) => active ? current.filter((item) => item !== symptom) : [...current, symptom])} className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left text-sm font-semibold transition ${active ? "border-[#efba62] bg-[#fff8ed] text-[#8d5c19]" : "border-[#e0eee8] text-[#526a61] hover:border-[#bcdccf]"}`}><span className={`grid h-5 w-5 place-items-center rounded-md border ${active ? "border-[#d78c24] bg-[#d78c24] text-white" : "border-[#bfd2c9]"}`}>{active && <Check className="h-3.5 w-3.5" />}</span>{symptom}</button>;
          })}
        </div>
        {checked.length > 0 && <div className={`mt-5 rounded-2xl p-4 text-sm leading-6 ${hasUrgentSymptom ? "bg-[#fff0ed] text-[#9d3e2e]" : "bg-[#fff8ed] text-[#8c641f]"}`}><p className="font-bold">{hasUrgentSymptom ? "호흡 곤란 또는 흉통이 있다면 즉시 119 또는 가까운 응급의료기관에 도움을 요청하세요." : "증상이 지속되거나 악화되면 의료기관 상담을 고려해 주세요."}</p><p className="mt-1 text-xs opacity-80">이 안내는 의료 진단이 아니며, 안전한 다음 행동을 돕기 위한 정보입니다.</p>{hasUrgentSymptom && <button className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#b44735] px-3 py-2 text-xs font-bold text-white"><Phone className="h-3.5 w-3.5" />응급 도움 요청</button>}</div>}
      </section>
      <div className="flex items-center gap-3 rounded-[24px] bg-[#e9f8f1] p-5 text-sm leading-6 text-[#427363]"><Stethoscope className="h-5 w-5 shrink-0 text-[#195b43]" />의학적 위험요인은 온보딩에서 개별 설정할 수 있어요. 필요하다면 의료진과 상의해 주세요.</div>
    </div>
  );
}

export default function Home() {
  const [view, setView] = useState<View>("home");
  const [profile, setProfile] = useState<ProfileSetup | null>(() => readStoredProfile());
  const [entryStarted, setEntryStarted] = useState(() => Boolean(readStoredProfile()));
  const [showFirstRun, setShowFirstRun] = useState(false);
  const [canMove, setCanMove] = useState(false);
  const [actionOpen, setActionOpen] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [activeRecommendation, setActiveRecommendation] = useState<Recommendation>(seatRecommendation);
  const [secondsLeft, setSecondsLeft] = useState(seatRecommendation.duration);

  useEffect(() => {
    if (!actionOpen || completed || secondsLeft <= 0) return;
    const timeout = window.setTimeout(() => setSecondsLeft((seconds) => seconds - 1), 1000);
    return () => window.clearTimeout(timeout);
  }, [actionOpen, completed, secondsLeft]);

  const recommendation = canMove ? moveRecommendation : seatRecommendation;
  const scheduleLabel = profile?.calendarConnected ? "캘린더 기준 다음 쉬는 시간까지 34분" : "다음 일정까지 34분";
  const openAction = (nextRecommendation = recommendation) => {
    setActiveRecommendation(nextRecommendation);
    setSecondsLeft(nextRecommendation.duration);
    setCompleted(false);
    setActionOpen(true);
  };

  const completeAction = () => {
    setCompleted(true);
    setSecondsLeft(0);
  };

  const completeProfile = (nextProfile: ProfileSetup) => {
    setProfile(nextProfile);
    setEntryStarted(true);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(nextProfile));
      if (window.localStorage.getItem(FIRST_RUN_TUTORIAL_KEY) !== "done") {
        setShowFirstRun(true);
      }
    }
  };

  useEffect(() => {
    if (!profile || typeof window === "undefined") return;
    if (window.localStorage.getItem(FIRST_RUN_TUTORIAL_KEY) !== "done") {
      setShowFirstRun(true);
    }
  }, [profile]);

  const finishFirstRun = () => {
    window.localStorage.setItem(FIRST_RUN_TUTORIAL_KEY, "done");
    setShowFirstRun(false);
  };

  if (!entryStarted) {
    return <WebAppEntryView onTestStart={() => setEntryStarted(true)} onLogin={() => setEntryStarted(true)} />;
  }

  if (!profile) {
    return <OnboardingView onComplete={completeProfile} onSkip={() => completeProfile({ goal: "focus", riskFactors: [], calendarConnected: false })} />;
  }

  if (showFirstRun) return <FirstRunIntro onDone={finishFirstRun} />;

  const renderView = () => {
    if (view === "calendar") return <CalendarView connected={profile.calendarConnected} onConnect={() => setProfile((current) => current ? { ...current, calendarConnected: true } : current)} completed={completed} onStart={openAction} />;
    if (view === "routine") return <RoutineView onStart={openAction} />;
    if (view === "report") return <ReportView />;
    if (view === "care") return <CareView />;
    return <div className="animate-page-in space-y-6 lg:space-y-7">
      <section className="relative overflow-hidden rounded-[30px] bg-[#195b43] px-5 py-6 text-white shadow-[0_18px_45px_rgba(15,110,86,0.20)] sm:px-8 sm:py-8">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "url('/manus-storage/rhythm-flow_311def95.png')", backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#a8e9d1]"><span className="h-2 w-2 rounded-full bg-[#7dddaf] shadow-[0_0_0_5px_rgba(125,221,175,0.16)]" />지금, 온라인 강의 중</div>
            <h1 className="mt-4 text-[28px] font-bold leading-[1.18] tracking-[-0.07em] sm:text-[34px]">가벼운 움직임이<br /><span className="text-[#bbefd9]">오늘의 리듬</span>을 바꿔요.</h1>
            <p className="mt-3 text-sm leading-6 text-[#d0ece1]">{scheduleLabel}. 지금은 자리에서<br className="hidden sm:block" /> 1분만 몸을 깨워보면 좋아요.</p>
          </div>
          <div className="flex items-center gap-4 rounded-[24px] border border-white/10 bg-[#0b5946]/55 px-4 py-3 backdrop-blur-sm sm:flex-col sm:gap-1 sm:px-5 sm:py-4">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-[#f3b64e] text-[#594216]"><Activity className="h-5 w-5" /></div>
            <div><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#bfe9da]">현재 위험도</p><p className="mt-0.5 text-xl font-bold tracking-[-0.04em]">주의 <span className="text-sm font-semibold text-[#e6d096]">57</span></p></div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.28fr_.72fr]">
        <article className="relative overflow-hidden rounded-[30px] bg-white p-5 shadow-[0_14px_36px_rgba(21,86,66,0.07)] ring-1 ring-[#d7ece3] sm:p-6">
          <div className="absolute -right-12 -top-8 h-32 w-32 rounded-full bg-[#eef9f3] blur-2xl" />
          <div className="relative flex items-start justify-between gap-4">
            <div><div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-xl bg-[#fff2da] text-[#d4881a]"><TimerReset className="h-4 w-4" /></span><span className="text-xs font-bold text-[#195b43]">지금 이 움직임</span></div><h2 className="mt-4 text-xl font-bold tracking-[-0.055em] text-[#20392f] sm:text-2xl">{recommendation.title}</h2><p className="mt-2 max-w-md text-sm leading-6 text-[#71847c]">{recommendation.description}</p></div>
            <span className="shrink-0 rounded-full bg-[#eff8f4] px-2.5 py-1.5 text-[10px] font-bold text-[#518476]">{recommendation.tag}</span>
          </div>
          <div className="relative mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#f4faf7] p-3 sm:p-4"><div className="flex items-center gap-2 text-xs font-bold text-[#356c5b]"><Clock3 className="h-4 w-4 text-[#195b43]" />{recommendation.cue}</div><button onClick={() => openAction()} className="inline-flex items-center gap-2 rounded-xl bg-[#3ddc84] px-4 py-2.5 text-sm font-bold text-white shadow-[0_9px_16px_rgba(99,153,34,0.22)] transition hover:bg-[#56891b] active:scale-[0.97]"><Play className="h-3.5 w-3.5 fill-current" />지금 시작</button></div>
          <div className="relative mt-5 flex items-center gap-2"><button onClick={() => setCanMove(false)} className={`rounded-full px-3 py-2 text-xs font-bold transition ${!canMove ? "bg-[#dff4e9] text-[#195b43]" : "bg-[#f5f8f6] text-[#8aa097] hover:bg-[#eaf4ef]"}`}>자리에서 가능</button><button onClick={() => setCanMove(true)} className={`rounded-full px-3 py-2 text-xs font-bold transition ${canMove ? "bg-[#dff4e9] text-[#195b43]" : "bg-[#f5f8f6] text-[#8aa097] hover:bg-[#eaf4ef]"}`}>자리 이동 가능</button></div>
        </article>

        <article className="relative overflow-hidden rounded-[30px] bg-[#e3f6ed] p-5 shadow-[0_14px_36px_rgba(21,86,66,0.06)] sm:p-6">
          <div className="flex items-start justify-between"><div><p className="text-xs font-bold text-[#34816a]">오늘의 리듬 잎</p><p className="mt-2 text-2xl font-bold tracking-[-0.06em] text-[#265745]">6 / 8</p><p className="mt-1 text-xs leading-5 text-[#5d8979]">두 번만 더 움직이면<br />새 잎이 피어요.</p></div><div className="rounded-full bg-white/65 p-2"><Sprout className="h-5 w-5 text-[#3ddc84]" /></div></div>
          <div className="mt-3 flex items-end justify-between"><div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/70"><div className="h-full w-3/4 rounded-full bg-[#3ddc84]" /></div><img src="/manus-storage/rhythm-plant_c4630f9f.png" alt="회복을 상징하는 화분 캐릭터" className="-mb-9 ml-2 h-28 w-28 object-contain drop-shadow-[0_12px_10px_rgba(30,80,60,0.16)]" /></div>
        </article>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4"><MetricCard icon={Clock3} value="1:46" unit="시간" label="연속 좌식" note="12분 남음" iconClass="bg-[#fff3df] text-[#d7891d]" /><MetricCard icon={Footprints} value="3,842" unit="걸음" label="오늘 걸음" note="목표 64%" iconClass="bg-[#e8f7ef] text-[#195b43]" /><MetricCard icon={MapPin} value="2.7" unit="km" label="이동 거리" note="캠퍼스" iconClass="bg-[#e9f2ff] text-[#4b73b6]" /><MetricCard icon={Brain} value="2:18" unit="시간" label="집중 시간" note="좋은 흐름" iconClass="bg-[#f1ecff] text-[#7752b4]" /></section>

      <section className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
        <article className="rounded-[28px] bg-white p-5 shadow-[0_12px_32px_rgba(21,86,66,0.055)] ring-1 ring-[#d8eee5]/80 sm:p-6">
          <div className="flex items-center justify-between"><div><h2 className="font-bold tracking-[-0.04em] text-[#20392f]">오늘의 흐름</h2><p className="mt-1 text-xs text-[#82938c]">앉음과 움직임의 균형</p></div><button onClick={() => setView("report")} className="inline-flex items-center gap-1 text-xs font-bold text-[#195b43]">자세히 <ChevronRight className="h-3.5 w-3.5" /></button></div>
          <div className="mt-7"><div className="flex items-center justify-between text-[10px] font-bold text-[#96a69f]"><span>09:00</span><span>12:00</span><span>15:00</span><span>18:00</span></div><div className="mt-2 flex h-7 overflow-hidden rounded-lg bg-[#eff6f2]"><div className="w-[15%] border-r-2 border-white bg-[#5dcc9f]" /><div className="w-[29%] border-r-2 border-white bg-[#f0b657]" /><div className="w-[12%] border-r-2 border-white bg-[#8ad8bb]" /><div className="w-[35%] border-r-2 border-white bg-[#e9a33d]" /><div className="w-[9%] bg-[#8ad8bb]" /></div><div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[11px] font-medium text-[#71847c]"><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#e9a33d]" />좌식</span><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#5dcc9f]" />이동</span><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#8ad8bb]" />가벼운 활동</span></div></div>
        </article>
        <article className="rounded-[28px] bg-[#fffaf2] p-5 shadow-[0_12px_32px_rgba(21,86,66,0.045)] ring-1 ring-[#f1e6d0] sm:p-6"><div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#ffecc8] text-[#d1871d]"><CalendarDays className="h-[17px] w-[17px]" /></span><div><p className="text-xs font-bold text-[#a16e29]">{profile.calendarConnected ? "캘린더에서 찾은 다음 틈" : "다음 일정"}</p><h2 className="mt-1 font-bold tracking-[-0.04em] text-[#4a3821]">{profile.calendarConnected ? "15:20 · 쉬는 시간" : "16:00 · 소비자행동론"}</h2><p className="mt-1 text-xs leading-5 text-[#8d7860]">{profile.calendarConnected ? "일정 사이 10분 · 루틴 추천 가능" : "강의실 B204 · 34분 뒤 시작"}</p></div></div><div className="mt-4 flex items-center justify-between border-t border-[#f1e4cd] pt-4"><span className="flex items-center gap-1.5 text-xs font-semibold text-[#79664c]"><Moon className="h-3.5 w-3.5" />{profile.goal === "activity" ? "활동량 추천" : profile.goal === "schedule" ? "일정 맞춤 추천" : "집중 회복 추천"}</span><button onClick={() => openAction(moveRecommendation)} className="text-xs font-bold text-[#a86d1b]">2분 걷기</button></div></article>
      </section>

      <section className="flex items-start gap-3 rounded-[24px] border border-[#d9eee4] bg-[#f0faf5] p-4 text-sm leading-6 text-[#52766a]"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#195b43]" /><p><strong className="font-bold text-[#1e5f4b]">시작점은 예방을 돕는 생활 도구예요.</strong> 한쪽 다리의 붓기·통증, 호흡 곤란 등 걱정되는 증상이 있으면 ‘케어’에서 다음 행동을 확인해 주세요.</p></section>
      <WeeklyAiReport goal={profile.goal} completedToday={completed} />
    </div>;
  };

  return (
    <main className="min-h-screen bg-[#f8fafc] pb-24 text-[#2c2c2a] lg:pb-0">
      <div className="mx-auto flex min-h-screen max-w-[1440px]">
        <aside className="hidden w-[246px] shrink-0 flex-col border-r border-[#dbece5] bg-[#f8fcfa] px-5 py-7 lg:flex">
          <div className="flex items-center gap-3 px-2"><img src="/manus-storage/startpoint-logo_afef8c07.webp" alt="시작점 로고" className="h-10 w-10 rounded-2xl object-cover shadow-[0_8px_16px_rgba(61,220,132,0.18)]" /><div><p className="text-lg font-bold tracking-[-0.07em] text-[#174c3e]">시작점</p><p className="text-[10px] font-semibold tracking-[0.08em] text-[#76958a]">LIFE RHYTHM</p></div></div>
          <nav className="mt-12 space-y-2">{navItems.map((item) => <NavButton key={item.id} active={view === item.id} label={item.label} icon={item.icon} onClick={() => setView(item.id)} />)}</nav>
          <div className="mt-auto overflow-hidden rounded-[24px] bg-[#eafff1] p-4"><Users className="h-5 w-5 text-[#31765f]" /><p className="mt-5 text-sm font-bold leading-5 tracking-[-0.035em] text-[#245b48]">캠퍼스 메이트와<br />함께 걸어볼까요?</p><button className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#195b43]">이번 주 순위 <ArrowRight className="h-3.5 w-3.5" /></button></div>
        </aside>
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-[#dbece5]/80 bg-[#f8fcfa]/85 px-5 backdrop-blur-xl sm:px-8 lg:h-[88px] lg:px-10">
            <div className="flex items-center gap-3 lg:hidden"><img src="/manus-storage/startpoint-logo_afef8c07.webp" alt="시작점 로고" className="h-9 w-9 rounded-2xl object-cover" /><p className="text-lg font-bold tracking-[-0.07em] text-[#174c3e]">시작점</p></div>
            <div className="hidden lg:block"><p className="text-xs font-bold uppercase tracking-[0.17em] text-[#80a295]">2026. 09. 05 · Friday</p><p className="mt-1 text-sm font-semibold text-[#456c5d]">안녕하세요, 지민님</p></div>
            <div className="flex items-center gap-3"><div className="hidden items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-bold text-[#56776b] shadow-sm ring-1 ring-[#dceee7] sm:flex"><CloudSun className="h-4 w-4 text-[#e6a33d]" />21°C · 맑음</div><button aria-label="알림" className="relative grid h-10 w-10 place-items-center rounded-2xl bg-white text-[#426b5c] shadow-sm ring-1 ring-[#dceee7] transition hover:bg-[#edf8f2]"><Bell className="h-[18px] w-[18px]" /><span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-[#e69d2c]" /></button><div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#ffdabb] text-sm font-bold text-[#8c5330]">지</div></div>
          </header>
          <div className="mx-auto max-w-[1160px] px-4 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-9">{renderView()}</div>
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-30 flex justify-around border-t border-[#d6e8df] bg-[#fbfefc]/95 px-3 pb-[max(0.55rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl lg:hidden">{navItems.map((item) => { const Icon = item.icon; const active = view === item.id; return <button key={item.id} onClick={() => setView(item.id)} className={`flex min-w-14 flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-[10px] font-bold transition ${active ? "text-[#195b43]" : "text-[#82958d]"}`}><span className={`grid h-7 w-9 place-items-center rounded-xl ${active ? "bg-[#e4f6ed]" : ""}`}><Icon className="h-[17px] w-[17px]" /></span>{item.label}</button>; })}</nav>

      {actionOpen && <div className="fixed inset-0 z-50 grid place-items-end bg-[#153d31]/35 p-0 backdrop-blur-[2px] sm:place-items-center sm:p-5"><section role="dialog" aria-modal="true" aria-label="마이크로 루틴 실행" className="animate-modal-in w-full max-w-md rounded-t-[32px] bg-[#fbfefc] p-6 shadow-2xl sm:rounded-[32px] sm:p-7">{completed ? <div className="text-center"><div className="relative mx-auto grid h-20 w-20 place-items-center"><span className="celebrate-orbit celebrate-orbit-one" /><span className="celebrate-orbit celebrate-orbit-two" /><span className="celebrate-confetti confetti-one" /><span className="celebrate-confetti confetti-two" /><span className="celebrate-confetti confetti-three" /><span className="celebrate-confetti confetti-four" /><div className="celebrate-pop grid h-16 w-16 place-items-center rounded-full bg-[#def5e9] text-[#3ddc84]"><Check className="h-8 w-8" /></div></div><p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-[#49816d]">리듬을 되찾았어요</p><h2 className="mt-2 text-2xl font-bold tracking-[-0.06em] text-[#234a3d]">완료! 새 잎에 물을 줬어요.</h2><p aria-live="polite" className="mt-3 text-sm leading-6 text-[#70877e]">1분의 움직임으로 혈류를 깨웠어요.<br />오늘의 회복 시간에 기록할게요.</p><div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full bg-[#f0fae8] px-3 py-2 text-xs font-bold text-[#3ddc84]"><Sprout className="h-3.5 w-3.5" />회복 시간 +1분</div><button onClick={() => setActionOpen(false)} className="mt-6 w-full rounded-2xl bg-[#195b43] py-3.5 text-sm font-bold text-white transition hover:bg-[#0b5a46] active:scale-[0.98]">계속 리듬 만들기</button></div> : <><div className="flex items-center justify-between"><span className="rounded-full bg-[#e5f7ed] px-3 py-1.5 text-xs font-bold text-[#195b43]">{activeRecommendation.tag}</span><button aria-label="닫기" onClick={() => setActionOpen(false)} className="grid h-9 w-9 place-items-center rounded-xl bg-[#f2f7f4] text-[#6c8279]"><X className="h-4 w-4" /></button></div><div className="mt-7 text-center"><div className="relative mx-auto grid h-40 w-40 place-items-center rounded-full" style={{ background: `conic-gradient(#3ddc84 ${((activeRecommendation.duration - secondsLeft) / activeRecommendation.duration) * 360}deg, #e4f1eb 0deg)` }}><div className="grid h-[124px] w-[124px] place-items-center rounded-full bg-[#fbfefc] shadow-inner"><div><p className="text-[11px] font-bold text-[#719086]">남은 시간</p><p className="mt-1 text-3xl font-bold tracking-[-0.07em] text-[#214c3d]">{formatTime(secondsLeft)}</p></div></div></div><h2 className="mt-6 text-2xl font-bold tracking-[-0.06em] text-[#234a3d]">{activeRecommendation.title}</h2><p className="mt-3 text-sm leading-6 text-[#71877e]">{activeRecommendation.description}</p><p aria-live="polite" className="mt-2 text-xs font-bold text-[#3ddc84]">{secondsLeft < activeRecommendation.duration / 2 ? "좋아요, 혈류가 깨어나는 중이에요." : "천천히, 호흡을 놓치지 않아요."}</p></div><button onClick={completeAction} className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#3ddc84] py-3.5 text-sm font-bold text-white shadow-[0_10px_18px_rgba(99,153,34,0.2)] transition hover:bg-[#56891b] active:scale-[0.98]"><Check className="h-4 w-4" />완료했어요</button><p className="mt-3 text-center text-[11px] font-medium text-[#90a097]">부담 없이, 가능한 만큼만 해도 충분해요.</p></>}</section></div>}
    </main>
  );
}

function CloudSun({ className }: { className?: string }) {
  return <Droplets className={className} />;
}
