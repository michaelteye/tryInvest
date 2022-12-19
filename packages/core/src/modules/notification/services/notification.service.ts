import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { AppRequestContext } from 'src/utils/app-request.context';
import { getAppContext, getAppContextALS } from '../../../utils/context';


export interface EmailInterface {
  subject: string,
  message: string,
  to: string | []
}

export interface EmailSMSInterface {
  to: string | [],
  sms: string,
  subject: string,
  message: string,
  toemail: string,
  template: string
}
export interface SmsInterface {
  to: string | [],
  sms: string,
}


@Injectable()
export class NotificationService {
  constructor(private httpService: HttpService) { }

  async getNotifications() {
    const ctx = getAppContextALS<AppRequestContext>();
  }

  async sendEmail(payload: EmailInterface): Promise<AxiosResponse> {
    return this.httpService.axiosRef.post('http://localhost:3000/api/sendMail', payload);

  }

  async sendSms(payload: SmsInterface): Promise<AxiosResponse> {
    return this.httpService.axiosRef.post('http://localhost:3000/api/sendMail', payload);

  }

}
