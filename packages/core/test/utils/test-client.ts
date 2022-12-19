import { JwtService } from '@nestjs/jwt';

import { TestClientBase } from './test-client-base';
import * as defaultFixtures from '../fixtures';
import { collect } from 'typeorm-fixture-builder';

export type LOGIN = {
  email?: string;
  phone?: string;
  password: string;
  deviceId?: string;
};

export interface CommonGqlOptions {
  expectErrors?: boolean;
  expectFirstErrorToMatch?: Record<string, any>;
  validationFn?: (resp: any) => void;
}

export interface CommonRestOptions {
  expectErrorCode?: string;
  path?: string;
}

export class TestClient extends TestClientBase {
  userId: string;
  authUser: any;

  async init(): Promise<void> {
    await super.init();
    await this.loadFixtures();
  }

  async login(login: LOGIN, opts?: CommonRestOptions) {
    const resp = await this.httpRequest('post', opts?.path ?? '/admin/login', {
      payload: {
        ...login,
      },
    });

    expect(resp.token).toBeDefined();
    expect(resp.refreshToken).toBeDefined();

    // Add header
    this.defaultHeaders.Authorization = `Bearer ${resp.token}`;

    // Load our profile
    const jwtService = this.app.get(JwtService);
    const decoded = jwtService.decode(resp.token) as any;
    this.userId = decoded.sub;

    this.authUser = await this.httpRequest(
      'get',
      opts?.path ? '/users/me' : '/admin/me',
    );
    expect(this.authUser.id).toEqual(this.userId);
    return resp;
  }

  async loadFixtures(
    opts: { fixtures?: any[]; drop?: boolean } = {},
  ): Promise<void> {
    const mapped = {
      ...opts,
      fixtures: opts.fixtures ?? collect(defaultFixtures),
    };
    return super.loadFixtures(mapped);
  }

  async clearFixtures() {
    console.log('fixtures cleared');
  }
}
