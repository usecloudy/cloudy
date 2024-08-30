export interface Price {
    id: string;
    active: boolean;
    currency: string;
    metadata: Record<string, string>;
    product: string;
    recurring?: {
        interval: string;
    } | null;
    unit_amount?: number | null;
}

export interface MarketingFeature {
    title: string;
}

export interface Product {
    id: string;
    name: string;
    description?: string | null;
    defaultPrice: Price;
    fullPrice?: Price | null;
    metadata: Record<string, string>;
    marketingFeatures: MarketingFeature[];
}
