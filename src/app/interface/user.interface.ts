
//Interface for user
export interface UserProfile {
    uid: string;
    email: string;
    displayName?: string;
    photoURL?: string;
    tipoMoneda?: string;
    emailVerified: boolean;
    color:string;
}

// List of most used currency types
export const currencyTypes: string[] = [
    'USD', // United States Dollar
    'EUR', // Euro
    'JPY', // Japanese Yen
    'GBP', // British Pound Sterling
    'AUD', // Australian Dollar
    'CAD', // Canadian Dollar
    'CHF', // Swiss Franc
    'CNY', // Chinese Yuan
    'SEK', // Swedish Krona
    'NZD'  // New Zealand Dollar
];