const { Parse } = global;

const send = async (title) => {
  const push = await Parse.Push.send(
    {
      channels: ['All'],
      data: {
        title,
      },
    },
    {
      useMasterKey: true,
    },
  );
  return push;
};

module.exports = {
  send,
};
