import * as core from '@actions/core';
import { shouldSkipBranch } from './utils';
import { getInputs } from './action-inputs';
import { GithubConnector } from './github-connector';
import { isValidTransition, JiraConnector } from './jira-connector';

async function run(): Promise<void> {
    try {
        const { BRANCH_IGNORE_PATTERN, TRANSITION } = getInputs();

        const githubConnector = new GithubConnector();
        const jiraConnector = new JiraConnector();

        if (!githubConnector.isPRAction) {
            console.log('This action is meant to be run only on PRs');
            process.exit(0);
        }

        const skipBranch = shouldSkipBranch(githubConnector.headBranch, BRANCH_IGNORE_PATTERN);

        if (skipBranch) {
            console.log('Skipping action on this branch');
            process.exit(0);
        }

        const issueKey = githubConnector.getIssueKeyFromTitle();

        if (issueKey == null) {
            console.log('Could not find any issue keys');
            process.exit(0);
        }

        if (TRANSITION === '') {
            console.log(`Fetching details for JIRA keys ${issueKey}`);
            const ticket = await jiraConnector.getTicketDetails(issueKey);

            console.log(`Updating PR description with the following JIRA ticket info: ${JSON.stringify(ticket)}`);
            await githubConnector.updatePrDetails(ticket);
        } else if (isValidTransition(TRANSITION)) {
            await jiraConnector.transitionIssue(issueKey, TRANSITION);
        } else {
            console.error('Unknown transition supplied', TRANSITION);
            process.exit(1);
        }
        console.log('Done!');
    } catch (error) {
        console.log({ error });
        core.setFailed(error.message);
        process.exit(1);
    }
}

run();
