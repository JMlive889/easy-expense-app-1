export interface LicenseLimits {
  adminLicenses: number;
  guestLicenses: number;
}

export interface StripeProduct {
  priceId: string;
  name: string;
  description: string;
  mode: 'subscription' | 'payment';
  price: number;
  currency: string;
  interval?: string;
  licenses: LicenseLimits;
  monthlyTokens: number;
}

export const TOKEN_OVERAGE_PRICE = 0.003;

export const stripeProducts: StripeProduct[] = [
  {
    priceId: 'price_1T0YznHW4skK6MDc6vtPXMHf',
    name: 'Basic',
    description: 'Double User (Two for One), you and your accountant.',
    mode: 'subscription',
    price: 10.00,
    currency: 'USD',
    interval: 'month',
    licenses: {
      adminLicenses: 1,
      guestLicenses: 1
    },
    monthlyTokens: 2000000
  },
  {
    priceId: 'price_1T0Z03HW4skK6MDcnavM0XBv',
    name: 'Premium',
    description: 'You and your accountant + 2 standard guests.',
    mode: 'subscription',
    price: 25.00,
    currency: 'USD',
    interval: 'month',
    licenses: {
      adminLicenses: 1,
      guestLicenses: 2
    },
    monthlyTokens: 4000000
  },
  {
    priceId: 'price_1T0Z0EHW4skK6MDcH2VsgSSu',
    name: 'Reserve',
    description: 'You and your accountant + 5 standard guests.',
    mode: 'subscription',
    price: 50.00,
    currency: 'USD',
    interval: 'month',
    licenses: {
      adminLicenses: 2,
      guestLicenses: 5
    },
    monthlyTokens: 7000000
  }
];

export function getProductByPriceId(priceId: string): StripeProduct | undefined {
  return stripeProducts.find(product => product.priceId === priceId);
}

export function getProductByName(name: string): StripeProduct | undefined {
  return stripeProducts.find(product => product.name.toLowerCase() === name.toLowerCase());
}

export function getLicenseLimitsByPriceId(priceId: string): LicenseLimits | null {
  const product = getProductByPriceId(priceId);
  return product ? product.licenses : null;
}

export function getLicenseLimitsByProductName(name: string): LicenseLimits | null {
  const product = getProductByName(name);
  return product ? product.licenses : null;
}

export interface LicenseAvailability {
  adminAvailable: number;
  guestAvailable: number;
  canAddAdmin: boolean;
  canAddGuest: boolean;
}

export function checkLicenseAvailability(
  productName: string,
  activeAdminCount: number,
  activeGuestCount: number
): LicenseAvailability {
  const limits = getLicenseLimitsByProductName(productName);

  if (!limits) {
    return {
      adminAvailable: 0,
      guestAvailable: 0,
      canAddAdmin: false,
      canAddGuest: false
    };
  }

  const adminAvailable = Math.max(0, limits.adminLicenses - activeAdminCount);
  const guestAvailable = Math.max(0, limits.guestLicenses - activeGuestCount);

  return {
    adminAvailable,
    guestAvailable,
    canAddAdmin: adminAvailable > 0,
    canAddGuest: guestAvailable > 0
  };
}

export function getTokenLimitsByProductName(name: string): number {
  const product = getProductByName(name);
  return product ? product.monthlyTokens : 0;
}

export function getTokenLimitPerUser(productName: string): number {
  const product = getProductByName(productName);
  if (!product) return 1000000;

  const totalUsers = product.licenses.adminLicenses + product.licenses.guestLicenses + 1;
  return Math.floor(product.monthlyTokens / totalUsers);
}

export function calculateOverageCost(tokensUsed: number, tokenLimit: number): number {
  if (tokensUsed <= tokenLimit) return 0;
  const overageTokens = tokensUsed - tokenLimit;
  return (overageTokens / 1000) * TOKEN_OVERAGE_PRICE;
}

export function formatOveragePrice(): string {
  return `We charge $${TOKEN_OVERAGE_PRICE.toFixed(3)} per 1,000 tokens (or equivalently $${(TOKEN_OVERAGE_PRICE * 1000).toFixed(0)} per million tokens) for anything over the included limit.`;
}