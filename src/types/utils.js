// @flow
import type { Request, Response } from 'restify';

export type HandlerReturn = {|
  status: number,
  body: Object,
|};

/** All functions exposed through an endpoint must be of type HandlerFunction */
export type HandlerFunction =
  (request: Request, response: Response) => Promise<HandlerReturn>;

export type HandlerDefinitions = Array<{|
  method: 'get' | 'post' ,
  url: string,
  handler: HandlerFunction,
|}>;

export type UtilOK<T> = {|
    kind: "ok";
    value: T;
|}
export type UtilErr = {|
    kind: "error";
    errMsg: string;
|}
export type UtilEither<T> = UtilOK<T> | UtilErr;
