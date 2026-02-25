import AgentEditor from "@/components/AgentEditor";

type Props = {
  params: { id: string };
};

export default function AgentEditPage({ params }: Props) {
  const { id } = params;
  const agentSlug = decodeURIComponent(id);
  return <AgentEditor agentId={id} agentSlug={agentSlug} />;
}
