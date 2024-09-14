import { Product } from "./pricing";

export interface PaymentsProductsGetResponse {
    products: Product[];
}

export interface CustomerStatus {
    stripeCustomerId: string;
    isActive: boolean;
    isTrialing: boolean;
    isEligibleForTrial: boolean;
    remainingDaysInTrial: number | null;
}

export interface PaymentsCustomersStatusGetResponse {
    wsId: string;
    wsSlug: string;
    customerStatus: CustomerStatus | null;
    userCount: number;
}

export interface ThoughtsExportGetRequestBody {
    hideWatermark?: boolean;
    hideTitle?: boolean;
    colorScheme?: "default" | "white";
    fontSizePt?: number;
    paperSize?: "a4" | "letter" | "legal";
}

export interface WorkspacesNewPostRequestBody {
    name: string;
    slug: string;
}

export interface WorkspacesNewPostResponse {
    success: boolean;
    wsId: string;
    wsSlug: string;
}
