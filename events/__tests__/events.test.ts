import { eventEmitter, sseManager } from "../src/models";

describe('Real-time Events Service', () => {
  it('emits insert event and broadcasts to clients', (done) => {
    const mockResponse = { write: jest.fn() } as any;
    sseManager.addClient(mockResponse);

    const testEvent = {
      collection: 'test_items',
      action: 'insert',
      operationId: 'op-123',
      eventData: {
        affected: [{ _id: '507f1f77bcf86cd799439011', name: 'Test Item' }],
        count: 1,
        ids: ['507f1f77bcf86cd799439011']
      }
    };

    // Test the main workflow: emit → broadcast → clients recieve
    eventEmitter.once('insert', (event) => {
      expect(event.collection).toBe('test_items');
      expect(event.action).toBe('insert');
      sseManager.broadcast(event);
      expect(mockResponse.write).toHaveBeenCalled();
      done();
    });

    eventEmitter.emitInsert('test_items', testEvent.eventData.affected, 'op-123');
  });
});
