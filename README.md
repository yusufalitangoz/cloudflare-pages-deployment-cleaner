# ⚠️ Cloudflare Pages Deployment Cleaner

> [!WARNING]
> **WARNING: THIS PROJECT DELETES _ALL_ DEPLOYMENTS OF A CLOUDFLARE PAGES PROJECT.**
> There is **NO UNDO**. Use at your own risk.

---

## ❗ What This Project Does (Read Carefully)

This is a **one time, local cleanup script** written in **Bun + TypeScript**.

Its **only purpose** is to:

> [!CAUTION]
> 🔥 **Delete _ALL_ deployments (production + preview) of a given Cloudflare Pages project**

If you start this project:

- Every deployment will be permanently deleted
- This includes **production**, **preview**, and **historical** deployments
- Cloudflare **cannot recover** deleted deployments

If this is _not_ exactly what you want **do not start this project**.

---

## 🧠 Intended Use Case

This project is intentionally **simple and dangerous**.

It is designed to delete all deployments of a Cloudflare Pages project.

This is **NOT**:

- A long running project
- A reusable automation pipeline
- A safe end user project

You are expected to:

- Understand Cloudflare Pages
- Understand API tokens and permissions
- Take full responsibility for the outcome

---

## 🧪 DRY RUN MODE (Strongly Recommended)

The project supports a **dry run mode**:

```
DRY_RUN="true"
```

When enabled:

- ❌ **No DELETE requests are sent**
- ✅ Deployment IDs are fetched
- 📝 Logs show what _would_ be deleted

You should **always run the project in DRY_RUN mode first** to verify:

- Correct project
- Correct account
- Expected number of deployments

---

## 🛠 Tech Stack

- **Runtime:** Bun
- **Language:** TypeScript
- **API:** Cloudflare v4 REST API

---

## 🔐 Required Environment Variables

| Variable                   | Description                           | Required |
| -------------------------- | ------------------------------------- | -------- |
| `CLOUDFLARE_ACCOUNT_ID`    | Cloudflare account ID                 | ✅       |
| `CLOUDFLARE_PAGES_PROJECT` | Pages project name                    | ✅       |
| `CLOUDFLARE_API_TOKEN`     | API token with Pages permissions      | ✅       |
| `CONCURRENCY`              | Parallel delete requests (default: 5) | ❌       |
| `DRY_RUN`                  | Enable test mode (default: true)      | ❌       |

If `DRY_RUN` is not explicitly set to `false`, the script will run in dry mode.

### API Token Permissions

API token **must** have `Cloudflare Pages:Edit` permission.

If the required permissions are not granted to the token, the project will fail.

---

## ▶️ Usage

### 1️⃣ Dry Run (Recommended First)

Expected output:

- Total number of deployments found
- Log lines like:

```
[DRY-RUN] Would delete deployment <id>
```

---

### 2️⃣ Real Deletion (Danger Zone)

Once started:

- Deletions happen in parallel
- There is **no confirmation prompt**
- Stopping mid run may leave partial deletions

---

## Installation

```bash
bun i
```

## Running the Script

```bash
bun .
```

---

## ⚙️ Concurrency Control

The `CONCURRENCY` variable controls how many delete requests run in parallel.

Notes:

- Higher values = faster deletion
- Too high values may trigger API rate limits

---

## 🧯 Error Handling

- API errors are logged per deployment
- Failures do **not** stop the entire process
- Successfully deleted deployments are counted and logged

---

## 🚨 Legal & Responsibility Disclaimer

**THIS SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.**

By using this project, you agree that:

- You fully understand what the script does
- You accept all risks and consequences
- The author takes **NO responsibility** for anything.

If you are not comfortable with this **do not use this project**.

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
