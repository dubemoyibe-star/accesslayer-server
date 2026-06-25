import { prisma } from '../../utils/prisma.utils';
import { CreateAlertInput } from './alert.schemas';

export type PriceMovement = {
    creatorId: string;
    previousPrice: number | string;
    currentPrice: number | string;
};

/**
 * Creates a new price alert for a wallet address watching a creator's key price.
 */
export async function createAlert(input: CreateAlertInput) {
    return await prisma.priceAlert.create({
        data: {
            creatorId: input.creator_id,
            walletAddress: input.wallet_address,
            targetPrice: input.target_price,
            direction: input.direction,
            callbackUrl: input.callback_url,
        },
    });
}

/**
 * Lists all active price alerts for a given wallet address.
 */
export async function listAlerts(walletAddress: string) {
    return await prisma.priceAlert.findMany({
        where: { walletAddress, isActive: true },
        orderBy: { createdAt: 'desc' },
    });
}

/**
 * Deletes a price alert by id, scoped to the wallet address for authorization.
 * Returns the deleted record id or null if not found.
 */
export async function deleteAlert(
    id: string,
    walletAddress: string
): Promise<{ id: string } | null> {
    const existing = await prisma.priceAlert.findFirst({
        where: { id, walletAddress },
    });

    if (!existing) {
        return null;
    }

    await prisma.priceAlert.delete({ where: { id } });
    return { id };
}

function toNumber(value: number | string | { toString(): string }): number {
    return typeof value === 'number' ? value : Number(value.toString());
}

/**
 * Evaluates active alerts for a creator price movement and delivers only alerts
 * whose threshold was crossed in the registered direction.
 */
export async function evaluatePriceAlertsForMovement(
    movement: PriceMovement
): Promise<void> {
    const previousPrice = toNumber(movement.previousPrice);
    const currentPrice = toNumber(movement.currentPrice);

    const alerts = await prisma.priceAlert.findMany({
        where: {
            creatorId: movement.creatorId,
            isActive: true,
            triggeredAt: null,
        },
    });

    for (const alert of alerts) {
        const targetPrice = toNumber(alert.targetPrice);
        const crossedAbove =
            alert.direction === 'above' &&
            previousPrice < targetPrice &&
            currentPrice >= targetPrice;
        const crossedBelow =
            alert.direction === 'below' &&
            previousPrice > targetPrice &&
            currentPrice <= targetPrice;

        if (!crossedAbove && !crossedBelow) {
            continue;
        }

        await fetch(alert.callbackUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                event_type: 'price_alert',
                alert_id: alert.id,
                creator_id: alert.creatorId,
                wallet_address: alert.walletAddress,
                target_price: targetPrice,
                current_price: currentPrice,
                direction: alert.direction,
            }),
        });

        await prisma.priceAlert.update({
            where: { id: alert.id },
            data: {
                isActive: false,
                triggeredAt: new Date(),
            },
        });
    }
}
