const mockSalt = 'mockingSalt';
const mockHash = 'hashedPassword';
const mockResult = { rows: [{ id: 123 }] };

jest.mock('../../../../src/utils/db', () => ({
  query: jest.fn(async (query, values) => Promise.resolve(mockResult)),
}));
jest.mock('../../../../src/utils/hash', () => ({
  createSalt: jest.fn(() => mockSalt),
  sha256: jest.fn(async (pw) => mockHash),
}));

import provider from '../../../../src/services/createUser/provider';
import db from '../../../../src/utils/db';
import hash from '../../../../src/utils/hash';

describe('Test /src/service/createUser/provider', () => {
  it('should insert a user and return the user ID', async () => {
    const email = 'test@example.com ';
    const password = 'password';
    const role = 'user1';

    const result = await provider(email, password, role);

    expect(result).toBe(mockResult.rows[0].id);
    expect(hash.createSalt).toHaveBeenCalled();
    expect(hash.sha256).toHaveBeenCalledWith(password + mockSalt);

    expect(db.query).toHaveBeenCalledWith(expect.any(String), [email, mockHash, mockSalt, role]);
  });
});
