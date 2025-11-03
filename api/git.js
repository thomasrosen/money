import { Octokit } from "octokit";

export function initOctokit() {
  const octokit = new Octokit({ auth: process.env.GHTOOLS_PASSWORD });
  return octokit;
}

export async function checkFileExistsByPath({
  octokit,
  owner,
  repo,
  path
}) {
  try {
    // HEAD does not return a body, so it should be faster than GET
    await octokit.request('HEAD /repos/{owner}/{repo}/contents/{path}', {
      owner,
      repo,
      path
    });
    // octokit throws an error if the request is not 200
    return true;
  } catch (error) {
    if (error.status === 404) {
      return false;
    }
    throw error;
  }
}

export async function getFileBySha({
  octokit,
  owner,
  repo,
  file_sha,
}) {
  const { data } = await octokit.rest.git.getBlob({
    owner,
    repo,
    file_sha
  });
  const buffer = Buffer.from(data.content, data.encoding);
  return buffer
}

export async function getFileByPath({
  octokit,
  owner,
  repo,
  path,
}) {
  const { data } = await octokit.rest.repos.getContent({
    mediaType: {
      format: "full",
    },
    owner,
    repo,
    path,
  });
  const buffer = Buffer.from(data.content, data.encoding);
  return buffer
}

export async function createOrUpdateFileContents({
  octokit,
  owner,
  repo,
  path,
  message = 'Updated File',
  base64content,
}) {
  const response = await octokit.rest.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message,
    content: base64content,
    // committer: {
    //   name: 'Your Name',
    //   email: 'your-email@example.com',
    // },
    // author: {
    //   name: 'Your Name',
    //   email: 'your-email@example.com',
    // },
  });

  return response;
}

export async function readFileSyncAsBase64(filePath) {
  if (!fs) {
    throw new Error('fs module is not available');
  }
  const base64content = fs.readFileSync(filePath).toString('base64');
  return base64content;
}

export function text2base64(text) {
  return Buffer.from(text).toString('base64');
}

// ; (async () => {
//   const octokit = initOctokit();
//
//   const base64content = fs.readFileSync('./debug.jpg').toString('base64');
//   const response = await createOrUpdateFileContents({
//     octokit,
//     owner: 'thomasrosen',
//     repo: 'money-data',
//     path: 'images/debug.jpg',
//     base64content,
//   })
//
//   // if (buffer) {
//   //   // Save the content to a file
//   //   // const savePath = `./${data.data}`;
//   //   const savePath = './debug-loaded.jpg';
//   //   fs.writeFileSync(savePath, buffer);
//   //   console.info(`File saved to ${savePath}`);
//   // }
//
// })()
