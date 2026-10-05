import { sundownUi } from "@/components/sundown/font";
import { Sundown } from "@/components/sundown/sundown";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sheriff's board · After 50" };

export default function BoardPage() {
  return <Sundown fontClass={sundownUi.variable} boardOpenAtStart />;
}
