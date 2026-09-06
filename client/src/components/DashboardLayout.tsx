import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/useMobile";
import { Activity, CalendarDays, HeartPulse, Home as HomeIcon, LogOut, PanelLeft, Sparkles } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";

const menuItems = [
  { icon: HomeIcon, label: "오늘", path: "/" },
  { icon: CalendarDays, label: "일정", path: "/calendar" },
  { icon: Activity, label: "리포트", path: "/analytics" },
];
const SIDEBAR_WIDTH_KEY = "startpoint:sidebar-width";
const DEFAULT_WIDTH = 270;
const MIN_WIDTH = 224;
const MAX_WIDTH = 360;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => { const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY); return saved ? parseInt(saved, 10) : DEFAULT_WIDTH; });
  const { loading, user } = useAuth();
  useEffect(() => localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString()), [sidebarWidth]);
  if (loading) return <DashboardLayoutSkeleton />;
  if (!user) return null;
  return <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}><DashboardLayoutContent setSidebarWidth={setSidebarWidth}>{children}</DashboardLayoutContent></SidebarProvider>;
}

function DashboardLayoutContent({ children, setSidebarWidth }: { children: React.ReactNode; setSidebarWidth: (width: number) => void }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const activeMenu = menuItems.find(item => item.path === location);
  useEffect(() => { const move = (event: MouseEvent) => { if (!isResizing) return; const width = event.clientX - (sidebarRef.current?.getBoundingClientRect().left ?? 0); if (width >= MIN_WIDTH && width <= MAX_WIDTH) setSidebarWidth(width); }; const up = () => setIsResizing(false); if (isResizing) { document.addEventListener("mousemove", move); document.addEventListener("mouseup", up); document.body.style.cursor = "col-resize"; document.body.style.userSelect = "none"; } return () => { document.removeEventListener("mousemove", move); document.removeEventListener("mouseup", up); document.body.style.cursor = ""; document.body.style.userSelect = ""; }; }, [isResizing, setSidebarWidth]);
  return <><div className="relative" ref={sidebarRef}><Sidebar collapsible="icon" className="border-r border-[#e4ebf0] bg-white text-[#18332a]" disableTransition={isResizing}><SidebarHeader className="h-[82px] justify-center px-4"><div className="flex w-full items-center gap-3"><button onClick={toggleSidebar} aria-label="메뉴 접기" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[#698279] transition hover:bg-[#effff5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3ddc84]"><PanelLeft className="h-[18px] w-[18px]" /></button>{!isCollapsed && <div className="flex min-w-0 items-center gap-2"><img src="/manus-storage/startpoint-logo_afef8c07.webp" alt="시작점 로고" className="h-9 w-9 rounded-xl object-cover" /><div><p className="text-[16px] font-bold tracking-[-0.07em] text-[#18332a]">시작점</p><p className="mt-0.5 text-[9px] font-bold tracking-[0.14em] text-[#8aa096]">LIFE RHYTHM</p></div></div>}</div></SidebarHeader><SidebarContent className="px-3 pt-3">{!isCollapsed && <div className="mb-6 rounded-2xl bg-[#effff5] p-4"><p className="text-[10px] font-bold tracking-[0.15em] text-[#22aa62]">WELCOME</p><p className="mt-3 text-sm font-bold leading-5 text-[#275241]">오늘의 시간을<br />가볍게 시작해요.</p><p className="mt-2 text-xs leading-5 text-[#789087]">집중과 움직임을 같은 흐름에서 살펴봐요.</p></div>}<SidebarMenu className="gap-1.5">{menuItems.map(item => <SidebarMenuItem key={item.path}><SidebarMenuButton isActive={location === item.path} onClick={() => setLocation(item.path)} tooltip={item.label} className="h-11 rounded-xl px-3 text-[13px] font-semibold text-[#81948b] transition hover:bg-[#effff5] hover:text-[#345b4b] data-[active=true]:bg-[#f5f8fa] data-[active=true]:text-[#45675a]"><item.icon className={`h-[17px] w-[17px] ${location === item.path ? "text-[#3ddc84]" : ""}`} /><span>{item.label}</span></SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu>{!isCollapsed && <div className="mt-6 border-t border-[#edf2ef] pt-5"><div className="flex items-center gap-3 px-3 py-2 text-[12px] font-semibold text-[#97a79f]"><Sparkles className="h-4 w-4" />작은 움직임</div><div className="flex items-center gap-3 px-3 py-2 text-[12px] font-semibold text-[#97a79f]"><HeartPulse className="h-4 w-4" />몸의 신호</div></div>}</SidebarContent><SidebarFooter className="p-3">{!isCollapsed && <div className="mb-3 rounded-2xl border border-[#e6edf1] p-3"><div className="flex items-center gap-2 text-xs font-bold text-[#668077]"><HeartPulse className="h-4 w-4 text-[#3ddc84]" />안전한 사용 안내</div><p className="mt-2 text-[10px] leading-4 text-[#8aa097]">시작점은 생활 관리 도구이며 의료 진단을 대신하지 않아요.</p></div>}<DropdownMenu><DropdownMenuTrigger asChild><button className="flex w-full items-center gap-3 rounded-xl px-1 py-1.5 text-left transition hover:bg-[#effff5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3ddc84] group-data-[collapsible=icon]:justify-center"><Avatar className="h-8 w-8 border border-[#dce7e1]"><AvatarFallback className="bg-[#e9fff1] text-[11px] font-bold text-[#195b43]">{user?.name?.charAt(0).toUpperCase() || "나"}</AvatarFallback></Avatar><div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden"><p className="truncate text-xs font-bold text-[#45675a]">{user?.name || "내 리듬"}</p><p className="mt-0.5 truncate text-[10px] text-[#9aaba4]">나만의 기록</p></div></button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-44"><DropdownMenuItem onClick={logout} className="cursor-pointer text-[#9d514a] focus:text-[#9d514a]"><LogOut className="mr-2 h-4 w-4" />로그아웃</DropdownMenuItem></DropdownMenuContent></DropdownMenu></SidebarFooter></Sidebar><div className={`absolute right-0 top-0 z-50 h-full w-1 cursor-col-resize transition hover:bg-[#3ddc84]/40 ${isCollapsed ? "hidden" : ""}`} onMouseDown={() => !isCollapsed && setIsResizing(true)} /></div><SidebarInset className="min-h-screen bg-[#f8fafc]">{isMobile && <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#e4ebf0] bg-white/95 px-4 backdrop-blur"><div className="flex items-center gap-2"><SidebarTrigger className="h-9 w-9 rounded-xl bg-transparent" /><span className="text-sm font-bold tracking-[-0.05em] text-[#33413e]">{activeMenu?.label ?? "시작점"}</span></div><span className="h-2 w-2 rounded-full bg-[#3ddc84]" /></header>}<main className="mx-auto w-full max-w-[1480px] px-4 py-5 sm:px-7 sm:py-7 lg:px-10 lg:py-9">{children}</main></SidebarInset></>;
}
