'use client';

import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeSelector } from '@/components/themes/theme-selector';
import { ThemeModeToggle } from '@/components/themes/theme-mode-toggle';
import { Icons } from '@/components/icons';

export default function SettingsPage() {
  return (
    <PageContainer
      pageTitle="Cài đặt hệ thống"
      pageDescription="Tùy chỉnh cấu hình, thay đổi giao diện sáng/tối và lựa chọn tông màu chủ đạo cho trang quản trị."
    >
      <div className="grid gap-6 max-w-4xl">
        {/* Card Giao diện */}
        <Card className="border-border/40 bg-card/60 backdrop-blur-md shadow-sm transition-all duration-300 hover:shadow-md hover:border-border/80">
          <CardHeader className="flex flex-row items-center gap-4 space-y-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform duration-300 hover:scale-110">
              <Icons.palette className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold tracking-tight">Giao diện & Chủ đề</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Tùy chỉnh chế độ sáng/tối và tông màu chủ đạo cho trang quản trị.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-4 border-t border-border/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-background/50 border border-border/30 hover:border-border/60 transition-all duration-200">
              <div className="space-y-1">
                <span className="text-sm font-semibold block text-foreground">Chế độ hiển thị</span>
                <span className="text-xs text-muted-foreground block">
                  Chuyển đổi nhanh giữa giao diện sáng (Light mode) và giao diện tối (Dark mode).
                </span>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <ThemeModeToggle />
                <span className="text-xs text-muted-foreground select-none">Nhấn để thay đổi</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-background/50 border border-border/30 hover:border-border/60 transition-all duration-200">
              <div className="space-y-1">
                <span className="text-sm font-semibold block text-foreground">Tông màu chủ đạo</span>
                <span className="text-xs text-muted-foreground block">
                  Chọn màu sắc thương hiệu và chủ đề hiển thị mong muốn cho các nút bấm và thành phần UI.
                </span>
              </div>
              <div className="flex items-center self-start sm:self-auto">
                <ThemeSelector />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card Thông tin phiên bản & Hệ thống */}
        <Card className="border-border/40 bg-card/60 backdrop-blur-md shadow-sm opacity-95 transition-all duration-300 hover:shadow-md">
          <CardHeader className="flex flex-row items-center gap-4 space-y-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Icons.info className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold tracking-tight">Thông tin hệ thống</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Thông tin kỹ thuật và phiên bản phần mềm đang vận hành.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4 border-t border-border/20">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="p-3 rounded-lg bg-background/30 border border-border/20 hover:bg-background/40 transition-colors">
                <span className="text-xs text-muted-foreground block">Phiên bản</span>
                <span className="font-semibold text-foreground">v2.4.0-release</span>
              </div>
              <div className="p-3 rounded-lg bg-background/30 border border-border/20 hover:bg-background/40 transition-colors">
                <span className="text-xs text-muted-foreground block">Môi trường</span>
                <span className="font-semibold text-foreground">Development (Local)</span>
              </div>
              <div className="p-3 rounded-lg bg-background/30 border border-border/20 hover:bg-background/40 transition-colors">
                <span className="text-xs text-muted-foreground block">Công nghệ</span>
                <span className="font-semibold text-foreground">Next.js v15.x & React 19</span>
              </div>
              <div className="p-3 rounded-lg bg-background/30 border border-border/20 hover:bg-background/40 transition-colors">
                <span className="text-xs text-muted-foreground block">Styling</span>
                <span className="font-semibold text-foreground">TailwindCSS & Radix UI</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
