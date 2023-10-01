// @ts-ignore
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const unparsed = require("koa-body/unparsed.js");

const endpointSecret = process.env.WEBHOOK_ENDPOINT_SECRET;

module.exports = {
  async saveToDB(ctx) {
    const payload = ctx.request.body[unparsed];
    const sig = ctx.request.headers["stripe-signature"];

    let event;

    try {
      event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
    } catch (err) {
      console.log(err);
      ctx.response.status = 400;
      ctx.response.message = `Webhook Error: ${err.message}`;
      return;
    }

    if (event.type === "checkout.session.completed") {
      const sessionWithLineItems = await stripe.checkout.sessions.retrieve(
        event.data.object.id,
        {
          expand: ["line_items.data.price.product"],
        }
      );
      const products = sessionWithLineItems.line_items.data.map((lineItem) => ({
        productId: lineItem.price.product.metadata.productId,
        quantity: lineItem.quantity,
        mrp: lineItem.price.product.metadata.mrp,
        size: lineItem.price.product.metadata.size,
        price: lineItem.price.unit_amount / 100,
        image: lineItem.price.product.images[0],
        title: lineItem.price.product.name,
      }));
      const total = sessionWithLineItems.amount_total / 100;
      const payment_id = sessionWithLineItems.payment_intent;
      const user_id = sessionWithLineItems.client_reference_id;

      // save order to db
      await strapi.service("api::order.order").create({
        data: {
          user_id,
          products: JSON.stringify(products),
          payment_id,
          total,
        },
      });
    }

    ctx.response.status = 200;
    ctx.response.message = "Order saved to DB";
  },
};
