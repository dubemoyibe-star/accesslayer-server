import { fetchWalletHoldings } from './wallet-holdings.service';
import { prisma } from '../../utils/prisma.utils';

jest.mock('../../utils/prisma.utils', () => ({
    prisma: {
        keyOwnership: {
            findMany: jest.fn(),
        },
        creatorProfile: {
            findMany: jest.fn(),
        },
        activity: {
            findMany: jest.fn(),
        },
    },
}));

const mockPrisma = prisma as unknown as {
    keyOwnership: {
        findMany: jest.Mock;
    };
    creatorProfile: {
        findMany: jest.Mock;
    };
    activity: {
        findMany: jest.Mock;
    };
};

const WALLET_ADDRESS = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

describe('fetchWalletHoldings ownership read model integration', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        mockPrisma.keyOwnership.findMany.mockResolvedValue([
            {
                ownerAddress: WALLET_ADDRESS,
                creatorId: 'creator-alpha',
                balance: '5',
                createdAt: new Date('2026-06-02T00:00:00Z'),
            },
            {
                ownerAddress: WALLET_ADDRESS,
                creatorId: 'creator-beta',
                balance: '2.5',
                createdAt: new Date('2026-06-01T00:00:00Z'),
            },
        ]);
        mockPrisma.creatorProfile.findMany.mockResolvedValue([
            { id: 'creator-alpha', handle: 'alpha' },
            { id: 'creator-beta', handle: 'beta' },
        ]);
        mockPrisma.activity.findMany.mockResolvedValue([
            {
                creatorId: 'creator-alpha',
                payload: { price_at_trade: '10' },
            },
            {
                creatorId: 'creator-beta',
                payload: { price_at_trade: '4' },
            },
        ]);
    });

    it('returns correct key balances and excludes zero-balance ownership rows', async () => {
        const [items, total] = await fetchWalletHoldings(WALLET_ADDRESS);

        expect(mockPrisma.keyOwnership.findMany).toHaveBeenCalledWith({
            where: {
                ownerAddress: WALLET_ADDRESS,
                balance: { gt: 0 },
            },
            orderBy: { createdAt: 'desc' },
        });
        expect(total).toBe(2);
        expect(items).toEqual([
            {
                creator_id: 'creator-alpha',
                creator_handle: 'alpha',
                key_count: '5',
                current_price: '10',
                total_value: null,
            },
            {
                creator_id: 'creator-beta',
                creator_handle: 'beta',
                key_count: '2.5',
                current_price: '4',
                total_value: null,
            },
        ]);
        expect(items.map((item) => item.creator_id)).not.toContain('creator-zero');
    });
});
