export interface Product {
  id: string
  name: string
  brand: string
  category: string
  ingredients: string[]
}

export const PRODUCTS: Product[] = [
  {
    id: 'prod-001',
    name: 'Advanced Snail 96 Mucin Power Essence',
    brand: 'COSRX',
    category: 'Essence',
    ingredients: [
      'Snail Secretion Filtrate', 'Betaine', 'Butylene Glycol', '1,2-Hexanediol',
      'Sodium Hyaluronate', 'Panthenol', 'Arginine', 'Allantoin', 'Ethyl Hexanediol',
      'Sodium Polyacrylate', 'Carbomer', 'Phenoxyethanol'
    ]
  },
  {
    id: 'prod-002',
    name: 'Skin Perfecting 2% BHA Liquid Exfoliant',
    brand: "Paula's Choice",
    category: 'Exfoliator',
    ingredients: [
      'Water', 'Methylpropanediol', 'Butylene Glycol', 'Salicylic Acid', 'Polysorbate 20',
      'Camellia Oleifera (Green Tea) Leaf Extract', 'Sodium Hydroxide', 'Tetrasodium EDTA'
    ]
  },
  {
    id: 'prod-003',
    name: 'Hydrating Facial Cleanser',
    brand: 'CeraVe',
    category: 'Cleanser',
    ingredients: [
      'Purified Water', 'Glycerin', 'Behentrimonium Methosulfate', 'Cetearyl Alcohol',
      'Ceramide 3', 'Ceramide 6-II', 'Ceramide 1', 'Hyaluronic Acid', 'Cholesterol',
      'Polyoxyl 40 Stearate', 'Glyceryl Monostearate', 'Stearyl Alcohol', 'Polysorbate 20',
      'Potassium Phosphate', 'Dipotassium Phosphate', 'Sodium Lauroyl Lactylate',
      'Cetyl Alcohol', 'Disodium EDTA', 'Phytosphingosine', 'Methylparaben', 'Propylparaben',
      'Carbomer', 'Xanthan Gum'
    ]
  },
  {
    id: 'prod-004',
    name: 'Toleriane Double Repair Face Moisturizer',
    brand: 'La Roche-Posay',
    category: 'Moisturizer',
    ingredients: [
      'Aqua/Water', 'Glycerin', 'Dimethicone', 'Hydrogenated Polyisobutene',
      'Niacinamide', 'Ammonium Polyacryloyldimethyl Taurate', 'Myristyl Myristate',
      'Stearic Acid', 'Ceramide NP', 'Potassium Cetyl Phosphate', 'Isobutane',
      'Glyceryl Stearate SE', 'Sodium Hydroxide', 'Myristic Acid', 'Palmitic Acid',
      'Capryloyl Glycine', 'Caprylyl Glycol', 'Xanthan Gum', 'T-Butyl Alcohol',
      'Cetyl Alcohol', 'Tocopherol'
    ]
  },
  {
    id: 'prod-005',
    name: 'C E Ferulic',
    brand: 'SkinCeuticals',
    category: 'Serum',
    ingredients: [
      'Water', 'Ethoxydiglycol', 'Ascorbic Acid (Vitamin C)', 'Glycerin', 'Propylene Glycol',
      'Laureth-23', 'Phenoxyethanol', 'Tocopherol (Vitamin E)', 'Triethanolamine',
      'Ferulic Acid', 'Panthenol', 'Sodium Hyaluronate'
    ]
  },
  {
    id: 'prod-006',
    name: 'Daily Facial Cleanser',
    brand: 'Cetaphil',
    category: 'Cleanser',
    ingredients: [
      'Water', 'Glycerin', 'Cocamidopropyl Betaine', 'Disodium Laureth Sulfosuccinate',
      'Sodium Cocoamphoacetate', 'Panthenol', 'Niacinamide', 'Pantolactone',
      'Acrylates/C10-30 Alkyl Acrylate Crosspolymer', 'Sodium Benzoate', 'Masking Fragrance',
      'Sodium Chloride', 'Citric Acid'
    ]
  },
  {
    id: 'prod-007',
    name: 'Niacinamide 10% + Zinc 1%',
    brand: 'The Ordinary',
    category: 'Serum',
    ingredients: [
      'Aqua (Water)', 'Niacinamide', 'Pentylene Glycol', 'Zinc PCA',
      'Dimethyl Isosorbide', 'Tamarindus Indica Seed Gum', 'Xanthan gum',
      'Isoceteth-20', 'Ethoxydiglycol', 'Phenoxyethanol', 'Chlorphenesin'
    ]
  },
  {
    id: 'prod-008',
    name: 'Hyaluronic Acid 2% + B5',
    brand: 'The Ordinary',
    category: 'Serum',
    ingredients: [
      'Aqua (Water)', 'Sodium Hyaluronate', 'Pentylene Glycol', 'Propanediol',
      'Sodium Hyaluronate Crosspolymer', 'Panthenol', 'Ahnfeltia Concinna Extract',
      'Glycerin', 'Trisodium Ethylenediamine Disuccinate', 'Citric Acid', 'Isoceteth-20',
      'Ethoxydiglycol', 'Ethylhexylglycerin', 'Hexylene Glycol', '1,2-Hexanediol',
      'Phenoxyethanol', 'Caprylyl Glycol'
    ]
  },
  {
    id: 'prod-009',
    name: 'Anthelios Melt-in Milk Sunscreen SPF 60',
    brand: 'La Roche-Posay',
    category: 'Sunscreen',
    ingredients: [
      'Avobenzone 3%', 'Homosalate 10%', 'Octisalate 5%', 'Octocrylene 7%',
      'Water', 'Styrene/Acrylates Copolymer', 'Dimethicone', 'Polymethylsilsesquioxane',
      'Butyloctyl Salicylate', 'Glycerin', 'Alcohol Denat.', 'Poly C10-30 Alkyl Acrylate',
      'Caprylyl Methicone', 'Trisiloxane', 'Acrylates/C10-30 Alkyl Acrylate Crosspolymer',
      'Diethylhexyl Syringylidenemalonate', 'PEG-8 Laurate', 'Potassium Cetyl Phosphate',
      'Phenoxyethanol', 'Sodium Hydroxide'
    ]
  },
  {
    id: 'prod-010',
    name: 'Retinol 0.5% in Squalane',
    brand: 'The Ordinary',
    category: 'Treatment',
    ingredients: [
      'Squalane', 'Caprylic/Capric Triglyceride', 'Retinol', 'Solanum Lycopersicum (Tomato) Fruit Extract',
      'Simmondsia Chinensis (Jojoba) Seed Oil', 'BHT'
    ]
  },
  {
    id: 'prod-011',
    name: 'Cicalfate+ Restorative Protective Cream',
    brand: 'Eau Thermale Avène',
    category: 'Moisturizer',
    ingredients: [
      'Avene Thermal Spring Water', 'Caprylic/Capric Triglyceride', 'Mineral Oil',
      'Glycerin', 'Hydrogenated Vegetable Oil', 'Zinc Oxide', 'Propylene Glycol',
      'Polyglyceryl-2 Sesquiisostearate', 'PEG-22/Dodecyl Glycol Copolymer',
      'Aluminum Sucrose Octasulfate', 'Aluminum Stearate', 'Beeswax',
      'Copper Sulfate', 'Magnesium Stearate', 'Magnesium Sulfate', 'Microcrystalline Wax',
      'Zinc Sulfate'
    ]
  },
  {
    id: 'prod-012',
    name: 'Clear Pore Normalizing Cleanser',
    brand: "Paula's Choice",
    category: 'Cleanser',
    ingredients: [
      'Salicylic Acid 0.5%', 'Water', 'Sodium Lauroyl Sarcosinate',
      'Acrylates/Steareth-20 Methacrylate Copolymer', 'Glycerin',
      'PEG-200 Hydrogenated Glyceryl Palmate', 'Sodium Laureth Sulfate',
      'Arginine', 'Butylene Glycol', 'PEG-7 Glyceryl Cocoate', 'Panthenol',
      'Disodium EDTA', 'Citric Acid', 'PEG-60 Hydrogenated Castor Oil',
      'Sodium Citrate', 'Phenoxyethanol', 'Caprylyl Glycol', 'Chlorphenesin'
    ]
  },
  {
    id: 'prod-013',
    name: 'Unseen Sunscreen SPF 40',
    brand: 'Supergoop!',
    category: 'Sunscreen',
    ingredients: [
      'Avobenzone 3%', 'Homosalate 8%', 'Octisalate 5%', 'Octocrylene 4%',
      'Isododecane', 'Dimethicone Crosspolymer', 'Dimethicone/Bis-Isobutyl PPG-20 Crosspolymer',
      'Polymethylsilsesquioxane', 'Isohexadecane', 'Dicaprylyl Carbonate',
      'Meadowfoam Estolide', 'Caprylic/Capric Triglyceride', 'Polyester-7',
      'Neopentyl Glycol Diheptanoate', 'Lithothamnion Calcareum Extract',
      'Caprylyl Glycol', 'Butyrospermum Parkii (Shea) Butter', 'Jojoba Esters',
      'Mannitol', 'Boswellia Serrata Resin Extract', 'Lecithin', 'Microcrystalline Cellulose',
      'Diatomaceous Earth', 'Zinc Sulfate', 'Silica', 'Tocopherol'
    ]
  },
  {
    id: 'prod-014',
    name: 'Squalane + Vitamin C Rose Oil',
    brand: 'Biossance',
    category: 'Face Oil',
    ingredients: [
      'Squalane', 'Tetrahexyldecyl Ascorbate', 'Caprylic/Capric Triglyceride',
      'Chios Mastiha Resin Extract', 'Rosa Damascena Flower Extract',
      'Geraniol', 'Citronellol', 'Farnesol', 'Linalool'
    ]
  },
  {
    id: 'prod-015',
    name: 'Watermelon Glow PHA + BHA Pore-Tight Toner',
    brand: 'Glow Recipe',
    category: 'Toner',
    ingredients: [
      'Opuntia Ficus-Indica (Cactus) Extract', 'Citrullus Lanatus (Watermelon) Fruit Extract',
      'Glycerin', 'Hyaluronic Acid', 'Gluconolactone', 'Sodium Polyglutamate', 
      'Betaine Salicylate', 'Salix Alba (Willow) Bark Extract', 'Melaleuca Alternifolia (Tea Tree) Extract',
      'Hibiscus Sabdariffa Flower Extract', 'Lactobacillus/Watermelon Fruit Ferment Extract',
      'Cucumis Sativus (Cucumber) Fruit Extract', 'Saccharum Officinarum (Sugarcane) Extract',
      'Glycyrrhiza Glabra (Licorice) Root Extract', 'Scutellaria Baicalensis Root Extract',
      'Paeonia Suffruticosa Root Extract', 'Brassica Oleracea Capitata (Cabbage) Leaf Extract',
      'Ipomoea Batatas Root Extract', 'Sorbitan Oleate', 'Levulinic Acid', 'Sodium Levulinate',
      'Fragrance/Parfum'
    ]
  }
]
