import { eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import {
  areas,
  cities,
  countries,
  regions,
  subCities,
} from "../../db/schema.js";

export const locationRepository = {
  async findCountryById(id: string) {
    return db.query.countries.findFirst({
      where: eq(countries.id, id),
    });
  },

  async findCountryByCode(code: string) {
    return db.query.countries.findFirst({
      where: eq(countries.code, code),
    });
  },

  async findRegionById(id: string) {
    return db.query.regions.findFirst({
      where: eq(regions.id, id),
    });
  },

  async findCityById(id: string) {
    return db.query.cities.findFirst({
      where: eq(cities.id, id),
    });
  },

  async findSubCityById(id: string) {
    return db.query.subCities.findFirst({
      where: eq(subCities.id, id),
    });
  },

  async findAreaById(id: string) {
    return db.query.areas.findFirst({
      where: eq(areas.id, id),
    });
  },

  async listCountries() {
    return db.query.countries.findMany({
      orderBy: (countries, { asc }) => [asc(countries.name)],
    });
  },

  async listRegionsByCountry(countryId: string) {
    return db.query.regions.findMany({
      where: eq(regions.countryId, countryId),
      orderBy: (regions, { asc }) => [asc(regions.name)],
    });
  },

  async listCitiesByRegion(regionId: string) {
    return db.query.cities.findMany({
      where: eq(cities.regionId, regionId),
      orderBy: (cities, { asc }) => [asc(cities.name)],
    });
  },

  async listSubCitiesByCity(cityId: string) {
    return db.query.subCities.findMany({
      where: eq(subCities.cityId, cityId),
      orderBy: (subCities, { asc }) => [asc(subCities.name)],
    });
  },

  async listAreasBySubCity(subCityId: string) {
    return db.query.areas.findMany({
      where: eq(areas.subCityId, subCityId),
      orderBy: (areas, { asc }) => [asc(areas.name)],
    });
  },

  async getLocationHierarchy(areaId: string) {
    const area = await db.query.areas.findFirst({
      where: eq(areas.id, areaId),
    });

    if (!area) return null;

    const subCity = await db.query.subCities.findFirst({
      where: eq(subCities.id, area.subCityId),
    });

    if (!subCity) return null;

    const city = await db.query.cities.findFirst({
      where: eq(cities.id, subCity.cityId),
    });

    if (!city) return null;

    const region = await db.query.regions.findFirst({
      where: eq(regions.id, city.regionId),
    });

    if (!region) return null;

    const country = await db.query.countries.findFirst({
      where: eq(countries.id, region.countryId),
    });

    if (!country) return null;

    return {
      area: area.name,
      subCity: subCity.name,
      city: city.name,
      region: region.name,
      country: country.name,
      countryCode: country.code,
    };
  },
};
