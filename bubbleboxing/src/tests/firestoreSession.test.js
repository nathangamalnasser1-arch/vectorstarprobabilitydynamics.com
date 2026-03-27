import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Firestore functions
const mockAddDoc = vi.fn();
const mockGetDocs = vi.fn();
const mockServerTimestamp = vi.fn(() => ({ _type: 'serverTimestamp' }));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn((db, col) => ({ _db: db, _col: col })),
  addDoc: (...args) => mockAddDoc(...args),
  getDocs: (...args) => mockGetDocs(...args),
  query: vi.fn((...args) => ({ _args: args })),
  where: vi.fn((field, op, val) => ({ field, op, val })),
  orderBy: vi.fn((field, dir) => ({ field, dir })),
  limit: vi.fn((n) => n),
  serverTimestamp: () => mockServerTimestamp(),
}));

vi.mock('firebase/storage', () => ({
  ref: vi.fn(),
  uploadBytes: vi.fn(),
  getDownloadURL: vi.fn(() => Promise.resolve('https://fake-url.com/recording.webm')),
}));

// Import after mocks
const { saveSession, getUserSessions, getLeaderboard } =
  await import('../lib/sessionService.js');

describe('saveSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAddDoc.mockResolvedValue({ id: 'session-123' });
  });

  it('resolves with the new document ID', async () => {
    const id = await saveSession('user-1', {
      totalPops: 42,
      punchEvents: [],
      averageSpeed: 0.03,
      duration: 180,
    });
    expect(id).toBe('session-123');
  });

  it('passes correct data structure to addDoc', async () => {
    await saveSession('user-abc', {
      totalPops: 10,
      punchEvents: [{ rating: 'Fast', speedNorm: 0.04 }],
      averageSpeed: 0.04,
      duration: 180,
    });

    const callArg = mockAddDoc.mock.calls[0][1];
    expect(callArg.userId).toBe('user-abc');
    expect(callArg.totalPops).toBe(10);
    expect(callArg.punchEvents).toHaveLength(1);
    expect(callArg.averageSpeed).toBe(0.04);
    expect(callArg.duration).toBe(180);
    expect(callArg.createdAt).toBeDefined();
  });

  it('defaults missing fields gracefully', async () => {
    await saveSession('user-2', {});
    const callArg = mockAddDoc.mock.calls[0][1];
    expect(callArg.totalPops).toBe(0);
    expect(callArg.punchEvents).toEqual([]);
    expect(callArg.videoUrl).toBeNull();
    expect(callArg.photos).toEqual([]);
  });
});

describe('getUserSessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns mapped session documents', async () => {
    mockGetDocs.mockResolvedValue({
      docs: [
        { id: 'sess-1', data: () => ({ totalPops: 30, userId: 'user-1' }) },
        { id: 'sess-2', data: () => ({ totalPops: 15, userId: 'user-1' }) },
      ],
    });

    const sessions = await getUserSessions('user-1');
    expect(sessions).toHaveLength(2);
    expect(sessions[0].id).toBe('sess-1');
    expect(sessions[0].totalPops).toBe(30);
    expect(sessions[1].id).toBe('sess-2');
  });

  it('returns empty array when no sessions', async () => {
    mockGetDocs.mockResolvedValue({ docs: [] });
    const sessions = await getUserSessions('user-x');
    expect(sessions).toEqual([]);
  });
});

describe('getLeaderboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns top sessions sorted by totalPops', async () => {
    mockGetDocs.mockResolvedValue({
      docs: [
        { id: 'top-1', data: () => ({ totalPops: 99, userId: 'champ' }) },
        { id: 'top-2', data: () => ({ totalPops: 77, userId: 'runner' }) },
      ],
    });

    const leaders = await getLeaderboard(2);
    expect(leaders).toHaveLength(2);
    expect(leaders[0].totalPops).toBe(99);
  });
});
