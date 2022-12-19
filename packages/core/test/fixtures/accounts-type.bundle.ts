import { AccountTypeEntity } from '../../src/modules/account/entities/account-type.entity';

import { fixture } from 'typeorm-fixture-builder';

export const accountTypeData: AccountTypeEntity[] = [];

const accountTypes: AccountTypeEntity[] = [
  {
    id: 'b3c5ec8c-cfaf-43cd-bf81-0a555c2a7dcc',
    name: 'Primary',
  },
  {
    id: 'e4279942-4a2f-442d-86e4-0295e8f054ec',
    name: 'Flexi Save',
    withdrawalPeriod: 30,
    dailyLimit: 100000,
    monthlyLimit: 1000000,
    withdrawalStartingCost: 25,
    withdrawalEndingCost: 50,
  },
  {
    id: '82395ef0-ea40-492b-93bf-770f2a88d5eb',
    name: 'Bezo Lock',
    withdrawalPeriod: 90,
    dailyLimit: 10000,
    monthlyLimit: 2000000,
    withdrawalStartingCost: 25,
    withdrawalEndingCost: 50,
  },
  {
    id: '581fd262-f407-4bbd-b0cc-81ceeb811f33',
    name: 'Investment',
  },
];

function createAccountType(data: any) {
  const accountType = new AccountTypeEntity();
  accountType.id = data.id;
  accountType.name = data.name;
  accountType.withdrawalPeriod = data.withdrawalPeriod ?? 0;
  accountType.dailyLimit = data.dailyLimit ?? 0;
  accountType.monthlyLimit = data.monthlyLimit ?? 0;
  accountType.withdrawalStartingCost = data.withdrawalStartingCost ?? 0;
  accountType.withdrawalEndingCost = data.withdrawalEndingCost ?? 0;
  return fixture(AccountTypeEntity, accountType);
}

for (const type of accountTypes) {
  accountTypeData.push(createAccountType(type));
}
