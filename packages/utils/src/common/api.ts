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
    uid: string;
    customerStatus: CustomerStatus | null;
}
