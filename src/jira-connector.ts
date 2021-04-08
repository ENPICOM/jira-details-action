import { getInputs } from './action-inputs';
import axios, { AxiosInstance } from 'axios';
import { Jira, JiraDetails } from './types';

export class JiraConnector {
  client: AxiosInstance;
  JIRA_TOKEN: string;
  JIRA_BASE_URL: string;

  constructor() {
    const { JIRA_TOKEN, JIRA_BASE_URL, ENCODE_JIRA_TOKEN } = getInputs();

    this.JIRA_BASE_URL = JIRA_BASE_URL;
    this.JIRA_TOKEN = JIRA_TOKEN;

    const encodedToken = ENCODE_JIRA_TOKEN ? Buffer.from(JIRA_TOKEN).toString('base64') : JIRA_TOKEN;

    this.client = axios.create({
      baseURL: `${JIRA_BASE_URL}/rest/api/3`,
      timeout: 2000,
      headers: { Authorization: `Basic ${encodedToken}` },
    });
  }

  async getTicketDetails(key: string): Promise<JiraDetails> {
    const issue: Jira.Issue = await this.getIssue(key);
    const {
      fields: { issuetype: type, project, summary },
    } = issue;

    return {
      key,
      summary,
      url: `${this.JIRA_BASE_URL}/browse/${key}`,
      type: {
        name: type.name,
        icon: type.iconUrl,
      },
      project: {
        name: project.name,
        url: `${this.JIRA_BASE_URL}/browse/${project.key}`,
        key: project.key,
      },
    };
  }

  async getIssue(id: string): Promise<Jira.Issue> {
    const url = `/issue/${id}?fields=project,summary,issuetype`;
    const response = await this.client.get<Jira.Issue>(url);
    return response.data;
  }

  async transitionIssue(id: string, target: 'Done' | 'In Progress') {
    const url = `/issue/${id}/transitions`;
    const response = await (await this.client.post(url)).data({
      transition: {
        id: TRANSITION_IDS[target],
      },
    });
    if (response.status > 200 && response.status < 400) {
      console.info('Transition success', response.status);
    } else {
      console.error('Transition failed', response.data, response.status);
    }
  }
}

type ValidTranstion = 'In Progress' | 'Done';

export const isValidTransition = (transition: string): transition is ValidTranstion => ['In Progress', 'Done'].includes(transition);

const TRANSITION_IDS = {
  Done: '31',
  'In Progress': '21',
} as const;
