import { eq } from "drizzle-orm";
import { db, sql } from "./client.js";
import {
  areas,
  brands,
  categories,
  cities,
  countries,
  models,
  regions,
  subCities,
  users,
} from "./schema.js";
import { hashPassword } from "../lib/password.js";

async function seed(): Promise<void> {
  // Seed admin user
  const adminEmail = "admin@marketplace.et";
  const existingAdmin = await db.query.users.findFirst({
    where: eq(users.email, adminEmail),
  });
  if (!existingAdmin) {
    await db.insert(users).values({
      fullName: "Marketplace Admin",
      email: adminEmail,
      passwordHash: await hashPassword("admin12345"),
      role: "ADMIN",
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
    });
    console.log("Seeded admin user:", adminEmail, "/ admin12345");
  }

  // Seed demo user
  const demoEmail = "demo@marketplace.et";
  const existingDemo = await db.query.users.findFirst({
    where: eq(users.email, demoEmail),
  });
  if (!existingDemo) {
    await db.insert(users).values({
      fullName: "Demo User",
      email: demoEmail,
      passwordHash: await hashPassword("demo12345"),
      role: "USER",
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
    });
    console.log("Seeded demo user:", demoEmail, "/ demo12345");
  }

  // Seed Ethiopia locations
  const existingEthiopia = await db.query.countries.findFirst({
    where: eq(countries.code, "ET"),
  });

  if (!existingEthiopia) {
    console.log("Seeding Ethiopia locations...");

    const ethiopiaResults = await db
      .insert(countries)
      .values({ name: "Ethiopia", code: "ET" })
      .returning();
    const ethiopia = ethiopiaResults[0];
    if (!ethiopia) throw new Error("Failed to seed Ethiopia");

    // Addis Ababa
    const addisAbabaRegionResults = await db
      .insert(regions)
      .values({ countryId: ethiopia.id, name: "Addis Ababa" })
      .returning();
    const addisAbabaRegion = addisAbabaRegionResults[0];
    if (!addisAbabaRegion) throw new Error("Failed to seed Addis Ababa region");

    const addisAbabaCityResults = await db
      .insert(cities)
      .values({ regionId: addisAbabaRegion.id, name: "Addis Ababa" })
      .returning();
    const addisAbabaCity = addisAbabaCityResults[0];
    if (!addisAbabaCity) throw new Error("Failed to seed Addis Ababa city");

    const subCitiesData = [
      "Bole",
      "Yeka",
      "Arada",
      "Kirkos",
      "Lideta",
      "Nifas Silk-Lafto",
      "Akaki-Kality",
      "Kolfe-Keranio",
      "Gullele",
      "Addis Ketema",
    ];

    const insertedSubCities: { id: string; name: string }[] = [];
    for (const name of subCitiesData) {
      const scResults = await db
        .insert(subCities)
        .values({ cityId: addisAbabaCity.id, name })
        .returning();
      const sc = scResults[0];
      if (sc) insertedSubCities.push(sc);
    }

    const areasBySubCity: Record<string, string[]> = {
      Bole: ["Bole Medhanealem", "Bole Atlas", "Edna Mall Area", "Moonlight Hotel Area"],
      Yeka: ["Yeka Abado", "Ayat", "Koye Feche", "Jemo"],
      Arada: ["Piazza", "Arat Killo", "St. George Cathedral Area", "Taitu Hotel Area"],
      Kirkos: ["Merkato", "Kazanchis", "Sregister", "Mexico Area"],
      Lideta: ["Lideta Market Area", "Kera", "Jemed Area"],
      "Nifas Silk-Lafto": ["Lafto", "Mekanissa", "Sululta Area"],
      "Akaki-Kality": ["Akaki", "Kality", "Kality Industrial Zone"],
      "Kolfe-Keranio": ["Bulbula", "Lege Tafo", "Meshuwalekiya"],
      Gullele: ["Gullele", "Jemo 2", "Addis Ketema Border"],
      "Addis Ketema": ["Merkato Extension", "Shiro Meda", "Tabor Area"],
    };

    for (const sc of insertedSubCities) {
      const areaNames = areasBySubCity[sc.name] ?? [];
      for (const areaName of areaNames) {
        await db.insert(areas).values({ subCityId: sc.id, name: areaName });
      }
    }

    // Oromia
    const oromiaRegionResults = await db
      .insert(regions)
      .values({ countryId: ethiopia.id, name: "Oromia" })
      .returning();
    const oromiaRegion = oromiaRegionResults[0];
    if (!oromiaRegion) throw new Error("Failed to seed Oromia region");

    const oromiaCities = ["Adama", "Bishoftu", "Jimma", "Shashemene", "Nekemte", "Ambo", "Sebeta", "Mojo"];
    for (const cityName of oromiaCities) {
      await db.insert(cities).values({ regionId: oromiaRegion.id, name: cityName });
    }

    // Amhara
    const amharaRegionResults = await db
      .insert(regions)
      .values({ countryId: ethiopia.id, name: "Amhara" })
      .returning();
    const amharaRegion = amharaRegionResults[0];
    if (!amharaRegion) throw new Error("Failed to seed Amhara region");

    const amharaCities = ["Bahir Dar", "Gondar", "Dessie", "Debre Markos", "Woldia"];
    for (const cityName of amharaCities) {
      await db.insert(cities).values({ regionId: amharaRegion.id, name: cityName });
    }

    // Tigray
    const tigrayRegionResults = await db
      .insert(regions)
      .values({ countryId: ethiopia.id, name: "Tigray" })
      .returning();
    const tigrayRegion = tigrayRegionResults[0];
    if (!tigrayRegion) throw new Error("Failed to seed Tigray region");

    const tigrayCities = ["Mekelle", "Shire", "Adwa", "Hawzen"];
    for (const cityName of tigrayCities) {
      await db.insert(cities).values({ regionId: tigrayRegion.id, name: cityName });
    }

    // Sidama
    const sidamaRegionResults = await db
      .insert(regions)
      .values({ countryId: ethiopia.id, name: "Sidama" })
      .returning();
    const sidamaRegion = sidamaRegionResults[0];
    if (!sidamaRegion) throw new Error("Failed to seed Sidama region");

    const sidamaCities = ["Hawassa", "Yirgalem", "Dilla", "Bensa"];
    for (const cityName of sidamaCities) {
      await db.insert(cities).values({ regionId: sidamaRegion.id, name: cityName });
    }

    // SNNPR
    const snnpRegionResults = await db
      .insert(regions)
      .values({ countryId: ethiopia.id, name: "Southern Nations, Nationalities, and Peoples' Region" })
      .returning();
    const snnpRegion = snnpRegionResults[0];
    if (!snnpRegion) throw new Error("Failed to seed SNNPR region");

    const snnpCities = ["Wolaita Sodo", "Arba Minch", "Jinka"];
    for (const cityName of snnpCities) {
      await db.insert(cities).values({ regionId: snnpRegion.id, name: cityName });
    }

    // Dire Dawa
    const direDawaRegionResults = await db
      .insert(regions)
      .values({ countryId: ethiopia.id, name: "Dire Dawa" })
      .returning();
    const direDawaRegion = direDawaRegionResults[0];
    if (!direDawaRegion) throw new Error("Failed to seed Dire Dawa region");

    await db.insert(cities).values({ regionId: direDawaRegion.id, name: "Dire Dawa" });

    // Harari
    const harariRegionResults = await db
      .insert(regions)
      .values({ countryId: ethiopia.id, name: "Harari" })
      .returning();
    const harariRegion = harariRegionResults[0];
    if (!harariRegion) throw new Error("Failed to seed Harari region");

    await db.insert(cities).values({ regionId: harariRegion.id, name: "Harar" });

    // Afar
    const afarRegionResults = await db
      .insert(regions)
      .values({ countryId: ethiopia.id, name: "Afar" })
      .returning();
    const afarRegion = afarRegionResults[0];
    if (!afarRegion) throw new Error("Failed to seed Afar region");

    await db.insert(cities).values({ regionId: afarRegion.id, name: "Semera" });

    // Gambela
    const gambelaRegionResults = await db
      .insert(regions)
      .values({ countryId: ethiopia.id, name: "Gambela" })
      .returning();
    const gambelaRegion = gambelaRegionResults[0];
    if (!gambelaRegion) throw new Error("Failed to seed Gambela region");

    await db.insert(cities).values({ regionId: gambelaRegion.id, name: "Gambela" });

    // Benishangul-Gumuz
    const benishangulRegionResults = await db
      .insert(regions)
      .values({ countryId: ethiopia.id, name: "Benishangul-Gumuz" })
      .returning();
    const benishangulRegion = benishangulRegionResults[0];
    if (!benishangulRegion) throw new Error("Failed to seed Benishangul-Gumuz region");

    await db.insert(cities).values({ regionId: benishangulRegion.id, name: "Asosa" });

    // Central Ethiopia
    const centralRegionResults = await db
      .insert(regions)
      .values({ countryId: ethiopia.id, name: "Central Ethiopia" })
      .returning();
    const centralRegion = centralRegionResults[0];
    if (!centralRegion) throw new Error("Failed to seed Central Ethiopia region");

    await db.insert(cities).values({ regionId: centralRegion.id, name: "Debre Birhan" });

    console.log("Ethiopia locations seeded successfully!");
  }

  // Seed categories, brands, and models
  const existingPhones = await db.query.categories.findFirst({
    where: eq(categories.slug, "phones"),
  });

  if (!existingPhones) {
    console.log("Seeding categories, brands, and models...");

    // Create root categories
    const phonesResults = await db
      .insert(categories)
      .values({ name: "Phones", slug: "phones" })
      .returning();
    const phonesCategory = phonesResults[0];
    if (!phonesCategory) throw new Error("Failed to seed Phones category");

    const tabletsResults = await db
      .insert(categories)
      .values({ name: "Tablets", slug: "tablets" })
      .returning();
    const tabletsCategory = tabletsResults[0];
    if (!tabletsCategory) throw new Error("Failed to seed Tablets category");

    const laptopsResults = await db
      .insert(categories)
      .values({ name: "Laptops", slug: "laptops" })
      .returning();
    const laptopsCategory = laptopsResults[0];
    if (!laptopsCategory) throw new Error("Failed to seed Laptops category");

    const accessoriesResults = await db
      .insert(categories)
      .values({ name: "Accessories", slug: "accessories" })
      .returning();
    const accessoriesCategory = accessoriesResults[0];
    if (!accessoriesCategory) throw new Error("Failed to seed Accessories category");

    // Create phone subcategories
    const smartphoneResults = await db
      .insert(categories)
      .values({ name: "Smartphones", slug: "smartphones", parentId: phonesCategory.id })
      .returning();
    const smartphoneCategory = smartphoneResults[0];
    if (!smartphoneCategory) throw new Error("Failed to seed Smartphones category");

    const featurePhoneResults = await db
      .insert(categories)
      .values({ name: "Feature Phones", slug: "feature-phones", parentId: phonesCategory.id })
      .returning();
    const featurePhoneCategory = featurePhoneResults[0];
    if (!featurePhoneCategory) throw new Error("Failed to seed Feature Phones category");

    // Create laptop subcategories
    const laptopResults = await db
      .insert(categories)
      .values({ name: "Laptops", slug: "laptops-sub", parentId: laptopsCategory.id })
      .returning();
    const laptopSubCategory = laptopResults[0];
    if (!laptopSubCategory) throw new Error("Failed to seed Laptops subcategory");

    const desktopResults = await db
      .insert(categories)
      .values({ name: "Desktops", slug: "desktops", parentId: laptopsCategory.id })
      .returning();
    const desktopCategory = desktopResults[0];
    if (!desktopCategory) throw new Error("Failed to seed Desktops category");

    // Create tablet subcategories
    const ipadResults = await db
      .insert(categories)
      .values({ name: "iPads", slug: "ipads", parentId: tabletsCategory.id })
      .returning();
    const ipadCategory = ipadResults[0];
    if (!ipadCategory) throw new Error("Failed to seed iPads category");

    const androidTabletResults = await db
      .insert(categories)
      .values({ name: "Android Tablets", slug: "android-tablets", parentId: tabletsCategory.id })
      .returning();
    const androidTabletCategory = androidTabletResults[0];
    if (!androidTabletCategory) throw new Error("Failed to seed Android Tablets category");

    // Create accessory subcategories
    const caseResults = await db
      .insert(categories)
      .values({ name: "Cases & Covers", slug: "cases-covers", parentId: accessoriesCategory.id })
      .returning();
    const caseCategory = caseResults[0];
    if (!caseCategory) throw new Error("Failed to seed Cases category");

    const chargerResults = await db
      .insert(categories)
      .values({ name: "Chargers & Cables", slug: "chargers-cables", parentId: accessoriesCategory.id })
      .returning();
    const chargerCategory = chargerResults[0];
    if (!chargerCategory) throw new Error("Failed to seed Chargers category");

    const earphoneResults = await db
      .insert(categories)
      .values({ name: "Earphones & Headphones", slug: "earphones-headphones", parentId: accessoriesCategory.id })
      .returning();
    const earphoneCategory = earphoneResults[0];
    if (!earphoneCategory) throw new Error("Failed to seed Earphones category");

    // Create brands for smartphones
    const appleResults = await db
      .insert(brands)
      .values({ name: "Apple", slug: "apple", categoryId: smartphoneCategory.id })
      .returning();
    const appleBrand = appleResults[0];
    if (!appleBrand) throw new Error("Failed to seed Apple brand");

    const samsungResults = await db
      .insert(brands)
      .values({ name: "Samsung", slug: "samsung", categoryId: smartphoneCategory.id })
      .returning();
    const samsungBrand = samsungResults[0];
    if (!samsungBrand) throw new Error("Failed to seed Samsung brand");

    const xiaomiResults = await db
      .insert(brands)
      .values({ name: "Xiaomi", slug: "xiaomi", categoryId: smartphoneCategory.id })
      .returning();
    const xiaomiBrand = xiaomiResults[0];
    if (!xiaomiBrand) throw new Error("Failed to seed Xiaomi brand");

    const huaweiResults = await db
      .insert(brands)
      .values({ name: "Huawei", slug: "huawei", categoryId: smartphoneCategory.id })
      .returning();
    const huaweiBrand = huaweiResults[0];
    if (!huaweiBrand) throw new Error("Failed to seed Huawei brand");

    const oneplusResults = await db
      .insert(brands)
      .values({ name: "OnePlus", slug: "oneplus", categoryId: smartphoneCategory.id })
      .returning();
    const oneplusBrand = oneplusResults[0];
    if (!oneplusBrand) throw new Error("Failed to seed OnePlus brand");

    const googleResults = await db
      .insert(brands)
      .values({ name: "Google", slug: "google", categoryId: smartphoneCategory.id })
      .returning();
    const googleBrand = googleResults[0];
    if (!googleBrand) throw new Error("Failed to seed Google brand");

    // Create brands for laptops
    const macbookResults = await db
      .insert(brands)
      .values({ name: "Apple", slug: "apple-laptops", categoryId: laptopSubCategory.id })
      .returning();
    const macbookBrand = macbookResults[0];
    if (!macbookBrand) throw new Error("Failed to seed Apple Laptops brand");

    const dellResults = await db
      .insert(brands)
      .values({ name: "Dell", slug: "dell", categoryId: laptopSubCategory.id })
      .returning();
    const dellBrand = dellResults[0];
    if (!dellBrand) throw new Error("Failed to seed Dell brand");

    const hpResults = await db
      .insert(brands)
      .values({ name: "HP", slug: "hp", categoryId: laptopSubCategory.id })
      .returning();
    const hpBrand = hpResults[0];
    if (!hpBrand) throw new Error("Failed to seed HP brand");

    const lenovoResults = await db
      .insert(brands)
      .values({ name: "Lenovo", slug: "lenovo", categoryId: laptopSubCategory.id })
      .returning();
    const lenovoBrand = lenovoResults[0];
    if (!lenovoBrand) throw new Error("Failed to seed Lenovo brand");

    const asusResults = await db
      .insert(brands)
      .values({ name: "ASUS", slug: "asus", categoryId: laptopSubCategory.id })
      .returning();
    const asusBrand = asusResults[0];
    if (!asusBrand) throw new Error("Failed to seed ASUS brand");

    // Create brands for tablets
    const ipadBrandResults = await db
      .insert(brands)
      .values({ name: "Apple", slug: "apple-tablets", categoryId: ipadCategory.id })
      .returning();
    const ipadBrand = ipadBrandResults[0];
    if (!ipadBrand) throw new Error("Failed to seed Apple Tablets brand");

    const samsungTabletResults = await db
      .insert(brands)
      .values({ name: "Samsung", slug: "samsung-tablets", categoryId: androidTabletCategory.id })
      .returning();
    const samsungTabletBrand = samsungTabletResults[0];
    if (!samsungTabletBrand) throw new Error("Failed to seed Samsung Tablets brand");

    // Create models for Apple smartphones
    const iphone15Results = await db
      .insert(models)
      .values({ name: "iPhone 15", slug: "iphone-15", brandId: appleBrand.id })
      .returning();
    const iphone15Model = iphone15Results[0];
    if (!iphone15Model) throw new Error("Failed to seed iPhone 15 model");

    const iphone15ProResults = await db
      .insert(models)
      .values({ name: "iPhone 15 Pro", slug: "iphone-15-pro", brandId: appleBrand.id })
      .returning();
    const iphone15ProModel = iphone15ProResults[0];
    if (!iphone15ProModel) throw new Error("Failed to seed iPhone 15 Pro model");

    const iphone15ProMaxResults = await db
      .insert(models)
      .values({ name: "iPhone 15 Pro Max", slug: "iphone-15-pro-max", brandId: appleBrand.id })
      .returning();
    const iphone15ProMaxModel = iphone15ProMaxResults[0];
    if (!iphone15ProMaxModel) throw new Error("Failed to seed iPhone 15 Pro Max model");

    const iphone14Results = await db
      .insert(models)
      .values({ name: "iPhone 14", slug: "iphone-14", brandId: appleBrand.id })
      .returning();
    const iphone14Model = iphone14Results[0];
    if (!iphone14Model) throw new Error("Failed to seed iPhone 14 model");

    const iphone13Results = await db
      .insert(models)
      .values({ name: "iPhone 13", slug: "iphone-13", brandId: appleBrand.id })
      .returning();
    const iphone13Model = iphone13Results[0];
    if (!iphone13Model) throw new Error("Failed to seed iPhone 13 model");

    // Create models for Samsung smartphones
    const galaxyS24Results = await db
      .insert(models)
      .values({ name: "Galaxy S24", slug: "galaxy-s24", brandId: samsungBrand.id })
      .returning();
    const galaxyS24Model = galaxyS24Results[0];
    if (!galaxyS24Model) throw new Error("Failed to seed Galaxy S24 model");

    const galaxyS24UltraResults = await db
      .insert(models)
      .values({ name: "Galaxy S24 Ultra", slug: "galaxy-s24-ultra", brandId: samsungBrand.id })
      .returning();
    const galaxyS24UltraModel = galaxyS24UltraResults[0];
    if (!galaxyS24UltraModel) throw new Error("Failed to seed Galaxy S24 Ultra model");

    const galaxyA54Results = await db
      .insert(models)
      .values({ name: "Galaxy A54", slug: "galaxy-a54", brandId: samsungBrand.id })
      .returning();
    const galaxyA54Model = galaxyA54Results[0];
    if (!galaxyA54Model) throw new Error("Failed to seed Galaxy A54 model");

    // Create models for Xiaomi smartphones
    const redmiNote12Results = await db
      .insert(models)
      .values({ name: "Redmi Note 12", slug: "redmi-note-12", brandId: xiaomiBrand.id })
      .returning();
    const redmiNote12Model = redmiNote12Results[0];
    if (!redmiNote12Model) throw new Error("Failed to seed Redmi Note 12 model");

    const pocoX5Results = await db
      .insert(models)
      .values({ name: "POCO X5", slug: "poco-x5", brandId: xiaomiBrand.id })
      .returning();
    const pocoX5Model = pocoX5Results[0];
    if (!pocoX5Model) throw new Error("Failed to seed POCO X5 model");

    // Create models for Apple laptops
    const macbookAirM2Results = await db
      .insert(models)
      .values({ name: "MacBook Air M2", slug: "macbook-air-m2", brandId: macbookBrand.id })
      .returning();
    const macbookAirM2Model = macbookAirM2Results[0];
    if (!macbookAirM2Model) throw new Error("Failed to seed MacBook Air M2 model");

    const macbookProM3Results = await db
      .insert(models)
      .values({ name: "MacBook Pro M3", slug: "macbook-pro-m3", brandId: macbookBrand.id })
      .returning();
    const macbookProM3Model = macbookProM3Results[0];
    if (!macbookProM3Model) throw new Error("Failed to seed MacBook Pro M3 model");

    // Create models for Dell laptops
    const dellXps13Results = await db
      .insert(models)
      .values({ name: "XPS 13", slug: "xps-13", brandId: dellBrand.id })
      .returning();
    const dellXps13Model = dellXps13Results[0];
    if (!dellXps13Model) throw new Error("Failed to seed Dell XPS 13 model");

    const dellInspiron15Results = await db
      .insert(models)
      .values({ name: "Inspiron 15", slug: "inspiron-15", brandId: dellBrand.id })
      .returning();
    const dellInspiron15Model = dellInspiron15Results[0];
    if (!dellInspiron15Model) throw new Error("Failed to seed Dell Inspiron 15 model");

    // Create models for HP laptops
    const hpSpectreResults = await db
      .insert(models)
      .values({ name: "Spectre x360", slug: "spectre-x360", brandId: hpBrand.id })
      .returning();
    const hpSpectreModel = hpSpectreResults[0];
    if (!hpSpectreModel) throw new Error("Failed to seed HP Spectre model");

    const hpPavilionResults = await db
      .insert(models)
      .values({ name: "Pavilion 15", slug: "pavilion-15", brandId: hpBrand.id })
      .returning();
    const hpPavilionModel = hpPavilionResults[0];
    if (!hpPavilionModel) throw new Error("Failed to seed HP Pavilion model");

    console.log("Categories, brands, and models seeded successfully!");
  }
}

await seed();
await sql.end();
