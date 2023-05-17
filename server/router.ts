import express from 'express';
import MDate from '../mutils/mdate';
import { sendMessage, sendData, sendError } from './utils/express';
import config from 'config';
import * as maruyuOAuthClient from './utils/oauth';
import { InvalidParamError, PermissionError } from './utils/errors';

const router = express.Router();


export default router;