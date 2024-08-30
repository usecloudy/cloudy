import { Price } from "@cloudy/utils/common";

const formatPrice = (amount: number | null | undefined) => {
    return amount !== null && amount !== undefined
        ? `$${(amount / 100).toFixed(0)}`
        : "N/A";
};

export const Pricing = ({
    price,
    fullPrice,
    showDiscount = true,
}: {
    price: Price;
    fullPrice?: Price | null;
    showDiscount?: boolean;
}) => {
    const discountPercentage =
        fullPrice && fullPrice.unit_amount && price.unit_amount
            ? Math.round(
                  ((fullPrice.unit_amount - price.unit_amount) /
                      fullPrice.unit_amount) *
                      100
              )
            : 0;

    return (
        <div className="flex flex-row items-center">
            {fullPrice ? (
                <div className="flex flex-row items-center gap-1">
                    <div className="text-base text-secondary line-through">
                        {formatPrice(fullPrice.unit_amount)}
                    </div>
                    <div className="flex items-baseline">
                        <span className="text-3xl font-bold text-primary">
                            {formatPrice(price.unit_amount)}
                        </span>
                        {price.recurring && (
                            <span className="text-sm text-secondary ml-1 mb-1">
                                /{price.recurring.interval}
                            </span>
                        )}
                    </div>
                    {showDiscount && (
                        <div className="text-sm text-accent font-medium">
                            Save {discountPercentage}%
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex items-baseline">
                    <span className="text-3xl font-bold text-primary">
                        {formatPrice(price.unit_amount)}
                    </span>
                    {price.recurring && (
                        <span className="text-sm text-secondary ml-1">
                            /{price.recurring.interval}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};
