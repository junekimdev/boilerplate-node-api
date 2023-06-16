// Mocks
const client = { query: jest.fn() };
jest.mock('../../../../src/utils/db', () => ({ transaction: jest.fn((f) => f(client)) }));

// Imports
import provider from '../../../../src/services/updatePushTopic/provider';
import db from '../../../../src/utils/db';
import { AppError, errDef, UK_ERR_CODE } from '../../../../src/utils/errors';
import { getDbErrorMock } from '../../../testUtil';

// Tests
describe('Test /src/services/updatePushTopic/provider', () => {
  const oldName = 'oldName';
  const newName = 'newName';
  const topicId = 123;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call next with TopicNotFound error when topic does not exist', async () => {
    const expectedError = new AppError(errDef[404].TopicNotFound);

    client.query.mockResolvedValue({ rowCount: 0 });

    try {
      await provider(oldName, newName);
    } catch (error) {
      expect(error).toEqual(expectedError);
    }

    expect(db.transaction).toBeCalledTimes(1);
    expect(client.query).toBeCalledTimes(1);
    expect(client.query).toBeCalledWith(expect.any(String), [oldName, newName]);
  });

  it('should call next with PushTopicAlreadyExists error when new topic already exists', async () => {
    const dbError = getDbErrorMock(UK_ERR_CODE);
    const expectedError = new AppError(errDef[409].PushTopicAlreadyExists);

    client.query.mockRejectedValue(dbError);

    try {
      await provider(oldName, newName);
    } catch (error) {
      expect(error).toEqual(expectedError);
    }

    expect(db.transaction).toBeCalledTimes(1);
    expect(client.query).toBeCalledTimes(1);
    expect(client.query).toBeCalledWith(expect.any(String), [oldName, newName]);
  });

  it('should call next with the error when DB throws an error', async () => {
    const expectedError = new Error('err');

    client.query.mockRejectedValue(expectedError);

    try {
      await provider(oldName, newName);
    } catch (error) {
      expect(error).toEqual(expectedError);
    }

    expect(db.transaction).toBeCalledTimes(1);
    expect(client.query).toBeCalledTimes(1);
    expect(client.query).toBeCalledWith(expect.any(String), [oldName, newName]);
  });

  it('should return topic id when updated successfully', async () => {
    client.query.mockResolvedValue({ rowCount: 1, rows: [{ id: topicId }] });

    const result = await provider(oldName, newName);

    expect(db.transaction).toBeCalledTimes(1);
    expect(client.query).toBeCalledTimes(1);
    expect(client.query).toBeCalledWith(expect.any(String), [oldName, newName]);
    expect(result).toEqual(topicId);
  });
});
