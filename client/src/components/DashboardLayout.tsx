import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/useMobile";
import { BarChart3, CalendarRange, LayoutDashboard, LogOut, PanelLeft, Timer } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";

const menuItems = [
  { icon: LayoutDashboard, label: "오늘의 흐름", path: "/" },
  { icon: CalendarRange, label: "시간 캘린더", path: "/calendar" },
  { icon: BarChart3, label: "활동 분석", path: "/analytics" },
];

const SIDEBAR_WIDTH_KEY = "startpoint:sidebar-width";
const DEFAULT_WIDTH = 272;
const MIN_WIDTH = 224;
const MAX_WIDTH = 360;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString()), [sidebarWidth]);
  if (loading) return <DashboardLayoutSkeleton />;
  if (!user) return null;

  return (
    <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}>
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>{children}</DashboardLayoutContent>
    </SidebarProvider>
  );
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

  useEffect(() => {
    const move = (event: MouseEvent) => {
      if (!isResizing) return;
      const left = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const width = event.clientX - left;
      if (width >= MIN_WIDTH && width <= MAX_WIDTH) setSidebarWidth(width);
    };
    const up = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", move);
      document.addEventListener("mouseup", up);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar collapsible="icon" className="border-r border-[#e7e5de] bg-[#fbfaf7] text-[#27323b]" disableTransition={isResizing}>
          <SidebarHeader className="h-[76px] justify-center px-3">
            <div className="flex w-full items-center gap-3 px-1">
              <button onClick={toggleSidebar} aria-label="메뉴 접기" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[#64716c] transition hover:bg-[#f0eee8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#41665f]">
                <PanelLeft className="h-[18px] w-[18px]" />
              </button>
              {!isCollapsed && <div className="min-w-0"><p className="text-[15px] font-extrabold tracking-[-0.07em] text-[#24343a]">시작점</p><p className="mt-0.5 text-[9px] font-bold tracking-[0.18em] text-[#9b8771]">DAILY RHYTHM</p></div>}
            </div>
          </SidebarHeader>
          <SidebarContent className="px-3 pt-4">
            {!isCollapsed && <div className="mb-5 rounded-2xl bg-[#edf1ed] px-4 py-3.5"><div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.12em] text-[#557269]"><span className="h-1.5 w-1.5 rounded-full bg-[#b48858]" />PRIVATE SPACE</div><p className="mt-2 text-xs font-semibold leading-5 text-[#4b5f58]">시간과 움직임을<br />나만의 리듬으로.</p></div>}
            <SidebarMenu className="gap-1">
              {menuItems.map(item => <SidebarMenuItem key={item.path}><SidebarMenuButton isActive={location === item.path} onClick={() => setLocation(item.path)} tooltip={item.label} className="h-11 rounded-xl px-3 text-[13px] font-semibold text-[#69746e] transition hover:bg-[#f1efe9] hover:text-[#2b3d3c] data-[active=true]:bg-[#e5ece7] data-[active=true]:text-[#315c56] data-[active=true]:shadow-none"><item.icon className="h-[17px] w-[17px]" /><span>{item.label}</span></SidebarMenuButton></SidebarMenuItem>)}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-3">
            <div className="mb-3 flex items-center gap-2 rounded-xl bg-[#f3eee6] px-3 py-2.5 text-[10px] font-semibold leading-4 text-[#80694e] group-data-[collapsible=icon]:hidden"><Timer className="h-3.5 w-3.5 shrink-0" />기록은 로그인 계정에만 저장됩니다.</div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild><button className="flex w-full items-center gap-3 rounded-xl px-1 py-1.5 text-left transition hover:bg-[#f0eee8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#41665f] group-data-[collapsible=icon]:justify-center"><Avatar className="h-8 w-8 border border-[#dedbd2]"><AvatarFallback className="bg-[#e3ece5] text-[11px] font-bold text-[#41665f]">{user?.name?.charAt(0).toUpperCase() || "나"}</AvatarFallback></Avatar><div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden"><p className="truncate text-xs font-bold text-[#42524e]">{user?.name || "내 기록"}</p><p className="mt-0.5 truncate text-[10px] text-[#8c948e]">안전한 개인 공간</p></div></button></DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44"><DropdownMenuItem onClick={logout} className="cursor-pointer text-[#9d514a] focus:text-[#9d514a]"><LogOut className="mr-2 h-4 w-4" />로그아웃</DropdownMenuItem></DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div className={`absolute right-0 top-0 z-50 h-full w-1 cursor-col-resize transition hover:bg-[#8aa99f]/40 ${isCollapsed ? "hidden" : ""}`} onMouseDown={() => !isCollapsed && setIsResizing(true)} />
      </div>
      <SidebarInset className="min-h-screen bg-[#f6f5f1]">
        {isMobile && <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#e7e5de] bg-[#fbfaf7]/95 px-4 backdrop-blur"><div className="flex items-center gap-2"><SidebarTrigger className="h-9 w-9 rounded-xl bg-transparent" /><span className="text-sm font-bold tracking-[-0.05em] text-[#33413e]">{activeMenu?.label ?? "시작점"}</span></div><span className="h-2 w-2 rounded-full bg-[#b48858]" /></header>}
        <main className="mx-auto w-full max-w-[1480px] px-4 py-5 sm:px-7 sm:py-7 lg:px-10 lg:py-9">{children}</main>
      </SidebarInset>
    </>
  );
}
