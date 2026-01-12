// Currency exchange rate service using exchangerate-api.com

const API_KEY = 'YOUR_API_KEY'; // You can get a free API key from https://www.exchangerate-api.com/
const BASE_URL = 'https://api.exchangerate-api.com/v4/latest';

// Cache for exchange rates
const ratesCache = new Map();

// Get current exchange rates
export const getExchangeRates = async (baseCurrency = 'USD') => {
    // Cache key for localStorage
    const cacheKey = `finance_manager_rates_${baseCurrency}`;
    const cachedData = localStorage.getItem(cacheKey);

    if (cachedData) {
        try {
            const { rates, timestamp } = JSON.parse(cachedData);
            // Check if cache is less than 24 hours old
            if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
                return rates;
            }
        } catch (e) {
            console.warn('Error parsing cached rates:', e);
            localStorage.removeItem(cacheKey);
        }
    }

    // Check in-memory cache as fallback layer (though localStorage handles refresh)
    const memCacheKey = `${baseCurrency}-${new Date().toDateString()}`;
    if (ratesCache.has(memCacheKey)) {
        return ratesCache.get(memCacheKey);
    }

    try {
        const response = await fetch(`${BASE_URL}/${baseCurrency}`);
        const data = await response.json();

        if (data && data.rates) {
            // Update in-memory cache
            ratesCache.set(memCacheKey, data.rates);

            // Update localStorage cache
            localStorage.setItem(cacheKey, JSON.stringify({
                rates: data.rates,
                timestamp: Date.now()
            }));

            return data.rates;
        }

        throw new Error('Failed to fetch exchange rates');
    } catch (error) {
        console.error('Error fetching exchange rates:', error);

        // If we have stale cache, use it as fallback instead of hardcoded
        if (cachedData) {
            try {
                return JSON.parse(cachedData).rates;
            } catch (e) {
                // Ignore parse error on stale cache
            }
        }

        // Return fallback rates if API fails
        return getFallbackRates();
    }
};

// Get historical exchange rate for a specific date
export const getHistoricalRate = async (fromCurrency, toCurrency, date) => {
    // For demo purposes, we'll use current rates
    // In production, you'd use a service like https://exchangerate.host with historical data
    try {
        const rates = await getExchangeRates(fromCurrency);
        return rates[toCurrency] || 1;
    } catch (error) {
        console.error('Error fetching historical rate:', error);
        return 1;
    }
};

// Convert amount from one currency to another
export const convertCurrency = async (amount, fromCurrency, toCurrency, date = null) => {
    if (fromCurrency === toCurrency) {
        return amount;
    }

    try {
        let rate;
        if (date) {
            rate = await getHistoricalRate(fromCurrency, toCurrency, date);
        } else {
            const rates = await getExchangeRates(fromCurrency);
            rate = rates[toCurrency];
        }

        return amount * rate;
    } catch (error) {
        console.error('Error converting currency:', error);
        return amount;
    }
};

// Get fallback rates (approximate values)
const getFallbackRates = () => {
    return {
        USD: 1,
        EUR: 0.92,
        ILS: 3.65,
        GBP: 0.79,
        JPY: 149.50
    };
};

// Format currency for display
export const formatCurrency = (amount, currency = 'ILS') => {
    const symbols = {
        USD: '$',
        EUR: '€',
        ILS: '₪',
        GBP: '£',
        JPY: '¥'
    };

    const symbol = symbols[currency] || currency;
    const formatted = new Intl.NumberFormat('he-IL', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(Math.abs(amount));

    return `${symbol}${formatted}`;
};

// Get currency symbol
export const getCurrencySymbol = (currency) => {
    const symbols = {
        USD: '$',
        EUR: '€',
        ILS: '₪',
        GBP: '£',
        JPY: '¥'
    };

    return symbols[currency] || currency;
};
