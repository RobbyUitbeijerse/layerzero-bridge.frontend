import { mulDecimals } from '../../utils';
import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';
import { getAddress } from '@harmony-js/crypto';
const BN = require('bn.js');

interface IHmyMethodsInitParams {
  web3: Web3;
  hmyManagerContract: Contract;
  hmyManagerContractAddress: string;
  options?: { gasPrice: number; gasLimit: number };
}

export class HmyMethodsHRC20Web3 {
  private web3: Web3;
  private hmyManagerContract: Contract;
  private hmyManagerContractAddress: string;
  // private options = { gasPrice: 3000000000, gasLimit: 6721900 };

  constructor(params: IHmyMethodsInitParams) {
    this.web3 = params.web3;
    this.hmyManagerContract = params.hmyManagerContract;
    this.hmyManagerContractAddress = params.hmyManagerContractAddress;

    // if (params.options) {
    //   this.options = params.options;
    // }
  }

  approveHmyManger = async (
    hrc20Address,
    amount,
    decimals,
    sendTxCallback?,
  ) => {
    const tokenJson = require('../out/MyERC20');
    const hmyTokenContract = new this.web3.eth.Contract(
      tokenJson.abi,
      hrc20Address,
    );
    // @ts-ignore
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

    if (Number(amount) === 0) {
      sendTxCallback('skip');
      return;
    }

    const res = await hmyTokenContract.methods
      .approve(this.hmyManagerContractAddress, mulDecimals(amount, decimals))
      .send({
        from: accounts[0],
        gasLimit: process.env.GAS_LIMIT,
        gasPrice: Number(process.env.GAS_PRICE),
      })
      .on('transactionHash', sendTxCallback);

    return res;
  };

  checkHmyBalance = async (hrc20Address, addr: string) => {
    const tokenJson = require('../out/MyERC20');
    const hmyTokenContract = new this.web3.eth.Contract(
      tokenJson.abi,
      hrc20Address,
    );

    const addrHex = getAddress(addr).checksum;

    return await hmyTokenContract.methods.balanceOf(addrHex).call();
  };

  /////////////////////////////////////////
  /////////////////////////////////////////
  /////////////////////////////////////////
  /////////////////////////////////////////
  /////////////////////////////////////////

  lockToken = async (
    erc20Address,
    userAddr,
    amount,
    decimals,
    sendTxCallback?,
  ) => {
    // @ts-ignore
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const hmyAddrHex = getAddress(userAddr).checksum;

    const res = await this.hmyManagerContract.methods
      .lockToken(erc20Address, mulDecimals(amount, decimals), hmyAddrHex)
      .send({
        from: accounts[0],
        gasLimit: process.env.GAS_LIMIT,
        gasPrice: Number(process.env.GAS_PRICE),
      })
      .on('transactionHash', sendTxCallback);

    return res;
  };

  lockOne = async (userAddr, amount, sendTxCallback?) => {
    // @ts-ignore
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

    const hmyAddrHex = getAddress(userAddr).checksum;

    const res = await this.hmyManagerContract.methods
      .lockOne(mulDecimals(amount, 18), hmyAddrHex)
      .send({
        from: accounts[0],
        gasLimit: process.env.GAS_LIMIT,
        gasPrice: Number(process.env.GAS_PRICE),
        value: mulDecimals(amount, 18),
      })
      .on('transactionHash', sendTxCallback);

    return res;
  };

  tokenDetails = async erc20Address => {
    const tokenJson = require('../out/MyERC20');
    const erc20Contract = new this.web3.eth.Contract(
      tokenJson.abi,
      erc20Address,
    );

    const name = await erc20Contract.methods.name().call();
    const symbol = await erc20Contract.methods.symbol().call();
    const decimals = await erc20Contract.methods.decimals().call();

    return {
      name,
      symbol,
      decimals: Number('0x' + decimals).toString(),
      erc20Address,
    };
  };

  allowance = async (addr: string, erc20Address: string) => {
    const addrHex = getAddress(addr).checksum;

    const tokenJson = require('../out/MyERC20');
    const hmyTokenContract = new this.web3.eth.Contract(
      tokenJson.abi,
      erc20Address,
    );

    return await hmyTokenContract.methods
      .allowance(addrHex, this.hmyManagerContractAddress)
      .call();
  };
}
