import { evaluatePriceAlertsForMovement } from '../alert.service';
import { prisma } from '../../../utils/prisma.utils';

jest.mock('../../../utils/prisma.utils', () => ({
    prisma: {
        priceAlert: {
            findMany: jest.fn(),
            update: jest.fn(),
        },
    },
}));

const mockPrisma = prisma as unknown as {
    priceAlert: {
        findMany: jest.Mock;
        update: jest.Mock;
    };
};

const BASE_ALERT = {
    id: 'alert-1',
    creatorId: 'creator-1',
    walletAddress: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    targetPrice: 100,
    callbackUrl: 'https://example.com/price-alert',
    isActive: true,
    triggeredAt: null,
    createdAt: new Date('2026-06-01T00:00:00Z'),
};

describe('price alert movement integration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        global.fetch = jest.fn().mockResolvedValue({ ok: true });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('does not fire an above alert when the price drops', async () => {
        mockPrisma.priceAlert.findMany.mockResolvedValue([
            {
                ...BASE_ALERT,
                id: 'above-alert',
                direction: 'above',
                targetPrice: 120,
            },
        ]);

        await evaluatePriceAlertsForMovement({
            creatorId: 'creator-1',
            previousPrice: 100,
            currentPrice: 90,
        });

        expect(global.fetch).not.toHaveBeenCalled();
        expect(mockPrisma.priceAlert.update).not.toHaveBeenCalled();
        expect(mockPrisma.priceAlert.findMany).toHaveBeenCalledWith({
            where: {
                creatorId: 'creator-1',
                isActive: true,
                triggeredAt: null,
            },
        });
    });

    it('does not fire a below alert when the price rises', async () => {
        mockPrisma.priceAlert.findMany.mockResolvedValue([
            {
                ...BASE_ALERT,
                id: 'below-alert',
                direction: 'below',
                targetPrice: 80,
            },
        ]);

        await evaluatePriceAlertsForMovement({
            creatorId: 'creator-1',
            previousPrice: 100,
            currentPrice: 110,
        });

        expect(global.fetch).not.toHaveBeenCalled();
        expect(mockPrisma.priceAlert.update).not.toHaveBeenCalled();
    });
});
