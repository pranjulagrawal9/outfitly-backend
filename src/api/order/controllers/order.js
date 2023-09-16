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
                // images: ["http://localhost:1337"+product.images.data[0].attributes.url]
                images: [
                  "https://images.bewakoof.com/t640/leader-full-sleeve-t-shirt-black-296657-1655834499-1.jpg",
                ],
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
      });

      return { stripeSession: session };
    } catch (error) {
      console.log(error);
      ctx.response.status = 500;
      return error;
    }
  },
}));
