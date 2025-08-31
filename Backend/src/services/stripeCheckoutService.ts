import prisma from '../config/prismaInstance';
import stripe from '../config/stripeConfig';

export interface CheckoutSessionData {
  courseId: string;
  userId: string;
  userEmail: string;
  priceId: string;
  successUrl?: string;
  cancelUrl?: string;
}

/**
 * Service for managing Stripe checkout sessions
 */
export class StripeCheckoutService {
  /**
   * Create a checkout session for course purchase
   */
  static async createCheckoutSession(data: CheckoutSessionData) {
    try {
      const {
        courseId,
        userId,
        userEmail,
        priceId,
        successUrl = `${process.env.FRONTEND_URL}/payment/success`,
        cancelUrl = `${process.env.FRONTEND_URL}/payment/cancel`,
      } = data;

      // Get course details for metadata
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: {
          id: true,
          title: true,
          price: true,
          currency: true,
        },
      });

      if (!course) {
        throw new Error('Course not found');
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl,
        customer_email: userEmail,
        metadata: {
          courseId,
          userId,
          courseTitle: course.title,
          type: 'course_purchase',
        },
        payment_intent_data: {
          metadata: {
            courseId,
            userId,
            courseTitle: course.title,
          },
        },
        // Enable automatic tax calculation if configured
        automatic_tax: {
          enabled: false, // Set to true if you have tax settings configured
        },
        // Add billing address collection
        billing_address_collection: 'required',
        // Add phone number collection
        phone_number_collection: {
          enabled: true,
        },
      });

      // Create transaction record
      const transaction = await prisma.transaction.create({
        data: {
          userId,
          amount: course.price || 0,
          paymentStatus: 'PENDING',
          gateway: 'Stripe',
          transactionId: session.id,
          orderId: session.id,
          purchasedItem: `${course.title} (${course.id})`,
        },
      });

      return {
        sessionId: session.id,
        sessionUrl: session.url,
        transactionId: transaction.id,
        course,
      };
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw new Error('Failed to create checkout session');
    }
  }

  /**
   * Retrieve a checkout session
   */
  static async retrieveSession(sessionId: string) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['payment_intent', 'customer', 'line_items'],
      });
      return session;
    } catch (error) {
      console.error('Error retrieving checkout session:', error);
      throw new Error(
        `Failed to retrieve checkout session: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Get checkout session with line items
   */
  static async getSessionWithLineItems(sessionId: string) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      const lineItems = await stripe.checkout.sessions.listLineItems(sessionId);

      return {
        session,
        lineItems: lineItems.data,
      };
    } catch (error) {
      console.error('Error getting session with line items:', error);
      throw new Error('Failed to get session details');
    }
  }
}
