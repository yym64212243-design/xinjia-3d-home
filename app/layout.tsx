import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    "https://yym64212243-design.github.io/xinjia-3d-home/",
  ),
  title: {
    default: "我们的新家 · 3D 户型",
    template: "%s · 我们的新家",
  },
  description:
    "无需安装软件，直接在手机浏览器里旋转、缩放、逐层查看，并一键切换简约原木装修效果。",
  openGraph: {
    type: "website",
    locale: "zh_CN",
    title: "我们的新家 · 3D 户型",
    description: "拖动查看三层住宅，并一键切换简约原木装修效果。",
    images: [
      {
        url: "/og.png",
        width: 1659,
        height: 948,
        alt: "我们的新家三层住宅与简约原木装修预览",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "我们的新家 · 3D 户型",
    description: "拖动查看三层住宅，并一键切换简约原木装修效果。",
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ece8df",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
