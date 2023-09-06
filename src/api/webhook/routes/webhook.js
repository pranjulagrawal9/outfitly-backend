module.exports = {
  routes: [
    {
      method: "GET",
      path: "/webhook",
      handler: "webhook.hello",
      config: {
        auth: false,
      },
    },
  ],
};
