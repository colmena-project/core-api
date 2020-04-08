const { WorkflowController } = require('../controllers');

module.exports = {
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
};
