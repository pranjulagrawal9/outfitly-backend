module.exports = {
  routes: [
    {
      method: "POST",
      path: "/webhook",
      handler: "webhook.saveToDB",
      config: {
        auth: false,
      },
    },
  ],
};
