
export enum PlanId {
  Basic = 'basic',
  Intermediate = 'intermediate',
  Pro = 'pro',
}

export interface Plan {
  id: PlanId;
  name: string;
  price: number;
  currency: string;
  smsIncluded: number;
  features: string[];
}

export interface Customer {
  id:string;
  business_id: string;
  name: string;
  phone: string;
  created_at: string;
}

export enum CampaignStatus {
  Draft = 'Draft',
  Scheduled = 'Scheduled',
  Sending = 'Sending',
  Sent = 'Sent',
  Failed = 'Failed',
}

export enum CampaignRecurrence {
  OneTime = 'One-Time',
  Weekly = 'Weekly',
  Monthly = 'Monthly',
}

export interface Campaign {
  id: string;
  business_id: string;
  title: string;
  content: string;
  status: CampaignStatus;
  customers?: number; // This will now be calculated
  smsUsed?: number; // This will now be calculated
  scheduled_at: string;
  recurrence: CampaignRecurrence;
  created_at: string;
}

export enum BusinessStatus {
  Active = 'Active',
  Disabled = 'Disabled',
}

export interface Business {
  id: string; // This is the business profile ID from the 'businesses' table
  user_id: string; // This is the auth user ID from auth.users
  name: string;
  plan_id: PlanId;
  sms_used: number;
  sms_limit: number;
  status: BusinessStatus;
  created_at: string;
}

export interface Admin {
  id: string;
  email: string;
}


export type Page = 'dashboard' | 'campaigns' | 'customers' | 'subscription' | 'settings';