// ISO 3166-1 numeric → country name + flag + ISO alpha-2 code
// Covers the most common/important countries for the intelligence dashboard
export interface CountryMeta {
  name: string;
  flag: string;
  code: string; // ISO alpha-2
}

export const COUNTRY_META: Record<string, CountryMeta> = {
  '4': { name: 'Afghanistan', flag: '🇦🇫', code: 'AF' },
  '8': { name: 'Albania', flag: '🇦🇱', code: 'AL' },
  '12': { name: 'Algeria', flag: '🇩🇿', code: 'DZ' },
  '32': { name: 'Argentina', flag: '🇦🇷', code: 'AR' },
  '36': { name: 'Australia', flag: '🇦🇺', code: 'AU' },
  '40': { name: 'Austria', flag: '🇦🇹', code: 'AT' },
  '50': { name: 'Bangladesh', flag: '🇧🇩', code: 'BD' },
  '56': { name: 'Belgium', flag: '🇧🇪', code: 'BE' },
  '76': { name: 'Brazil', flag: '🇧🇷', code: 'BR' },
  '100': { name: 'Bulgaria', flag: '🇧🇬', code: 'BG' },
  '104': { name: 'Myanmar', flag: '🇲🇲', code: 'MM' },
  '116': { name: 'Cambodia', flag: '🇰🇭', code: 'KH' },
  '120': { name: 'Cameroon', flag: '🇨🇲', code: 'CM' },
  '124': { name: 'Canada', flag: '🇨🇦', code: 'CA' },
  '152': { name: 'Chile', flag: '🇨🇱', code: 'CL' },
  '156': { name: 'China', flag: '🇨🇳', code: 'CN' },
  '170': { name: 'Colombia', flag: '🇨🇴', code: 'CO' },
  '180': { name: 'DR Congo', flag: '🇨🇩', code: 'CD' },
  '191': { name: 'Croatia', flag: '🇭🇷', code: 'HR' },
  '192': { name: 'Cuba', flag: '🇨🇺', code: 'CU' },
  '196': { name: 'Cyprus', flag: '🇨🇾', code: 'CY' },
  '203': { name: 'Czech Republic', flag: '🇨🇿', code: 'CZ' },
  '208': { name: 'Denmark', flag: '🇩🇰', code: 'DK' },
  '818': { name: 'Egypt', flag: '🇪🇬', code: 'EG' },
  '231': { name: 'Ethiopia', flag: '🇪🇹', code: 'ET' },
  '233': { name: 'Estonia', flag: '🇪🇪', code: 'EE' },
  '246': { name: 'Finland', flag: '🇫🇮', code: 'FI' },
  '250': { name: 'France', flag: '🇫🇷', code: 'FR' },
  '276': { name: 'Germany', flag: '🇩🇪', code: 'DE' },
  '300': { name: 'Greece', flag: '🇬🇷', code: 'GR' },
  '320': { name: 'Guatemala', flag: '🇬🇹', code: 'GT' },
  '332': { name: 'Haiti', flag: '🇭🇹', code: 'HT' },
  '348': { name: 'Hungary', flag: '🇭🇺', code: 'HU' },
  '352': { name: 'Iceland', flag: '🇮🇸', code: 'IS' },
  '356': { name: 'India', flag: '🇮🇳', code: 'IN' },
  '360': { name: 'Indonesia', flag: '🇮🇩', code: 'ID' },
  '364': { name: 'Iran', flag: '🇮🇷', code: 'IR' },
  '368': { name: 'Iraq', flag: '🇮🇶', code: 'IQ' },
  '372': { name: 'Ireland', flag: '🇮🇪', code: 'IE' },
  '376': { name: 'Israel', flag: '🇮🇱', code: 'IL' },
  '380': { name: 'Italy', flag: '🇮🇹', code: 'IT' },
  '392': { name: 'Japan', flag: '🇯🇵', code: 'JP' },
  '400': { name: 'Jordan', flag: '🇯🇴', code: 'JO' },
  '398': { name: 'Kazakhstan', flag: '🇰🇿', code: 'KZ' },
  '404': { name: 'Kenya', flag: '🇰🇪', code: 'KE' },
  '408': { name: 'North Korea', flag: '🇰🇵', code: 'KP' },
  '410': { name: 'South Korea', flag: '🇰🇷', code: 'KR' },
  '414': { name: 'Kuwait', flag: '🇰🇼', code: 'KW' },
  '422': { name: 'Lebanon', flag: '🇱🇧', code: 'LB' },
  '434': { name: 'Libya', flag: '🇱🇾', code: 'LY' },
  '428': { name: 'Latvia', flag: '🇱🇻', code: 'LV' },
  '440': { name: 'Lithuania', flag: '🇱🇹', code: 'LT' },
  '458': { name: 'Malaysia', flag: '🇲🇾', code: 'MY' },
  '484': { name: 'Mexico', flag: '🇲🇽', code: 'MX' },
  '504': { name: 'Morocco', flag: '🇲🇦', code: 'MA' },
  '528': { name: 'Netherlands', flag: '🇳🇱', code: 'NL' },
  '554': { name: 'New Zealand', flag: '🇳🇿', code: 'NZ' },
  '566': { name: 'Nigeria', flag: '🇳🇬', code: 'NG' },
  '578': { name: 'Norway', flag: '🇳🇴', code: 'NO' },
  '586': { name: 'Pakistan', flag: '🇵🇰', code: 'PK' },
  '604': { name: 'Peru', flag: '🇵🇪', code: 'PE' },
  '608': { name: 'Philippines', flag: '🇵🇭', code: 'PH' },
  '616': { name: 'Poland', flag: '🇵🇱', code: 'PL' },
  '620': { name: 'Portugal', flag: '🇵🇹', code: 'PT' },
  '634': { name: 'Qatar', flag: '🇶🇦', code: 'QA' },
  '642': { name: 'Romania', flag: '🇷🇴', code: 'RO' },
  '643': { name: 'Russia', flag: '🇷🇺', code: 'RU' },
  '682': { name: 'Saudi Arabia', flag: '🇸🇦', code: 'SA' },
  '688': { name: 'Serbia', flag: '🇷🇸', code: 'RS' },
  '702': { name: 'Singapore', flag: '🇸🇬', code: 'SG' },
  '703': { name: 'Slovakia', flag: '🇸🇰', code: 'SK' },
  '705': { name: 'Slovenia', flag: '🇸🇮', code: 'SI' },
  '706': { name: 'Somalia', flag: '🇸🇴', code: 'SO' },
  '710': { name: 'South Africa', flag: '🇿🇦', code: 'ZA' },
  '724': { name: 'Spain', flag: '🇪🇸', code: 'ES' },
  '144': { name: 'Sri Lanka', flag: '🇱🇰', code: 'LK' },
  '729': { name: 'Sudan', flag: '🇸🇩', code: 'SD' },
  '752': { name: 'Sweden', flag: '🇸🇪', code: 'SE' },
  '756': { name: 'Switzerland', flag: '🇨🇭', code: 'CH' },
  '760': { name: 'Syria', flag: '🇸🇾', code: 'SY' },
  '158': { name: 'Taiwan', flag: '🇹🇼', code: 'TW' },
  '764': { name: 'Thailand', flag: '🇹🇭', code: 'TH' },
  '792': { name: 'Turkey', flag: '🇹🇷', code: 'TR' },
  '804': { name: 'Ukraine', flag: '🇺🇦', code: 'UA' },
  '784': { name: 'UAE', flag: '🇦🇪', code: 'AE' },
  '826': { name: 'United Kingdom', flag: '🇬🇧', code: 'GB' },
  '840': { name: 'United States', flag: '🇺🇸', code: 'US' },
  '858': { name: 'Uruguay', flag: '🇺🇾', code: 'UY' },
  '860': { name: 'Uzbekistan', flag: '🇺🇿', code: 'UZ' },
  '862': { name: 'Venezuela', flag: '🇻🇪', code: 'VE' },
  '704': { name: 'Vietnam', flag: '🇻🇳', code: 'VN' },
  '887': { name: 'Yemen', flag: '🇾🇪', code: 'YE' },
  '-99': { name: 'Unknown', flag: '🏳', code: 'XX' },
};

// Map of country code (alpha-2) → country name for matching news/cameras
export const COUNTRY_CODE_TO_NAME: Record<string, string> = {};
export const COUNTRY_NAME_TO_CODE: Record<string, string> = {};

Object.values(COUNTRY_META).forEach(m => {
  COUNTRY_CODE_TO_NAME[m.code] = m.name;
  COUNTRY_NAME_TO_CODE[m.name.toLowerCase()] = m.code;
});

// Common aliases
COUNTRY_NAME_TO_CODE['usa'] = 'US';
COUNTRY_NAME_TO_CODE['u.s.'] = 'US';
COUNTRY_NAME_TO_CODE['u.s.a.'] = 'US';
COUNTRY_NAME_TO_CODE['america'] = 'US';
COUNTRY_NAME_TO_CODE['uk'] = 'GB';
COUNTRY_NAME_TO_CODE['britain'] = 'GB';
COUNTRY_NAME_TO_CODE['uae'] = 'AE';
COUNTRY_NAME_TO_CODE['south korea'] = 'KR';
COUNTRY_NAME_TO_CODE['north korea'] = 'KP';
COUNTRY_NAME_TO_CODE['czech republic'] = 'CZ';
COUNTRY_NAME_TO_CODE['czechia'] = 'CZ';
