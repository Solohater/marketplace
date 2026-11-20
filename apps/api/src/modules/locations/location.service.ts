import { locationRepository } from "./location.repository.js";

export const locationService = {
  async getCountries() {
    return locationRepository.listCountries();
  },

  async getRegions(countryId: string) {
    const country = await locationRepository.findCountryById(countryId);
    if (!country) {
      throw new Error("Country not found");
    }
    return locationRepository.listRegionsByCountry(countryId);
  },

  async getCities(regionId: string) {
    const region = await locationRepository.findRegionById(regionId);
    if (!region) {
      throw new Error("Region not found");
    }
    return locationRepository.listCitiesByRegion(regionId);
  },

  async getSubCities(cityId: string) {
    const city = await locationRepository.findCityById(cityId);
    if (!city) {
      throw new Error("City not found");
    }
    return locationRepository.listSubCitiesByCity(cityId);
  },

  async getAreas(subCityId: string) {
    const subCity = await locationRepository.findSubCityById(subCityId);
    if (!subCity) {
      throw new Error("Sub-city not found");
    }
    return locationRepository.listAreasBySubCity(subCityId);
  },

  async getLocationHierarchy(areaId: string) {
    const hierarchy = await locationRepository.getLocationHierarchy(areaId);
    if (!hierarchy) {
      throw new Error("Area not found");
    }
    return hierarchy;
  },
};
