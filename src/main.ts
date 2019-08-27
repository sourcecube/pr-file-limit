import * as core from '@actions/core';
import * as github from '@actions/github';

async function run() {
  try {
    const token = core.getInput('repo-token', {required: true});
    const fileLimit = parseInt(core.getInput('limit', {required: true}));

    const prNumber = getPrNumber();
    if (!prNumber) {
      console.log('Could not get pull request number from context, exiting');
      return;
    }

    const client = new github.GitHub(token);

    core.debug(`fetching changed files for pr #${prNumber}`);
    const changedFiles: string[] = await getChangedFiles(client, prNumber);
    
    if(changedFiles.length > fileLimit) {
      core.setFailed(`Too many files. Expected: ${fileLimit}. Got: ${changedFiles.length}`)
    } 

  } catch (error) {
    core.error(error);
    core.setFailed(error.message);
  }

}

const getPrNumber = (): number | undefined => {
  const pullRequest = github.context.payload.pull_request;
  if (!pullRequest) {
    return undefined;
  }

  return pullRequest.number;
}

const getChangedFiles = async(
  client: github.GitHub,
  prNumber: number
): Promise<string[]> => {
  const listFilesResponse = await client.pulls.listFiles({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    pull_number: prNumber
  });

  const changedFiles = listFilesResponse.data.map(f => f.filename);

  core.debug('found changed files:');
  for (const file of changedFiles) {
    core.debug('  ' + file);
  }

  return changedFiles;
}

run();
