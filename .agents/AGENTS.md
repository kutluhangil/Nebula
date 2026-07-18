# Nebula Agent Rules

<RULE[kutluhangil_workflow]>
The user (Kutluhan) prefers an automated git workflow.
- **Auto-Commit & Push:** ALWAYS execute a `git add .`, `git commit -m "..."`, and `git push` if there are any uncommitted changes after fulfilling a user prompt. Do not wait for explicit permission to commit unless the changes are highly experimental and require review.
- **Branch:** Ensure you are on the `kutluhangil` branch.
- **Pull Requests:** The user expects PRs to be created automatically. Since `gh` CLI may not be authenticated, provide the user with the direct GitHub URL to create a PR from the current branch.
</RULE[kutluhangil_workflow]>
