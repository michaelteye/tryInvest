import { SavingsGoalEntity } from '../../savings-goal/entities/savings-goal.entity';
//export const savingsGoalData: SavingsGoalEntity[] = [{}];

// @OneToOne(() => AccountEntity, (u) => u.savingsGoal, { cascade: true })
// @JoinColumn({ name: 'accountId' })
// account: AccountEntity;

// @Column('uuid', { nullable: true })
// accountId?: string;

// @ManyToOne(() => GoalTypeEntity, (u) => u.savingsGoals)
// @JoinColumn({ name: 'goalTypeId' })
// goalType?: GoalTypeEntity;

// @Column('uuid')
// goalTypeId?: string;

// @ManyToOne(() => UserEntity, (u) => u.savingsGoals)
// @JoinColumn({ name: 'userId' })
// user: UserEntity;

// @Column('uuid')
// userId: string;

// @Column('text')
// name: string;

// @Column('text', { nullable: true })
// description: string;

// @Column('integer', { default: 0, nullable: false })
// period: number;

// @Column('enum', { enum: FREQUENCY_TYPE })
// frequency: FREQUENCY_TYPE;

// @Column({
//   type: 'decimal',
//   precision: 10,
//   scale: 2,
//   default: 0,
//   nullable: false,
// })
// amount: number;

// @Column('boolean')
// lockSaving: boolean;

// @Column('text', { nullable: true })
// emoji?: string;

// @Column('enum', { enum: DEPOSIT_PREFERENCE })
// preference: DEPOSIT_PREFERENCE;

// @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
// amountToRaise: number;

// // enquire about status

// @Column('enum', { enum: STATUS })
// status: STATUS;

// @Column('enum', { enum: GOAL_STATUS })
// goalStatus: GOAL_STATUS;

// @Column('boolean', { default: false })
// isFavorite: boolean;

// @Column('date')
// startDate: Date;
