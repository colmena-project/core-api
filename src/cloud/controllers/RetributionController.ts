import { LatLng } from '@googlemaps/google-maps-services-js/dist/common';
import RetributionService from '../services/RetributionService';
import MapService from '../services/MapService';

const processMaterialInput = async (
  elements: Colmena.Material[],
): Promise<{ total: number; elements: Object[] }> => {
  const materialsRetributions = await Promise.all(
    elements.map((element) => RetributionService.getMaterialRetribution([element])),
  );

  // set material elements response
  const materialDetail = materialsRetributions.map((value, index) => ({
    wasteType: elements[index].wasteType,
    qty: elements[index].qty,
    unit: elements[index].unit,
    value,
  }));
  // set result
  const totalResult = materialDetail.reduce((accumulator, detail) => accumulator + detail.value, 0);
  return {
    total: totalResult,
    elements: materialDetail,
  };
};

const processTransportInput = async (
  origin: LatLng,
  destination: LatLng,
): Promise<{ total: number }> => {
  const distanceMatrix = await MapService.distancematrix(origin, destination);
  const distance = distanceMatrix.distance[0].elements[0];
  const kms = distance.distance.value / 1000;
  const total = await RetributionService.getTransportRetribution(kms);
  return {
    total,
  };
};

const estimateRetribution = async (request: Parse.Cloud.FunctionRequest) => {
  const { params } = request;
  const { type, elements = [] } = <{ type: string; elements: string[] | Colmena.Material[] }>params;
  let response;
  let unsoportedType;
  let materialResult;
  let transportResult;
  switch (type) {
    case 'material':
      materialResult = await processMaterialInput(<Colmena.Material[]>elements);
      response = {
        material: materialResult,
      };
      break;
    case 'transport':
      transportResult = await processTransportInput(<LatLng>elements[0], <LatLng>elements[1]);
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
