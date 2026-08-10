import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";
import Login from "../welcome/login";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Sync-chill" },
    { name: "description", content: "Sync-chill: calendar where several people can share their schedules, agree on dates and coordinate events" },
  ];
}

export default function Home() {
  return <Login />;
}
