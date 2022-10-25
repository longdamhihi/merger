import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import morgan from "morgan";
import helmet from "helmet";
import path from "path";
import AWS from "aws-sdk";
import "express-async-errors";

import s3 from "./services/s3";
import statusCodes from "./util/statusCodes";
import redis from "./services/redis";