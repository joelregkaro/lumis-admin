import { getPromptVersions } from "@/lib/queries";
import PromptLabClient from "./prompt-lab-client";

export const dynamic = "force-dynamic";

export default async function PromptLabPage() {
  const versions = await getPromptVersions();
  return <PromptLabClient initialVersions={versions} />;
}
