import express, { Router } from 'express';

import { UserRoutes } from '../modules/user/user.route';
import { AuthRoutes } from '../modules/auth/auth.route';
import { ResearchRoutes } from '../modules/research/research.route';
import { PaperRoutes } from '../modules/paper/paper.route';
import { NoteRoutes } from '../modules/note/note.route';
import { WalletRoutes } from '../modules/wallet/wallet.route';
import { PaymentRoutes } from '../modules/payment/payment.route';
import { ParaphraseRoutes } from '../modules/paraphrase/paraphrase.route';

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
  {
    path: '/papers',    
    route: PaperRoutes,
  },
  {
    path: '/notes',      
    route: NoteRoutes,
  },
  {
  path: '/wallet',
  route: WalletRoutes,
},
{
  path: '/payment',
  route: PaymentRoutes,
},
{
  path: '/paraphrase',
  route: ParaphraseRoutes,
},
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
