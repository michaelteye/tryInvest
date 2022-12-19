import { AccountTypeEntity } from '../../account/entities/account-type.entity';
export const accountTypeData: AccountTypeEntity[] = [
  {
    id: '57301e10-73f0-4b22-b605-e007caa0ab01',
    name: 'Primary',
  },
  {
    id: '4d912996-e216-4d26-8b86-da7070893836',
    name: 'Investment',
  },
  {
    id: 'f31dad46-dcc1-4474-8096-542838a56c60',
    name: 'Flexi Save',
    withdrawalPeriod: 30,
    dailyLimit: 100000,
    monthlyLimit: 100000,
    withdrawalStartingCost: 2,
    withdrawalEndingCost: 5,
  },
  {
    id: 'bc77ced0-e811-4c41-861e-8820240dbb17',
    name: 'Bezo Lock',
    withdrawalPeriod: 60,
    dailyLimit: 100000,
    monthlyLimit: 1000000,
    withdrawalStartingCost: 6,
    withdrawalEndingCost: 11,
  },
];
