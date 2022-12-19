import { SavingsGoalEntity } from './../entities/savings-goal.entity';
import { EntityManager, Not, Repository } from 'typeorm';
import { SavingsGoalDto, SavingsGoalInputDto } from '../dtos/savings-goal.dto';
import { AccountEntity } from '../../../../src/modules/account/entities/account.entity';
import { STATUS } from '../../../../src/modules/auth/entities/enums/status.enum';
import { AppRequestContext } from '../../../../src/utils/app-request.context';
import { getAppContextALS } from '../../../../src/utils/context';
import { GOAL_STATUS } from '../../../../src/modules/auth/entities/enums/goal-status.enum';
import { HttpException, Injectable } from '@nestjs/common';
import { GoalTypeEntity } from '../entities/goal-type.entity';
import { GoalTypeDto } from '../dtos/goal-type.dto';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';

import { generateCode } from 'src/utils/shared';
import { WalletTypeEntity } from '../../wallet/entities/wallet.entity';

@Injectable()
export class SavingsGoalService {
  constructor(
    @InjectEntityManager('default') private em: EntityManager,

    @InjectRepository(SavingsGoalEntity)
    private savingsGoalRepository: Repository<SavingsGoalEntity>,
  ) {}

  async create(input: SavingsGoalInputDto): Promise<SavingsGoalDto> {
    const ctx = getAppContextALS<AppRequestContext>();
    if (await this.savingsGoalExist(input.name, ctx.authUser.userId)) {
      throw new HttpException('Savings Goal already exist', 400);
    }
    const account = new AccountEntity();
    account.name = input.name;
    account.accountTypeId = input.accountTypeId;
    account.userId = ctx.authUser.userId;
    account.accountNumber = Number(generateCode(10));
    account.walletId = input.walletId ?? (await this.getDefaultWalletId());

    const savingsGoal = new SavingsGoalEntity();
    savingsGoal.name = input.name;
    savingsGoal.description = input.description;
    savingsGoal.goalTypeId = input.goalTypeId;
    savingsGoal.account = account;
    savingsGoal.amount = input.amount;
    savingsGoal.period = input.period;
    savingsGoal.startDate =
      typeof input.startDate === 'string'
        ? new Date(input.startDate)
        : input.startDate;
    savingsGoal.status = STATUS.enabled;
    savingsGoal.userId = ctx.authUser.userId;
    savingsGoal.goalStatus = GOAL_STATUS.pending;
    savingsGoal.frequency = input.frequency;
    return this.em.save(savingsGoal) as unknown as SavingsGoalDto;
  }

  async all(): Promise<SavingsGoalDto[]> {
    const ctx = getAppContextALS<AppRequestContext>();
    const goals = await this.em.find(SavingsGoalEntity, {
      relations: ['account', 'goalType', 'user'],
      where: {
        userId: ctx.authUser.userId,
        name: Not('Primary'),
        goalStatus: GOAL_STATUS.inprogress,
        goalType: { name: Not('Primary'), status: STATUS.active },
      },
    });
    return goals as unknown as SavingsGoalDto[];
  }

  async get(id: string): Promise<SavingsGoalDto> {
    const ctx = getAppContextALS<AppRequestContext>();
    return (await this.em.findOne(SavingsGoalEntity, {
      where: { id: id, userId: ctx.authUser.userId },
      relations: ['account', 'goalType', 'user'],
    })) as unknown as SavingsGoalDto;
  }

  async update(id: string, input: { name: string }): Promise<SavingsGoalDto> {
    const savingsGoal: SavingsGoalEntity | SavingsGoalDto = await this.get(id);
    if (!savingsGoal) {
      throw new HttpException('AccountType not found', 404);
    }
    savingsGoal.name = input.name;
    return this.em.save(savingsGoal) as unknown as SavingsGoalDto;
  }

  // delete savings goal
  async delete(id: string): Promise<void> {
    const savingsGoal: SavingsGoalEntity | SavingsGoalDto = await this.get(id);
    if (!savingsGoal) {
      throw new HttpException('Savings Goal not found', 404);
    }
    await this.em.delete(SavingsGoalEntity, id);
  }

  async getDefaultWalletId(): Promise<string> {
    return this.em
      .findOne(WalletTypeEntity, { where: { name: 'Local' } })
      .then((wallet) => wallet.id);
  }

  async savingsGoalExist(name: string, userId: string) {
    return await this.em.findOne(SavingsGoalEntity, {
      where: { name: name, userId: userId },
    });
  }
}
