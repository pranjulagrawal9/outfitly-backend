"use strict";

/**
 * order controller
 */

// @ts-ignore
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::order.order", ({ strapi }) => ({
  async create(ctx) {
    const { products } = ctx.request.body;
    try {
      const lineItems = await Promise.all(
        products.map(async (product) => {
          const item = await strapi
            .service("api::product.product")
            .findOne(product.id);

          return {
            price_data: {
              currency: "inr",
              product_data: {
                name: item.title,
                images: [product.images.data[0].attributes.url],
                metadata: {
                  productId: product.id,
                  mrp: product.mrp,
                  size: product.selectedSize,
                },
              },
              unit_amount: item.price * 100,
            },
            quantity: product.qty,
          };
        })
      );

      const session = await stripe.checkout.sessions.create({
        line_items: lineItems,
        mode: "payment",
        success_url: process.env.CLIENT_URL + "/orderstatus?success=true",
        cancel_url: process.env.CLIENT_URL + "/orderstatus?success=false",
        client_reference_id: ctx.state.user.id,
        billing_address_collection: "required",
        shipping_address_collection: {
          allowed_countries: ["US", "CA", "IN", "DE"],
        },
      });

      return { stripeSession: session };
    } catch (error) {
      console.log(error);
      ctx.response.status = 500;
      return error;
    }
  },

  async find(ctx) {
    const user = ctx.state.user;
    console.log(ctx.query);
    ctx.query.filters = {
      ...(ctx.query.filters || {}),
      user_id: user.id,
    };
    console.log(ctx.query.filters);
    // @ts-ignore
    return super.find(ctx);
  },
}));
