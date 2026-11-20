import type { RequestHandler } from "express";
import { sendSuccess } from "../../lib/http.js";
import { locationService } from "./location.service.js";

export const locationController = {
  getCountries: (async (_req, res) => {
    const countries = await locationService.getCountries();
    sendSuccess(res, { countries });
  }) as RequestHandler,

  getRegions: (async (req, res) => {
    const regions = await locationService.getRegions(String(req.params.countryId));
    sendSuccess(res, { regions });
  }) as RequestHandler,

  getCities: (async (req, res) => {
    const cities = await locationService.getCities(String(req.params.regionId));
    sendSuccess(res, { cities });
  }) as RequestHandler,

  getSubCities: (async (req, res) => {
    const subCities = await locationService.getSubCities(String(req.params.cityId));
    sendSuccess(res, { subCities });
  }) as RequestHandler,

  getAreas: (async (req, res) => {
    const areas = await locationService.getAreas(String(req.params.subCityId));
    sendSuccess(res, { areas });
  }) as RequestHandler,

  getLocationHierarchy: (async (req, res) => {
    const hierarchy = await locationService.getLocationHierarchy(String(req.params.areaId));
    sendSuccess(res, { hierarchy });
  }) as RequestHandler,
};
