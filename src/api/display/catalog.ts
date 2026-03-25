import { DISPLAY_BASE_URL, type WalmartApiClient } from "../client.js";

export async function displayGetItemsets(
  client: WalmartApiClient,
  advertiserId: number,
  filters: { class?: string; status?: string }
) {
  return client.request("/itemsets", {
    method: "GET",
    baseUrl: DISPLAY_BASE_URL,
    query: { advertiserId, class: filters.class, status: filters.status }
  });
}

export async function displayGetItemsetAssociations(
  client: WalmartApiClient,
  advertiserId: number,
  filters: { campaignId?: string; itemsetId?: string }
) {
  return client.request("/itemsetAssociations", {
    method: "GET",
    baseUrl: DISPLAY_BASE_URL,
    query: { advertiserId, campaignId: filters.campaignId, itemsetId: filters.itemsetId }
  });
}

export async function displayGetCatalog(
  client: WalmartApiClient,
  advertiserId: number,
  filters: { itemIds?: string[]; brand?: string; category?: string }
) {
  return client.request("/catalog", {
    method: "GET",
    baseUrl: DISPLAY_BASE_URL,
    query: {
      advertiserId,
      itemIds: filters.itemIds?.join(","),
      brand: filters.brand,
      category: filters.category
    }
  });
}

export async function displayGetBrands(client: WalmartApiClient, advertiserId: number, search?: string) {
  return client.request("/brands", {
    method: "GET",
    baseUrl: DISPLAY_BASE_URL,
    query: { advertiserId, search }
  });
}

export async function displayGetTaxonomies(client: WalmartApiClient, advertiserId: number, search?: string) {
  return client.request("/taxonomies", {
    method: "GET",
    baseUrl: DISPLAY_BASE_URL,
    query: { advertiserId, search }
  });
}

export async function displayGetBrandLandingPages(
  client: WalmartApiClient,
  advertiserId: number,
  filters: { pageType?: string; brand?: string }
) {
  return client.request("/brandLandingPages", {
    method: "GET",
    baseUrl: DISPLAY_BASE_URL,
    query: { advertiserId, pageType: filters.pageType, brand: filters.brand }
  });
}

export async function displayGetFolders(client: WalmartApiClient, advertiserId: number, search?: string) {
  return client.request("/folders", {
    method: "GET",
    baseUrl: DISPLAY_BASE_URL,
    query: { advertiserId, search }
  });
}
