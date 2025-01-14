/**
 * GENERATED CODE - DO NOT MODIFY
 */
import { BlobRef, type ValidationResult } from "@atproto/lexicon";
import { CID } from "multiformats/cid";
import { lexicons } from "../../../lexicons";
import { hasProp, isObj } from "../../../util";

export interface Record {
	status: string;
	createdAt: string;
	[k: string]: unknown;
}

export function isRecord(v: unknown): v is Record {
	return (
		isObj(v) &&
		hasProp(v, "$type") &&
		(v.$type === "xyz.statusphere.status#main" ||
			v.$type === "xyz.statusphere.status")
	);
}

export function validateRecord(v: unknown): ValidationResult {
	return lexicons.validate("xyz.statusphere.status#main", v);
}
