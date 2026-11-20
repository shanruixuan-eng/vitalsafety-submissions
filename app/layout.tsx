import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "惟泰安全供稿收集站",
  description: "惟泰安全公众号内部供稿，收集行业应用与项目案例素材。",
  robots: { index: false, follow: false },
  icons: { icon: "/brand-icon.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
