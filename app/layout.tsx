import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    "https://yym64212243-design.github.io/xinjia-3d-home/",
  ),
  title: {
    default: "我们的新家 · 沉浸式 VR",
    template: "%s · 我们的新家",
  },
  description:
    "手机直接打开的沉浸式住宅 VR：八个空间、五种写实装修风格、清晨中午夜晚三种光照。",
  openGraph: {
    type: "website",
    locale: "zh_CN",
    title: "我们的新家 · 沉浸式 VR",
    description: "站进房间拖动看 360°，切换五种写实装修风格和三个时段。",
    images: [
      {
        url: "/og-vr-five-styles.png",
        width: 1672,
        height: 941,
        alt: "我们的新家五种写实装修风格全景预览",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "我们的新家 · 沉浸式 VR",
    description: "站进房间拖动看 360°，切换五种写实装修风格和三个时段。",
    images: ["/og-vr-five-styles.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#161613",
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
