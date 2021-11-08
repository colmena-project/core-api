import { WorkflowController } from '../controllers';

const definitions: Colmena.RouteDefinitions = {
  registerRecover: {
    action: WorkflowController.registerRecover,
    secure: true,
  },
  registerTransferRequest: {
    action: WorkflowController.registerTransferRequest,
    secure: true,
  },
  registerTransferAccept: {
    action: WorkflowController.registerTransferAccept,
    secure: true,
  },
  registerTransferReject: {
    action: WorkflowController.registerTransferReject,
    secure: true,
  },
  registerTransferCancel: {
    action: WorkflowController.registerTransferCancel,
    secure: true,
  },
  registerTransport: {
    action: WorkflowController.registerTransport,
    secure: true,
  },
  registerTransportCancel: {
    action: WorkflowController.registerTransportCancel,
    secure: true,
  },
  registerTransportAccept: {
    action: WorkflowController.registerTransportAccept,
    secure: true,
  },
  registerTransportReject: {
    action: WorkflowController.registerTransportReject,
    secure: true,
  },
  registerPayment: {
    action: WorkflowController.registerPayment,
    secure: true,
  },
  deleteContainers: {
    action: WorkflowController.deleteContainers,
    secure: true,
  },
};

export default definitions;
