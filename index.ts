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

let deletedCount = 0;

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
  const deployments: any[] = [];
  const perPage = 25;
  let page = 1;

  while (true) {
    const body = await cloudflareFetch(
      `/accounts/${CLOUDFLARE_ACCOUNT_ID}/pages/projects/${CLOUDFLARE_PAGES_PROJECT}/deployments?page=${page}&per_page=${perPage}`,
    );
    const result = body.result ?? [];
    deployments.push(...result);
    if (result.length < perPage) {
      break;
    }
    page++;
  }

  return deployments.map(({ id }) => id);
}

async function deleteDeployment(id: string): Promise<void> {
  if (DRY_RUN === "true") {
    console.log(`[DRY-RUN] Would delete deployment ${id}`);
    return;
  }
  try {
    await cloudflareFetch(
      `/accounts/${CLOUDFLARE_ACCOUNT_ID}/pages/projects/${CLOUDFLARE_PAGES_PROJECT}/deployments/${id}`,
      { method: "DELETE" },
    );
    deletedCount++;
    console.log(`Deleted deployment ${id}`);
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
      if (!item) {
        return;
      }
      await worker(item);
    }
  });
  await Promise.all(workers);
}

console.log("Fetching all deployments...");

const deploymentIds = await fetchAllDeploymentIds();

console.log(`Found ${deploymentIds.length} deployments.`);

if (deploymentIds.length > 0) {
  await pool(deploymentIds, deleteDeployment, Number(CONCURRENCY));

  console.log(`${deletedCount} deployments deleted successfully.`);
}
