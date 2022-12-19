import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SavingsGoalEntity } from './entities/savings-goal.entity';
import { GoalTypeEntity } from './entities/goal-type.entity';
import { GoalTypeController } from './controllers/goal-type.controller';
import { SavingsGoalController } from './controllers/savings-goal.controller';
import { GoalTypeService } from './services/goal-type.service';
import { SavingsGoalService } from './services/savings-goal.service';
import { MigrationService } from '../migration/services/migration.service';
import { UserGoalTypeController } from './controllers/user-goal-type.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SavingsGoalEntity, GoalTypeEntity])],
  providers: [SavingsGoalService, GoalTypeService, MigrationService],
  controllers: [
    GoalTypeController,
    SavingsGoalController,
    UserGoalTypeController,
  ],
  exports: [SavingsGoalService, GoalTypeService],
})
export class SavingsGoalModule {}
