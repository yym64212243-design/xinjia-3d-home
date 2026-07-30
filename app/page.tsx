import type { Metadata } from "next";
import { HouseViewer } from "./HouseViewer";

export const metadata: Metadata = {
  title: "我们的新家 · 沉浸式 VR",
  description:
    "在手机上拖动、缩放查看八个空间，并切换五种写实装修风格和清晨中午夜晚三种光照。",
};

export default function Home() {
  return <HouseViewer />;
}
