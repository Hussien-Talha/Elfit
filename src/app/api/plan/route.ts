import { NextResponse } from 'next/server';
import { getMongoClient } from '@/lib/mongodb';
import type { Plan } from '@/types/plan';
import { toError } from '@/lib/utils';

const COLLECTION = 'plans';

export async function GET() {
  try {
    const client = await getMongoClient();
    const db = client.db();
    const plan = await db.collection<Plan>(COLLECTION).findOne({}, { sort: { updatedAt: -1 } });
    return NextResponse.json({ plan });
  } catch (error) {
    const normalized = toError(error);
    console.error('Failed to fetch plan', normalized);
    return NextResponse.json({ error: normalized.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Plan & { updatedAt?: Date };
    const client = await getMongoClient();
    const db = client.db();
    await db.collection(COLLECTION).updateOne({}, { $set: { ...payload, updatedAt: new Date() } }, { upsert: true });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const normalized = toError(error);
    console.error('Failed to save plan', normalized);
    return NextResponse.json({ error: normalized.message }, { status: 500 });
  }
}
