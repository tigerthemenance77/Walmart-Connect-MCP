export interface WalmartAccount {
  advertiserId: number;
  advertiserName: string;
  advertiserType: string;
  apiType: "search" | "display";
}

export interface AccountsCache {
  lastRefreshed: string;
  accounts: WalmartAccount[];
}
