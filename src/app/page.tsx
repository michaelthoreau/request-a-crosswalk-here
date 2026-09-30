import { connection } from "next/server"
import { HomeMap } from "@/components/home-map"
import { listActiveCrosswalks } from "@/lib/crosswalks"

export default async function Home() {
  await connection()
  return <HomeMap points={await listActiveCrosswalks()} />
}
