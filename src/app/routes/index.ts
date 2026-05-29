import express, { Router } from 'express';

import { UserRoutes } from '../modules/user/user.route';
import { AuthRoutes } from '../modules/auth/auth.route';
import { ResearchRoutes } from '../modules/research/research.route';

const router = express.Router();

type IModuleRoute = {
  path: string;
  route: Router;
};

const moduleRoutes: IModuleRoute[] = [
  {
    path: '/users',
    route: UserRoutes,
  },
  {
    path: '/auth',
    route: AuthRoutes,
  },
    {
    path: '/research',     
    route: ResearchRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
