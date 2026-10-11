// Fotografie Pexels abbinate ai temi. Il sito Pexels dichiara le immagini
// utilizzabili gratuitamente anche per progetti commerciali.
const photo = (id) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1200&h=520&fit=crop`;

export const illustrations = {
  base: photo(4020654),
  halloween: photo(5589854),
  natale: photo(5768967),
  autunno: photo(10821220),
  inverno: photo(5820105),
  primavera: photo(3851117),
  estate: photo(33829496),
  settembre: photo(29259140),
  capodanno: photo(5881729),
  epifania: photo(6211043),
  valentino: photo(36694454),
  carnevale: photo(16423674),
  pasqua: photo(20821500),
  ferragosto: photo(32531680),
  compleanno: photo(26546847),
  anniversario: photo(36747296),
};
