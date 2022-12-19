import { STATUS } from 'src/modules/auth/entities/enums/status.enum';
import { fixture } from 'typeorm-fixture-builder';
import { GoalTypeEntity } from '../../src/modules/savings-goal/entities/goal-type.entity';

export const savingGoalTypes: GoalTypeEntity[] = [];

const savingGoalTypeTypeData: GoalTypeEntity[] = [
  {
    id: '3361767f-ef8d-4aba-8ebd-0f951d784b95',
    name: 'Primary',
    description: null,
    type: 'account',
    status: STATUS.active,
  },
  {
    id: '7ea2813d-f85d-4d85-88e9-1737aca58f28',
    name: 'Business',
    description: null,
    type: 'account',
    status: STATUS.active,
  },
  {
    id: '792a5823-bd74-4d18-87a1-a0e852a3e8b9',
    name: 'Rent',
    description: null,
    type: 'account',
    status: STATUS.active,
  },
  {
    id: '788b58a3-c2e3-4c44-a79c-f562b4f1a296',
    name: 'Fees',
    description: null,
    type: 'account',
    status: STATUS.active,
  },
  {
    id: '706256e7-0818-4f70-bff3-28629cf87771',
    name: 'Beneficiary',
    description: null,
    type: 'account',
    status: STATUS.active,
  },
  {
    id: '806d88b2-5ad9-41f5-b88f-620977becfa2',
    name: 'Halal',
    description: null,
    type: 'account',
    status: STATUS.active,
  },
  {
    id: '02222287-105b-4a68-a267-8a02099015ac',
    name: '90 Days Challenge',
    description: null,
    type: 'challenge',
    status: STATUS.active,
  },
  {
    id: '46c417fb-108d-4c5f-9a38-e4416902f2f3',
    name: 'Bezo Valentine',
    description: null,
    type: 'challenge',
    status: STATUS.active,
  },
  {
    id: 'e7bd8677-1455-4f6b-ad1b-dd3f6af4ae1a',
    name: 'Richfluencer',
    description: null,
    type: null,
    status: STATUS.active,
  },
  {
    id: 'cac9e388-f005-4384-9b0c-c7c1cf8d65b1',
    name: 'Emergency',
    description: null,
    type: 'account',
    status: STATUS.active,
  },
  {
    id: 'afd321d3-1b0b-4877-8ee2-f00c6909467d',
    name: 'Other',
    description: null,
    type: 'account',
    status: STATUS.active,
  },
  {
    id: '8cf8091f-9076-4384-8765-d47f5bba9fb7',
    name: 'Travel & Vacation ✈️',
    description: null,
    type: 'account',
    status: STATUS.active,
  },
  {
    id: '8ed772ee-7591-4556-8db0-6a142fd0e82a',
    name: 'WeDeyGoQatar',
    description: null,
    type: null,
    status: STATUS.active,
  },
];

for (const type of savingGoalTypeTypeData) {
  savingGoalTypes.push(createGoalTypes(type));
}

function createGoalTypes(data: any) {
  const goalType = new GoalTypeEntity();
  goalType.name = data.name;
  goalType.status = data.status;
  if (data.type) goalType.type = data.type;
  if (data.description) goalType.description = data.description;

  return fixture(GoalTypeEntity, goalType);
}
