declare module 'midtrans-client' {
  export interface CoreApiConfig {
    serverKey: string;
    clientKey: string;
    isProduction: boolean;
  }

  export interface SnapConfig {
    isProduction: boolean;
    clientKey: string;
  }

  export interface TransactionDetails {
    order_id: string;
    gross_amount: number;
  }

  export interface CustomerDetails {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  }

  export interface ItemDetails {
    id: string;
    price: number;
    quantity: number;
    name: string;
    category: string;
  }

  export interface Callbacks {
    finish: string;
    pending: string;
    error: string;
  }

  export interface ChargeParameter {
    transaction_details: TransactionDetails;
    customer_details: CustomerDetails;
    item_details: ItemDetails[];
    callbacks: Callbacks;
  }

  export interface ChargeResponse {
    token: string;
    redirect_url: string;
  }

  export interface TransactionStatus {
    transaction_status: string;
    fraud_status: string;
    gross_amount: number;
  }

  export interface NotificationParameter {
    order_id: string;
    status_code: string;
    gross_amount: number;
  }

  export class CoreApi {
    constructor(config: CoreApiConfig);
    charge(parameter: ChargeParameter): Promise<ChargeResponse>;
    transaction: {
      status(transactionId: string): Promise<TransactionStatus>;
      notification(parameter: NotificationParameter): string;
    };
  }

  export class Snap {
    constructor(config: SnapConfig);
  }
}
