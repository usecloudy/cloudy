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
    unitPrice: number | null;
    unitCount: number | null;
    totalPrice: number | null;
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
    fileName?: string;
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

export interface TopicsRefreshPostRequestBody {
    topicId: string;
}

export interface TopicsNewPostRequestBody {
    query: string;
    workspaceId: string;
}

export interface FileHandlerClientPayload {
    Authorization: string;
    thoughtId: string;
}

export interface ThreadRespondPostRequestBody {
    thoughtId: string;
    commentId: string;
}

export interface ApplyChangePostRequestBody {
    thoughtId: string;
    suggestionContent: string;
}

export interface CollectionSummaryPostRequestBody {
    collectionId: string;
}
