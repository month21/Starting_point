import { useEffect, useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { exercises, type Exercise } from "../../../shared/movement";
import { Button } from "@/components/ui/button";

const format = (d: Date) =>
  new Date(d).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
const card = "space-y-3 rounded-2xl border bg-white p-5";
const selectStyle = "block w-full rounded-lg border p-2";
type Notice = { id: number; exercise: Exercise; shownAt: Date | null };

export function MovementNotice() {
  const utils = trpc.useUtils();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [ready, setReady] = useState(false);
  const [revision, refresh] = useState(0);
  const reply = trpc.movement.respond.useMutation({
    onSuccess: () => {
      setNotice(null);
      refresh(v => v + 1);
      void utils.movement.report.invalidate();
    },
    onError: e => toast.error(e.message),
  });
  useEffect(() => {
    let active = true;
    let busy = false;
    async function poll() {
      if (!active || busy || document.hidden) return;
      busy = true;
      try {
        const row = await utils.client.movement.evaluate.mutate();
        if (active && !document.hidden) setNotice(row);
      } catch {
        if (active) setNotice(null);
      } finally {
        busy = false;
      }
    }
    void poll();
    const clock = window.setInterval(poll, 15000);
    document.addEventListener("visibilitychange", poll);
    window.addEventListener("movement-change", poll);
    return () => {
      active = false;
      clearInterval(clock);
      document.removeEventListener("visibilitychange", poll);
      window.removeEventListener("movement-change", poll);
    };
  }, [utils.client, revision]);
  const id = notice?.id;
  useEffect(() => {
    let active = true;
    setReady(false);
    if (id) {
      const ack = async () => {
        if (document.hidden) return;
        try {
          await utils.client.movement.shown.mutate({ id });
          if (active) {
            setReady(true);
            void utils.movement.report.invalidate();
          }
        } catch {
          if (active) setNotice(null);
        }
      };
      void ack();
      document.addEventListener("visibilitychange", ack);
      return () => {
        active = false;
        document.removeEventListener("visibilitychange", ack);
      };
    }
  }, [id, utils.client]);
  if (!notice) return null;
  return (
    <aside
      role="status"
      className="mb-4 rounded-2xl bg-[#195b43] p-4 text-white"
    >
      <strong>{exercises[notice.exercise]}</strong>
      <p>지금 가능하면 가볍게 움직이고 실천 여부를 남겨 주세요.</p>
      <div className="mt-2 flex gap-2">
        {(["done", "dismiss"] as const).map(response => (
          <Button
            variant="secondary"
            key={response}
            disabled={!ready || reply.isPending}
            onClick={() => reply.mutate({ id: notice.id, response })}
          >
            {response === "done" ? "실천했어요" : "건너뛰기"}
          </Button>
        ))}
      </div>
    </aside>
  );
}

export default function Movement() {
  const report = trpc.movement.report.useQuery(undefined, {
    refetchInterval: 30000,
  });
  const utils = trpc.useUtils();
  const changed = () => {
    void utils.movement.report.invalidate();
    window.dispatchEvent(new Event("movement-change"));
  };
  const options = {
    onSuccess: changed,
    onError: (e: { message: string }) => toast.error(e.message),
  };
  const save = trpc.movement.configure.useMutation(options);
  const add = trpc.movement.addClass.useMutation(options);
  const remove = trpc.movement.removeClass.useMutation(options);
  const data = report.data;
  if (!data) return <p>{report.error?.message ?? "기록을 불러오는 중…"}</p>;
  const { profile, goal, count, score } = data;
  return (
    <div className="mx-auto max-w-3xl space-y-4 text-[#18332a]">
      <h1 className="text-2xl font-bold">움직임과 실천</h1>
      <section className={card}>
        <h2 className="font-bold">오늘의 행동 목표</h2>
        <p>
          {count} / {goal}회 · 달성 점수 {score}점
        </p>
        <p>
          처음 7일은 하루 8회예요. 이후 매일 직전 7일 평균 실천 횟수를 올림하고
          1회를 더해 목표를 정해요(1~16회).
        </p>
      </section>
      <form
        className={card}
        key={profile?.userId ?? "new"}
        onSubmit={e => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          save.mutate({
            place: f.get("place") as "desk" | "hall" | "home",
            situation: f.get("situation") as "quiet" | "free",
            preference: f.get("preference") as Exercise,
          });
        }}
      >
        <h2 className="font-bold">알림 설정</h2>
        <p>
          좌석 타이머가 30분을 채우면 열린 앱에서 알림을 확인할 수 있어요. 수업
          중에는 보류해요. 효과 비교를 위해 알림마다 고정·맞춤 방식을 무작위
          배정해요.
        </p>
        <label className="block">
          장소
          <select
            className={selectStyle}
            name="place"
            defaultValue={profile?.place}
          >
            <option value="desk">책상</option>
            <option value="hall">복도</option>
            <option value="home">집</option>
          </select>
        </label>
        <label className="block">
          현재 상황
          <select
            className={selectStyle}
            name="situation"
            defaultValue={profile?.situation}
          >
            <option value="quiet">조용히 움직여야 해요</option>
            <option value="free">자유롭게 움직일 수 있어요</option>
          </select>
        </label>
        <label className="block">
          선호 운동
          <select
            className={selectStyle}
            name="preference"
            defaultValue={profile?.preference ?? "walk"}
          >
            {Object.entries(exercises).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <Button disabled={save.isPending}>
          {profile ? "설정 저장" : "알림 시작"}
        </Button>
      </form>
      <section className={card}>
        <h2 className="font-bold">수업 일정</h2>
        <form
          className="space-y-2"
          onSubmit={e => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            add.mutate({
              start: new Date(String(f.get("start"))),
              end: new Date(String(f.get("end"))),
            });
          }}
        >
          <label className="block">
            시작 (기기 시간)
            <input
              className={selectStyle}
              type="datetime-local"
              name="start"
              required
            />
          </label>
          <label className="block">
            종료 (기기 시간)
            <input
              className={selectStyle}
              type="datetime-local"
              name="end"
              required
            />
          </label>
          <Button disabled={add.isPending}>수업 추가</Button>
        </form>
        {data.classes.map(c => (
          <div key={c.id}>
            {format(c.start)} ~ {format(c.end)} (한국 시간){" "}
            <Button
              variant="outline"
              onClick={() => remove.mutate({ id: c.id })}
            >
              삭제
            </Button>
          </div>
        ))}
      </section>
      <section className={card}>
        <h2 className="font-bold">실천 패턴과 알림 비교</h2>
        <p>
          한국 시간 기준 · 실제 표시한 알림 중 실천 완료한 비율이에요. 응답이
          없는 알림도 분모에 포함해요.
        </p>
        {Object.entries({
          mode: "알림 방식",
          hour: "시간대",
          weekday: "요일",
          exercise: "운동 종류",
        }).map(([axis, title]) => (
          <div key={axis}>
            <h3 className="font-semibold">{title}</h3>
            {Object.keys(data.groups[axis]).length === 0
              ? "기록 없음"
              : Object.entries(data.groups[axis]).map(([label, g]) => (
                  <p key={label}>
                    {label} · {g.done}/{g.sent}회 (
                    {Math.round((g.done / g.sent) * 100)}%)
                  </p>
                ))}
          </div>
        ))}
      </section>
      <section className={card}>
        <h2 className="font-bold">최근 알림 및 응답</h2>
        {!data.history.length && "기록 없음"}
        {data.history.map(row => (
          <p key={row.id} className="border-t pt-2 text-sm">
            {format(row.createdAt)} · {row.mode === "fixed" ? "고정" : "맞춤"} ·{" "}
            {row.reason}
            {row.deferredUntil && " · 보류 기한 " + format(row.deferredUntil)}
            <br />
            {row.shownAt ? "표시 " + format(row.shownAt) : "표시 전"} ·{" "}
            {row.response === "done"
              ? "실천"
              : row.response === "dismiss"
                ? "건너뜀"
                : "응답 없음"}{" "}
            {row.respondedAt && format(row.respondedAt)}
          </p>
        ))}
      </section>
    </div>
  );
}
