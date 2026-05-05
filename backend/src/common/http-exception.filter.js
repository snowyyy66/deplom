import { Catch, HttpException, HttpStatus } from '@nestjs/common';

@Catch()
export class HttpErrorFilter {
  catch(exception, host) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const toDetail = () => {
      if (exception instanceof HttpException) {
        const resp = exception.getResponse();
        if (resp && typeof resp === 'object') {
          if (typeof resp.detail === 'string') return resp.detail;
          if (typeof resp.message === 'string') return resp.message;
          if (Array.isArray(resp.message) && resp.message.length) return resp.message.join('\n');
        }
        return exception.message || 'Ошибка';
      }

      if (exception instanceof Error) {
        return exception.message || 'Ошибка';
      }

      return 'Ошибка';
    };

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const detail = toDetail();

    // eslint-disable-next-line no-console
    console.error('[API_ERROR]', { status, detail, path: request?.url });

    response.status(status).json({ detail });
  }
}
