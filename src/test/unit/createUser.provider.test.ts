const mockSalt = 'mockingSalt';
const mockHash = 'hashedPassword';
const mockResult = { rows: [{ id: 123 }] };

jest.mock('../../utils', () => ({
  hash: { createSalt: jest.fn(() => mockSalt), sha256: jest.fn(async (pw) => mockHash) },
  db: { query: jest.fn(async (query, values) => Promise.resolve(mockResult)) },
}));

import provider, { ROLE_NAME } from '../../services/createUser/provider';
import { db, hash } from '../../utils';

describe('Test /src/service/createUser/provider', () => {
  it('should insert a user and return the user ID', async () => {
    const email = ' TEST@example.com '; // with uppercase letters and spaces
    const password = 'password';

    const result = await provider(email, password);

    expect(result).toBe(mockResult.rows[0].id);
    expect(hash.createSalt).toHaveBeenCalled();
    expect(hash.sha256).toHaveBeenCalledWith(password + mockSalt);

    expect(db.query).toHaveBeenCalledWith(expect.any(String), [
      email.toLowerCase().trim(),
      mockHash,
      mockSalt,
      ROLE_NAME,
    ]);
  });
});
