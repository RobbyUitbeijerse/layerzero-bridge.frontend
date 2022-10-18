import {
  ACTION_TYPE,
  EXCHANGE_MODE,
  IAction,
  NETWORK_TYPE,
  STATUS,
} from '../interfaces';
import { sleep } from 'utils';
import { ITransaction } from './index';
import { IStores } from '../index';
import { hmyMethodsERC20Web3 } from '../../blockchain-bridge/hmy';
import { getExNetworkMethods } from '../../blockchain-bridge/eth';

export const send1ETHToken = async (params: {
  transaction: ITransaction;
  stores: IStores;
  mode: EXCHANGE_MODE;
  getActionByType: (action: ACTION_TYPE) => IAction;
  confirmCallback: (hash: string, action: ACTION_TYPE) => void;
}) => {
  const {
    getActionByType,
    confirmCallback,
    transaction,
    stores,
    mode,
  } = params;

  let hmyMethods = hmyMethodsERC20Web3;

  const externalNetwork = getExNetworkMethods();

  const ethMethods = externalNetwork.ethMethodsERC20;

  if (mode === EXCHANGE_MODE.ETH_TO_ONE) {
    confirmCallback('skip', ACTION_TYPE.approveEthManger);

    const lockToken = getActionByType(ACTION_TYPE.lockToken);

    if (lockToken.status === STATUS.WAITING) {
      await ethMethods.lockToken(
        '',
        transaction.oneAddress,
        transaction.amount,
        18,
        hash => confirmCallback(hash, lockToken.type),
      );
    }

    return;
  }

  if (mode === EXCHANGE_MODE.ONE_TO_ETH) {
    const hrc20Address = stores.user.hrc20Address;

    let approveHmyManger = getActionByType(ACTION_TYPE.approveHmyManger);

    if (approveHmyManger && approveHmyManger.status === STATUS.WAITING) {
      await hmyMethods.approveHmyManger(
        hrc20Address,
        transaction.approveAmount,
        stores.userMetamask.erc20TokenDetails.decimals,
        hash => confirmCallback(hash, approveHmyManger.type),
      );
    }

    while (
      [STATUS.WAITING, STATUS.IN_PROGRESS].includes(approveHmyManger.status)
    ) {
      approveHmyManger = getActionByType(ACTION_TYPE.approveHmyManger);

      await sleep(500);
    }

    if (approveHmyManger.status !== STATUS.SUCCESS) {
      return;
    }

    const burnToken = getActionByType(ACTION_TYPE.burnToken);

    if (burnToken && burnToken.status === STATUS.WAITING) {
      await hmyMethods.burnToken(
        hrc20Address,
        transaction.ethAddress,
        transaction.amount,
        stores.userMetamask.erc20TokenDetails.decimals,
        hash => confirmCallback(hash, burnToken.type),
      );
    }

    return;
  }
};
