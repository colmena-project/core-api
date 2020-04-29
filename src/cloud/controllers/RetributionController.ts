import { LatLng } from '@googlemaps/google-maps-services-js/dist/common';
import RetributionService from '../services/RetributionService';
import ContainerService from '../services/ContainerService';
import MapService from '../services/MapService';

const processMaterialInput = async (elements: string[], user: Parse.User) => {
  // get containers
  const containers = await Promise.all(elements.map((e) => ContainerService.findContainerById(e, user)));
  // get retribution for each one
  const materialsRetributions = await Promise.all(containers.map((c) => {
    const materials = [{
      container: c,
      qty: c.get('type').get('qty'),
      unit: c.get('type').get('unit'),
    }];
    return RetributionService.getMaterialRetribution(materials);
  }));
  // set material elements response
  const materialDetail = materialsRetributions.map((value, index) => ({ containerId: containers[index].id, value }));
  // set result
  const totalResult = materialDetail.reduce((accumulator, detail) => accumulator + detail.value, 0);
  return {
    total: totalResult,
    elements: materialDetail,
  };
};

const processTransportInput = async (origin: LatLng, destination: LatLng) => {
  const distanceMatrix = await MapService.distancematrix(origin, destination);
  const distance = distanceMatrix.distance[0].elements[0];
  const kms = distance.distance.value / 1000;
  return RetributionService.getTransportRetribution(kms);
};

const estimateRetribution = async (request: Parse.Cloud.FunctionRequest) => {
  const { params, user } = <{ params: Parse.Cloud.Params, user: Parse.User }>request;
  const { type, elements = [] } = <{ type: string, elements: string[]}> params;
  let response;
  let unsoportedType;
  let materialResult;
  let transportResult;
  switch (type) {
    case 'material':
      materialResult = await processMaterialInput(elements, user);
      response = {
        material: materialResult,
      };
      break;
    case 'transport':
      transportResult = await processTransportInput(elements[0], elements[1]);
      response = {
        transport: transportResult,
      };
      break;
    default:
      unsoportedType = true;
      break;
  }

  if (unsoportedType) throw new Error(`Unspoported type ${type}`);
  return response;
};

export default {
  estimateRetribution,
};
