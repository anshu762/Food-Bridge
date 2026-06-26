import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;
const API_URL = `http://localhost:${PORT}`;

async function runTest() {
  console.log('--- Starting Concurrency Test for Approval ---');

  // 1. Setup Data directly in DB
  const donor = await prisma.user.create({
    data: {
      email: `donor-${Date.now()}@test.com`,
      passwordHash: 'dummy',
      role: 'DONOR',
      verificationStatus: 'APPROVED',
    },
  });

  const receiver1 = await prisma.user.create({
    data: { email: `receiver1-${Date.now()}@test.com`, passwordHash: 'dummy', role: 'RECEIVER' },
  });

  const receiver2 = await prisma.user.create({
    data: { email: `receiver2-${Date.now()}@test.com`, passwordHash: 'dummy', role: 'RECEIVER' },
  });

  const listing = await prisma.foodListing.create({
    data: {
      donorId: donor.id,
      title: 'Concurrency Test Listing',
      foodType: 'Test',
      quantity: 1,
      unit: 'ITEM',
      pickupLat: 0,
      pickupLng: 0,
      pickupAddress: 'Test Address',
      preparedAt: new Date(),
      safeUntil: new Date(Date.now() + 100000),
      status: 'AVAILABLE',
    },
  });

  const request1 = await prisma.foodRequest.create({
    data: { listingId: listing.id, receiverId: receiver1.id, status: 'PENDING' },
  });

  const request2 = await prisma.foodRequest.create({
    data: { listingId: listing.id, receiverId: receiver2.id, status: 'PENDING' },
  });

  // Login as donor to get token
  // For the sake of this script, we'll just sign a token directly
  const token = jwt.sign({ id: donor.id }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '1h',
  });

  console.log(
    'Firing two concurrent approve requests for different PENDING requests on the same listing...',
  );

  // 2. Fire two requests concurrently
  const req1 = fetch(`${API_URL}/requests/${request1.id}/approve`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });

  const req2 = fetch(`${API_URL}/requests/${request2.id}/approve`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });

  const results = await Promise.allSettled([req1, req2]);

  let successCount = 0;
  let conflictCount = 0;

  for (let i = 0; i < results.length; i++) {
    const res = results[i];
    if (res.status === 'fulfilled') {
      const json = await res.value.json();
      if (res.value.ok) {
        console.log(`Request ${i + 1} succeeded`);
        successCount++;
      } else {
        console.log(`Request ${i + 1} failed: ${res.value.status} - ${json.error}`);
        if (res.value.status === 409) conflictCount++;
      }
    } else {
      console.log(`Request ${i + 1} threw an error: ${res.reason}`);
    }
  }

  console.log(`\nResults: ${successCount} succeeded, ${conflictCount} conflicts.`);
  if (successCount === 1 && conflictCount === 1) {
    console.log('✅ TEST PASSED: Row locking successfully prevented double approval.');
  } else {
    console.log('❌ TEST FAILED: Race condition occurred or both failed.');
  }

  // Cleanup
  await prisma.foodRequest.deleteMany({ where: { listingId: listing.id } });
  await prisma.foodListing.delete({ where: { id: listing.id } });
  await prisma.user.deleteMany({ where: { id: { in: [donor.id, receiver1.id, receiver2.id] } } });
}

runTest()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
