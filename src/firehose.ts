import type { IdResolver } from "@atproto/identity";
import { Firehose } from "@atproto/sync";
import type { MongoClient } from "mongodb";
import pino from "pino";
import * as Status from "#/lexicon/types/xyz/statusphere/status";

export function createFirehose(idResolver: IdResolver, dbm: MongoClient) {
	const logger = pino({ name: "firehose ingestion" });
	return new Firehose({
		idResolver,
		handleEvent: async (evt: any) => {
			// Watch for write events
			if (evt.event === "create" || evt.event === "update") {
				const now = new Date();
				const record = evt.record;

				// If the write is a valid status update
				if (
					evt.collection === "xyz.statusphere.status" &&
					Status.isRecord(record) &&
					Status.validateRecord(record).success
				) {
					// Store the status in mongodb
					try {
						const collection = dbm.db("statusphere").collection("status");
						await collection.insertOne({
							uri: evt.uri.toString(),
							authorDid: evt.did,
							status: record.status,
							createdAt: record.createdAt,
							indexedAt: now.toISOString(),
						});
					} catch (error) {
						logger.error({ error }, "Failed to insert status into MongoDB");
						throw error;
					}
				}
			} else if (
				evt.event === "delete" &&
				evt.collection === "xyz.statusphere.status"
			) {
				// Remove the status from mongodb
				const collection = dbm.db("statusphere").collection("status");
				const deleteResult = await collection.deleteOne({
					uri: evt.uri.toString(),
				});
				console.log("Deleted documents =>", deleteResult);
			}
		},
		onError: (err: Error) => {
			logger.error({ err }, "error on firehose ingestion");
		},
		filterCollections: ["xyz.statusphere.status"],
		excludeIdentity: true,
		excludeAccount: true,
	});
}
