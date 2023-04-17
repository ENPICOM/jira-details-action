import { getInputs } from './action-inputs';
import { IGithubData, JiraDetails, PullRequestParams } from './types';
import { PullsUpdateParams } from '@octokit/rest';
import { buildPrDescription, getJiraIssueKey, getPrDescription } from './utils';
import { context, GitHub } from '@actions/github/lib/github';

export class GithubConnector {
    client: GitHub = {} as GitHub;
    githubData: IGithubData = {} as IGithubData;

    constructor() {
        const { GITHUB_TOKEN } = getInputs();
        this.client = new GitHub(GITHUB_TOKEN);
        this.githubData = this.getGithubData();
    }

    get isPRAction(): boolean {
        return this.githubData.eventName === 'pull_request';
    }

    get headBranch(): string {
        return this.githubData.pullRequest.head.ref;
    }

    getIssueKeyFromTitle(): string | null {
        const { USE_BRANCH_NAME } = getInputs();

        const prTitle = this.githubData.pullRequest.title;
        const branchName = this.headBranch;
        const preferredStringToParse = USE_BRANCH_NAME ? branchName : prTitle;
        const backupStringToParse = USE_BRANCH_NAME ? prTitle : branchName;

        if (!preferredStringToParse) {
            if (USE_BRANCH_NAME) {
                console.log(`JIRA issue id is missing in your branch ${branchName}, doing nothing`);
            } else {
                console.log(`JIRA issue id is missing in your PR title ${prTitle}, doing nothing`);
            }

            return null;
        }

        return (
            getJiraIssueKey(preferredStringToParse) ??
            (backupStringToParse ? getJiraIssueKey(backupStringToParse) : null)
        );
    }

    async updatePrDetails(ticket: JiraDetails) {
        const owner = this.githubData.owner;
        const repo = this.githubData.repository.name;

        const { number: prNumber = 0, body: prBody = '' } = this.githubData.pullRequest;

        const prData: PullsUpdateParams = {
            owner,
            repo,
            pull_number: prNumber,
            body: getPrDescription(prBody, buildPrDescription(ticket)),
        };

        await this.client.pulls.update(prData);
    }

    private getGithubData(): IGithubData {
        const {
            eventName,
            payload: {
                repository,
                organization: { login: owner },
                pull_request: pullRequest,
            },
        } = context;

        return {
            eventName,
            repository,
            owner,
            pullRequest: pullRequest as PullRequestParams,
        };
    }
}
