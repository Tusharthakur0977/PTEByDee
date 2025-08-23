import stripe from '../config/stripeConfig';

export interface StripeProductData {
  courseId: string;
  name: string;
  description: string;
  imageUrl?: string;
  price: number;
  currency: string;
}

/**
 * Service for managing Stripe products and prices
 */
export class StripeProductService {
  /**
   * Create a Stripe product and price for a course
   */
  static async createProductAndPrice(data: StripeProductData) {
    try {
      // Create Stripe product
      const product = await stripe.products.create({
        name: data.name,
        description: data.description,
        images: data.imageUrl ? [data.imageUrl] : undefined,
        metadata: {
          courseId: data.courseId,
          type: 'course',
        },
      });

      // Create Stripe price
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(data.price * 100), // Convert to cents
        currency: data.currency.toLowerCase(),
        metadata: {
          courseId: data.courseId,
        },
      });

      return {
        productId: product.id,
        priceId: price.id,
        product,
        price,
      };
    } catch (error) {
      console.error('Error creating Stripe product and price:', error);
      throw new Error('Failed to create Stripe product and price');
    }
  }

  /**
   * Update a Stripe product
   */
  static async updateProduct(
    productId: string,
    data: Partial<StripeProductData>
  ) {
    try {
      const updateData: any = {};

      if (data.name) updateData.name = data.name;
      if (data.description) updateData.description = data.description;
      if (data.imageUrl) updateData.images = [data.imageUrl];

      const product = await stripe.products.update(productId, updateData);
      return product;
    } catch (error) {
      console.error('Error updating Stripe product:', error);
      throw new Error('Failed to update Stripe product');
    }
  }

  /**
   * Create a new price for an existing product (for price changes)
   */
  static async createNewPrice(
    productId: string,
    price: number,
    currency: string,
    courseId: string
  ) {
    try {
      // Deactivate old prices
      const existingPrices = await stripe.prices.list({
        product: productId,
        active: true,
      });

      for (const existingPrice of existingPrices.data) {
        await stripe.prices.update(existingPrice.id, { active: false });
      }

      // Create new price
      const newPrice = await stripe.prices.create({
        product: productId,
        unit_amount: Math.round(price * 100),
        currency: currency.toLowerCase(),
        metadata: {
          courseId,
        },
      });

      return newPrice;
    } catch (error) {
      console.error('Error creating new Stripe price:', error);
      throw new Error('Failed to create new Stripe price');
    }
  }

  /**
   * Archive a Stripe product (when course is deleted)
   */
  static async archiveProduct(productId: string) {
    try {
      const product = await stripe.products.update(productId, {
        active: false,
      });
      return product;
    } catch (error) {
      console.error('Error archiving Stripe product:', error);
      throw new Error('Failed to archive Stripe product');
    }
  }

  /**
   * Get active price for a product
   */
  static async getActivePrice(productId: string) {
    try {
      const prices = await stripe.prices.list({
        product: productId,
        active: true,
        limit: 1,
      });

      return prices.data[0] || null;
    } catch (error) {
      console.error('Error getting active price:', error);
      throw new Error('Failed to get active price');
    }
  }
}
