import Header from "@/components/Header";
import AgentsTable from "@/components/AgentsTable";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <Header />
      <div className="flex-1 min-h-0 overflow-auto">
        <AgentsTable />
      </div>
    </div>
  );
}
