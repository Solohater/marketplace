import { Router } from "express";
import { locationController } from "./location.controller.js";

export const locationRouter = Router();

locationRouter.get("/countries", locationController.getCountries);
locationRouter.get("/countries/:countryId/regions", locationController.getRegions);
locationRouter.get("/regions/:regionId/cities", locationController.getCities);
locationRouter.get("/cities/:cityId/sub-cities", locationController.getSubCities);
locationRouter.get("/sub-cities/:subCityId/areas", locationController.getAreas);
locationRouter.get("/areas/:areaId/hierarchy", locationController.getLocationHierarchy);
