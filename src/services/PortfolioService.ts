import { collection, doc, getDocs, query, where, writeBatch, Timestamp, getDoc, runTransaction } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { InvestmentAsset, InvestmentTransaction, TransactionType, InvestmentCategory, InvestmentPriceSource } from '../types';

export class PortfolioService {
  /**
   * Pure function to calculate current position from an array of transactions
   */
  static calculatePosition(transactions: InvestmentTransaction[]): { quantity: number; averagePrice: number; totalInvested: number } {
    // Sort transactions by date ascending
    const sortedTx = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    let quantity = 0;
    let totalInvested = 0;

    for (const tx of sortedTx) {
      switch (tx.type) {
        case 'COMPRA':
        case 'APORTE':
          // New Average Price = (Previous Total Invested + New Purchase Value) / (Previous Quantity + New Quantity)
          const newPurchaseValue = tx.quantity * tx.unitPrice;
          const newTotalInvested = totalInvested + newPurchaseValue;
          const newQuantity = quantity + tx.quantity;
          
          if (newQuantity > 0) {
            quantity = newQuantity;
            totalInvested = newTotalInvested;
          }
          break;
          
        case 'VENDA':
        case 'RESGATE':
          // Selling reduces quantity and total invested proportionally (average price remains the same)
          if (quantity > 0) {
            const currentAveragePrice = totalInvested / quantity;
            quantity -= tx.quantity;
            // Prevent floating point anomalies near 0
            if (quantity <= 0.000001) {
              quantity = 0;
              totalInvested = 0;
            } else {
              totalInvested = quantity * currentAveragePrice;
            }
          }
          break;
          
        case 'BONIFICAÇÃO':
        case 'DESDOBRAMENTO':
          // Increases quantity, does not increase total invested (lowers average price)
          quantity += tx.quantity;
          break;
          
        case 'AMORTIZAÇÃO':
          // Reduces total invested, quantity remains the same (lowers average price)
          totalInvested -= tx.grossValue;
          if (totalInvested < 0) totalInvested = 0;
          break;
      }
    }

    const averagePrice = quantity > 0 ? totalInvested / quantity : 0;

    return {
      quantity,
      averagePrice,
      totalInvested
    };
  }

  /**
   * Registers a new transaction. If the asset doesn't exist for this user, it creates it.
   */
  static async registerTransaction(
    ownerId: string,
    assetData: {
      ticker: string;
      name: string;
      category: InvestmentCategory;
      priceSource: InvestmentPriceSource;
      currency?: string;
    },
    txData: {
      type: TransactionType;
      date: string;
      quantity: number;
      unitPrice: number;
      taxes: number;
    }
  ): Promise<void> {
    try {
      // 1. Check if asset already exists for this user (by ticker)
      const assetQuery = query(
        collection(db, 'investments'), 
        where('ownerId', '==', ownerId),
        where('ticker', '==', assetData.ticker)
      );
      
      const assetSnap = await getDocs(assetQuery);
      
      let assetId: string;
      let existingAsset: Partial<InvestmentAsset> = {};

      if (!assetSnap.empty) {
        assetId = assetSnap.docs[0].id;
        existingAsset = assetSnap.docs[0].data();
      } else {
        // Create new asset doc reference
        const newAssetRef = doc(collection(db, 'investments'));
        assetId = newAssetRef.id;
      }

      const txRef = doc(collection(db, 'investment_transactions'));
      
      const grossValue = txData.quantity * txData.unitPrice;
      // Net value logic depends on transaction type. Simplified here:
      const isOutflow = ['COMPRA', 'APORTE', 'TAXA'].includes(txData.type);
      const netValue = isOutflow ? grossValue + txData.taxes : grossValue - txData.taxes;

      const newTx: InvestmentTransaction = {
        id: txRef.id,
        ownerId,
        assetId,
        type: txData.type,
        date: txData.date,
        quantity: txData.quantity,
        unitPrice: txData.unitPrice,
        taxes: txData.taxes,
        grossValue,
        netValue,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // 2. Get all previous transactions to calculate new position safely
      let allTxs: InvestmentTransaction[] = [newTx];
      if (!assetSnap.empty) {
        const txQuery = query(collection(db, 'investment_transactions'), where('assetId', '==', assetId));
        const existingTxDocs = await getDocs(txQuery);
        const existingTxs = existingTxDocs.docs.map(d => d.data() as InvestmentTransaction);
        allTxs = [...existingTxs, newTx];
      }

      // 3. Calculate new position
      const { quantity, averagePrice, totalInvested } = this.calculatePosition(allTxs);

      // 4. Batch write
      const batch = writeBatch(db);
      
      batch.set(txRef, newTx);
      
      const assetUpdate: Partial<InvestmentAsset> = {
        quantity,
        averagePrice,
        totalInvested,
        updatedAt: new Date().toISOString(),
        isActive: quantity > 0
      };

      if (assetSnap.empty) {
        // Creating new asset completely
        const fullAsset: InvestmentAsset = {
          id: assetId,
          ownerId,
          ticker: assetData.ticker.toUpperCase(),
          name: assetData.name,
          category: assetData.category,
          currency: assetData.currency || 'BRL',
          priceSource: assetData.priceSource,
          currentPrice: txData.unitPrice, // Initial price is the purchase price
          quantity: assetUpdate.quantity!,
          averagePrice: assetUpdate.averagePrice!,
          totalInvested: assetUpdate.totalInvested!,
          isActive: assetUpdate.isActive!,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        batch.set(doc(db, 'investments', assetId), fullAsset);
      } else {
        // Updating existing asset
        batch.update(doc(db, 'investments', assetId), assetUpdate);
      }

      await batch.commit();

    } catch (error) {
      console.error("Error registering transaction:", error);
      throw error;
    }
  }

  static async getAssetTransactions(assetId: string): Promise<InvestmentTransaction[]> {
    try {
      const txQuery = query(collection(db, 'investment_transactions'), where('assetId', '==', assetId));
      const snapshot = await getDocs(txQuery);
      const txs = snapshot.docs.map(d => d.data() as InvestmentTransaction);
      return txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // descending
    } catch (error) {
      console.error("Error fetching transactions:", error);
      return [];
    }
  }

  static async getUserTransactions(ownerId: string): Promise<InvestmentTransaction[]> {
    try {
      const txQuery = query(collection(db, 'investment_transactions'), where('ownerId', '==', ownerId));
      const snapshot = await getDocs(txQuery);
      const txs = snapshot.docs.map(d => d.data() as InvestmentTransaction);
      return txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
      console.error("Error fetching user transactions:", error);
      return [];
    }
  }

  static async processWalletTransaction(ownerId: string, amount: number, date: string, type: 'APORTE' | 'RESGATE' = 'APORTE'): Promise<void> {
    try {
      const assetData = {
        ticker: 'CAIXA',
        name: 'Conta Corrente / Caixa',
        category: 'Caixa' as InvestmentCategory,
        priceSource: 'MANUAL' as InvestmentPriceSource,
        currency: 'BRL'
      };
      const txData = {
        type: type as TransactionType,
        date: date,
        quantity: amount,
        unitPrice: 1,
        taxes: 0
      };
      await this.registerTransaction(ownerId, assetData, txData);
    } catch (error) {
      console.error("Error processing wallet transaction:", error);
      throw error;
    }
  }

  /**
   * Deletes an asset completely along with all its transaction history.
   * If returnFundsToWallet is true and asset has invested balance, refunds the current value to Caixa.
   */
  static async deleteAsset(assetId: string, returnFundsToWallet: boolean = false, ownerId?: string, refundAmount?: number): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      // 1. Delete all transactions associated with this asset
      const txQuery = query(collection(db, 'investment_transactions'), where('assetId', '==', assetId));
      const txSnap = await getDocs(txQuery);
      txSnap.docs.forEach(d => {
        batch.delete(d.ref);
      });

      // 2. Delete the asset document
      const assetRef = doc(db, 'investments', assetId);
      batch.delete(assetRef);

      await batch.commit();

      // 3. If refund is requested and we have ownerId and amount > 0, register wallet deposit
      if (returnFundsToWallet && ownerId && refundAmount && refundAmount > 0) {
        const today = new Date().toISOString().split('T')[0];
        await this.processWalletTransaction(ownerId, refundAmount, today, 'APORTE');
      }
    } catch (error) {
      console.error("Error deleting asset:", error);
      throw error;
    }
  }
}
