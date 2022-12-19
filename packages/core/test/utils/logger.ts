import { ConsoleLogger } from '@nestjs/common';

export class TestLogger extends ConsoleLogger {
  verbose(message: any, context?: string) {
    message = this.serializeLog(message);
    super.verbose(message, context);
  }

  debug(message: any, context?: string) {
    message = this.serializeLog(message);
    super.debug(message, context);
  }

  log(message: any, context?: string) {
    message = this.serializeLog(message);
    super.log(message, context);
  }

  warn(message: any, context?: string) {
    message = this.serializeLog(message);
    super.warn(message, context);
  }

  error(message: any, stack?: string, context?: string) {
    message = this.serializeLog(message);
    super.error(message, stack, context);
  }

  private serializeLog(message: any) {
    if (typeof message === 'object') {
      return JSON.stringify(message);
    }
    return message;
  }
}
