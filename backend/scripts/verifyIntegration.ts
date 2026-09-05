import jwt from 'jsonwebtoken';
import { env } from '../src/config/env.js';

async function test() {
  const userId = '3302aee1-5794-4dfb-a725-7491e5ba95e5';
  const token = jwt.sign({ id: userId, email: 'muzammil@goldenbowl.com', role: 'CUSTOMER' }, env.JWT_SECRET, { expiresIn: '1h' });

  console.log('--- 1. Testing POST Address ---');
  const addrPayload = {
    type: 'Home',
    address: JSON.stringify({
      name: 'Muzammil Shaik',
      phone: '09399991239',
      addressLine: 'Snagadigunta 6th line guntur',
      area: 'Guntur',
      city: 'Guntur',
      state: 'Andhra Pradesh',
      postalCode: '522003'
    }),
    isDefault: true
  };

  const createAddrRes = await fetch(`http://16.171.41.5:8080/api/customers/${userId}/addresses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(addrPayload)
  });

  const addrJson = await createAddrRes.json();
  console.log('Create Address Status:', createAddrRes.status, addrJson);

  console.log('--- 2. Testing GET Addresses ---');
  const getAddrRes = await fetch(`http://16.171.41.5:8080/api/customers/${userId}/addresses`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const getAddrJson = await getAddrRes.json();
  console.log('Get Addresses Status:', getAddrRes.status, getAddrJson);

  console.log('--- 3. Testing GET Saved Payments ---');
  const getPayRes = await fetch(`http://16.171.41.5:8080/api/customers/${userId}/payments`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const getPayJson = await getPayRes.json();
  console.log('Get Payments Status:', getPayRes.status, getPayJson);

  console.log('--- 4. Testing POST Saved Payment ---');
  const createPayRes = await fetch(`http://16.171.41.5:8080/api/customers/${userId}/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      type: 'UPI',
      name: 'Google Pay',
      detail: 'shaik@okaxis',
      isDefault: true
    })
  });
  const createPayJson = await createPayRes.json();
  console.log('Create Payment Status:', createPayRes.status, createPayJson);

  console.log('--- 5. Testing DELETE Saved Payment ---');
  if (createPayJson.data?.id) {
    const delRes = await fetch(`http://16.171.41.5:8080/api/customers/${userId}/payments/${createPayJson.data.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('Delete Payment Status:', delRes.status, await delRes.json());
  }
}

test().catch(console.error);
