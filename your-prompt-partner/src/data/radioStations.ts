export interface RadioStation {
  id: string;
  name: string;
  country: string;
  flag: string;
  genre: string;
  streamUrl: string;
  region: 'americas' | 'europe' | 'asia' | 'africa' | 'oceania' | 'middle-east';
  lat: number;
  lon: number;
}

export const RADIO_STATIONS: RadioStation[] = [
  // Americas
  { id: 'kexp', name: 'KEXP 90.3', country: 'USA', flag: '🇺🇸', genre: 'Indie/Alt', streamUrl: 'https://kexp-mp3-128.streamguys1.com/kexp128.mp3', region: 'americas', lat: 47.62, lon: -122.35 },
  { id: 'wfmu', name: 'WFMU', country: 'USA', flag: '🇺🇸', genre: 'Freeform', streamUrl: 'https://stream0.wfmu.org/freeform-128k', region: 'americas', lat: 40.73, lon: -74.07 },
  { id: 'kusc', name: 'KUSC Classical', country: 'USA', flag: '🇺🇸', genre: 'Classical', streamUrl: 'https://kusc.streamguys1.com/kusc-128k.mp3', region: 'americas', lat: 34.05, lon: -118.24 },
  { id: 'cbc-music', name: 'CBC Music', country: 'Canada', flag: '🇨🇦', genre: 'Eclectic', streamUrl: 'https://cbcliveradio-lh.akamaihd.net/i/CBCMUSIC_1@354192/master.m3u8', region: 'americas', lat: 43.65, lon: -79.38 },
  { id: 'blue-fm', name: 'Blue 100.7 FM', country: 'Argentina', flag: '🇦🇷', genre: 'Rock', streamUrl: 'https://www.bue.fm/radios/blue1007/listen.mp3', region: 'americas', lat: -34.60, lon: -58.38 },
  { id: 'radio-unam', name: 'Radio UNAM', country: 'Mexico', flag: '🇲🇽', genre: 'Culture', streamUrl: 'https://stream.unam.mx/radio/unam/live.mp3', region: 'americas', lat: 19.43, lon: -99.13 },
  { id: 'jovem-pan', name: 'Jovem Pan', country: 'Brazil', flag: '🇧🇷', genre: 'Pop/News', streamUrl: 'https://stream-ic.jovempan.com.br/jp', region: 'americas', lat: -23.55, lon: -46.63 },
  { id: 'radio-havana', name: 'Radio Havana Cuba', country: 'Cuba', flag: '🇨🇺', genre: 'News', streamUrl: 'http://media.rhc.cu:8000/rhcingleslq', region: 'americas', lat: 23.11, lon: -82.37 },
  { id: 'radio-colombia', name: 'Blu Radio', country: 'Colombia', flag: '🇨🇴', genre: 'News/Music', streamUrl: 'https://edge-1.cdn.blu.com.co/live/bluradio.stream/playlist.m3u8', region: 'americas', lat: 4.71, lon: -74.07 },
  { id: 'radio-chile', name: 'Radio Cooperativa', country: 'Chile', flag: '🇨🇱', genre: 'News', streamUrl: 'https://unlimited1-cl.dps.live/cooperativa/aac/icecast.audio', region: 'americas', lat: -33.45, lon: -70.67 },

  // Europe
  { id: 'bbc-r1', name: 'BBC Radio 1', country: 'UK', flag: '🇬🇧', genre: 'Pop/Electronic', streamUrl: 'http://stream.live.vc.bbcmedia.co.uk/bbc_radio_one', region: 'europe', lat: 51.51, lon: -0.13 },
  { id: 'bbc-ws', name: 'BBC World Service', country: 'UK', flag: '🇬🇧', genre: 'News', streamUrl: 'http://stream.live.vc.bbcmedia.co.uk/bbc_world_service', region: 'europe', lat: 51.51, lon: -0.13 },
  { id: 'fip', name: 'FIP Radio', country: 'France', flag: '🇫🇷', genre: 'Eclectic', streamUrl: 'https://icecast.radiofrance.fr/fip-midfi.mp3', region: 'europe', lat: 48.86, lon: 2.35 },
  { id: 'france-inter', name: 'France Inter', country: 'France', flag: '🇫🇷', genre: 'Culture', streamUrl: 'https://icecast.radiofrance.fr/franceinter-midfi.mp3', region: 'europe', lat: 48.86, lon: 2.35 },
  { id: 'nts-1', name: 'NTS Radio 1', country: 'UK', flag: '🇬🇧', genre: 'Electronic/World', streamUrl: 'https://stream-relay-geo.ntslive.net/stream', region: 'europe', lat: 51.53, lon: -0.07 },
  { id: 'radio-swiss-jazz', name: 'Radio Swiss Jazz', country: 'Switzerland', flag: '🇨🇭', genre: 'Jazz', streamUrl: 'http://stream.srg-ssr.ch/m/rsj/mp3_128', region: 'europe', lat: 46.95, lon: 7.45 },
  { id: 'radio-paradise', name: 'Radio Paradise', country: 'Intl', flag: '🌍', genre: 'Eclectic', streamUrl: 'https://stream.radioparadise.com/aac-320', region: 'europe', lat: 50.85, lon: 4.35 },
  { id: 'radio-fm4', name: 'FM4', country: 'Austria', flag: '🇦🇹', genre: 'Alt/Electronic', streamUrl: 'https://orf-live.ors-shoutcast.at/fm4-q2a', region: 'europe', lat: 48.21, lon: 16.37 },
  { id: 'radio3-rai', name: 'Rai Radio 3', country: 'Italy', flag: '🇮🇹', genre: 'Culture/Classical', streamUrl: 'https://icestreaming.rai.it/3.mp3', region: 'europe', lat: 41.90, lon: 12.50 },
  { id: 'radio-sweden', name: 'Sveriges Radio P2', country: 'Sweden', flag: '🇸🇪', genre: 'Classical', streamUrl: 'https://sverigesradio.se/topsy/direkt/2196-hi-mp3', region: 'europe', lat: 59.33, lon: 18.07 },
  { id: 'radio-norge', name: 'NRK P3', country: 'Norway', flag: '🇳🇴', genre: 'Pop/Youth', streamUrl: 'https://lyd.nrk.no/nrk_radio_p3_mp3_h', region: 'europe', lat: 59.91, lon: 10.75 },
  { id: 'deutschlandfunk', name: 'Deutschlandfunk', country: 'Germany', flag: '🇩🇪', genre: 'News/Culture', streamUrl: 'https://st01.dlf.de/dlf/01/128/mp3/stream.mp3', region: 'europe', lat: 52.52, lon: 13.40 },
  { id: 'polskie-radio', name: 'Polskie Radio 1', country: 'Poland', flag: '🇵🇱', genre: 'News', streamUrl: 'https://stream.polskieradio.pl/pr1/pr1.sdp/playlist.m3u8', region: 'europe', lat: 52.23, lon: 21.01 },
  { id: 'radio-espana', name: 'RNE Radio Clásica', country: 'Spain', flag: '🇪🇸', genre: 'Classical', streamUrl: 'https://rtveradio-a.akamaihd.net/live/radioclasica.mp3', region: 'europe', lat: 40.42, lon: -3.70 },
  { id: 'radio-portugal', name: 'Antena 1', country: 'Portugal', flag: '🇵🇹', genre: 'Pop/News', streamUrl: 'https://streaming-live.rtp.pt/liveradio/antena180a/playlist.m3u8', region: 'europe', lat: 38.72, lon: -9.14 },
  { id: 'radio-romania', name: 'Radio Romania', country: 'Romania', flag: '🇷🇴', genre: 'Culture', streamUrl: 'http://radioromania.stream.laut.fm/radioromania', region: 'europe', lat: 44.43, lon: 26.10 },
  { id: 'radio-czech', name: 'Czech Radio Vltava', country: 'Czech Republic', flag: '🇨🇿', genre: 'Culture', streamUrl: 'https://rozhlas.stream/vltava_mp3_128.mp3', region: 'europe', lat: 50.08, lon: 14.42 },
  { id: 'radio-greece', name: 'ERA Kosmos', country: 'Greece', flag: '🇬🇷', genre: 'World Music', streamUrl: 'http://radiostreaming.ert.gr/ert-kosmos', region: 'europe', lat: 37.98, lon: 23.73 },
  { id: 'radio-ireland', name: 'RTÉ Radio 1', country: 'Ireland', flag: '🇮🇪', genre: 'News/Culture', streamUrl: 'https://stream.rte.ie/radio/rte_radio_1.mp3', region: 'europe', lat: 53.35, lon: -6.26 },
  { id: 'radio-finland', name: 'YLE Radio 1', country: 'Finland', flag: '🇫🇮', genre: 'Classical/Culture', streamUrl: 'https://yleradiolive.akamaized.net/hls/live/2027671/in-YleRadio1/master.m3u8', region: 'europe', lat: 60.17, lon: 24.94 },
  { id: 'radio-denmark', name: 'DR P8 Jazz', country: 'Denmark', flag: '🇩🇰', genre: 'Jazz', streamUrl: 'http://live-icy.dr.dk/A/A29H.mp3', region: 'europe', lat: 55.68, lon: 12.57 },

  // Asia
  { id: 'j-wave', name: 'J-WAVE 81.3', country: 'Japan', flag: '🇯🇵', genre: 'Pop/Urban', streamUrl: 'https://musicbird-hls.leanstream.co/musicbird/JCB069.stream/playlist.m3u8', region: 'asia', lat: 35.68, lon: 139.77 },
  { id: 'radio-korea', name: 'KBS Classic FM', country: 'South Korea', flag: '🇰🇷', genre: 'Classical', streamUrl: 'https://kong.kbs.co.kr/listen/aac/cfm_aac.m3u8', region: 'asia', lat: 37.57, lon: 126.98 },
  { id: 'all-india', name: 'All India Radio', country: 'India', flag: '🇮🇳', genre: 'Culture', streamUrl: 'https://air.pc.cdn.bitgravity.com/air/live/pbaudio001/playlist.m3u8', region: 'asia', lat: 28.61, lon: 77.21 },
  { id: 'radio-china', name: 'CRI English', country: 'China', flag: '🇨🇳', genre: 'News', streamUrl: 'http://sk.cri.cn/am846.m3u', region: 'asia', lat: 39.91, lon: 116.40 },
  { id: 'radio-thailand', name: 'FM 91.5 MHz', country: 'Thailand', flag: '🇹🇭', genre: 'Pop', streamUrl: 'https://stream.coolism.net/live/aac', region: 'asia', lat: 13.76, lon: 100.50 },
  { id: 'radio-vietnam', name: 'VOV World', country: 'Vietnam', flag: '🇻🇳', genre: 'News/Culture', streamUrl: 'https://stream.vov.vn/vov_world/chunklist.m3u8', region: 'asia', lat: 21.03, lon: 105.85 },
  { id: 'radio-philippines', name: 'DZRH News', country: 'Philippines', flag: '🇵🇭', genre: 'News', streamUrl: 'https://stream.zenolive.com/0qxr2m5q6yeuv', region: 'asia', lat: 14.60, lon: 120.98 },
  { id: 'radio-indonesia', name: 'RRI Pro 2', country: 'Indonesia', flag: '🇮🇩', genre: 'Pop', streamUrl: 'http://stream.rfrg.net:8000/rripro2', region: 'asia', lat: -6.21, lon: 106.85 },
  { id: 'radio-malaysia', name: 'BFM 89.9', country: 'Malaysia', flag: '🇲🇾', genre: 'Business/Talk', streamUrl: 'https://bfrm.leanstream.co/bfm899', region: 'asia', lat: 3.14, lon: 101.69 },
  { id: 'radio-singapore', name: 'Symphony 924', country: 'Singapore', flag: '🇸🇬', genre: 'Classical', streamUrl: 'https://mediacorp-radio-924.cdn.mediacorp.sg/924.m3u8', region: 'asia', lat: 1.35, lon: 103.82 },
  { id: 'radio-pakistan', name: 'Radio Pakistan', country: 'Pakistan', flag: '🇵🇰', genre: 'News/Culture', streamUrl: 'http://streaming.radio.gov.pk:8000/pbc-english', region: 'asia', lat: 33.69, lon: 73.04 },
  { id: 'radio-bangladesh', name: 'Bangladesh Betar', country: 'Bangladesh', flag: '🇧🇩', genre: 'Culture', streamUrl: 'http://betar.portal.gov.bd/sites/default/files/radio.mp3', region: 'asia', lat: 23.81, lon: 90.41 },
  { id: 'radio-mongolia', name: 'MNB Radio', country: 'Mongolia', flag: '🇲🇳', genre: 'News', streamUrl: 'http://stream.mn:8000/mnb1', region: 'asia', lat: 47.92, lon: 106.91 },

  // Middle East
  { id: 'radio-israel', name: 'Galei Zahal', country: 'Israel', flag: '🇮🇱', genre: 'Pop/News', streamUrl: 'https://glzwizzlv.bynetcdn.com/glglz_mp3', region: 'middle-east', lat: 32.07, lon: 34.78 },
  { id: 'radio-qatar', name: 'Qatar Radio', country: 'Qatar', flag: '🇶🇦', genre: 'Arabic', streamUrl: 'http://stream.media.gov.qa/radio', region: 'middle-east', lat: 25.29, lon: 51.53 },
  { id: 'radio-uae', name: 'Virgin Radio Dubai', country: 'UAE', flag: '🇦🇪', genre: 'Pop', streamUrl: 'https://radio.virginradiodubai.com/stream', region: 'middle-east', lat: 25.20, lon: 55.27 },
  { id: 'radio-turkey', name: 'TRT FM', country: 'Turkey', flag: '🇹🇷', genre: 'Pop/Turkish', streamUrl: 'https://tv-trtradyo1.medya.trt.com.tr/master_128.m3u8', region: 'middle-east', lat: 39.93, lon: 32.86 },
  { id: 'radio-iran', name: 'IRIB World Service', country: 'Iran', flag: '🇮🇷', genre: 'News', streamUrl: 'http://stream.irib.ir/ws', region: 'middle-east', lat: 35.70, lon: 51.42 },

  // Africa
  { id: 'radio-nigeria', name: 'Cool FM Lagos', country: 'Nigeria', flag: '🇳🇬', genre: 'Pop', streamUrl: 'https://stream.coolfm.ng/live', region: 'africa', lat: 6.52, lon: 3.38 },
  { id: 'radio-sa', name: 'SAfm', country: 'South Africa', flag: '🇿🇦', genre: 'News/Talk', streamUrl: 'https://stream.rfrg.net:8000/safm', region: 'africa', lat: -33.93, lon: 18.42 },
  { id: 'radio-kenya', name: 'Capital FM Kenya', country: 'Kenya', flag: '🇰🇪', genre: 'Pop', streamUrl: 'https://capitalfm.co.ke/stream', region: 'africa', lat: -1.29, lon: 36.82 },
  { id: 'radio-egypt', name: 'Nile FM', country: 'Egypt', flag: '🇪🇬', genre: 'Pop/Arabic', streamUrl: 'http://ice-the.musicradio.com/NileFM', region: 'africa', lat: 30.04, lon: 31.24 },
  { id: 'radio-ghana', name: 'Joy FM', country: 'Ghana', flag: '🇬🇭', genre: 'News/Music', streamUrl: 'https://stream.myjoyonline.com/joyfm', region: 'africa', lat: 5.60, lon: -0.19 },
  { id: 'radio-morocco', name: 'Hit Radio', country: 'Morocco', flag: '🇲🇦', genre: 'Pop', streamUrl: 'https://hitradio.ice.infomaniak.ch/hitradio-128.mp3', region: 'africa', lat: 33.97, lon: -6.85 },
  { id: 'radio-ethiopia', name: 'Fana FM', country: 'Ethiopia', flag: '🇪🇹', genre: 'News', streamUrl: 'http://fanabc.com/stream', region: 'africa', lat: 9.02, lon: 38.75 },
  { id: 'radio-tanzania', name: 'Radio Free Africa', country: 'Tanzania', flag: '🇹🇿', genre: 'News/Music', streamUrl: 'http://stream.rfa.co.tz/live', region: 'africa', lat: -6.79, lon: 39.28 },
  { id: 'radio-senegal', name: 'RFM Sénégal', country: 'Senegal', flag: '🇸🇳', genre: 'Music', streamUrl: 'https://stream.rfmsenegal.com/rfm', region: 'africa', lat: 14.69, lon: -17.44 },

  // Oceania
  { id: 'triple-j', name: 'triple j', country: 'Australia', flag: '🇦🇺', genre: 'Indie/Alt', streamUrl: 'http://live-radio01.mediahubaustralia.com/2TJW/mp3/', region: 'oceania', lat: -33.87, lon: 151.21 },
  { id: 'rnz-national', name: 'RNZ National', country: 'New Zealand', flag: '🇳🇿', genre: 'News/Culture', streamUrl: 'https://radionz.streamguys1.com/national', region: 'oceania', lat: -41.29, lon: 174.78 },
  { id: 'radio-fiji', name: 'Fiji One FM', country: 'Fiji', flag: '🇫🇯', genre: 'Pop', streamUrl: 'http://stream.fijivillage.com:8000/live', region: 'oceania', lat: -18.14, lon: 178.44 },
];
