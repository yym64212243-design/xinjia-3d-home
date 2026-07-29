import type { Metadata } from "next";
import { HouseViewer } from "./HouseViewer";

export const metadata: Metadata = {
  title: "我们的新家 · 3D 户型",
  description: "在手机上拖动、旋转和缩放查看地下室、一楼、二楼与整栋住宅。",
};

export default function Home() {
  return <HouseViewer />;
}
