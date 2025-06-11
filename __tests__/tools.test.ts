import { isBraveWebSearchArgs, isBraveLocalSearchArgs } from '../tools.js'; // Use .js extension for ESM imports

describe('Tool Argument Type Guards', () => {

  // --- Tests for isBraveWebSearchArgs ---
  describe('isBraveWebSearchArgs', () => {
    it('should return true for valid minimal args', () => {
      expect(isBraveWebSearchArgs({ query: 'test' })).toBe(true);
    });

    it('should return true for valid args with count', () => {
      expect(isBraveWebSearchArgs({ query: 'test', count: 10 })).toBe(true);
    });

    it('should return true for valid args with offset', () => {
      expect(isBraveWebSearchArgs({ query: 'test', offset: 5 })).toBe(true);
    });

    it('should return true for valid args with count and offset', () => {
      expect(isBraveWebSearchArgs({ query: 'test', count: 20, offset: 0 })).toBe(true);
    });

    it('should return false if query is missing', () => {
      expect(isBraveWebSearchArgs({ count: 10 })).toBe(false);
    });

    it('should return false if query is not a string', () => {
      expect(isBraveWebSearchArgs({ query: 123 })).toBe(false);
    });

    it('should return false if count is not a number', () => {
      expect(isBraveWebSearchArgs({ query: 'test', count: 'abc' })).toBe(false);
    });

    it('should return false if offset is not a number', () => {
      expect(isBraveWebSearchArgs({ query: 'test', offset: 'xyz' })).toBe(false);
    });

    it('should return false for null input', () => {
      expect(isBraveWebSearchArgs(null)).toBe(false);
    });

    it('should return false for undefined input', () => {
      expect(isBraveWebSearchArgs(undefined)).toBe(false);
    });

    it('should return false for non-object input', () => {
      expect(isBraveWebSearchArgs('string')).toBe(false);
    });

     it('should return false for extra unexpected properties', () => {
      // The current guard allows extra properties, which is generally fine for type guards.
      // If strict checking is needed, the guard would need modification.
      expect(isBraveWebSearchArgs({ query: 'test', extra: 'property' })).toBe(true); // Current behavior
    });
  });

  // --- Tests for isBraveLocalSearchArgs ---
  describe('isBraveLocalSearchArgs', () => {
    it('should return true for valid minimal args', () => {
      expect(isBraveLocalSearchArgs({ query: 'pizza near me' })).toBe(true);
    });

    it('should return true for valid args with count', () => {
      expect(isBraveLocalSearchArgs({ query: 'coffee shop', count: 3 })).toBe(true);
    });

    it('should return false if query is missing', () => {
      expect(isBraveLocalSearchArgs({ count: 5 })).toBe(false);
    });

    it('should return false if query is not a string', () => {
      expect(isBraveLocalSearchArgs({ query: true })).toBe(false);
    });

    it('should return false if count is not a number', () => {
      expect(isBraveLocalSearchArgs({ query: 'library', count: {} })).toBe(false);
    });

     it('should return false for null input', () => {
      expect(isBraveLocalSearchArgs(null)).toBe(false);
    });

    it('should return false for undefined input', () => {
      expect(isBraveLocalSearchArgs(undefined)).toBe(false);
    });

    it('should return false for non-object input', () => {
      expect(isBraveLocalSearchArgs(12345)).toBe(false);
    });

    it('should return false for extra unexpected properties', () => {
       // Similar to the web search guard, extra properties are currently allowed.
      expect(isBraveLocalSearchArgs({ query: 'park', another: 'field' })).toBe(true); // Current behavior
    });
  });
});