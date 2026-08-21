// Lightweight, zero-dependency Firestore REST Client for Vercel Serverless Functions
// Avoids loading heavy browser-only Firebase SDKs in Node.js lambdas

const FIREBASE_PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || "animahub";
const FIRESTORE_DATABASE_ID = process.env.FIRESTORE_DATABASE_ID || "(default)";
const BASE_FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/${FIRESTORE_DATABASE_ID}/documents`;

export function toFirestoreValue(val: any): any {
  if (val === null || val === undefined) {
    return { nullValue: null };
  }
  if (typeof val === "boolean") {
    return { booleanValue: val };
  }
  if (typeof val === "number") {
    if (Number.isInteger(val)) {
      return { integerValue: String(val) };
    }
    return { doubleValue: val };
  }
  if (typeof val === "string") {
    return { stringValue: val };
  }
  if (Array.isArray(val)) {
    return {
      arrayValue: {
        values: val.map(toFirestoreValue)
      }
    };
  }
  if (typeof val === "object") {
    return {
      mapValue: {
        fields: toFirestoreFields(val)
      }
    };
  }
  return { stringValue: String(val) };
}

export function toFirestoreFields(obj: Record<string, any>): Record<string, any> {
  const fields: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      fields[key] = toFirestoreValue(value);
    }
  }
  return fields;
}

export function fromFirestoreValue(val: any): any {
  if (!val || typeof val !== "object") return null;
  if ("stringValue" in val) return val.stringValue;
  if ("booleanValue" in val) return val.booleanValue;
  if ("integerValue" in val) return Number(val.integerValue);
  if ("doubleValue" in val) return Number(val.doubleValue);
  if ("timestampValue" in val) return val.timestampValue;
  if ("nullValue" in val) return null;
  if ("arrayValue" in val) {
    return (val.arrayValue.values || []).map(fromFirestoreValue);
  }
  if ("mapValue" in val) {
    return fromFirestoreFields(val.mapValue.fields || {});
  }
  return null;
}

export function fromFirestoreFields(fields: Record<string, any>): Record<string, any> {
  const obj: Record<string, any> = {};
  for (const [key, val] of Object.entries(fields || {})) {
    obj[key] = fromFirestoreValue(val);
  }
  return obj;
}

export function parseFirestoreDoc(doc: any): { id: string; data: Record<string, any> } | null {
  if (!doc || !doc.name) return null;
  const parts = doc.name.split("/");
  const id = parts[parts.length - 1];
  const data = fromFirestoreFields(doc.fields || {});
  return { id, data };
}

/**
 * Add a document to a collection
 */
export async function firestoreAddDoc(collectionName: string, data: Record<string, any>): Promise<string | null> {
  try {
    const url = `${BASE_FIRESTORE_URL}/${collectionName}`;
    const fields = toFirestoreFields(data);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields })
    });
    if (!res.ok) {
      console.warn(`[Firestore REST] Failed to add doc to ${collectionName}:`, await res.text());
      return null;
    }
    const result = await res.json();
    const docInfo = parseFirestoreDoc(result);
    return docInfo ? docInfo.id : null;
  } catch (err: any) {
    console.warn(`[Firestore REST] Error in firestoreAddDoc (${collectionName}):`, err.message);
    return null;
  }
}

/**
 * Get a single document by ID
 */
export async function firestoreGetDoc(collectionName: string, docId: string): Promise<{ id: string; data: Record<string, any> } | null> {
  try {
    const url = `${BASE_FIRESTORE_URL}/${collectionName}/${encodeURIComponent(docId)}`;
    const res = await fetch(url, { method: "GET" });
    if (!res.ok) return null;
    const result = await res.json();
    return parseFirestoreDoc(result);
  } catch (err: any) {
    console.warn(`[Firestore REST] Error in firestoreGetDoc (${collectionName}/${docId}):`, err.message);
    return null;
  }
}

/**
 * Update / patch a document
 */
export async function firestoreUpdateDoc(collectionName: string, docId: string, data: Record<string, any>): Promise<boolean> {
  try {
    const keys = Object.keys(data);
    if (keys.length === 0) return true;
    const updateMask = keys.map(k => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join("&");
    const url = `${BASE_FIRESTORE_URL}/${collectionName}/${encodeURIComponent(docId)}?${updateMask}`;
    const fields = toFirestoreFields(data);
    const res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields })
    });
    return res.ok;
  } catch (err: any) {
    console.warn(`[Firestore REST] Error in firestoreUpdateDoc (${collectionName}/${docId}):`, err.message);
    return false;
  }
}

/**
 * Query documents where field == value
 */
export async function firestoreQuery(collectionName: string, field: string, value: any): Promise<Array<{ id: string; data: Record<string, any> }>> {
  try {
    const url = `${BASE_FIRESTORE_URL}:runQuery`;
    const structuredQuery = {
      structuredQuery: {
        from: [{ collectionId: collectionName }],
        where: {
          fieldFilter: {
            field: { fieldPath: field },
            op: "EQUAL",
            value: toFirestoreValue(value)
          }
        }
      }
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(structuredQuery)
    });

    if (!res.ok) return [];
    const results: any[] = await res.json();
    const docs: Array<{ id: string; data: Record<string, any> }> = [];

    for (const item of results) {
      if (item.document) {
        const parsed = parseFirestoreDoc(item.document);
        if (parsed) docs.push(parsed);
      }
    }

    return docs;
  } catch (err: any) {
    console.warn(`[Firestore REST] Error in firestoreQuery (${collectionName}.${field}):`, err.message);
    return [];
  }
}

/**
 * List all documents in a collection
 */
export async function firestoreListDocs(collectionName: string, pageSize = 100): Promise<Array<{ id: string; data: Record<string, any> }>> {
  try {
    const url = `${BASE_FIRESTORE_URL}/${collectionName}?pageSize=${pageSize}`;
    const res = await fetch(url, { method: "GET" });
    if (!res.ok) return [];
    const result = await res.json();
    const rawDocs = result.documents || [];
    const docs: Array<{ id: string; data: Record<string, any> }> = [];
    for (const doc of rawDocs) {
      const parsed = parseFirestoreDoc(doc);
      if (parsed) docs.push(parsed);
    }
    return docs;
  } catch (err: any) {
    console.warn(`[Firestore REST] Error in firestoreListDocs (${collectionName}):`, err.message);
    return [];
  }
}
