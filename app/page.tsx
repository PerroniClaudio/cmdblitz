import TutorialGenerator from "@/components/TutorialGenerator";
import { getTutorials } from "./actions";

export default async function Home() {
  const tutorials = await getTutorials();

  return (
    <main className="min-h-screen bg-slate-50">
      <TutorialGenerator initialHistory={tutorials} />
    </main>
  );
}
