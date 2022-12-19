import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Console, Command } from 'nestjs-console';

import { UserEntity } from 'src/modules/main/entities/user.entity';

import { ErrorEntity } from '../entitites/error.entity';
import { UserPinEntity } from '../../userpin/entities/userpin.entity';
import { EntityManager } from 'typeorm';
import { PasswordEncoderService } from 'src/modules/auth/services/password-encorder.service';
import { UserPinService } from '../../userpin/services/userpin.service';
import { otps } from 'test/fixtures';

@Console()
export class MigrateTransactionPinCommand {
  private db: Connection;
  constructor(
    private em: EntityManager,
    @InjectConnection() private connection: Connection,

    private passwordHash: PasswordEncoderService,
    private userPinService: UserPinService,
  ) {
    this.db = this.connection.useDb('bezosusuDBLive');
  }

  @Command({
    command: 'migrate:pins',
    options: [
      {
        flags: '--type <type>',
        required: false,
      },
    ],
  })
  async execute(opts?: any) {
    try {
      return await this._execute(opts);
    } catch (e) {
      console.error(e);
      return 1;
    }
  }

  async _execute(opts?: any) {
    console.log('migrating ....');
    let user_pins: any[] = [];
    if (opts?.type === 'bezousers') {
      user_pins = await this.db
        .collection('user_bezopin')
        .find({
          user_id: { $in: await this.bezoUsers() },
        })
        .toArray();
    } else {
      user_pins = await this.db.collection('user_bezopin').find().toArray();
    }

    const chunkSize = 100;
    for (let i = 0; i < user_pins.length; i += chunkSize) {
      const chunk = user_pins.slice(i, i + chunkSize);
      await Promise.all([this.createTransactionPin(chunk, opts?.type)]);
    }
    console.log('migration completed !!!!');
  }

  async createTransactionPin(dataPins: any, type?: string) {
    for (const data of dataPins) {
      try {
        const id = await this.getUserId(data.user_id);
        const pin = new UserPinEntity();
        //pin.pin = await this.userPinService.encryptPin(data.pin, id);
        pin.pin = data.pin;
        pin.status = data.status;
        pin.userId = id;
        await this.em.save(pin);
      } catch (error: any) {
        console.log('error details', error.detail);
        // await this.storeErrorData({
        //   data,
        //   error,
        // });
      }
    }
  }

  async getUserId(user_id, type?: string) {
    const user = await this.em.findOne(UserEntity, { where: { user_id } });
    return user.id;
  }

  async storeErrorData(data: { [key: string]: any }) {
    const errorData = new ErrorEntity();
    errorData.migrationType = 'user_pins';
    errorData.data = data.data;
    if (data.error.detail) errorData.detail = data.error.detail;
    if (data.error.table) errorData.table = data.error.table;
    if (data.error.query) errorData.query = data.error.query;
    await this.em.save(errorData);
  }

  bezoUsers() {
    const users = [
      'e8d1f260398a3b202ad53e87bc2311714b303e4e',
      'e1a07e6d62bb59ceb9106d8510f3c760cb00aa43',
      'd308121515b204a6e42debd9eb7a5b45c76efe08',
      '138ac5f3c1945c95218c8af5e6291cd1f10b176c',
      '5224e8043ef265408fe82ab684bd0c4830297eab',
      '24ba32b6ce949d5761c451ccc5ce75a48c78ad92',
      '41dbd50b957608041f862739fe0ac4c72a35a3f9',
      'e46a60ac1facd7e0378ac182973058e68cca8598',
      '9999d305555bae808eca26b4b459b6cca75a4ea8',
      '5250b772c3f65166ac2cf00bbe5a7647856763f6',
      'a17bc3fe092aeb229782df1f05775fe17bf31208',
      '04a926271731e4603a7e405108b4d1ba98f0d37c',
      '7c41af50ca491e29e4ab11e7168ed113c05600d7',
      '537e31925cba79503ad6b39aa0a107cd39b232d8',
      '9ed01082e0d7366c7d4a7e6f68314d7571be3e07',
      '3a581b611d35ef221affd5047fd27f6421cadee8',
      'bd756794c382c584a5d1287a7f591616c9446cbb',
      '98d100741280b62c6b734c6b6e653e24b443731f',
      'fa1a703401943a993a536c8eb82656a1435daf0d',
      '3367edc08e435dbc140bcebb896d0d725ea87b97',
      '5bf0e497860189c276b29df0e3897936326957ac',
      '2a12b8a0633662dc37e03a604cd97df1420cab50',
      '460eb80ed86fd377106105036318dd196b84c7ad',
      'f6a4f00ce247dfa4b1aa50a60f7bf01ad9c5076f',
      '5ddbb42961068053a5e13a8fa0bed69d2fa05b66',
    ];
    return users;
  }
}
