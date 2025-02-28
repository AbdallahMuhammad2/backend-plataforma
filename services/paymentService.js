const axios = require('axios');
const { AppError } = require('../middleware/errorHandler');

class PaymentService {
  constructor() {
    this.api = axios.create({
      baseURL: process.env.ASAAS_API_URL,
      headers: {
        'access_token': process.env.ASAAS_API_KEY,
        'Content-Type': 'application/json'
      }
    });
  }

  async createCustomer(userData) {
    try {
      const response = await this.api.post('/customers', {
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        cpfCnpj: userData.cpf,
        notificationDisabled: false
      });

      return response.data;
    } catch (error) {
      throw new AppError('Error creating customer in Asaas', 500);
    }
  }

  async createSubscription(data) {
    try {
      const response = await this.api.post('/subscriptions', {
        customer: data.customerId,
        billingType: data.billingType || 'CREDIT_CARD',
        value: data.value,
        nextDueDate: data.nextDueDate,
        cycle: 'MONTHLY',
        description: data.description,
        creditCard: data.creditCard,
        creditCardHolderInfo: data.creditCardHolderInfo
      });

      return response.data;
    } catch (error) {
      throw new AppError('Error creating subscription', 500);
    }
  }

  async createPayment(data) {
    try {
      const response = await this.api.post('/payments', {
        customer: data.customerId,
        billingType: data.billingType || 'CREDIT_CARD',
        value: data.value,
        dueDate: data.dueDate,
        description: data.description,
        creditCard: data.creditCard,
        creditCardHolderInfo: data.creditCardHolderInfo
      });

      return response.data;
    } catch (error) {
      throw new AppError('Error creating payment', 500);
    }
  }

  async getSubscription(subscriptionId) {
    try {
      const response = await this.api.get(`/subscriptions/${subscriptionId}`);
      return response.data;
    } catch (error) {
      throw new AppError('Error fetching subscription', 500);
    }
  }

  async cancelSubscription(subscriptionId) {
    try {
      const response = await this.api.delete(`/subscriptions/${subscriptionId}`);
      return response.data;
    } catch (error) {
      throw new AppError('Error canceling subscription', 500);
    }
  }

  async getPayment(paymentId) {
    try {
      const response = await this.api.get(`/payments/${paymentId}`);
      return response.data;
    } catch (error) {
      throw new AppError('Error fetching payment', 500);
    }
  }

  async getCustomerPayments(customerId) {
    try {
      const response = await this.api.get(`/payments`, {
        params: {
          customer: customerId
        }
      });
      return response.data;
    } catch (error) {
      throw new AppError('Error fetching customer payments', 500);
    }
  }

  async refundPayment(paymentId) {
    try {
      const response = await this.api.post(`/payments/${paymentId}/refund`);
      return response.data;
    } catch (error) {
      throw new AppError('Error refunding payment', 500);
    }
  }

  // Helper methods for payment processing
  formatCreditCardData(cardData) {
    return {
      creditCardNumber: cardData.number,
      creditCardHolderName: cardData.holderName,
      creditCardExpiryMonth: cardData.expiryMonth,
      creditCardExpiryYear: cardData.expiryYear,
      creditCardCcv: cardData.ccv
    };
  }

  formatHolderInfo(holderData) {
    return {
      name: holderData.name,
      email: holderData.email,
      cpfCnpj: holderData.cpf,
      postalCode: holderData.postalCode,
      addressNumber: holderData.addressNumber,
      phone: holderData.phone
    };
  }

  calculateSubscriptionPrice(plan) {
    const prices = {
      basic: 49.90,
      premium: 99.90,
      enterprise: 199.90
    };

    return prices[plan] || prices.basic;
  }

  async processWebhook(event) {
    const eventHandlers = {
      'PAYMENT_CONFIRMED': this.handlePaymentConfirmed.bind(this),
      'PAYMENT_RECEIVED': this.handlePaymentReceived.bind(this),
      'PAYMENT_OVERDUE': this.handlePaymentOverdue.bind(this),
      'PAYMENT_REFUNDED': this.handlePaymentRefunded.bind(this),
      'SUBSCRIPTION_CANCELED': this.handleSubscriptionCanceled.bind(this)
    };

    const handler = eventHandlers[event.event];
    if (handler) {
      await handler(event.payment);
    }
  }

  // Webhook event handlers
  async handlePaymentConfirmed(payment) {
    // Update user subscription status
    // Send confirmation email
    // Update access permissions
  }

  async handlePaymentReceived(payment) {
    // Update payment status
    // Send receipt email
  }

  async handlePaymentOverdue(payment) {
    // Update subscription status
    // Send reminder email
  }

  async handlePaymentRefunded(payment) {
    // Update payment status
    // Send refund confirmation email
  }

  async handleSubscriptionCanceled(subscription) {
    // Update user subscription status
    // Send cancellation confirmation email
  }
}

module.exports = new PaymentService();
