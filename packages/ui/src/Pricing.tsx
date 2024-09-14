import { Price } from "@cloudy/utils/common";

export const formatPrice = (
    amount: number | null | undefined,
    currency: string
) => {
    if (amount === null || amount === undefined) {
        return "N/A";
    }
    const formattedAmount = (amount / 100).toFixed(2);
    const formatter = new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    });
    return formatter.format(parseFloat(formattedAmount)).replace(/\.00$/, "");
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
                        {formatPrice(fullPrice.unit_amount, fullPrice.currency)}
                    </div>
                    <div className="flex items-baseline">
                        <span className="text-3xl font-bold text-primary">
                            {formatPrice(price.unit_amount, price.currency)}
                        </span>
                        {price.recurring && (
                            <span className="text-sm text-secondary ml-1 mb-1">
                                /seat
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
                        {formatPrice(price.unit_amount, price.currency)}
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
