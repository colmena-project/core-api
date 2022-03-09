import { RETRIBUTION_TYPES, TRANSACTIONS_TYPES } from '../constants';
import TransactionService from './TransactionService';

const getRetributionParametersBy = async (type: RETRIBUTION_TYPES, wasteType: Parse.Object) => {
  const query = new Parse.Query('RetributionParameter');
  query.equalTo('type', type);
  query.equalTo('wasteType', wasteType);
  query.equalTo('active', true);
  const retributionParameter = query.find({ useMasterKey: true });
  if (!retributionParameter) {
    throw new Error(
      `Cannot Find Retribution Parameter for type ${type} and wasteType ${wasteType.id}`,
    );
  }
  return retributionParameter;
};

const getAllRetributionParameters = async (): Promise<Parse.Object[]> => {
  const query = new Parse.Query('RetributionParameter');
  query.equalTo('active', true);
  const retributionParameter = await query.find({ useMasterKey: true });
  return retributionParameter;
};

const calculateMaterialRetribution = (
  qty: number,
  unit: string,
  retributionParameter: Parse.Object,
): number => {
  const retribution = 0;
  let quantity = 0;
  if (retributionParameter.get('qty') === 0) return retribution;
  switch (unit.toLowerCase()) {
    case 'gr':
      quantity = qty / 1000;
      break;
    case 'kg':
      quantity = qty;
      break;
    default:
      break;
  }
  return (quantity * retributionParameter.get('retribution')) / retributionParameter.get('qty');
};

const calculateTransportRetribution = (
  qty: number,
  unit: string,
  retributionParameter: Parse.Object,
): number => {
  const retribution = 0;
  let quantity = 0;
  if (retributionParameter.get('qty') === 0) return retribution;
  switch (unit.toLowerCase()) {
    case 'mts':
      quantity = qty / 1000;
      break;
    case 'kms':
      quantity = qty;
      break;
    default:
      break;
  }
  return (quantity * retributionParameter.get('retribution')) / retributionParameter.get('qty');
};

const getMaterialRetribution = async (materials: Colmena.Material[]): Promise<number> => {
  const retributionParameters = await getAllRetributionParameters();
  const estimatedRetributions = materials.map((material) => {
    const { wasteType } = material;
    const rp = retributionParameters.find(
      (r) => r.get('type') === RETRIBUTION_TYPES.MATERIAL && r.get('wasteType').id === wasteType,
    );
    if (!rp) {
      throw new Error(
        `Cannot find retribution parameter to ${wasteType} and type ${RETRIBUTION_TYPES.MATERIAL}`,
      );
    }
    return calculateMaterialRetribution(material.qty, material.unit, rp);
  });

  return estimatedRetributions.reduce((accumulator, value) => accumulator + value, 0);
};

const getTransportRetribution = async (kms: number): Promise<number> => {
  const retributionParameters = await getAllRetributionParameters();
  const rp = retributionParameters.find((r) => r.get('type') === RETRIBUTION_TYPES.TRANSPORT);
  if (!rp) throw new Error(`Cannot find retribution parameter type ${RETRIBUTION_TYPES.TRANSPORT}`);
  return calculateTransportRetribution(kms, 'kms', rp);
};

const generateRetribution = async (
  transaction: Parse.Object,
  user: Parse.User,
): Promise<Parse.Object> => {
  try {
    const retribution = new Parse.Object('Retribution');
    retribution.set('user', user);
    retribution.set('transaction', transaction);
    if (transaction.get('type') === TRANSACTIONS_TYPES.RECOVER) {
      if (transaction.isNew()) {
        throw new Error('Cannot find TransactionDetails from an unsaved Transaction');
      }
      const transactionDetails: Parse.Object[] = await TransactionService.findTransactionDetails(
        transaction,
      );
      const materials = transactionDetails.map((detail) => ({
        wasteType: detail.get('container').get('type').id,
        qty: detail.get('qty'),
        unit: detail.get('unit'),
      }));
      const value = await getMaterialRetribution(materials);
      retribution.set('estimated', value);
    }

    if (transaction.get('type') === TRANSACTIONS_TYPES.TRANSPORT) {
      const value = await getTransportRetribution(transaction.get('kms'));
      retribution.set('estimated', value);
    }
    retribution.set('createdBy', user);
    const acl = new Parse.ACL();
    acl.setPublicReadAccess(false);
    acl.setPublicWriteAccess(false);
    acl.setWriteAccess(user.id, true);
    acl.setReadAccess(user.id, true);
    retribution.setACL(acl);
    return retribution.save(null, { useMasterKey: true });
  } catch (error) {
    throw new Error(`Cannot generate retribution. Detail: ${error.message}`);
  }
};

const updateRetribution = async (
  retributionId: string,
  confirmationTransaction: Parse.Object,
  confirm: number,
) => {
  const query = new Parse.Query('Retribution');
  const retribution: Parse.Object | undefined = await query.get(retributionId, {
    useMasterKey: true,
  });
  if (retribution) {
    retribution.set('confirmationTransaction', confirmationTransaction);
    retribution.set('confirmed', confirm);
    retribution.set('accredited', true);
    await retribution.save(null, { useMasterKey: true });
  }
  return retribution;
};

const getByTransaction = async (id: Parse.Object): Promise<Parse.Object | undefined> => {
  const query = new Parse.Query('Retribution');
  query.equalTo('transaction', id);
  const results: Parse.Object | undefined = await query.first({
    useMasterKey: true,
  });
  return results;
};

export default {
  getMaterialRetribution,
  getTransportRetribution,
  getAllRetributionParameters,
  getRetributionParametersBy,
  generateRetribution,
  updateRetribution,
  getByTransaction,
};
