import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { collect, install } from 'typeorm-fixture-builder';

@Injectable()
export class FixtureLoader {
  constructor(private em: EntityManager) {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('ERROR-TEST-UTILS-ONLY-FOR-TESTS');
    }
  }

  async loadFixtures(fixtures: any[]) {
    const connection = this.em.connection;
    try {
      await install(connection, fixtures);
    } catch (err) {
      throw err;
    }
  }
}
