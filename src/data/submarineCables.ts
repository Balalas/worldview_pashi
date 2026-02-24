export interface SubmarineCable {
  name: string;
  color: string;
  coordinates: [number, number][]; // [lat, lon]
  capacity: string;
  length: string;
  year: number;
}

export const SUBMARINE_CABLES: SubmarineCable[] = [
  // Transatlantic
  { name: 'TAT-14', color: '#00d4ff', coordinates: [[40.5,-74],[50,- 30],[51,-10],[51.5,-1],[53.5,7],[55,10]], capacity: '3.2 Tbps', length: '15,428 km', year: 2001 },
  { name: 'MAREA', color: '#00ff88', coordinates: [[37,-76],[37,-50],[37,-25],[37,-10],[43,-8.5]], capacity: '200 Tbps', length: '6,605 km', year: 2018 },
  { name: 'Dunant', color: '#ff6b35', coordinates: [[39,-74],[40,-50],[42,-30],[44,-10],[46,-1.5]], capacity: '250 Tbps', length: '6,600 km', year: 2020 },
  { name: 'AEConnect-1', color: '#aa44ff', coordinates: [[40.8,-73.5],[48,-35],[52,-10]], capacity: '52 Tbps', length: '5,536 km', year: 2016 },
  { name: 'Hibernia Express', color: '#00ffdd', coordinates: [[41,-72],[47,-35],[52,-10],[53.5,-6]], capacity: '53 Tbps', length: '4,600 km', year: 2015 },
  { name: 'Apollo', color: '#ffb000', coordinates: [[40,-74],[43,-45],[47,-20],[50,-5],[51,1]], capacity: '72 Tbps', length: '12,870 km', year: 2003 },
  // Europe-Asia (SEA-ME-WE)
  { name: 'SEA-ME-WE 5', color: '#ff0088', coordinates: [[43,5],[35,12],[31.2,32.3],[27,34],[21,40],[12.5,43],[8,52],[7,72],[6,80],[2,104],[1.3,103.8]], capacity: '24 Tbps', length: '20,000 km', year: 2016 },
  { name: 'SEA-ME-WE 3', color: '#ff4488', coordinates: [[51,1],[43,5],[35,12],[31,32],[26,35],[21,40],[13,43],[10,55],[8,73],[6,80],[2,104],[1.3,103.8],[-8,115],[-34,151]], capacity: '0.96 Tbps', length: '39,000 km', year: 1999 },
  { name: 'FLAG Europe-Asia', color: '#ffdd00', coordinates: [[51,1],[43,5],[36,12],[31,32],[26,35],[21,40],[13,43],[10,56],[19,72],[22,91],[13.7,100.5],[1.3,103.8],[22,114],[35,139]], capacity: '10 Tbps', length: '28,000 km', year: 1997 },
  // Trans-Pacific
  { name: 'Trans-Pacific Express', color: '#00ff88', coordinates: [[45,-124],[40,-160],[35,-180],[30,170],[25,150],[23,121],[22,114]], capacity: '5.12 Tbps', length: '17,700 km', year: 2008 },
  { name: 'Pacific Crossing-1', color: '#00d4ff', coordinates: [[46,-124],[42,-155],[38,-180],[35,170],[35,140]], capacity: '3.84 Tbps', length: '21,000 km', year: 1999 },
  { name: 'Unity (EAC-C2C)', color: '#aa44ff', coordinates: [[34,-120],[30,-155],[28,-180],[28,170],[30,150],[35,140]], capacity: '7.68 Tbps', length: '9,620 km', year: 2010 },
  { name: 'PLCN', color: '#ffb000', coordinates: [[34,-118],[28,-150],[22,-180],[18,165],[15,145],[15,121],[22,114]], capacity: '144 Tbps', length: '12,971 km', year: 2020 },
  // Africa
  { name: 'SAT-3/WASC', color: '#ff6b35', coordinates: [[39,-9],[33,-10],[28,-14],[15,-18],[6,-2],[4,5],[-6,12],[-23,13],[-34,18]], capacity: '0.34 Tbps', length: '14,350 km', year: 2002 },
  { name: '2Africa', color: '#ff0044', coordinates: [[51,1],[43,-9],[33,-8],[28,-13],[14,-17],[5,-2],[4,5],[0,9],[-6,12],[-15,12],[-24,14],[-34,18],[-26,33],[-12,44],[-6,39],[2,45],[11,43],[15,42],[21,39],[26,34],[31,32],[35,12],[43,5],[51,1]], capacity: '180 Tbps', length: '45,000 km', year: 2024 },
  { name: 'EASSy', color: '#00ffdd', coordinates: [[-34,18],[-26,33],[-15,40],[-6,39],[-1,41],[4,43],[11,43],[12,45]], capacity: '10 Tbps', length: '10,000 km', year: 2010 },
  // South America
  { name: 'EllaLink', color: '#aa44ff', coordinates: [[39,-9],[33,-12],[28,-15],[15,-20],[5,-30],[-3,-38]], capacity: '100 Tbps', length: '6,200 km', year: 2021 },
  { name: 'BRUSA', color: '#00ff88', coordinates: [[37,-76],[30,-60],[20,-45],[5,-35],[-3,-38],[-23,-43]], capacity: '70 Tbps', length: '10,556 km', year: 2018 },
  // Asia-Pacific
  { name: 'Southern Cross NEXT', color: '#ffdd00', coordinates: [[-34,151],[-38,175],[-41,175],[-36,-178],[-20,-160],[-10,-150],[5,-140],[20,-130],[34,-120]], capacity: '72 Tbps', length: '13,700 km', year: 2022 },
  { name: 'INDIGO', color: '#ff0088', coordinates: [[1.3,103.8],[-8,115],[-20,120],[-32,130],[-35,139],[-38,145]], capacity: '36 Tbps', length: '9,000 km', year: 2019 },
  // Middle East
  { name: 'PEACE Cable', color: '#00d4ff', coordinates: [[43,5],[35,12],[31,32],[26,34],[21,39],[13,45],[10,65],[25,67]], capacity: '96 Tbps', length: '15,000 km', year: 2022 },
  { name: 'AAE-1', color: '#ffb000', coordinates: [[43,5],[35,12],[31,32],[22,39],[13,45],[8,52],[7,73],[6,80],[2,104],[1.3,103.8],[10,107],[22,114]], capacity: '40 Tbps', length: '25,000 km', year: 2017 },
];
