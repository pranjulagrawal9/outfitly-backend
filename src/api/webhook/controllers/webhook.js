module.exports = {
  async hello(ctx, next) {
    console.log(ctx.request.body);
    ctx.body = "Hello World!";
  },
};
