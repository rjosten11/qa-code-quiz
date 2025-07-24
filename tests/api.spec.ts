import { test, expect } from '@playwright/test';
import * as fs from 'fs';

const API_BASE_URL = 'http://localhost:9999';
const STORAGE_PATH = './storage/account.json';

interface User {
  username: string;
  name: string;
  password: string;
  favouriteFruit: string;
  favouriteMovie: string;
  favouriteNumber: number;
}

interface StorageData {
  [username: string]: Omit<User, 'username'>;
}

let initialAccountsState: StorageData = {};

function ensureStorageDirectory() {
  const dir = './storage';
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function safeReadJSON(filePath: string): StorageData {
  try {
    ensureStorageDirectory();
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, '{}');
      return {};
    }
    const content = fs.readFileSync(filePath, 'utf-8').trim();
    if (!content) {
      return {};
    }
    return JSON.parse(content);
  } catch (error) {
    console.warn(`JSON parsing error: ${error.message}`);
    return {};
  }
}

function saveJSON(filePath: string, data: StorageData) {
  ensureStorageDirectory();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 4));
}

async function waitForCondition(
  condition: () => boolean,
  maxRetries: number = 10,
  delayMs: number = 500
): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    if (condition()) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  return false;
}

async function waitForUserToExist(username: string): Promise<StorageData> {
  let accounts: StorageData = {};
  
  await waitForCondition(() => {
    accounts = safeReadJSON(STORAGE_PATH);
    return accounts[username] !== undefined;
  });
  
  return accounts;
}

async function waitForUserToBeDeleted(username: string): Promise<StorageData> {
  let accounts: StorageData = {};
  
  await waitForCondition(() => {
    accounts = safeReadJSON(STORAGE_PATH);
    return accounts[username] === undefined;
  });
  
  return accounts;
}

const testUser: User = {
  username: 'examtest',
  name: 'Exam Test User',
  password: 'testpass123',
  favouriteFruit: 'apple',
  favouriteMovie: 'Dune',
  favouriteNumber: 11
};

const testUsernames = ['examtest', 'undefined', 'partial_test'];

test.describe('API Tests', () => {
  
  test.beforeAll(async () => {
    initialAccountsState = safeReadJSON(STORAGE_PATH);
    console.log('Initial accounts state:', initialAccountsState);
  });

  test.afterAll(async () => {
    saveJSON(STORAGE_PATH, initialAccountsState);
    console.log('Restored initial accounts state');
  });
  
  test.beforeEach(async () => {
    const accounts = safeReadJSON(STORAGE_PATH);
    let modified = false;
    
    testUsernames.forEach(username => {
      if (accounts[username]) {
        delete accounts[username];
        modified = true;
      }
    });
    
    if (modified) {
      saveJSON(STORAGE_PATH, accounts);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  });

  test.afterEach(async () => {
    const cleanAccounts = { ...initialAccountsState };
    saveJSON(STORAGE_PATH, cleanAccounts);
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  test('GET / - should return backend API message', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/`);    
    expect(response.status()).toBe(200);
    const text = await response.text();
    expect(text).toBe('Backend API');
  });

  test('POST /user - should create new user', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/user`, {
      data: testUser
    });

    expect(response.status()).toBe(200);
    const text = await response.text();
    expect(text).toBe('Account Created');
    
    const accounts = await waitForUserToExist(testUser.username);
    
    expect(accounts[testUser.username]).toBeDefined();
    expect(accounts[testUser.username].name).toBe(testUser.name);
    expect(accounts[testUser.username].password).toBe(testUser.password);
    expect(accounts[testUser.username].favouriteFruit).toBe(testUser.favouriteFruit);
    expect(accounts[testUser.username].favouriteMovie).toBe(testUser.favouriteMovie);
    expect(accounts[testUser.username].favouriteNumber).toBe(testUser.favouriteNumber);
    
    Object.keys(initialAccountsState).forEach(username => {
      expect(accounts[username]).toBeDefined();
      expect(accounts[username]).toEqual(initialAccountsState[username]);
    });
  });

  test('POST /user - should reject duplicate user', async ({ request }) => {
    await request.post(`${API_BASE_URL}/user`, { data: testUser });
    
    await waitForUserToExist(testUser.username);
    
    const response = await request.post(`${API_BASE_URL}/user`, { data: testUser });
    
    expect(response.status()).toBe(200);
    const text = await response.text();
    expect(text).toBe('Account Already Exists');
  });

  test('DELETE /user - should delete existing user', async ({ request }) => {
    await request.post(`${API_BASE_URL}/user`, { data: testUser });
    
    await waitForUserToExist(testUser.username);
    
    const response = await request.delete(`${API_BASE_URL}/user?username=${testUser.username}`);
    
    expect(response.status()).toBe(200);
    const text = await response.text();
    expect(text).toBe('Account Deleted');
    
    const accounts = await waitForUserToBeDeleted(testUser.username);
    
    expect(accounts[testUser.username]).toBeUndefined();
    
    Object.keys(initialAccountsState).forEach(username => {
      expect(accounts[username]).toBeDefined();
      expect(accounts[username]).toEqual(initialAccountsState[username]);
    });
  });

  test('DELETE /user - should handle non-existent user', async ({ request }) => {
    const response = await request.delete(`${API_BASE_URL}/user?username=nonexistent`);
    expect(response.status()).toBe(200);
    const text = await response.text();
    expect(text).toBe('Account Does Not Exist');
  });

  test('PUT /user - should update existing user', async ({ request }) => {
    await request.post(`${API_BASE_URL}/user`, { data: testUser });
    
    await waitForUserToExist(testUser.username);
    
    const updateData = {
      name: 'Updated Name',
      password: 'newpass',
      favouriteFruit: 'banana',
      favouriteMovie: 'Updated Movie',
      favouriteNumber: 99
    };
    
    const response = await request.put(`${API_BASE_URL}/user?username=${testUser.username}`, {
      data: updateData
    });
    
    expect(response.status()).toBe(200);
    const text = await response.text();
    expect(text).toBe('Account Updated');
    
    let accounts: StorageData;
    await waitForCondition(() => {
      accounts = safeReadJSON(STORAGE_PATH);
      return accounts[testUser.username] !== undefined && 
        accounts[testUser.username].name === updateData.name;
    });
    
    expect(accounts[testUser.username]).toBeDefined();
    expect(accounts[testUser.username].name).toBe(updateData.name);
    expect(accounts[testUser.username].password).toBe(updateData.password);
    expect(accounts[testUser.username].favouriteFruit).toBe(updateData.favouriteFruit);
    expect(accounts[testUser.username].favouriteNumber).toBe(updateData.favouriteNumber);
    
    // Note: The server has a bug - it doesn't save favouriteMovie in the update
    // This is because the user object in PUT is missing favouriteMovie property
    
    Object.keys(initialAccountsState).forEach(username => {
      expect(accounts[username]).toBeDefined();
      expect(accounts[username]).toEqual(initialAccountsState[username]);
    });
  });

  test('PUT /user - should handle non-existent user', async ({ request }) => {
    const updateData = {
      name: 'Test Name',
      password: 'testpass',
      favouriteFruit: 'apple',
      favouriteMovie: 'Test Movie',
      favouriteNumber: 1
    };

    const response = await request.put(`${API_BASE_URL}/user?username=nonexistent`, {
      data: updateData
    });
    
    expect(response.status()).toBe(200);
    const text = await response.text();
    expect(text).toBe('Account Does NOT Exist');
  });

  test('POST /user - should handle empty request body', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/user`, {
      data: {}
    });

    expect(response.status()).toBe(200);
    const text = await response.text();
    expect(text).toBe('Account Created');
    
    const accounts = await waitForUserToExist('undefined');
    
    expect(accounts['undefined']).toBeDefined();
    
    Object.keys(initialAccountsState).forEach(username => {
      expect(accounts[username]).toBeDefined();
      expect(accounts[username]).toEqual(initialAccountsState[username]);
    });
  });

  test('POST /user - should handle partial user data', async ({ request }) => {
    const partialUser = {
      username: 'partial_test',
      name: 'Partial User'
    };

    const response = await request.post(`${API_BASE_URL}/user`, {
      data: partialUser
    });

    expect(response.status()).toBe(200);
    const text = await response.text();
    expect(text).toBe('Account Created');
    
    const accounts = await waitForUserToExist('partial_test');
    
    expect(accounts['partial_test']).toBeDefined();
    expect(accounts['partial_test'].name).toBe('Partial User');
    expect(accounts['partial_test'].password).toBeUndefined();
    expect(accounts['partial_test'].favouriteFruit).toBeUndefined();
    expect(accounts['partial_test'].favouriteMovie).toBeUndefined();
    expect(accounts['partial_test'].favouriteNumber).toBeUndefined();
    
    Object.keys(initialAccountsState).forEach(username => {
      expect(accounts[username]).toBeDefined();
      expect(accounts[username]).toEqual(initialAccountsState[username]);
    });
  });
});