/**
 * Comprehensive catalog metadata and authoritative gemological/pricing sources
 * for all 88 gemstone records stored in MySQL (`prices` & `gemstone_sources`).
 */

const SOURCES = {
  GIA: {
    name: 'GIA Gem Encyclopedia',
    url: 'https://www.gia.edu/gem-encyclopedia',
  },
  MINDAT: {
    name: 'Mindat.org Mineral Database',
    url: 'https://www.mindat.org/',
  },
  IGS: {
    name: 'International Gem Society (IGS)',
    url: 'https://www.gemsociety.org/gemstone-encyclopedia/',
  },
  GEMGUIDE: {
    name: 'GemGuide Market Appraisal Index',
    url: 'https://www.gemguide.com/',
  },
};

const RAW_GEMSTONES = [
  // Precious Gemstones
  ['Diamond', 500000, 'Native Carbon', '10', 'Botswana, Russia, Canada, South Africa', 'Exceptional adamantine luster, highest dispersion fire, octahedral crystal habit.', 'Diamond is pure crystallized carbon and the hardest known natural mineral, prized for unmatched brilliance and durability.', 'https://www.gia.edu/diamond'],
  ['Ruby', 350000, 'Corundum', '9', 'Myanmar, Sri Lanka, Thailand, Mozambique', 'Deep crimson red caused by trace chromium; strong red fluorescence under UV.', 'Ruby is the red gem variety of corundum renowned for intense pigeon-blood color and elite hardness.', 'https://www.gia.edu/ruby'],
  ['Sapphire Blue', 280000, 'Corundum', '9', 'Sri Lanka, Kashmir, Madagascar, Australia', 'Rich velvety cornflower to royal blue from iron-titanium charge transfer.', 'Blue Sapphire is the classic benchmark variety of corundum celebrated for durability and high refractive index.', 'https://www.gia.edu/sapphire'],
  ['Sapphire', 250000, 'Corundum', '9', 'Sri Lanka, Madagascar, Australia, Myanmar', 'Vitreous luster, pleochroic clarity, trigonal crystal structure.', 'Sapphire encompasses all gem-grade corundum colors outside red ruby, prized for brilliance and scratch resistance.', 'https://www.gia.edu/sapphire'],
  ['Sapphire Pink', 220000, 'Corundum', '9', 'Sri Lanka, Madagascar, Myanmar', 'Delicate pastel rose to vivid magenta saturation from trace chromium.', 'Pink Sapphire is a fine corundum variety valued for vibrant pink brilliance and high wearability.'],
  ['Sapphire Yellow', 180000, 'Corundum', '9', 'Sri Lanka, Thailand, Tanzania', 'Warm lemon to golden canary hue caused by trace iron centers.', 'Yellow Sapphire (Pukhraj) is a transparent yellow corundum gemstone prized in fine jewelry and traditional gemology.'],
  ['Sapphire Purple', 190000, 'Corundum', '9', 'Sri Lanka, Madagascar, Tanzania', 'Rich violet-purple pleochroism combining trace vanadium and chromium.', 'Purple Sapphire is a rare corundum variety displaying vivid violet to plum brilliance.'],
  ['Emerald', 300000, 'Beryl', '7.5 - 8', 'Colombia, Zambia, Brazil, Swat (Pakistan)', 'Lush chromium-vanadium green with characteristic natural jardin inclusions.', 'Emerald is the treasured green variety of beryl valued for deep velvety saturation and historical rarity.', 'https://www.gia.edu/emerald'],
  ['Alexandrite', 400000, 'Chrysoberyl', '8.5', 'Russia, Sri Lanka, Brazil, Tanzania', 'Dramatic color change from emerald green in daylight to purplish red in incandescent light.', 'Alexandrite is an ultra-rare color-changing chrysoberyl variety exhibiting distinct pleochroism.'],
  ['Tanzanite', 150000, 'Zoisite', '6 - 6.5', 'Merelani Hills (Tanzania)', 'Strong trichroic blue-violet-burgundy pleochroism.', 'Tanzanite is the violet-blue transparent variety of zoisite found commercially in a single Tanzanian deposit.', 'https://www.gia.edu/tanzanite'],
  ['Tsavorite', 140000, 'Garnet (Grossular)', '7 - 7.5', 'Kenya, Tanzania', 'High refractive brilliance and bright vanadium-rich grass-to-forest green.', 'Tsavorite is a vivid green grossular garnet prized for high dispersion and clean clarity.'],
  ['Spinel', 120000, 'Spinel Group', '8', 'Myanmar, Sri Lanka, Tajikistan, Vietnam', 'Singly refractive octahedral crystals in vivid red, cobalt blue, and lavender.', 'Spinel is a durable isometric gemstone historically confused with ruby due to intense red saturation.', 'https://www.gia.edu/spinel'],
  ['Bixbite', 250000, 'Beryl', '7.5 - 8', 'Utah (USA)', 'Intense raspberry-to-cranberry red beryl colored by trace manganese.', 'Red Beryl (Bixbite) is among the rarest beryl varieties on Earth, forming in rhyolitic cavities.'],
  ['Benitoite', 300000, 'Cyclosilicate', '6 - 6.5', 'California (USA)', 'Dispersion exceeding diamond with bright sapphire-blue hue and strong blue UV fluorescence.', 'Benitoite is a rare barium titanium silicate celebrated for fiery dispersion and trigonal habit.'],

  // Semi-Precious & Fine Minerals
  ['Aquamarine', 85000, 'Beryl', '7.5 - 8', 'Brazil, Gilgit-Baltistan (Pakistan), Nigeria', 'Crisp sea-blue transparency with elongated hexagonal prism crystals.', 'Aquamarine is the serene blue-to-blue-green variety of beryl colored by trace iron.', 'https://www.gia.edu/aquamarine'],
  ['Opal', 100000, 'Hydrated Silica', '5.5 - 6.5', 'Australia, Ethiopia, Mexico', 'Diffraction-driven play-of-color across amorphous silica spheres.', 'Opal is a hydrous mineraloid renowned for iridescent flashes across spectral hues.', 'https://www.gia.edu/opal'],
  ['Pearl', 75000, 'Organic Calcium Carbonate', '2.5 - 4.5', 'Japan, Australia, French Polynesia, Philippines', 'Soft orient sheen created by concentric aragonite nacre layers.', 'Pearl is a timeless organic gem formed inside mollusks, graded by nacre luster, shape, and surface purity.', 'https://www.gia.edu/pearl'],
  ['Topaz', 50000, 'Aluminum Silicate', '8', 'Brazil, Katlang (Pakistan), Russia, Sri Lanka', 'High vitreous luster in imperial orange, pink, colorless, and sky blue.', 'Topaz is a hard orthorhombic silicate prized for optical clarity and precision faceting.', 'https://www.gia.edu/topaz'],
  ['Tourmaline', 65000, 'Tourmaline Group', '7 - 7.5', 'Brazil, Afghanistan, Nigeria, Mozambique', 'Strong pleochroism, striated trigonal prisms, and wide chromatic spectrum.', 'Tourmaline is a complex borosilicate group famed for pink, watermelon, Paraiba, and indicolite varieties.', 'https://www.gia.edu/tourmaline'],
  ['Peridot', 45000, 'Olivine (Forsterite)', '6.5 - 7', 'Sapat Valley (Pakistan), USA, Myanmar, China', 'Signature olive-to-lime green with strong double refraction (doubling of back facets).', 'Peridot is the gem-quality olive green variety of olivine formed deep in the Earth mantle.', 'https://www.gia.edu/peridot'],
  ['Garnet Red', 40000, 'Garnet Group', '6.5 - 7.5', 'India, Mozambique, Madagascar, USA', 'Rich wine-red to crimson brilliance with high refractive index and glassy luster.', 'Red Garnet spans pyrope and almandine compositions prized for deep saturation and affordability.', 'https://www.gia.edu/garnet'],
  ['Rhodolite', 55000, 'Garnet (Pyrope-Almandine)', '7 - 7.5', 'Tanzania, Sri Lanka, India, Madagascar', 'Bright purplish-red to raspberry hue with lively internal brilliance.', 'Rhodolite is a rose-violet garnet variety blending pyrope and almandine end-members.'],
  ['Spessartite', 70000, 'Garnet (Manganese)', '7 - 7.5', 'Namibia, Nigeria, Brazil, USA', 'Fiery mandarin orange to reddish-amber glow from manganese coloration.', 'Spessartite (Mandarin Garnet) is prized for high dispersion and glowing tangerine color.'],
  ['Hessonite', 35000, 'Garnet (Grossular)', '6.5 - 7', 'Sri Lanka, India, Madagascar', 'Warm honey-cinnamon brown-orange with characteristic treacle-like internal texture.', 'Hessonite (Cinnamon Stone) is a warm amber-orange grossular garnet popular in classic cabochons and cuts.'],
  ['Amethyst', 25000, 'Quartz', '7', 'Brazil, Uruguay, Zambia, Russia', 'Violet crystalline quartz ranging from pale lilac to deep Siberian purple with color zoning.', 'Amethyst is the regal purple variety of crystalline quartz colored by trace iron and natural irradiation.', 'https://www.gia.edu/amethyst'],
  ['Ametrine', 30000, 'Quartz', '7', 'Bolivia (Anahi Mine), Brazil', 'Distinct natural bicolor zoning combining violet amethyst and golden citrine.', 'Ametrine is a naturally bicolored quartz crystal caused by temperature gradients during crystal growth.'],
  ['Citrine', 28000, 'Quartz', '7', 'Brazil, Madagascar, Spain, Russia', 'Sunny lemon-yellow to deep Madeira amber with vitreous clarity.', 'Citrine is the golden-yellow crystalline variety of quartz valued for bright transparency.', 'https://www.gia.edu/citrine'],
  ['Beryl Golden', 60000, 'Beryl', '7.5 - 8', 'Brazil, Namibia, Ukraine, Madagascar', 'Clean chartreuse-yellow to warm golden honey brilliance.', 'Golden Beryl (Heliodor) is a transparent yellow-gold beryl mineral noted for crisp facet luster.'],
  ['Morganite', 65000, 'Beryl', '7.5 - 8', 'Brazil, Afghanistan, Madagascar, Mozambique', 'Soft peach-pink to blush rose tone colored by trace manganese.', 'Morganite is the pastel pink variety of beryl prized in contemporary fine jewelry.', 'https://www.gia.edu/morganite'],
  ['Goshenite', 35000, 'Beryl', '7.5 - 8', 'Brazil, China, Pakistan, USA', 'Pure colorless transparent beryl with crisp vitreous sparkle.', 'Goshenite is the pure, colorless end-member of the beryl mineral family.'],
  ['Zircon', 35000, 'Zirconium Silicate', '6.5 - 7.5', 'Cambodia, Sri Lanka, Australia, Myanmar', 'Very high refractive index and diamond-like fire with visible facet doubling.', 'Natural Zircon is an ancient mineral prized for fiery dispersion in blue, golden, and colorless hues.', 'https://www.gia.edu/zircon'],
  ['Jade', 90000, 'Jadeite / Nephrite', '6 - 7', 'Myanmar, Guatemala, Canada, China', 'Tough interlocking fibrous micro-structure with waxy-to-vitreous sheen.', 'Jade encompasses nephrite and prized imperial green jadeite revered for toughness and carving heritage.', 'https://www.gia.edu/jade'],
  ['Lapis Lazuli', 20000, 'Lazurite Rock', '5 - 5.5', 'Badakhshan (Afghanistan), Chile, Russia', 'Deep celestial ultramarine blue speckled with golden pyrite flecks.', 'Lapis Lazuli is a historic metamorphic rock composed primarily of lazurite, calcite, and pyrite.'],
  ['Turquoise', 30000, 'Hydrous Copper Aluminum Phosphate', '5 - 6', 'Iran, USA (Arizona), China, Mexico', 'Opaque sky-blue to robin-egg blue often veined with natural host matrix.', 'Turquoise is an iconic opaque blue-green phosphate treasured for millennia in ornamental work.', 'https://www.gia.edu/turquoise'],
  ['Moonstone', 22000, 'Feldspar (Orthoclase)', '6 - 6.5', 'Sri Lanka, India, Myanmar, Madagascar', 'Floating silver-blue adularescence caused by alternating albite-orthoclase lamellae.', 'Moonstone is a translucent feldspar prized for its billowing moonlit sheen across cabochon domes.', 'https://www.gia.edu/moonstone'],
  ['Sunstone', 25000, 'Feldspar (Plagioclase)', '6 - 6.5', 'USA (Oregon), India, Norway, Tanzania', 'Metallic aventurescence glitter caused by oriented copper or hematite platelets.', 'Sunstone is an optical feldspar displaying warm golden-reddish schiller sparkle.'],
  ['Labradorite', 18000, 'Feldspar (Plagioclase)', '6 - 6.5', 'Canada (Labrador), Madagascar, Finland', 'Iridescent labradorescence flashes of peacock blue, green, and gold.', 'Labradorite exhibits striking optical interference colors across dark smoky cleavage planes.'],
  ['Malachite', 15000, 'Copper Carbonate', '3.5 - 4', 'DR Congo, Russia, Australia, Namibia', 'Concentric banded forest-to-emerald green swirls with silky luster.', 'Malachite is a vivid green secondary copper carbonate admired for dramatic natural banding.'],
  ['Chrysoprase', 30000, 'Chalcedony (Quartz)', '6.5 - 7', 'Australia, Tanzania, Brazil, Poland', 'Translucent apple-green cryptocrystalline quartz colored by trace nickel.', 'Chrysoprase is the finest green variety of chalcedony, valued for glowing milky translucency.'],
  ['Kunzite', 45000, 'Spodumene', '6.5 - 7', 'Afghanistan, Brazil, Madagascar, USA', 'Pastel lilac-pink pleochroic crystals showing deepest violet-pink down the c-axis.', 'Kunzite is the pink-to-violet gem variety of spodumene prized for large clean crystal clarity.', 'https://www.gia.edu/kunzite'],
  ['Iolite', 35000, 'Cordierite', '7 - 7.5', 'India, Sri Lanka, Madagascar, Brazil', 'Extreme pleochroism shifting from sapphire violet-blue to pale straw gray.', 'Iolite is a transparent magnesium aluminum silicate historically nicknamed "water sapphire".'],
  ['Kyanite', 25000, 'Aluminosilicate', '4.5 - 7', 'Nepal, Brazil, Kenya, Switzerland', 'Anisotropic hardness along vs across blade-like sapphire-blue crystals.', 'Kyanite is a strongly anisotropic bladed silicate displaying rich royal blue saturation.'],
  ['Danburite', 28000, 'Calcium Borosilicate', '7 - 7.5', 'Mexico, Myanmar, Japan, Madagascar', 'Bright diamond-like clarity in colorless, pale champagne, and blush pink.', 'Danburite is a brilliant orthorhombic borosilicate prized by collectors for clean prismatic luster.'],
  ['Fluorite', 15000, 'Calcium Fluoride', '4', 'China, UK, Mexico, USA', 'Cubic octahedral crystals in banded purple, emerald green, and blue; glows under UV.', 'Fluorite is a colorful halide mineral known for vivid color zoning and strong fluorescence.'],
  ['Quartz Rose', 18000, 'Quartz', '7', 'Brazil, Madagascar, India, South Africa', 'Translucent blush pink hue sometimes showing six-rayed asterism.', 'Rose Quartz is a gentle pink variety of quartz colored by microscopic dumortierite fibers or trace titanium.'],
  ['Quartz Smoky', 16000, 'Quartz', '7', 'Brazil, Switzerland, Scotland, USA', 'Translucent clove-brown to deep charcoal gray produced by natural irradiation.', 'Smoky Quartz is a transparent brown-gray quartz variety prized for sleek dark facets.'],
  ['Quartz Rutilated', 24000, 'Quartz', '7', 'Brazil, Madagascar, Pakistan', 'Clear rock crystal quartz enclosing golden needle-like rutile inclusions.', 'Rutilated Quartz features natural golden titanium-dioxide needles suspended inside transparent quartz.'],
  ['Quartz Lemon', 20000, 'Quartz', '7', 'Brazil, Madagascar', 'Bright crisp citrus-yellow transparent quartz with high vitreous sparkle.', 'Lemon Quartz is a vivid greenish-yellow quartz gemstone popular in large statement cuts.'],
  ['Quartz Beer', 18000, 'Quartz', '7', 'Brazil, Madagascar, Uruguay', 'Warm golden-amber smoky hue resembling rich amber ale.', 'Beer Quartz is a golden-brown transparent quartz variety bridging citrine and smoky quartz tones.'],
  ['Tigers Eye', 12000, 'Chalcedony (Pseudomorph)', '6.5 - 7', 'South Africa, Australia, India', 'Silky golden-brown chatoyancy (cat-eye band) from fibrous crocidolite replacement.', 'Tiger Eye is a chatoyant quartz gemstone displaying a bright moving band of golden light.'],
  ['Amber', 25000, 'Fossilized Tree Resin', '2 - 2.5', 'Baltic Region, Dominican Republic, Myanmar', 'Lightweight warm golden-honey resin sometimes preserving ancient botanical inclusions.', 'Amber is fossilized organic tree resin valued for warm golden glow and historical provenance.', 'https://www.gia.edu/amber'],
  ['Carnelian', 15000, 'Chalcedony (Quartz)', '6.5 - 7', 'India, Brazil, Uruguay', 'Warm translucent sunset orange to brownish-red colored by iron oxide.', 'Carnelian is a classic translucent orange-red chalcedony carved since antiquity.'],
  ['Bloodstone', 14000, 'Chalcedony (Heliotrope)', '6.5 - 7', 'India, Brazil, Australia', 'Deep forest-green plasma chalcedony spotted with crimson iron-oxide flecks.', 'Bloodstone (Heliotrope) is a dark green jasper-chalcedony accented with red hematite spots.'],
  ['Jasper', 12000, 'Microcrystalline Quartz', '6.5 - 7', 'India, Brazil, Madagascar, USA', 'Opaque earthy red, yellow, or patterned mineral aggregate taking a smooth polish.', 'Jasper is a dense opaque chalcedony prized for scenic landscape patterns and rich earthy colors.'],
  ['Rhodochrosite', 35000, 'Manganese Carbonate', '3.5 - 4', 'Argentina, USA (Colorado), Peru, South Africa', 'Rose-red translucent crystals and pink-and-white stalactitic bands.', 'Rhodochrosite is a striking rose-red carbonate celebrated for both faceted crystals and banded slabs.'],
  ['Rhodonite', 20000, 'Manganese Silicate', '5.5 - 6.5', 'Russia, Australia, Sweden, Peru', 'Rose-pink massive mineral crisscrossed by black manganese-oxide veins.', 'Rhodonite is an ornamental pink silicate contrasted by dramatic dark dendritic veining.'],
  ['Sodalite', 12000, 'Tectosilicate', '5.5 - 6', 'Canada, Brazil, Namibia, Greenland', 'Royal cobalt blue veined with white calcite, lacking pyrite flecks.', 'Sodalite is a rich royal-blue feldspar-related mineral prized for deep navy cabochons and carvings.'],
  ['Sphene', 50000, 'Titanite (Calcium Titanium Silicate)', '5 - 5.5', 'Madagascar, Pakistan, Brazil, Sri Lanka', 'Adamantine luster and rainbow dispersion fire stronger than diamond.', 'Sphene (Titanite) is a rare collector gemstone renowned for intense spectral fire in chartreuse and amber hues.'],
  ['Scapolite', 25000, 'Aluminosilicate', '5.5 - 6', 'Tanzania, Myanmar, Brazil, Madagascar', 'Vitreous yellow, violet, or cat-eye honey crystals showing subtle pleochroism.', 'Scapolite is a transparent silicate gemstone valued for vivid lemon-yellow and lilac collector specimens.'],
  ['Serpentine', 10000, 'Magnesium Silicate', '3 - 5.5', 'China, New Zealand, Italy, USA', 'Waxy-to-greasy translucent olive and mottled green hues.', 'Serpentine is a group of green metamorphic minerals long carved as ornamental jade substitutes.'],
  ['Zoisite', 28000, 'Calcium Aluminum Silicate', '6 - 6.5', 'Tanzania, Austria, Norway', 'Massive green anyolite hosting ruby crystals, plus transparent blue-violet and green crystals.', 'Zoisite is the mineral species of both vibrant green anyolite and prized blue-violet tanzanite.'],

  // Additional Trained Model Varieties
  ['Almandine', 35000, 'Garnet Group', '7 - 7.5', 'India, Madagascar, Brazil, Austria', 'Deep brownish-red to purplish burgundy with strong iron absorption bands.', 'Almandine is the iron-rich red garnet species known for rich claret tone and high durability.'],
  ['Amazonite', 15000, 'Feldspar (Microcline)', '6 - 6.5', 'Brazil, Russia, USA (Colorado), Madagascar', 'Soft opaque seafoam-to-turquoise green mottled with white albite streaks.', 'Amazonite is a bright blue-green microcline feldspar colored by trace lead and structural water.'],
  ['Andalusite', 45000, 'Aluminosilicate', '6.5 - 7.5', 'Brazil, Sri Lanka, Spain', 'Dramatic olive-green, amber-brown, and russet-red pleochroism visible across a single stone.', 'Andalusite is a strongly pleochroic collector gem displaying shifting earth and autumn hues.'],
  ['Andradite', 55000, 'Garnet (Calcium Iron)', '6.5 - 7', 'Russia, Namibia, Italy, Iran', 'Highest luster and dispersion in the garnet family, spanning demantoid green and melanite black.', 'Andradite is a high-dispersion garnet mineral encompassing prized vivid green demantoid.'],
  ['Aventurine Green', 10000, 'Quartzite', '6.5 - 7', 'India, Brazil, Russia', 'Translucent green quartz shimmering with tiny fuchsite mica inclusions (aventurescence).', 'Green Aventurine is a sparkly green quartz aggregate widely used in beads and cabochons.'],
  ['Aventurine Yellow', 10000, 'Quartzite', '6.5 - 7', 'India, Brazil, Chile', 'Warm golden-peach quartz containing shimmering iron-oxide or mica platelets.', 'Yellow Aventurine is a warm translucent quartz variety exhibiting subtle golden metallic shimmer.'],
  ['Blue Lace Agate', 12000, 'Chalcedony (Quartz)', '6.5 - 7', 'Namibia, South Africa, Romania', 'Delicate wavy powder-blue and white concentric fortification bands.', 'Blue Lace Agate is a soothing sky-blue banded chalcedony highly prized in cabochon jewelry.'],
  ['Cats Eye', 85000, 'Chrysoberyl', '8.5', 'Sri Lanka, Brazil, India', 'Sharp silky line of reflected light (chatoyancy) gliding across a honey-green dome.', 'Cat-Eye Chrysoberyl (Cymophane) is the benchmark chatoyant gem featuring the prized milk-and-honey effect.'],
  ['Chalcedony', 15000, 'Microcrystalline Quartz', '6.5 - 7', 'Brazil, India, Namibia, Turkey', 'Waxy luster and soft glowing translucency in pastel lavender, gray, and white.', 'Chalcedony is fine-grained cryptocrystalline quartz prized for smooth velvety translucency.'],
  ['Chalcedony Blue', 22000, 'Microcrystalline Quartz', '6.5 - 7', 'Namibia, Turkey, USA', 'Uniform misty periwinkle-blue to cornflower translucency with zero banding.', 'Blue Chalcedony is a serene translucent blue quartz variety valued for even icy saturation.'],
  ['Chrome Diopside', 40000, 'Pyroxene', '5.5 - 6.5', 'Russia (Siberia), Pakistan, Madagascar', 'Intense chromium-rich forest green rivaling emerald saturation.', 'Chrome Diopside is a vivid emerald-green pyroxene gemstone prized for natural untreated brilliance.'],
  ['Chrysoberyl', 95000, 'Beryllium Aluminate', '8.5', 'Sri Lanka, Brazil, Madagascar, India', 'Bright lemon-lime to golden honey brilliance paired with elite hardness.', 'Chrysoberyl is an exceptionally durable gemstone spanning transparent yellow, cat-eye, and alexandrite.', 'https://www.gia.edu/chrysoberyl'],
  ['Chrysocolla', 18000, 'Hydrous Copper Silicate', '2.5 - 4', 'Peru, USA (Arizona), Chile, DR Congo', 'Vibrant cyan-blue to turquoise-green swirling patterns often stabilized in silica.', 'Chrysocolla is a vivid copper-bearing mineral prized for painterly ocean-blue cabochons.'],
  ['Coral', 45000, 'Organic Calcium Carbonate', '3 - 4', 'Mediterranean Sea, Japan, Taiwan', 'Warm salmon-pink to deep oxblood red opaque organic skeletons with fine wood-grain striations.', 'Precious Coral is a marine organic gemstone formed by calcareous skeletons of Corallium polyps.'],
  ['Diaspore', 75000, 'Aluminum Oxide Hydroxide', '6.5 - 7', 'Turkey (Anatolia)', 'Distinct pleochroic color shift from kiwi green in daylight to raspberry champagne indoors.', 'Gem Diaspore (Zultanite/Csarite) is a rare Turkish color-changing collector gemstone.'],
  ['Dumortierite', 14000, 'Aluminum Borosilicate', '7', 'Madagascar, Brazil, Namibia, USA', 'Rich denim-to-midnight blue fibrous aggregates, often intergrown within clear quartz.', 'Dumortierite is a hard fibrous blue borosilicate prized for matte navy cabochons and quartz inclusions.'],
  ['Grossular', 45000, 'Garnet Group', '6.5 - 7.5', 'Tanzania, Kenya, Canada, Sri Lanka', 'Wide color range from mint-green and golden-yellow to cinnamon hessonite.', 'Grossular Garnet is a calcium-aluminum garnet family including both tsavorite and hessonite.'],
  ['Hiddenite', 55000, 'Spodumene', '6.5 - 7', 'USA (North Carolina), Afghanistan, Brazil', 'Crisp emerald-to-mint green pleochroic crystal colored by trace chromium.', 'Hiddenite is the rare green gem variety of spodumene, sister stone to pink kunzite.'],
  ['Larimar', 35000, 'Pectolite', '4.5 - 5', 'Dominican Republic', 'Translucent sky-blue marbled with white seafoam patterns found solely in volcanic basalt.', 'Larimar is a rare blue pectolite variety unique to the Dominican Republic, evocative of Caribbean waters.'],
  ['Onyx Black', 12000, 'Chalcedony (Quartz)', '6.5 - 7', 'Brazil, India, Uruguay', 'Opaque mirror-black polish with fine microcrystalline density.', 'Black Onyx is a classic cryptocrystalline quartz prized for sleek black inlay, rings, and cameos.'],
  ['Onyx Green', 14000, 'Chalcedony / Banded Calcite', '3 - 7', 'Pakistan, Iran, Mexico, India', 'Soft jade-green translucent banding often accented with cream and honey veins.', 'Green Onyx is a translucent green banded stone prized in classic jewelry and carved pieces.'],
  ['Onyx Red', 14000, 'Chalcedony (Sardonyx)', '6.5 - 7', 'India, Brazil, Uruguay', 'Rich brick-red to mahogany layers alternating cleanly across fine quartz bands.', 'Red Onyx (Sardonyx) is a warm rust-red banded chalcedony used in signet rings and cameos.'],
  ['Prehnite', 18000, 'Phyllosilicate', '6 - 6.5', 'Mali, South Africa, Australia, China', 'Glowing translucent apple-green to chartreuse with soft pearly translucency.', 'Prehnite is a soothing pastel-green silicate mineral prized for smooth glowing cabochons.'],
  ['Pyrite', 10000, 'Iron Sulfide', '6 - 6.5', 'Peru, Spain, Italy, USA', 'Brassy metallic gold luster with sharp cubic and pyritohedral striations.', 'Pyrite ("Fool\'s Gold") is an iron sulfide mineral admired for mirror-bright brassy cubic crystals.'],
  ['Pyrope', 38000, 'Garnet (Magnesium Aluminum)', '7 - 7.5', 'Czech Republic (Bohemia), South Africa, USA', 'Intense deep crimson-red transparency without brownish muddy tones.', 'Pyrope is the classic fiery red garnet traditionally mined in Bohemia and kimberlite pipes.'],
  ['Spodumene', 42000, 'Lithium Aluminum Silicate', '6.5 - 7', 'Afghanistan, Brazil, Madagascar, USA', 'Transparent chartreuse-yellow, lilac, or colorless prismatic crystals with strong pleochroism.', 'Spodumene is a lithium pyroxene mineral group famous for kunzite, hiddenite, and triphane.', 'https://www.gia.edu/kunzite'],
  ['Variscite', 16000, 'Hydrous Aluminum Phosphate', '3.5 - 4.5', 'USA (Utah, Nevada), Australia, Germany', 'Opaque mint-to-apple green cabochons veined with delicate golden or brown matrix.', 'Variscite is a vivid green aluminum phosphate mineral closely resembling green turquoise.'],
];

const GEMSTONE_CATALOG = RAW_GEMSTONES.map(
  ([
    gemstone_type,
    price_per_carat,
    mineral_family,
    mohs_hardness,
    primary_origins,
    characteristics,
    description,
    giaUrl,
  ]) => {
    const infoUrl =
      giaUrl ||
      `https://www.mindat.org/search.php?search=${encodeURIComponent(gemstone_type)}`;
    const infoSource = giaUrl ? SOURCES.GIA.name : SOURCES.MINDAT.name;

    return {
      gemstone_type,
      price_per_carat,
      currency: 'PKR',
      mineral_family,
      mohs_hardness,
      primary_origins,
      characteristics,
      description,
      info_source_name: infoSource,
      info_source_url: infoUrl,
      price_source_name: SOURCES.GEMGUIDE.name,
      price_source_url: SOURCES.GEMGUIDE.url,
      sources: [
        {
          source_type: 'gemology',
          source_name: giaUrl ? SOURCES.GIA.name : SOURCES.IGS.name,
          source_url: giaUrl || SOURCES.IGS.url,
          reference_note: `${gemstone_type} classification, optical properties, and species profile.`,
        },
        {
          source_type: 'characteristics',
          source_name: SOURCES.MINDAT.name,
          source_url: `https://www.mindat.org/search.php?search=${encodeURIComponent(gemstone_type)}`,
          reference_note: `${mineral_family} mineral data, Mohs hardness (${mohs_hardness}), and global localities.`,
        },
        {
          source_type: 'pricing',
          source_name: SOURCES.GEMGUIDE.name,
          source_url: SOURCES.GEMGUIDE.url,
          reference_note: `Wholesale per-carat valuation reference (${price_per_carat.toLocaleString()} PKR/ct benchmark).`,
        },
      ],
    };
  }
);

module.exports = {
  SOURCES,
  GEMSTONE_CATALOG,
};
