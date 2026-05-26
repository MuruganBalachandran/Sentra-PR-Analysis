import { Metadata } from "next";
import WorkflowsClient from "./WorkflowsClient";

export const metadata: Metadata = {
  title: "GitHub Workflows | Sentra",
  description: "Manage GitHub Actions workflows for automated CI/CD",
};

export default function WorkflowsPage() {
  return <WorkflowsClient />;
}
