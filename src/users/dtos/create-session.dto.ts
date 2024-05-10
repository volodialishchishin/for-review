export class CreateSessionDto {
  ip: string;
  title: string;
  lastActiveDate: Date;
  deviceId: string;
  tokenExpireDate: Date;
  userId: string;
}
