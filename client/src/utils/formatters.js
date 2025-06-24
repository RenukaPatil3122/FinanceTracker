export const formatCurrency = (amount, currency = "USD") => {
  // Clean and validate currency code
  const cleanCurrency = currency.toString().replace(/[^\w]/g, "").toUpperCase();

  // List of valid ISO currency codes
  const validCurrencies = [
    "USD",
    "EUR",
    "INR",
    "GBP",
    "JPY",
    "CNY",
    "CAD",
    "AUD",
    "CHF",
    "SEK",
    "NOK",
    "DKK",
    "PLN",
    "CZK",
    "HUF",
    "RUB",
    "BRL",
    "MXN",
    "ZAR",
    "KRW",
    "SGD",
    "HKD",
    "THB",
    "TRY",
    "ILS",
    "AED",
    "SAR",
    "EGP",
    "NGN",
    "KES",
    "GHS",
    "UGX",
    "TZS",
    "ZMW",
    "BWP",
    "MWK",
    "RWF",
    "ETB",
    "DZD",
    "MAD",
    "TND",
    "LYD",
    "SDG",
  ];

  const safeCurrency = validCurrencies.includes(cleanCurrency)
    ? cleanCurrency
    : "USD";

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: safeCurrency,
    }).format(amount);
  } catch (error) {
    console.warn(
      `Currency formatting error for ${currency}, using USD fallback`
    );
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  }
};

export const formatDate = (date) => {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
};

export const formatPercentage = (value) => {
  return `${(value * 100).toFixed(2)}%`;
};

export const getCurrencySymbol = (currency = "USD") => {
  const symbols = {
    USD: "$",
    EUR: "€",
    INR: "₹",
    GBP: "£",
    JPY: "¥",
    CNY: "¥",
    CAD: "C$",
    AUD: "A$",
    CHF: "CHF",
    SEK: "kr",
    NOK: "kr",
    DKK: "kr",
    PLN: "zł",
    CZK: "Kč",
    HUF: "Ft",
    RUB: "₽",
    BRL: "R$",
    MXN: "$",
    ZAR: "R",
    KRW: "₩",
    SGD: "S$",
    HKD: "HK$",
    THB: "฿",
    TRY: "₺",
    ILS: "₪",
    AED: "د.إ",
    SAR: "﷼",
    EGP: "£",
    NGN: "₦",
    KES: "KSh",
    GHS: "₵",
    UGX: "USh",
    TZS: "TSh",
    ZMW: "ZK",
    BWP: "P",
    MWK: "MK",
    RWF: "₣",
    ETB: "Br",
    DZD: "د.ج",
    MAD: "د.م.",
    TND: "د.ت",
    LYD: "ل.د",
    SDG: "ج.س.",
  };

  // Clean currency code before lookup
  const cleanCurrency = currency.toString().replace(/[^\w]/g, "").toUpperCase();
  return symbols[cleanCurrency] || currency;
};

// Alternative function that formats amount with currency symbol
export const formatCurrencyWithSymbol = (amount, currency = "USD") => {
  const symbol = getCurrencySymbol(currency);
  const formattedAmount = Math.abs(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `${symbol}${formattedAmount}`;
};

// Function to get currency name
export const getCurrencyName = (currency = "USD") => {
  const names = {
    USD: "US Dollar",
    EUR: "Euro",
    INR: "Indian Rupee",
    GBP: "British Pound",
    JPY: "Japanese Yen",
    CNY: "Chinese Yuan",
    CAD: "Canadian Dollar",
    AUD: "Australian Dollar",
    CHF: "Swiss Franc",
    SEK: "Swedish Krona",
    NOK: "Norwegian Krone",
    DKK: "Danish Krone",
    PLN: "Polish Złoty",
    CZK: "Czech Koruna",
    HUF: "Hungarian Forint",
    RUB: "Russian Ruble",
    BRL: "Brazilian Real",
    MXN: "Mexican Peso",
    ZAR: "South African Rand",
    KRW: "South Korean Won",
    SGD: "Singapore Dollar",
    HKD: "Hong Kong Dollar",
    THB: "Thai Baht",
    TRY: "Turkish Lira",
    ILS: "Israeli Shekel",
    AED: "UAE Dirham",
    SAR: "Saudi Riyal",
    EGP: "Egyptian Pound",
    NGN: "Nigerian Naira",
  };

  // Clean currency code before lookup
  const cleanCurrency = currency.toString().replace(/[^\w]/g, "").toUpperCase();
  return names[cleanCurrency] || currency;
};
