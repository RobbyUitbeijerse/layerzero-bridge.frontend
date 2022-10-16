import { Harmony } from '@harmony-js/core';
import { Contract } from '@harmony-js/contract';
import { connectToOneWallet } from './helpers';
import { mulDecimals } from '../../utils';

interface IHmyMethodsInitParams {
  hmy: Harmony;
  hmyTokenContract: Contract;
  hmyManagerContract: Contract;
  options?: { gasPrice: number; gasLimit: number };
}

export class HmyMethods {
  private hmy: Harmony;
  private hmyTokenContract: Contract;
  private hmyManagerContract: Contract;
  private options = { gasPrice: Number(process.env.GAS_PRICE), gasLimit: 6721900 };

  constructor(params: IHmyMethodsInitParams) {
    this.hmy = params.hmy;
    this.hmyTokenContract = params.hmyTokenContract;
    this.hmyManagerContract = params.hmyManagerContract;

    if (params.options) {
      this.options = params.options;
    }
  }

  approveHmyManger = (amount, sendTxCallback?) => {
    return new Promise(async (resolve, reject) => {
      try {
        if (Number(amount) === 0) {
          sendTxCallback('skip');
          return resolve();
        }

        await connectToOneWallet(this.hmyTokenContract.wallet, null, reject);

        const res = await this.hmyTokenContract.methods
          .approve(this.hmyManagerContract.address, mulDecimals(amount, 18))
          .send(this.options)
          .on('transactionHash', sendTxCallback);

        resolve(res);
      } catch (e) {
        reject(e);
      }
    });
  };

  burnToken = async (userAddr, amount, sendTxCallback?) => {
    return new Promise(async (resolve, reject) => {
      try {
        await connectToOneWallet(this.hmyManagerContract.wallet, null, reject);

        let response = await this.hmyManagerContract.methods
          .burnToken(mulDecimals(amount, 18), userAddr)
          .send(this.options)
          .on('transactionHash', sendTxCallback);

        resolve(response.transaction.id);
      } catch (e) {
        reject(e);
      }
    });
  };

  checkHmyBalance = async (addr: string) => {
    const addrHex = this.hmy.crypto.getAddress(addr).checksum;

    return await this.hmyTokenContract.methods
      .balanceOf(addrHex)
      .call(this.options);
  };

  totalSupply = async () => {
    return await this.hmyTokenContract.methods.totalSupply().call(this.options);
  };

  allowance = async (addr: string) => {
    const addrHex = this.hmy.crypto.getAddress(addr).checksum;

    return await this.hmyTokenContract.methods
      .allowance(addrHex, this.hmyManagerContract.address)
      .call(this.options);
  };
}
