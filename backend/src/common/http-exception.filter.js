import { Catch, HttpException, HttpStatus } from '@nestjs/common';

@Catch()
export class HttpErrorFilter {
  catch(exception, host) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    let detail;
    if (exception instanceof HttpException) {
      const resp = exception.getResponse();
      if (resp && typeof resp === 'object') {
        if (typeof resp.detail === 'string') detail = resp.detail;
        else if (typeof resp.message === 'string') detail = resp.message;
        else if (Array.isArray(resp.message) && resp.message.length) detail = resp.message.join('\n');
      }
      detail = detail ?? exception.message ?? 'Ошибка';
    } else {
      detail = 'Внутренняя ошибка сервера';
    }

    console.error('[API_ERROR]', { status, detail: exception instanceof HttpException ? detail : exception?.message, path: request?.url });

    response.status(status).json({ detail });
  }
}
