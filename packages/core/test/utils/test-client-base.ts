import { INestApplication } from '@nestjs/common';
import { Test, TestingModule, TestingModuleBuilder } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import * as request from 'supertest';
import { EntityManager } from 'typeorm';
import { FixtureLoader } from '../../test/services/fixture-loader';
import { MainModule } from '../../src/modules/main/main.module';
import { TestLogger } from './logger';
import { AuthModule } from '../../src/modules/auth/auth.module';

export class TestClientBase {
  defaultHeaders: Record<string, string> = {};
  responseBody: any;

  protected _app: INestApplication;

  get app() {
    return this._app;
  }

  protected _testingModule: TestingModule;

  get testingModule(): TestingModule {
    return this._testingModule;
  }

  async init(configurator?: (builder: TestingModuleBuilder) => void) {
    const builder = Test.createTestingModule({
      imports: [AppModule],
      providers: [FixtureLoader],
    });
    if (configurator) {
      configurator(builder);
    }

    builder.setLogger(new TestLogger());
    this._testingModule = await builder.compile();

    this._app = this._testingModule.createNestApplication();

    await this._app.init();
  }

  async loadFixtures(
    opts: { fixtures: any[]; drop?: boolean } = { fixtures: [] },
  ) {
    opts.drop = opts.drop ?? true;
    // Temporarily disable subscribers when loading fixtures
    const em = this._app.get(EntityManager);
    const s = em.connection.subscribers.splice(
      0,
      em.connection.subscribers.length,
    );

    // Truncate tables
    let sql = '';
    for (const entityMetadata of em.connection.entityMetadatas) {
      sql += `TRUNCATE TABLE ${entityMetadata.tableName} CASCADE;`;
    }
    await em.query(sql);
    await em.connection.synchronize(true);
    await this._app.get(FixtureLoader).loadFixtures(opts.fixtures);
    em.connection.subscribers.push(...s);
  }

  async close() {
    await this._app.close();
  }

  async httpOperation(
    method: 'post' | 'get' | 'patch' | 'delete' | 'put',
    path: string,
    opts: {
      payload?: any;
      query?: any;
      files?: Record<string, { path: string }>;
      fields?: Record<string, any>;
      expectErrorCode?: string | number;
      statusCode?: string | number;
    } = {},
  ) {
    const headers = { ...this.defaultHeaders };
    const rb = request(this.app.getHttpServer())
      [method](path)
      .set(headers)
      .query(opts?.query);
    if (opts.files) {
      for (const [k, v] of Object.entries(opts.files)) {
        rb.attach(k, v.path);
      }
    }
    if (opts.fields) {
      rb.field(opts.fields);
    }
    let resp = null;
    if (opts.payload) {
      resp = await rb.send(opts.payload ? opts.payload : undefined);
    } else {
      resp = await rb;
    }
    //console.log(resp);
    const statusCode = resp.body.statusCode ?? null;
    const statusMessage = resp.body.message ?? null;
    const statusError = resp.body.error ?? null;
    this.responseBody = resp.body;

    if (statusCode) console.log('statusCode', statusCode);
    if (statusMessage) console.log('statusMessage', statusMessage);
    if (statusError) console.log('statusError', statusError);

    if (opts.expectErrorCode) {
      expect(resp.body.statusCode).toEqual(opts.expectErrorCode);
    }


    if (opts.statusCode) {
      expect(resp.status).toEqual(opts.statusCode);
    }

    return resp;
  }

  async httpRequest<T = any>(
    method: 'post' | 'get' | 'patch' | 'delete' | 'put',
    path: string,
    opts: {
      payload?: any;
      query?: any;
      files?: Record<string, { path: string }>;
      fields?: Record<string, any>;
      expectErrorCode?: string | number;
      statusCode?: string | number;
    } = {},
  ): Promise<T> {
    return await this.httpOperation(method, path, opts).then(
      (r) => r.body as T,
    );
  }
}
