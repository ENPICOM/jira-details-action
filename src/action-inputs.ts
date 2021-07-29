import { IActionInputs } from './types';
import * as core from '@actions/core';

export const getInputs = (): IActionInputs => {
    const JIRA_TOKEN: string = core.getInput('jira-token', { required: true });
    const JIRA_BASE_URL: string = core.getInput('jira-base-url', { required: true });
    const GITHUB_TOKEN: string = core.getInput('github-token', { required: true });
    const BRANCH_IGNORE_PATTERN: string = core.getInput('skip-branches', { required: false }) || '';

    const USE_BRANCH_NAME: boolean = core.getInput('use-branch-name', { required: false }) === 'true';
    const ENCODE_JIRA_TOKEN: boolean = core.getInput('encode-jira-token', { required: false }) === 'true';

    const TRANSITION: string = core.getInput('transition', { required: false }) || '';

    return {
        JIRA_TOKEN,
        GITHUB_TOKEN,
        USE_BRANCH_NAME,
        BRANCH_IGNORE_PATTERN,
        JIRA_BASE_URL: JIRA_BASE_URL.endsWith('/') ? JIRA_BASE_URL.replace(/\/$/, '') : JIRA_BASE_URL,
        ENCODE_JIRA_TOKEN,
        TRANSITION,
    };
};
