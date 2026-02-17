const {
  CLOUDFLARE_PAGES_PROJECT,
  CLOUDFLARE_ACCOUNT_ID,
  CLOUDFLARE_API_TOKEN,
  CONCURRENCY = "5",
  DRY_RUN = "true",
} = process.env;

if (
  !CLOUDFLARE_PAGES_PROJECT ||
  !CLOUDFLARE_ACCOUNT_ID ||
  !CLOUDFLARE_API_TOKEN
) {
  throw new Error("Missing env vars.");
}

let deletedDeploymentCount = 0;
let totalDeployments = 0;

async function cloudflareFetch(
  path: string,
  options?: RequestInit,
): Promise<any> {
  const response = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    headers: {
      Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    ...options,
  });

  const body: any = await response.json();

  if (!body.success) {
    throw new Error(JSON.stringify(body.errors ?? body, null, 2));
  }

  return body;
}

async function fetchAllDeploymentIds(): Promise<string[]> {
  const { result, result_info } = await cloudflareFetch(
    `/accounts/${CLOUDFLARE_ACCOUNT_ID}/pages/projects/${CLOUDFLARE_PAGES_PROJECT}/deployments?page=1&per_page=25`,
  );

  const ids: string[] = result.map(({ id }: { id: string }) => id);
  totalDeployments = result_info.total_count;

  console.log(
    `Page: 1/${result_info.total_pages} | Deployment: ${ids.length}/${totalDeployments}`,
  );

  await pool(
    Array.from({ length: result_info.total_pages - 1 }, (_, i) => i + 2),
    async (page) => {
      const { result, result_info } = await cloudflareFetch(
        `/accounts/${CLOUDFLARE_ACCOUNT_ID}/pages/projects/${CLOUDFLARE_PAGES_PROJECT}/deployments?page=${page}&per_page=25`,
      );
      ids.push(...result.map(({ id }: { id: string }) => id));
      console.log(
        `Page: ${page}/${result_info.total_pages} | Deployment: ${ids.length}/${totalDeployments}`,
      );
    },
    Number(CONCURRENCY),
  );

  return ids;
}

async function deleteDeployment(id: string): Promise<void> {
  if (DRY_RUN === "true") {
    deletedDeploymentCount++;
    console.log(
      `[DRY-RUN] | ${deletedDeploymentCount}/${totalDeployments} | would delete deployment.`,
    );
    return;
  }
  try {
    await cloudflareFetch(
      `/accounts/${CLOUDFLARE_ACCOUNT_ID}/pages/projects/${CLOUDFLARE_PAGES_PROJECT}/deployments/${id}`,
      { method: "DELETE" },
    );
    deletedDeploymentCount++;
    console.log(
      `${deletedDeploymentCount}/${totalDeployments} | deployment deleted successfully.`,
    );
  } catch (error) {
    console.error(error);
  }
}

async function pool<T>(
  items: T[],
  worker: (item: T) => Promise<void>,
  concurrency: number,
): Promise<void> {
  const queue = [...items];
  const workers = Array.from({ length: concurrency }, async () => {
    while (queue.length) {
      const item = queue.shift();
      if (!item) return;
      await worker(item);
    }
  });
  await Promise.all(workers);
}

console.log("Fetching all deployment IDs...");

const deploymentIds = await fetchAllDeploymentIds();

console.log(`Deletion is starting...`);

await pool(deploymentIds, deleteDeployment, Number(CONCURRENCY));

console.log(
  `${deletedDeploymentCount}/${totalDeployments} deployments deleted successfully.`,
);
