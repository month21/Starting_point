from pathlib import Path

home = Path('/home/ubuntu/life-rhythm/client/src/pages/Home.tsx')
s = home.read_text()
replacements = {
    '>리듬</p>': '>시작점</p>',
    '리듬 웹 앱에 오신 것을 환영해요': '시작점 웹 앱에 오신 것을 환영해요',
    '리듬은 생활 관리 도구이며 의료 진단을 대신하지 않아요.': '시작점은 생활 관리 도구이며 의료 진단을 대신하지 않아요.',
    '리듬은 진단을 대신하지 않아요.': '시작점은 진단을 대신하지 않아요.',
    '<div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#3ddc84] text-[#093d27]"><Sprout className="h-5 w-5" /></div>': '<img src="/manus-storage/startpoint-logo_afef8c07.webp" alt="시작점 로고" className="h-10 w-10 rounded-2xl object-cover" />',
    '<div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#195b43] text-white shadow-[0_8px_16px_rgba(15,110,86,0.2)]"><Sprout className="h-5 w-5" /></div>': '<img src="/manus-storage/startpoint-logo_afef8c07.webp" alt="시작점 로고" className="h-10 w-10 rounded-2xl object-cover shadow-[0_8px_16px_rgba(61,220,132,0.18)]" />',
    '<div className="grid h-9 w-9 place-items-center rounded-xl bg-[#3ddc84] text-[#093d27]"><Sprout className="h-4 w-4" /></div>': '<img src="/manus-storage/startpoint-logo_afef8c07.webp" alt="시작점 로고" className="h-9 w-9 rounded-xl object-cover" />',
}
for old, new in replacements.items():
    if old not in s:
        print(f"missing: {old[:60]}")
    s = s.replace(old, new)
home.write_text(s)

index = Path('/home/ubuntu/life-rhythm/client/index.html')
t = index.read_text().replace('<title>리듬 — 생활 리듬</title>', '<title>시작점 — 앉아 있는 하루에도 움직임의 틈</title>')
index.write_text(t)
