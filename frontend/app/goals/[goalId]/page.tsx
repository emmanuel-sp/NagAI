import GoalWorkspaceContainer from "@/components/goals/GoalWorkspaceContainer";

interface GoalWorkspacePageProps {
  params: Promise<{
    goalId: string;
  }>;
}

export default async function GoalWorkspacePage({ params }: GoalWorkspacePageProps) {
  const { goalId } = await params;
  return <GoalWorkspaceContainer goalId={Number(goalId)} />;
}
