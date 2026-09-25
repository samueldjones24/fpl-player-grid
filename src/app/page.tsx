import { getPlayers } from "@/lib/fpl/client";
import { PlayerGrid } from "@/components/player-grid";

export default async function Home() {
  const players = await getPlayers();
  return <PlayerGrid players={players} />;
}
