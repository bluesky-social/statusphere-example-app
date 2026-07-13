import { getDb, StatusTable, DatabaseSchema } from ".";
import { AtUri } from "@atproto/syntax";
import { getHandle } from "@atproto/common-web";
import { IdResolver } from "@atproto/identity";
import { Transaction } from "kysely";

const idResolver = new IdResolver();

export async function getAccountHandle(did: string): Promise<string | null> {
  const db = getDb();
  // if we've indexed this account through the jetstream consumer, we'll load from there
  const account = await db
    .selectFrom("account")
    .select("handle")
    .where("did", "=", did)
    .executeTakeFirst();
  if (account) return account.handle;
  // otherwise resolve the DID directly, e.g. for a freshly logged-in account we
  // haven't seen an identity/account event for yet
  try {
    const didDoc = await idResolver.did.resolve(did);
    if (!didDoc) return null;
    return getHandle(didDoc) ?? null;
  } catch {
    return null;
  }
}

export async function updateHandle(did: string, handle: string) {
  await getDb()
    .updateTable("account")
    .set({ handle })
    .where("did", "=", did)
    .execute();
}

export async function getAccountStatus(did: string) {
  const db = getDb();
  const status = await db
    .selectFrom("status")
    .selectAll()
    .where("authorDid", "=", did)
    .orderBy("createdAt", "desc")
    .limit(1)
    .executeTakeFirst();
  return status ?? null;
}

export async function getRecentStatuses(limit = 5) {
  const db = getDb();
  return db
    .selectFrom("status")
    .innerJoin("account", "status.authorDid", "account.did")
    .selectAll()
    .orderBy("createdAt", "desc")
    .limit(limit)
    .execute();
}

export async function getTopStatuses(limit = 10) {
  const db = getDb();
  return db
    .selectFrom("status")
    .select(["status", db.fn.count("uri").as("count")])
    .where("current", "=", 1)
    .groupBy("status")
    .orderBy("count", "desc")
    .limit(limit)
    .execute();
}

export async function insertStatus(data: StatusTable) {
  await getDb()
    .transaction()
    .execute(async (tx) => {
      // Seed an account row for this DID if we haven't seen it before. This is
      // the only place accounts get created: identity/account events cover the
      // whole network, not just Statusphere users, so those handlers only ever
      // update rows that were discovered here (see updateAccountActive/updateHandle).
      await tx
        .insertInto("account")
        .values({ did: data.authorDid, handle: data.authorDid, active: 1 })
        .onConflict((oc) => oc.doNothing())
        .execute();
      await tx
        .insertInto("status")
        .values(data)
        .onConflict((oc) =>
          oc.column("uri").doUpdateSet({
            status: data.status,
            createdAt: data.createdAt,
            indexedAt: data.indexedAt,
          }),
        )
        .execute();
      await setCurrStatus(tx, data.authorDid);
    });
}

export async function deleteStatus(uri: AtUri) {
  await getDb()
    .transaction()
    .execute(async (tx) => {
      await tx.deleteFrom("status").where("uri", "=", uri.toString()).execute();
      await setCurrStatus(tx, uri.hostname);
    });
}

// Update-only: jetstream's account/identity events cover every DID on the
// network, not just Statusphere users, so we only apply them to accounts we
// already track (seeded by insertStatus). This is a no-op for everyone else.
export async function updateAccountActive(did: string, active: 0 | 1) {
  await getDb()
    .updateTable("account")
    .set({ active })
    .where("did", "=", did)
    .execute();
}

export async function deleteAccount(did: string) {
  await getDb().deleteFrom("account").where("did", "=", did).execute();
  await getDb().deleteFrom("status").where("authorDid", "=", did).execute();
}

// Helper to update which status is "current" for a user (inside a transaction)
async function setCurrStatus(tx: Transaction<DatabaseSchema>, did: string) {
  // Clear current flag for all user's statuses
  await tx
    .updateTable("status")
    .set({ current: 0 })
    .where("authorDid", "=", did)
    .where("current", "=", 1)
    .execute();
  // Set the most recent status as current
  await tx
    .updateTable("status")
    .set({ current: 1 })
    .where("uri", "=", (qb) =>
      qb
        .selectFrom("status")
        .select("uri")
        .where("authorDid", "=", did)
        .orderBy("createdAt", "desc")
        .limit(1),
    )
    .execute();
}
