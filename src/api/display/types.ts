export interface DisplayCampaign {
  campaignId: string;
  advertiserId: number;
  name: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
}

export interface DisplayAdGroup {
  adGroupId: string;
  campaignId: string;
  advertiserId: number;
  name: string;
  status?: string;
}

export interface DisplayKeyword {
  keywordId: string;
  adGroupId: string;
  advertiserId: number;
  keywordText: string;
  matchType?: string;
  bid?: number;
}

export interface DisplayTargeting {
  targetingId: string;
  advertiserId: number;
  tactic?: string;
  audienceType?: string;
  name?: string;
}

export interface DisplayGeoLocation {
  geoId: string;
  advertiserId: number;
  name: string;
  type?: string;
}

export interface DisplayCreative {
  creativeId: string;
  advertiserId: number;
  name: string;
  status?: string;
  folderId?: string;
}

export interface DisplayCreativeAssociation {
  creativeId: string;
  adGroupId: string;
  advertiserId: number;
  status?: string;
}
