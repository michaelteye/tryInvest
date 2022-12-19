import { WalletTypeEntity } from '../../src/modules/wallet/entities/wallet.entity';
import { fixture } from 'typeorm-fixture-builder';
import { CURRENCY } from '../../src/modules/enums/currency.enum';

export const walletData: WalletTypeEntity[] = [];

const wallets: WalletTypeEntity[] = [
  {
    id: '0371a818-4c6c-45fb-ba1d-6cc6c608ba6d',
    name: 'Local',
    currency: CURRENCY.GHS,
  },
];

function createWallet(data: any) {
  const wallet = new WalletTypeEntity();
  wallet.name = data.name;
  return fixture(WalletTypeEntity, wallet);
}

for (const wallet of wallets) {
  walletData.push(createWallet(wallet));
}
