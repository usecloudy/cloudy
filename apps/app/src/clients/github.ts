import { Octokit } from "octokit";

export const octokit = new Octokit({ auth: process.env.REACT_APP_GITHUB_TOKEN });
