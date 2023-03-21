import { HttpStatus } from '@nestjs/common';

export class ResponseSucc implements IResponse {
    constructor(data?: unknown, msg?: string) {
        this.code = HttpStatus.OK;
        this.msg = msg ?? 'success';
        this.data = data;
    }
    code: number;
    msg: string;
    data: unknown;
}

export class ResponseError implements IResponse {
    constructor(code: number, msg: string) {
        this.code = code;
        this.msg = msg;
        this.data = null;
    }
    code: number;
    msg: string;
    data: unknown;
}

export class ResponseInternalError implements IResponse {
    constructor(msg: string, code?: number) {
        this.code = code ?? HttpStatus.SERVICE_UNAVAILABLE;
        this.msg = msg;
        this.data = null;
    }
    code: number;
    msg: string;
    data: unknown;
}

export interface IResponse {
    code: number;
    msg: string;
    data: unknown;
}
